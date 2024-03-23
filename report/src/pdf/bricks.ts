import { MostUsedBrick } from "../types";
import { fetchImage, header, spacesAtLeastOfWidth } from "./common";
import { Color } from "shared";

export async function writeMostUsedBricks(doc: PDFKit.PDFDocument, data: MostUsedBrick[]) {
  header(doc, "Most used bricks", "Bricks used the most in sets (in one color)");
  for (let i = 0; i < data.length; i++) {
    const element = data[i];
    const prefix = `#${i + 1}: `;
    doc.text(prefix, { continued: true });
    if (element.color !== null)
      writeColor(doc, element.color, prefix);
    doc.text(element.brick.name, { link: element.brick.link });
    doc.image(await fetchImage(element.brick.icon), { height: 30 });
    doc.moveDown(0.5);
    doc.text(`Details: (${element.total} in ${element.numberOfElements} elements)`);
    for (const from of element.breakdown.from) {
      doc.text(`- ${from.quantity} in `, { continued: true });
      doc.text(from.element.name, { link: from.element.link });
    }
    if (element.breakdown.remaining)
      doc.text(`- ${element.breakdown.remaining} more in ${element.numberOfElements - element.breakdown.from.length} other elements...`);
    doc.moveDown();
  }
}

export function writeColor(doc: PDFKit.PDFDocument, color: Color["properties"], prefix: string | number) {
  const offset = typeof prefix === "number" ? prefix : doc.widthOfString(prefix);
  doc.roundedRect(doc.x + offset, doc.y - 2, 12, 12, 3)
    .fillAndStroke("#" + color.value.toString(16).padStart(6, "0"), "black");
  doc.fillColor("black").text(`${spacesAtLeastOfWidth(doc, 12)}${color.name} `, { continued: true });
}
