import {Container, FrameworkConfiguration} from 'aurelia-framework';

import {IHttpClient} from '@essential-projects/http_contracts';
import {SolutionExplorerFileSystemRepository} from '@process-engine/solutionexplorer.repository.filesystem';
import {SolutionExplorerManagementApiRepository} from '@process-engine/solutionexplorer.repository.management_api';
import {SolutionExplorerService} from '@process-engine/solutionexplorer.service';

import {DiagramTrashFolderService} from './DiagramTrashFolderService';
import {RefreshingSolutionExplorerService} from './RefreshingSolutionExplorerService';
import {SolutionExplorerServiceFactory} from './SolutionExplorerServiceFactory';

export async function configure(config: FrameworkConfiguration): Promise<void> {
  if ((window as any).nodeRequire) {
    // only available if a filesystem is present
    registerFileSystem(config.container);
  }

  registerManagementApi(config.container);

  config.container.registerSingleton('SolutionExplorerServiceFactory', SolutionExplorerServiceFactory);
  config.container.registerSingleton('DiagramTrashFolderService', DiagramTrashFolderService);
}

function registerFileSystem(container: Container): void {
  const diagramTrashFolderService: DiagramTrashFolderService = new DiagramTrashFolderService();
  const diagramTrashFolder: string = diagramTrashFolderService.getDiagramTrashFolder();

  const fileSystemRepository: SolutionExplorerFileSystemRepository = new SolutionExplorerFileSystemRepository(diagramTrashFolder);
  const filesystemSolutionexplorerService: SolutionExplorerService = new SolutionExplorerService(fileSystemRepository);

  container.registerInstance('SolutionExplorerServiceFileSystem', filesystemSolutionexplorerService);
}

function registerManagementApi(container: Container): void {
  const httpClient: IHttpClient = container.get('HttpFetchClient');
  const managementApiRepository: SolutionExplorerManagementApiRepository = new SolutionExplorerManagementApiRepository(httpClient);
  const solutionexplorerService: SolutionExplorerService = new SolutionExplorerService(managementApiRepository);

  container.registerInstance('SolutionExplorerServiceManagementApi_NotRefreshing', solutionexplorerService);

  container.registerSingleton('SolutionExplorerServiceManagementApi', RefreshingSolutionExplorerService);
}
