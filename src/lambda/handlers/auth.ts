import { CloudFrontRequestEvent, Context, CloudFrontRequestCallback } from 'aws-lambda';
import { SecretsManager } from 'aws-sdk';

// since environment variables are not supported on Lambda@Edge, hardcode some variables
const region = 'us-east-1';
const SecretId = 'private-docs-store-secret';

const secretsManagerClient = new SecretsManager({ apiVersion: '2017-10-17', region });

const getSecretValue = async (): Promise<string> => {
  try {
    const data = await secretsManagerClient.getSecretValue({ SecretId }).promise();
    return data.SecretString || '';
  } catch (error) {
    console.error('An error occurred while retrieving a secret value');
    return '';
  }
};

const unauthorizedResponse = {
  status: '401',
  statusDescription: 'Unauthorized',
  body: '401 Unauthorized',
  headers: {
    'www-authenticate': [ { key: 'WWW-Authenticate', value: 'Basic' } ],
  },
};

const serviceTemporarilyUnavailableResponse = {
  status: '503',
  statusDescription: 'Service Temporarily Unavailable',
  body: '503 Service Temporarily Unavailable',
};

export const handler = async (
  event: CloudFrontRequestEvent,
  context: Context,
  callback: CloudFrontRequestCallback
) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  const secret = await getSecretValue();
  if (secret === '') {
    callback(null, serviceTemporarilyUnavailableResponse);
  }

  const authString = `Basic ${secret}`;
  if (typeof headers.authorization === 'undefined' || headers.authorization[0].value !== authString) {
    callback(null, unauthorizedResponse);
  }

  callback(null, request);
};
