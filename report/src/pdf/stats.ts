import { GeneralStats } from "../types";

export function writeGeneralStats(doc: PDFKit.PDFDocument, stats: GeneralStats) {
  doc.fontSize(12).moveDown(5);
  // @ts-ignore
  doc.outline.addItem("General stats");
  doc.text("General statistics about the database:");
  doc.text(`${stats.bricks} bricks are produced in ${stats.colors} colors. They can be assembled into ${stats.minifigures} minifigures and ${stats.sets} sets, categorized into ${stats.categories} categories. These elements are contained in ${stats.inventories} inventories.`)
}
