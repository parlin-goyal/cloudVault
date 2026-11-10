/**
 * Loads and validates environment variables from server/.env
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

const REQUIRED = ['AWS_REGION', 'S3_BUCKET', 'JWT_SECRET'];
const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy server/.env.example to server/.env and fill in the values.');
  process.exit(1);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,

  awsRegion: process.env.AWS_REGION,
  s3Bucket: process.env.S3_BUCKET,
  s3Endpoint: process.env.S3_ENDPOINT || null, // optional, only for local testing (e.g. LocalStack)

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  cookieSecure: process.env.COOKIE_SECURE === 'true',

  clientOrigin: process.env.CLIENT_ORIGIN || null,
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 25,
  downloadUrlTtlSeconds: Number(process.env.DOWNLOAD_URL_TTL_SECONDS) || 300,
  dataDir: process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'),
};

env.isProduction = env.nodeEnv === 'production';

module.exports = env;
