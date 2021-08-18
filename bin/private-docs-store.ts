#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PrivateDocsStoreStack } from '../lib/private-docs-store-stack';

const app = new cdk.App();
new PrivateDocsStoreStack(app, 'PrivateDocsStoreStack', {
  // To use normal `lambda.Function` insteadof `EdgeFunction`, create the stack in the `us-east-1` region
  // https://docs.aws.amazon.com/cdk/api/latest/docs/aws-cloudfront-readme.html#lambdaedge
  env: { account: process.env.CDK_DEFAULT_ACOUNT, region: 'us-east-1' },
});
