// src/config/r2.js
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

function cleanBaseUrl(url) {
  return (url || "").replace(/\/+$/, "");
}

// ---- Read env directly ----
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_BASE = cleanBaseUrl(process.env.R2_PUBLIC_BASE);

if (
    !R2_BUCKET ||
    !R2_ENDPOINT ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY
) {
    console.warn("⚠️ R2 env vars missing — uploads will fail");
}

// ---- Create R2 S3 client ----
export const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ---- Helpers you’ll use in routes ----
export async function uploadBufferToR2({ key, buffer, contentType, cacheControl }) {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: cacheControl || "public, max-age=31536000, immutable",
    })
  );

  const url = R2_PUBLIC_BASE ? `${R2_PUBLIC_BASE}/${key}` : null;
  return { key, url };
}

export async function deleteFromR2(key) {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}
