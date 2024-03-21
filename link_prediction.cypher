/* Compute simple estimation of similarity between sets */

// Find root category of each set
MATCH (s:Set)-[:IN_CATEGORY|IS_SUBCATEGORY_OF*]->(c:Category)
WHERE NOT EXISTS { (c)-[:IS_SUBCATEGORY_OF]->(:Category) }
MERGE (s)-[:IN_ROOT_CATEGORY]->(c);

// Find minifigures of each set
MATCH (s:Set)<-[:OF_ELEMENT]-()<-[:IS_PART]-(m:Minifigure)
MERGE (s)-[:HAS_MINIFIGURE]->(m);

// Temporary graph projection to run collapsePath algorithm
CALL gds.graph.project("proj",
  [ "Set", "Inventory", "Category", "Minifigure" ],
  {
    SET_IN_INVENTORY: { type: "IN_INVENTORY" },
    INVENTORY_HAS_SET: { type: "IN_INVENTORY", orientation: "REVERSE" },
    SET_IN_CATEGORY: { type: "IN_ROOT_CATEGORY" },
    CATEGORY_HAS_SET: { type: "IN_ROOT_CATEGORY", orientation: "REVERSE" },
    SET_HAS_MINIFIGURE: { type: "HAS_MINIFIGURE" },
    MINIFIGURE_IN_SET: { type: "HAS_MINIFIGURE", orientation: "REVERSE" }
  }
);

CALL gds.collapsePath.mutate("proj", {
  pathTemplates: [ [ "SET_IN_INVENTORY", "INVENTORY_HAS_SET" ] ],
  mutateRelationshipType: "SHARES_INVENTORY"
});

CALL gds.collapsePath.mutate("proj", {
  pathTemplates: [ [ "SET_IN_CATEGORY", "CATEGORY_HAS_SET" ] ],
  mutateRelationshipType: "SHARES_CATEGORY"
});

CALL gds.collapsePath.mutate("proj", {
  pathTemplates: [ [ "SET_HAS_MINIFIGURE", "MINIFIGURE_IN_SET" ] ],
  mutateRelationshipType: "SHARES_MINIFIGURE"
});

// Save results
CALL gds.graph.relationship.write("proj", "SHARES_INVENTORY");
CALL gds.graph.relationship.write("proj", "SHARES_CATEGORY");
CALL gds.graph.relationship.write("proj", "SHARES_MINIFIGURE");

// Drop duplicates
MATCH (s1:Set)-[r:SHARES_INVENTORY]->(s2:Set)
WHERE elementId(s1) < elementId(s2)
DELETE r;

MATCH (s1:Set)-[r:SHARES_CATEGORY]->(s2:Set)
WHERE elementId(s1) < elementId(s2)
DELETE r;

MATCH (s1:Set)-[r:SHARES_MINIFIGURE]->(s2:Set)
WHERE elementId(s1) < elementId(s2)
DELETE r;

// Add weighted relationships
MATCH (s1:Set)-[r:SHARES_INVENTORY]->(s2:Set)
WITH s1, s2, count(r) AS numberOfInventories
MERGE (s1)-[r:RELATED_WITH]->(s2) SET r.weight = numberOfInventories * 5;

MATCH (s1:Set)-[:SHARES_CATEGORY]->(s2:Set)
MERGE (s1)-[r:RELATED_WITH]->(s2) SET r.weight = 15;

MATCH (s1:Set)-[r:SHARES_MINIFIGURE]->(s2:Set)
WITH s1, s2, count(r) AS numberOfMinifigures
MERGE (s1)-[r:RELATED_WITH]->(s2) SET r.weight = numberOfMinifigures * 10;

// Cleanup temporary relationships
MATCH ()-[r:IN_ROOT_CATEGORY]-() DELETE r;
MATCH ()-[r:HAS_MINIFIGURE]-() DELETE r;
MATCH ()-[r:SHARES_INVENTORY]-() DELETE r;
MATCH ()-[r:SHARES_CATEGORY]-() DELETE r;
MATCH ()-[r:SHARES_MINIFIGURE]-() DELETE r;

// Final graph projection with estimated sets similarity and inventories
CALL gds.graph.drop("proj");
CALL gds.graph.project("proj", [ "Set", "Inventory" ], {
  RELATED_WITH: {
    orientation: "UNDIRECTED",
    properties: {
      weight: {
        property: "weight",
        aggregation: "SUM"
      }
    }
  },
  IN_INVENTORY: {
    orientation: "UNDIRECTED"
  }
});

/* Train machine learning pipeline to predict new inventory items */

CALL gds.beta.pipeline.linkPrediction.create("pipe");

CALL gds.beta.pipeline.linkPrediction.addNodeProperty("pipe", "fastRP", {
  mutateProperty: "embedding",
  embeddingDimension: 128,
  randomSeed: 7474
}) YIELD nodePropertySteps;

CALL gds.beta.pipeline.linkPrediction.addNodeProperty("pipe", "degree", {
  mutateProperty: "degree"
}) YIELD nodePropertySteps;

CALL gds.beta.pipeline.linkPrediction.addFeature("pipe", "l2", {
  nodeProperties: [ "embedding" ]
}) YIELD featureSteps;

CALL gds.beta.pipeline.linkPrediction.addFeature("pipe", "cosine", {
  nodeProperties: [ "embedding" ]
}) YIELD featureSteps;

CALL gds.beta.pipeline.linkPrediction.addFeature("pipe", "hadamard", {
  nodeProperties: [ "degree" ]
}) YIELD featureSteps;

CALL gds.beta.pipeline.linkPrediction.configureSplit("pipe", {
  testFraction: 0.2,
  trainFraction: 0.5,
  negativeSamplingRatio: 2.0
}) YIELD splitConfig;

CALL gds.beta.pipeline.linkPrediction.addLogisticRegression("pipe", {
  penalty: 0.001,
  patience: 2
}) YIELD parameterSpace;

CALL gds.beta.pipeline.linkPrediction.addLogisticRegression("pipe", {
  penalty: 1.0,
  patience: 2
}) YIELD parameterSpace;

CALL gds.beta.pipeline.linkPrediction.train("proj", {
  pipeline: "pipe",
  modelName: "lp-pipeline-model",
  targetRelationshipType: "IN_INVENTORY",
  randomSeed: 7474
}) YIELD modelInfo
RETURN
  modelInfo.bestParameters AS winningModel,
  modelInfo.metrics.AUCPR.train.avg AS avgTrainScore,
  modelInfo.metrics.AUCPR.outerTrain AS outerTrainScore,
  modelInfo.metrics.AUCPR.test AS testScore;

/* Predict new IN_INVENTORY relationships and filter results using param $id */

CALL gds.beta.pipeline.linkPrediction.predict.stream("proj", {
  modelName: "lp-pipeline-model",
  sampleRate: 0.1,
  topK: 1,
  randomSeed: 7474,
  concurrency: 1
}) YIELD node1, node2, probability
WITH gds.util.asNode(node1) AS n1, gds.util.asNode(node2) AS n2, probability
WHERE (n1:Inventory AND n1.id = $id) OR (n2:Inventory AND n2.id = $id)
RETURN n1, n2, probability ORDER BY probability DESC;

/* Cleanup graph */

MATCH ()-[r:RELATED_WITH]-() DELETE r;

CALL gds.graph.drop("proj");
CALL gds.pipeline.drop("pipe");
CALL gds.model.drop("lp-pipeline-model");
