// @ts-ignore
import { FlameGraph } from "@lucko/react-flame-graph";
import { useMemo } from "react";
import { InventoryCategory } from "./types";

interface FlameGraphData {
  name: string;
  value: number;
  children?: FlameGraphData[];
}

interface CategoryData extends InventoryCategory {
  children: CategoryData[];
}

export interface CategoriesFlameGraphProps {
  categories: InventoryCategory[];
}

export default function CategoriesFlameGraph({ categories }: CategoriesFlameGraphProps) {
  const graph = useMemo(() => {
    const data: Record<CategoryData["category"]["id"], CategoryData> = {};
    for (const category of categories)
      data[category.category.id] = { ...category, children: [] };
    let totalWeight = 0;
    const roots: CategoryData[] = [];
    for (const category of Object.values(data)) {
      const parent = category.parent;
      if (parent === null) {
        roots.push(category);
        totalWeight += category.weight;
      } else
        data[parent].children.push(category);
    }
    const processChildrens = (children: CategoryData[]): FlameGraphData[] => children.map(cat => ({
      name: `${cat.category.name} (${Math.round(cat.weight * 100)}%)`,
      value: cat.weight,
      children: processChildrens(cat.children)
    }));
    return {
      name: "Categories",
      value: 1,
      children: processChildrens(roots).concat({
        name: `Uncategorized (${Math.round((1 - totalWeight) * 100)}%)`,
        value: 1 - totalWeight
      })
    };
  }, [ categories ]);
  return graph ? <FlameGraph data={graph} height={150} width={document.getElementById("root")!.offsetWidth - 100} /> : null;
}
