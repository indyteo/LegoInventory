import { Node, QueryStatistics, Relationship } from "neo4j-driver";
import { RequiredFields } from "./utils";

export type Neo4jID = number;
export type Neo4jStats = ReturnType<QueryStatistics["updates"]>;

export type Color = Node<Neo4jID, {
  id: number;
  name: string;
  value: number;
  type: string;
}, "Color">;

export type Category = Node<Neo4jID, {
  id: string;
  name: string;
  link: string;
}, "Category">;

export type Part = Node<Neo4jID, {
  id: string;
  quantity: number;
}, "Part">;

export type Inventory = Node<Neo4jID, {
  id: string;
  name: string;
}, "Inventory">;

export type Element = Node<Neo4jID, {
  id: string;
  name: string;
  link: string;
  icon: string;
  image: string;
  source?: string;
  instructions?: string;
}, "Element" | "Set" | "Minifigure" | "Brick">;

export type Set = Node<Neo4jID, RequiredFields<Element["properties"], "source" | "instructions">, "Element" | "Set">;
export type Minifigure = Node<Neo4jID, RequiredFields<Omit<Element["properties"], "instructions">, "source">, "Element" | "Minifigure">;
export type Brick = Node<Neo4jID, Omit<Element["properties"], "source" | "instructions">, "Element" | "Brick">;

export type IS_PART = Relationship<Neo4jID, {}, "IS_PART">;
export type OF_ELEMENT = Relationship<Neo4jID, {}, "OF_ELEMENT">;
export type WITH_COLOR = Relationship<Neo4jID, {}, "WITH_COLOR">;
export type IN_CATEGORY = Relationship<Neo4jID, {}, "IN_CATEGORY">;
export type IS_SUBCATEGORY_OF = Relationship<Neo4jID, {}, "IS_SUBCATEGORY_OF">;
export type IN_INVENTORY = Relationship<Neo4jID, {
  quantity: number;
}, "IN_INVENTORY">;
export type PRODUCED_IN = Relationship<Neo4jID, {
  link: string;
  icon: string;
  image: string;
}, "PRODUCED_IN">;
