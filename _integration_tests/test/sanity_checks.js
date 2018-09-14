'use strict';

const should = require('should');

const TestFixtureProvider = require('../dist/commonjs/test_fixture_provider').TestFixtureProvider;

describe('Deployment API -> Sanity Checks', () => {

  let testFixtureProvider;

  const processModelId = 'generic_deployment_sanity_check';
  const processModelUpdatedId = 'generic_deployment_sanity_check_updated';

  let processModelXml;
  let processModelUpdatedXml;

  let executionContextFacade;
  let processModelService;

  before(async () => {

    testFixtureProvider = new TestFixtureProvider();
    await testFixtureProvider.initializeAndStart();

    processModelXml = testFixtureProvider.readProcessModelFromFile(processModelId);
    processModelUpdatedXml = testFixtureProvider.readProcessModelFromFile(processModelUpdatedId);

    executionContextFacade = await testFixtureProvider.createExecutionContextFacadeForContext(testFixtureProvider.context);
    processModelService = await testFixtureProvider.resolveAsync('ProcessModelService');

    await performImport(processModelXml);
    await performImport(processModelUpdatedXml);
  });

  after(async () => {
    await testFixtureProvider.tearDown();
  });

  it('should always return the most up to date version of any process definition', async () => {

    const existingProcessModel = await processModelService.getProcessModelById(executionContextFacade, processModelId);

    should.exist(existingProcessModel);
    should(existingProcessModel.id).be.equal(processModelId);

    const startEvent = existingProcessModel.flowNodes.find((flowNode) => {
      return flowNode.constructor.name === 'StartEvent';
    });

    // The difference between the two process models is the ID of their StartEvent.
    // We must be expecting the updated StartEvent ID.
    const expectedStartEventId = 'StartEvent_666';

    should.exist(startEvent);
    should(startEvent.id).be.equal(expectedStartEventId, `Received an unexpected StartEventId: ${startEvent.id}`);
  });

  it('should not contain outdated versions of any process definitions, when querying all process definitions', async () => {

    const processModels = await processModelService.getProcessModels(executionContextFacade);

    const occurencesOfTestProcessModel = processModels.filter((item) => {
      return item.id === processModelId;
    });

    should(occurencesOfTestProcessModel.length).be.equal(1);
  });

  async function performImport(xml) {

    const importPayload = {
      name: processModelId,
      xml: xml,
      overwriteExisting: true,
    };

    await testFixtureProvider.deploymentApiService.importBpmnFromXml(testFixtureProvider.context, importPayload);
  }

});
