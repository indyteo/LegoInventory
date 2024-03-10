export type ElementType = "S" | "M";

export function isElementType(type: string): type is ElementType {
  return type === "S" || type === "M";
}

export const elementTypeDisplay: Record<ElementType, string> = {
  S: "Set",
  M: "Minifigure"
};

export interface CatalogItemIdentifier {
  type: ElementType;
  id: string;
}

export interface BaseElement {
  id: string;
  name: string;
  link: string;
  icon: string;
}

export interface CatalogItem extends BaseElement {
  image: string;
  source: string;
  type: ElementType;
  instructions: string | null;
  category: Category["id"];
  bricks: Brick[];
  minifigures: Minifigure[];
}

export interface QuantifiedElement extends BaseElement {
  quantity: number;
}

export interface Brick extends QuantifiedElement {
  image: string;
  color: Color["id"];
}

export interface Minifigure extends QuantifiedElement {
  image: string;
}

export interface Color {
  id: number;
  name: string;
  value: number;
  type: string;
}

export interface Category {
  id: string;
  name: string;
  link: string;
  parent: Category["id"] | null;
}
