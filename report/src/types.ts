import { Brick, Category, Color, Element, Set } from "shared";

export interface MostPopularCategory {
  category: Category["properties"];
  hierarchy: Category["properties"][];
  total: number;
}

export interface MostUsedBrick {
  brick: Brick["properties"];
  color: Color["properties"] | null;
  total: number;
  numberOfElements: number;
  breakdown: {
    from: {
      element: Element["properties"];
      quantity: number;
    }[];
    remaining: number;
  };
}

export interface BiggestSets {
  set: Set["properties"];
  total: number;
  minifigures: number;
  categories: Category["properties"][];
  colors: {
    color: Color["properties"];
    quantity: number;
    weight: number;
  }[];
}

export interface GeneralStats {
  bricks: number;
  colors: number;
  minifigures: number;
  sets: number;
  categories: number;
  inventories: number;
}
