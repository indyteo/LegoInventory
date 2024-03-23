import { Category, IS_SUBCATEGORY_OF, Path, readDatabaseMany } from "shared";
import { MostPopularCategory } from "../types";

interface GetMostPopularCategoriesResult {
  c: Category;
  p: Path<Category, IS_SUBCATEGORY_OF>;
  total: number;
}

export async function getMostPopularCategories(count: number): Promise<MostPopularCategory[]> {
  const results = await readDatabaseMany(tx => tx.run<GetMostPopularCategoriesResult>(`
    MATCH (c:Category)<-[:IN_CATEGORY|IS_SUBCATEGORY_OF*]-(:Element)-[r:IN_INVENTORY]->(:Inventory)
    WITH c, sum(r.quantity) AS total ORDER BY total DESC LIMIT toInteger($count)
    OPTIONAL MATCH p = (r:Category)<-[:IS_SUBCATEGORY_OF*]-(c)
    WHERE r IS NULL OR NOT EXISTS { (r)-[:IS_SUBCATEGORY_OF]->(:Category) }
    RETURN c, p, total
  `, { count }));
  return results.map(result => {
    const category = result.get("c").properties;
    const total = result.get("total");
    const path = result.get("p");
    const hierarchy = path === null ? [] : path.segments.map(seg => seg.start.properties);
    hierarchy.push(category);
    return { category, hierarchy, total };
  });
}
