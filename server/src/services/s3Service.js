/**
 * All communication with Amazon S3 happens here.
 */
const crypto = require('crypto');
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3');
const env = require('../config/env');

/** Makes a file name safe to use inside an S3 object key. */
function safeKeyName(name) {
  const cleaned = name.replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_');
  return cleaned.slice(-100) || 'file';
}

/** Content-Disposition header that keeps non-English file names intact on download. */
function attachmentHeader(filename) {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

/** Builds a unique object key: users/<userId>/<uuid>-<filename> */
function buildObjectKey(userId, originalName) {
  return `users/${userId}/${crypto.randomUUID()}-${safeKeyName(originalName)}`;
}

/** Uploads a file to S3 with server-side encryption (AES-256). */
async function uploadFile(key, body, contentType) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.s3Bucket,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
      ServerSideEncryption: 'AES256',
    })
  );
}

/** Returns a temporary signed URL that allows downloading one private file. */
async function getDownloadUrl(key, filename) {
  const command = new GetObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
    ResponseContentDisposition: attachmentHeader(filename),
  });
  return getSignedUrl(s3Client, command, { expiresIn: env.downloadUrlTtlSeconds });
}

/** Permanently deletes a file from S3. */
async function deleteFile(key) {
  await s3Client.send(new DeleteObjectCommand({ Bucket: env.s3Bucket, Key: key }));
}

/** Confirms the bucket exists and the IAM role/credentials can access it. */
async function checkBucketAccess() {
  await s3Client.send(new HeadBucketCommand({ Bucket: env.s3Bucket }));
}

module.exports = { buildObjectKey, uploadFile, getDownloadUrl, deleteFile, checkBucketAccess };
