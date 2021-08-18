import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as iam from '@aws-cdk/aws-iam';
import * as secretsManager from '@aws-cdk/aws-secretsmanager';
import { S3EventSource } from '@aws-cdk/aws-lambda-event-sources';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';

export class PrivateDocsStoreStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'privateDocsBucket');

    const storeIdentity = new cloudfront.OriginAccessIdentity(this, 'storeIdentity');
    const bucketPolicyStatement = new iam.PolicyStatement({
      actions: ["s3:GetObject"],
      effect: iam.Effect.ALLOW,
      principals: [
        new iam.CanonicalUserPrincipal(
          storeIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
        )
      ],
      resources: [`${bucket.bucketArn}/*`],
    });
    bucket.addToResourcePolicy(bucketPolicyStatement);

    const basicAuthSecret = new secretsManager.Secret(this, 'basicAuthSecret', {
      secretName: 'private-docs-store-secret',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const basicAuthFunction = new NodejsFunction(this, 'basicAuthFunction', {
      entry: 'src/lambda/handlers/auth.ts',
    });
    basicAuthSecret.grantRead(basicAuthFunction);

    const cloudfrontDistribution = new cloudfront.CloudFrontWebDistribution(this, 'privateDocsDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: storeIdentity,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              lambdaFunctionAssociations: [
                {
                  eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                  lambdaFunction: basicAuthFunction.currentVersion,
                },
              ],
            },
          ],
        },
      ],
    });

    const slackNotifierSecret = new secretsManager.Secret(this, 'slackNotifierSecret', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const slackNotifierFunction = new NodejsFunction(this, 'slackNotifierFunction', {
      entry: 'src/lambda/handlers/notify.ts',
      environment: {
        SECRET_NAME: slackNotifierSecret.secretName,
        DISTRIBUTION_DOMAIN: cloudfrontDistribution.domainName,
      },
    });
    slackNotifierSecret.grantRead(slackNotifierFunction);

    slackNotifierFunction.addEventSource(new S3EventSource(bucket, {
      events: [ s3.EventType.OBJECT_CREATED ],
    }));

    new cdk.CfnOutput(this, 'cloudfrontDomainName', { value: cloudfrontDistribution.domainName });
    new cdk.CfnOutput(this, 'basicAuthSecretName', { value: basicAuthSecret.secretName });
    new cdk.CfnOutput(this, 'notifierSecretName', { value: slackNotifierSecret.secretName });
    new cdk.CfnOutput(this, 'bucketName', { value: bucket.bucketName });
  }
}
