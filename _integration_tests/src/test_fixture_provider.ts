import * as fs from 'fs';
import * as path from 'path';

import {InvocationContainer} from 'addict-ioc';
import {Logger} from 'loggerhythm';

import {AppBootstrapper} from '@essential-projects/bootstrapper_node';
import {IIdentity} from '@essential-projects/iam_contracts';

import {IDeploymentApiService} from '@process-engine/deployment_api_contracts';
import {ExecutionContext, IExecutionContextFacade, IExecutionContextFacadeFactory} from '@process-engine/process_engine_contracts';

const logger: Logger = Logger.createLogger('test:bootstrapper');

const iocModuleNames: Array<string> = [
  '@essential-projects/bootstrapper',
  '@essential-projects/bootstrapper_node',
  '@essential-projects/event_aggregator',
  '@essential-projects/http_extension',
  '@essential-projects/services',
  '@essential-projects/timing',
  '@process-engine/consumer_api_core',
  '@process-engine/correlations.repository.sequelize',
  '@process-engine/deployment_api_core',
  '@process-engine/deployment_api_http',
  '@process-engine/flow_node_instance.repository.sequelize',
  '@process-engine/iam',
  '@process-engine/metrics_api_core',
  '@process-engine/metrics.repository.file_system',
  '@process-engine/process_engine_core',
  '@process-engine/process_model.repository.sequelize',
  '@process-engine/timers.repository.sequelize',
  '../../',
];

const iocModules: Array<any> = iocModuleNames.map((moduleName: string): any => {
  return require(`${moduleName}/ioc_module`);
});

export class TestFixtureProvider {
  private httpBootstrapper: AppBootstrapper;
  private _deploymentApiService: IDeploymentApiService;

  private container: InvocationContainer;

  private _identityDefault: IIdentity = undefined;
  private _identityForbidden: IIdentity = undefined;

  public get identity(): IIdentity {
    return this._identityDefault;
  }

  public get identityForbidden(): IIdentity {
    return this._identityForbidden;
  }

  public get deploymentApiService(): IDeploymentApiService {
    return this._deploymentApiService;
  }

  public async initializeAndStart(): Promise<void> {
    await this._initializeBootstrapper();
    await this.httpBootstrapper.start();
    await this._createContexts();
    this._deploymentApiService = await this.resolveAsync<IDeploymentApiService>('DeploymentApiService');
  }

  public async tearDown(): Promise<void> {
    const httpExtension: any = await this.container.resolveAsync('HttpExtension');
    await httpExtension.close();
  }

  public async resolveAsync<T>(moduleName: string, args?: any): Promise<any> {
    return this.container.resolveAsync<T>(moduleName, args);
  }

  private async _initializeBootstrapper(): Promise<void> {

    try {
      this.container = new InvocationContainer({
        defaults: {
          conventionCalls: ['initialize'],
        },
      });

      for (const iocModule of iocModules) {
        iocModule.registerInContainer(this.container);
      }

      this.container.validateDependencies();

      const appPath: string = path.resolve(__dirname);
      this.httpBootstrapper = await this.resolveAsync<AppBootstrapper>('AppBootstrapper', [appPath]);

      logger.info('Bootstrapper started.');
    } catch (error) {
      logger.error('Failed to start bootstrapper!', error);
      throw error;
    }
  }

  private async _createContexts(): Promise<void> {

    // Note: Since the iam service is mocked, it doesn't matter what kind of token is used here.
    // It only matters that one is present.
    this._identityDefault = <IIdentity> {
      token: 'deploymentApiIntegrationtestUser',
    };

    this._identityForbidden = <IIdentity> {
      token: 'forbiddenUser',
    };
  }

  public async getExecutionContextFacadeForIdentity(identity: IIdentity): Promise<IExecutionContextFacade> {

    const executionContext: ExecutionContext = new ExecutionContext(identity);

    const executionContextFacadeFactory: IExecutionContextFacadeFactory =
      await this.resolveAsync<IExecutionContextFacadeFactory>('ExecutionContextFacadeFactory');

    return executionContextFacadeFactory.create(executionContext);
  }

  public readProcessModelFromFile(fileName: string): string {

    const bpmnFolderLocation: string = this.getBpmnDirectoryPath();
    const processModelPath: string = path.join(bpmnFolderLocation, `${fileName}.bpmn`);

    const processModelAsXml: string = fs.readFileSync(processModelPath, 'utf-8');

    return processModelAsXml;
  }

  /**
   * Generate an absoulte path, which points to the bpmn directory.
   *
   * Checks if the cwd is "_integration_tests". If not, that directory name is appended.
   * This is necessary, because Jenkins uses a different cwd than the local machines do.
   */
  public getBpmnDirectoryPath(): string {

    const bpmnDirectoryName: string = 'bpmn';
    let rootDirPath: string = process.cwd();
    const integrationTestDirName: string = '_integration_tests';

    if (!rootDirPath.endsWith(integrationTestDirName)) {
      rootDirPath = path.join(rootDirPath, integrationTestDirName);
    }

    return path.join(rootDirPath, bpmnDirectoryName);
  }
}
