export function header(doc: PDFKit.PDFDocument, name: string, description: string) {
  doc.addPage()
    .fontSize(24)
    .text(name)
    .fontSize(16)
    .text(description)
    .fontSize(12)
    .moveDown();
  // @ts-ignore
  doc.outline.addItem(name);
}

export function spacesAtLeastOfWidth(doc: PDFKit.PDFDocument, width: number, options?: PDFKit.Mixins.TextOptions): string {
  let spaces = "";
  while (doc.widthOfString(spaces, options) < width)
    spaces += " ";
  return spaces;
}

export async function fetchImage(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url)
  return res.arrayBuffer();
}
