import { S3Client, ListBucketsCommand, CreateBucketCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";

export async function uploadFileToS3(file: string) {
  const s3 = connectToS3();
  await createBucketIfNotExist(s3, "reports");
  await sendFileToBucket(s3, "reports", file);
}

function connectToS3(): S3Client {
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION;

  if (!accessKey || !secretKey || !endpoint)
    throw new Error("Missing S3 connection information (S3_ACCESS_KEY, S3_SECRET_KEY, S3_ENDPOINT and S3_REGION environment variables)");

  return new S3Client({
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    endpoint,
    region,
    forcePathStyle: true,
  });
}

async function createBucketIfNotExist(s3: S3Client, bucketName: string) {
  const listBucketsResult = await s3.send(new ListBucketsCommand({}));
  if (listBucketsResult.Buckets?.some(bucket => bucket.Name === bucketName))
    return;
  await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
}

async function sendFileToBucket(s3: S3Client, bucketName: string, fileName: string) {
  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: fs.readFileSync(fileName)
  }));
}
