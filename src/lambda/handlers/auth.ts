import { CloudFrontRequestEvent,Context, CloudFrontRequestCallback, CloudFrontRequestHandler } from 'aws-lambda';

const unauthorizedResponse = {
  status: '401',
  statusDescription: 'Unauthorized',
  body: '401 Unauthorized',
  headers: {
    'www-authenticate': [ { key: 'WWW-Authenticate', value: 'Basic' } ],
  },
};

export const handler: CloudFrontRequestHandler = (
  event: CloudFrontRequestEvent,
  context: Context,
  callback: CloudFrontRequestCallback
) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  const authString = 'Basic dXNlcjpwYXNz';

  if (typeof headers.authorization === 'undefined' || headers.authorization[0].value !== authString) {
    callback(null, unauthorizedResponse);
  }

  callback(null, request);
};
