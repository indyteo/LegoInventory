import { MostPopularCategory } from "../types";
import { header } from "./common";
import { Category } from "shared";

export function writeMostPopularCategories(doc: PDFKit.PDFDocument, data: MostPopularCategory[]) {
  header(doc, "Most popular categories", "Categories with the most elements in inventories");
  for (let i = 0; i < data.length; i++) {
    const element = data[i];
    doc.text(`#${i + 1}: `, { continued: true });
    writeCategories(doc, element.hierarchy);
    doc.text(` (${element.total} elements)`, { link: null });
  }
}

export function writeCategories(doc: PDFKit.PDFDocument, categories: Category["properties"][]) {
  for (let j = 0; j < categories.length; j++) {
    if (j !== 0)
      doc.text(" > ", { link: null, continued: true });
    const category = categories[j];
    doc.text(`${category.name}`, { link: category.link, continued: true });
  }
}
