/**
 * Amazon S3 client.
 *
 * No access keys are written in the code. The AWS SDK finds credentials automatically:
 *   - On EC2: from the IAM role attached to the instance (recommended).
 *   - On a laptop: from AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY or ~/.aws/credentials.
 */
const { S3Client } = require('@aws-sdk/client-s3');
const env = require('./env');

const config = { region: env.awsRegion };

if (env.s3Endpoint) {
  config.endpoint = env.s3Endpoint;
  config.forcePathStyle = true;
}

const s3Client = new S3Client(config);

module.exports = s3Client;
