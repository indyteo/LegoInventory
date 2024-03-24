import { closeDatabaseDriver } from "shared";
import PDFDocument from "pdfkit";
import * as fs from "fs";
import { getMostPopularCategories } from "./database/categories";
import { writeMostPopularCategories } from "./pdf/categories";
import { writeMostUsedBricks } from "./pdf/bricks";
import { getMostUsedBricks } from "./database/bricks";
import { writeBiggestSets } from "./pdf/sets";
import { getBiggestSets } from "./database/sets";
import { getGeneralStats } from "./database/stats";
import { writeGeneralStats } from "./pdf/stats";
import { uploadFileToS3 } from "./s3/minio";

async function generateReport(): Promise<string> {
  const date = new Date().toJSON().substring(0, 10);
  const fileName = `lego4j-${date}.pdf`;
  const doc = new PDFDocument({
    info: {
      Title: `Lego4j Stats - ${date}`,
      CreationDate: new Date(),
      Author: "Lego4j"
    }
  });
  doc.pipe(fs.createWriteStream(fileName));

  doc
    .fontSize(24)
    .text("Statistical report about the Lego4j database", { align: "center" })
    .moveDown()
    .fontSize(18)
    .text(date, { align: "center" })
    .fontSize(12)
    .moveDown(5);
  writeGeneralStats(doc, await getGeneralStats());
  writeMostPopularCategories(doc, await getMostPopularCategories(3));
  await writeMostUsedBricks(doc, await getMostUsedBricks(5, 2));
  await writeBiggestSets(doc, await getBiggestSets(3, 2));

  doc.end();
  return fileName;
}

async function main() {
  const start = Date.now();
  console.log("Generating report PDF...");
  const file = await generateReport();
  console.log(`PDF report "${file}" generated!`);
  console.log("Uploading result on S3...");
  await uploadFileToS3(file);
  console.log("Result successfully uploaded!")
  console.log("Closing Neo4j database driver...");
  await closeDatabaseDriver();
  console.log("Neo4j database driver closed!")
  const end = Date.now();
  const time = Math.round((end - start) / 100) / 10;
  console.log(`Done in ${time}s`);
}

main().catch(e => {
  console.error(e);
  closeDatabaseDriver().then(() => process.exit(1));
});
