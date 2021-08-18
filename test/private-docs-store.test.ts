import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as PrivateDocsStore from '../lib/private-docs-store-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new PrivateDocsStore.PrivateDocsStoreStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
