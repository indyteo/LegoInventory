import { BiggestSets } from "../types";
import { fetchImage, header } from "./common";
import { writeCategories } from "./categories";
import { writeColor } from "./bricks";

export async function writeBiggestSets(doc: PDFKit.PDFDocument, data: BiggestSets[]) {
  header(doc, "Biggest sets", "Sets with the most pieces");
  for (let i = 0; i < data.length; i++) {
    const element = data[i];
    doc.text(`#${i + 1}: `, { continued: true });
    doc.text(element.set.name, { link: element.set.link, continued: true });
    doc.text(` (${element.total} pieces / ${element.minifigures} minifigures)`, { link: null });
    if (element.categories.length) {
      doc.text("Category: ", { continued: true });
      writeCategories(doc, element.categories);
      doc.text("", { continued: false });
      doc.moveDown();
    }
    doc.image(await fetchImage(element.set.image), { height: 100 });
    doc.moveDown(0.5);
    doc.text("Dominant colors:");
    for (const color of element.colors) {
      doc.text("- ", { continued: true });
      writeColor(doc, color.color, "- ");
      doc.text(`(${color.quantity} pieces, ${Math.round(100 * color.weight)}%)`);
    }
    doc.moveDown();
  }
}
