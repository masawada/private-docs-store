import { S3Event, Context } from 'aws-lambda';
import { SecretsManager } from 'aws-sdk';
import { App } from '@slack/bolt';

const { AWS_REGION, SECRET_NAME, DISTRIBUTION_DOMAIN } = process.env;

const secretsManagerClient = new SecretsManager({ apiVersion: '2017-10-17', region: AWS_REGION || '' });

const getSecretValue = async (SecretId: string) => {
  try {
    const data = await secretsManagerClient.getSecretValue({ SecretId }).promise();
    return JSON.parse(data.SecretString || '{}');
  } catch (error) {
    console.error('An error occurred while retrieving a secret value');
    return {};
  }
};

export const handler = async (event: S3Event, context: Context) => {
  const objectKeys = event.Records.map(element => element.s3.object.key);

  const config = await getSecretValue(SECRET_NAME || '');
  const app = new App({
    token: config.SLACK_BOT_TOKEN,
    signingSecret: config.SLACK_SIGNING_SECRET,
  });

  await app.client.chat.postMessage({
    channel: config.SLACK_CHANNEL_ID,
    text: "新しいファイルが追加されたよ\n" + objectKeys.map(key => `https://${DISTRIBUTION_DOMAIN}/${key}`).join("\n"),
  });
}
