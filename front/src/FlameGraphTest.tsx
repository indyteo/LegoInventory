// @ts-ignore
import { FlameGraph } from "@lucko/react-flame-graph";
import { useEffect, useState } from "react";

interface FlameGraphData {
  name: string;
  value: number;
  children?: FlameGraphData[];
}

interface CategoryInfo {
  category: {
    id: string;
    name: string;
  };
  weight: number;
  parent: CategoryInfo["category"]["id"];
  children: CategoryInfo[];
}

export function FlameGraphTest() {
  const [ graph, setGraph ] = useState<FlameGraphData>();
  useEffect(() => {
    fetch("http://localhost:8080/inventories/c2aa2173-ad4e-46bb-8804-2712e0b0566e").then<{ categories: CategoryInfo[] }>(res => res.json()).then(inv => {
      const categories: { [k: string]: CategoryInfo } = {};
      for (const category of inv.categories) {
        categories[category.category.id] = category;
        category.children = [];
      }
      let totalWeight = 0;
      const roots: CategoryInfo[] = [];
      for (const category of inv.categories) {
        const parent = category.parent;
        if (parent === null) {
          roots.push(category);
          totalWeight += category.weight;
        } else
          categories[parent].children.push(category);
      }
      const processChildrens = (children: CategoryInfo[]): FlameGraphData[] => children.map(cat => ({
        name: `${cat.category.name} (${Math.round(cat.weight * 100)}%)`,
        value: cat.weight,
        children: processChildrens(cat.children)
      }));
      const data = {
        name: "Categories",
        value: 1,
        children: processChildrens(roots).concat({ name: `Uncategorized (${Math.round((1 - totalWeight) * 100)}%)`, value: 1 - totalWeight })
      };
      setGraph(data);
    });
  }, []);
  return graph ? (
    <FlameGraph data={graph} height={250} width={1000} />
  ) : null;
}
