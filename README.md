# Private Docs Store

The CDK stack creates these resources:

- CloudFront
  - enabled Basic Authentication with Lambda@Edge
- S3 bucket
  - When objects are put, a notification is sent to your Slack channel

## Init

You must create the stack in the us-east-1 region.

```
$ npx cdk bootstrap --profile YOUR_PROFILE_NAME
$ npx cdk deploy PrivateDocsStoreStack --profile YOUR_PROFILE NAME
$ cp config/slackConfig.json.example config/slackConfig.json
$ cat config/slackConfig.json
{
  "SLACK_BOT_TOKEN": "YOUR_SLACK_BOT_TOKEN",
  "SLACK_SIGNING_SECRET": "YOUR_SLACK_SIGNING_SECRET",
  "SLACK_CHANNEL_ID": "YOUR_SLACK_CHANNEL_NAME"
}
$ aws secrets manager update-secret --secret-id private-docs-store-secret --secret-string $(echo -n "YOUR_BASIC_USER:YOUR_BASIC_PASS" | base64) --profile YOUR_PROFILE_NAME
$ aws secrets manager update-secret --secret-id YOUR_SLACK_NOTIFIER_SECRET_NAME --secret-string file://config/slackConfig.json --profile YOUR_PROFILE_NAME
```

note: The bot token requires the `chat.write` permission.
