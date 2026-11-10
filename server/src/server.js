const env = require('./config/env');
const app = require('./app');
const s3Service = require('./services/s3Service');

const server = app.listen(env.port, () => {
  console.log(`CloudVault API running on http://localhost:${env.port} (${env.nodeEnv})`);

  s3Service
    .checkBucketAccess()
    .then(() => console.log(`Connected to S3 bucket "${env.s3Bucket}" in ${env.awsRegion}`))
    .catch((err) =>
      console.warn(
        `WARNING: cannot access S3 bucket "${env.s3Bucket}" (${err.name}). ` +
          'Check S3_BUCKET, AWS_REGION and the IAM role or credentials.'
      )
    );
});

// Graceful shutdown (PM2 sends SIGINT/SIGTERM on restart)
function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
