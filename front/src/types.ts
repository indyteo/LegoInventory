export interface ElementType {
  id: string;
  name: string;
  link: string;
  icon: string;
  image: string;
  source?: string;
  instructions?: string;
}

export interface Category {
  id: string;
  name: string;
  link: string;
}

export interface Color {
  id: number;
  name: string;
  type: string;
  value: number;
}

export interface InventoryType {
  id: string;
  name: string;
  content: InventoryContent[];
  categories: InventoryCategory[];
}

export interface InventoryContent {
  element: ElementType & { type: "S" | "M" };
  quantity: number;
  since: {
    year: number;
    month: number;
    day: number;
  };
}

export interface InventoryCategory {
  category: Category;
  weight: number;
  parent: Category["id"];
}

export interface InventoriesType {
  id: string;
  name: string;
  sets: number;
  minifigures: number;
}

export interface InventoryDetailsType extends ElementType {
  color?: Color;
  quantity: number;
  from: {
    element: ElementType["id"] | null;
    quantity: number;
    type?: "S" | "M";
  }[];
}

export interface CatalogBricksType extends ElementType {
  colors: Color[];
}

export interface CatalogMinifiguresType extends ElementType {
  pieces: number;
}

export interface CatalogSetsType extends CatalogMinifiguresType {
  minifigures: number;
}

export interface CatalogBrickType extends CatalogBricksType {
  isPartOf: {
    element: ElementType & { type: "S" | "M" };
    quantity: number;
    details: {
      color: Color | null;
      quantity: number;
    }[];
  }[];
}

export interface CatalogMinifigureType extends ElementType {
  pieces: BrickPart[];
  isPartOf: {
    set: ElementType;
    quantity: number;
  }[];
}

export interface CatalogSetType extends ElementType {
  minifigures: {
    minifigure: ElementType;
    quantity: number;
  }[];
  pieces: BrickPart[];
}

export interface BrickPart {
  brick: ElementType;
  color: Color | null;
  quantity: number;
}
