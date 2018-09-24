'use strict';

const should = require('should');
const uuid = require('uuid');

const TestFixtureProvider = require('../dist/commonjs').TestFixtureProvider;

describe('Deployment API -> importBpmnFromXml', () => {

  let testFixtureProvider;
  let defaultIdentity;
  let restrictedIdentity;

  const processModelId = 'generic_deployment_sample';
  let processModelAsXml;

  before(async () => {
    testFixtureProvider = new TestFixtureProvider();
    await testFixtureProvider.initializeAndStart();

    defaultIdentity = testFixtureProvider.identities.defaultUser;
    restrictedIdentity = testFixtureProvider.identities.restrictedUser;

    processModelAsXml = testFixtureProvider.readProcessModelFile(processModelId);
  });

  after(async () => {
    await testFixtureProvider.tearDown();
  });

  it('should successfully import the process model, if it does not yet exist and overwriteExisting is set to false', async () => {

    // This is to ensure that any existing process models will not falsify the results.
    const uniqueImportName = uuid.v4();

    const importPayload = {
      name: uniqueImportName,
      xml: processModelAsXml,
      overwriteExisting: false,
    };

    await testFixtureProvider.deploymentApiService.importBpmnFromXml(defaultIdentity, importPayload);

    await assertThatImportWasSuccessful();
  });

  it('should successfully import the process model, if it already exists and overwriteExisting is set to true', async () => {

    // This is to ensure that any existing process models will not falsify the results.
    const uniqueImportName = uuid.v4();

    const importPayload = {
      name: uniqueImportName,
      xml: processModelAsXml,
      overwriteExisting: true,
    };

    // The value of overwriteExisting doesn't matter for the first import run.
    await testFixtureProvider.deploymentApiService.importBpmnFromXml(defaultIdentity, importPayload);
    await testFixtureProvider.deploymentApiService.importBpmnFromXml(defaultIdentity, importPayload);

    await assertThatImportWasSuccessful();
  });

  it('should fail to import the process model, if a process model by the same name exists, and overwriteExisting is set to false', async () => {

    try {

      // This is to ensure that any existing process models will not falsify the results.
      const uniqueImportName = uuid.v4();

      const importPayload = {
        name: uniqueImportName,
        xml: processModelAsXml,
        overwriteExisting: false,
      };

      // The value of overwriteExisting doesn't matter for the first import run.
      await testFixtureProvider.deploymentApiService.importBpmnFromXml(defaultIdentity, importPayload);
      await testFixtureProvider.deploymentApiService.importBpmnFromXml(defaultIdentity, importPayload);

      should.fail(undefined, 'error', 'This request should have failed, because the process model already exists!');
    } catch (error) {
      const expectedErrorCode = 409;
      const expectedErrorMessage = /already exists/i;
      should(error.code).be.eql(expectedErrorCode);
      should(error.message).be.match(expectedErrorMessage);
    }

  });

  it('should fail to import the process model, when the user is not authenticated', async () => {

    const importPayload = {
      name: processModelId,
      xml: processModelAsXml,
      overwriteExisting: false,
    };

    try {
      await testFixtureProvider.deploymentApiService.importBpmnFromXml(undefined, importPayload);
      should.fail({}, 'error', 'This request should have failed, due to missing user authentication!');
    } catch (error) {
      const expectedErrorCode = 401;
      const expectedErrorMessage = /no auth token/i;
      should(error.code).be.eql(expectedErrorCode);
      should(error.message).be.match(expectedErrorMessage);
    }
  });

  it('should fail to import the process model, when the user is forbidden to see the process instance result', async () => {

    const importPayload = {
      name: processModelId,
      xml: processModelAsXml,
      overwriteExisting: false,
    };

    try {
      await testFixtureProvider.deploymentApiService.importBpmnFromXml(restrictedIdentity, importPayload);
      should.fail(undefined, 'error', 'This request should have failed, due to a missing claim!');
    } catch (error) {
      const expectedErrorCode = 403;
      const expectedErrorMessage = /access denied/i;
      should(error.code).be.eql(expectedErrorCode);
      should(error.message).be.match(expectedErrorMessage);
    }
  });

  async function assertThatImportWasSuccessful() {

    const existingProcessModel = await testFixtureProvider
      .processModelService
      .getProcessModelById(testFixtureProvider.identities.defaultUser, processModelId);

    should.exist(existingProcessModel);
  }

});
