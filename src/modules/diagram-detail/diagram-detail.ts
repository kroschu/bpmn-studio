import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';
import {Redirect, Router} from 'aurelia-router';
import {ValidateEvent, ValidationController} from 'aurelia-validation';

import {IIdentity} from '@essential-projects/iam_contracts';
import {IManagementApi} from '@process-engine/management_api_contracts';
import {ProcessModelExecution} from '@process-engine/management_api_contracts';
import {IDiagram} from '@process-engine/solutionexplorer.contracts';
import {ISolutionExplorerService} from '@process-engine/solutionexplorer.service.contracts';

import {IAuthenticationService, IModdleElement, NotificationType} from '../../contracts/index';
import environment from '../../environment';
import {BpmnIo} from '../bpmn-io/bpmn-io';
import {NotificationService} from '../notification/notification.service';

interface RouteParameters {
  diagramUri: string;
}

@inject('SolutionExplorerServiceFileSystem',
        'ManagementApiClientService',
        'AuthenticationService',
        'NotificationService',
        EventAggregator,
        Router,
        ValidationController)
export class DiagramDetail {

  public diagram: IDiagram;
  public bpmnio: BpmnIo;
  public showUnsavedChangesModal: boolean = false;
  public showSaveBeforeDeployModal: boolean = false;

  private _solutionExplorerService: ISolutionExplorerService;
  private _managementClient: IManagementApi;
  private _authenticationService: IAuthenticationService;
  private _notificationService: NotificationService;
  private _eventAggregator: EventAggregator;
  private _subscriptions: Array<Subscription>;
  private _router: Router;
  private _diagramHasChanged: boolean;
  private _validationController: ValidationController;
  private _diagramIsInvalid: boolean = false;

  // This identity is used for the filesystem actions. Needs to be refactored.
  private _identity: any;

  constructor(solutionExplorerService: ISolutionExplorerService,
              managementClient: IManagementApi,
              authenticationService: IAuthenticationService,
              notificationService: NotificationService,
              eventAggregator: EventAggregator,
              router: Router,
              validationController: ValidationController) {
    this._solutionExplorerService = solutionExplorerService;
    this._managementClient = managementClient;
    this._authenticationService = authenticationService;
    this._notificationService = notificationService;
    this._eventAggregator = eventAggregator;
    this._router = router;
    this._validationController = validationController;
  }

  public determineActivationStrategy(): string {
    return 'replace';
  }

  public async activate(routeParameters: RouteParameters): Promise<void> {
    this.diagram = await this._solutionExplorerService.openSingleDiagram(routeParameters.diagramUri, this._identity);

    this._diagramHasChanged = false;
  }

  public attached(): void {
    const navbarTitle: string = (this.diagram.id === undefined)
                              ? (this.diagram.name)
                              : (this.diagram.id);
    this._eventAggregator.publish(environment.events.navBar.showTools, navbarTitle);
    this._eventAggregator.publish(environment.events.navBar.enableDiagramUploadButton);
    this._eventAggregator.publish(environment.events.navBar.disableStartButton);
    this._eventAggregator.publish(environment.events.navBar.showProcessName, this.diagram);

    this._eventAggregator.publish(environment.events.statusBar.showDiagramViewButtons);

    this._subscriptions = [
      this._validationController.subscribe((event: ValidateEvent) => {
        this._handleFormValidateEvents(event);
      }),
      this._eventAggregator.subscribe(environment.events.processDefDetail.saveDiagram, () => {
        this._saveDiagram();
      }),
      this._eventAggregator.subscribe(environment.events.processDefDetail.uploadProcess, () => {
        this._checkIfDiagramIsSavedBeforeDeploy();
      }),
      this._eventAggregator.subscribe(environment.events.differsFromOriginal, (savingNeeded: boolean) => {
        this._diagramHasChanged = savingNeeded;
      }),
    ];
  }

  public async canDeactivate(): Promise<Redirect> {

    const _modal: Promise<boolean> = new Promise((resolve: Function, reject: Function): boolean | void => {
      if (!this._diagramHasChanged) {
        resolve(true);
      } else {
        this.showUnsavedChangesModal = true;

        // register onClick handler
        document.getElementById('dontSaveButtonLeaveView').addEventListener('click', () => {
          this.showUnsavedChangesModal = false;
          this._diagramHasChanged = false;
          resolve(true);
        });
        document.getElementById('saveButtonLeaveView').addEventListener('click', () => {
          if (this._diagramIsInvalid) {
            resolve(false);
          }

          this.showUnsavedChangesModal = false;
          this._saveDiagram();
          this._diagramHasChanged = false;
          resolve(true);
        });
        document.getElementById('cancelButtonLeaveView').addEventListener('click', () => {
          this.showUnsavedChangesModal = false;
          resolve(false);
        });
      }
    });

    const result: boolean = await _modal;
    if (result === false) {
      /*
       * As suggested in https://github.com/aurelia/router/issues/302, we use
       * the router directly to navigate back, which results in staying on this
       * component-- and this is the desired behaviour.
       */
      return new Redirect(this._router.currentInstruction.fragment, {trigger: false, replace: false});
    }
  }

  public detached(): void {
    for (const subscription of this._subscriptions) {
      subscription.dispose();
    }

    this._eventAggregator.publish(environment.events.navBar.hideTools);
    this._eventAggregator.publish(environment.events.navBar.hideProcessName);
    this._eventAggregator.publish(environment.events.navBar.enableStartButton);
    this._eventAggregator.publish(environment.events.navBar.noValidationError);
    this._eventAggregator.publish(environment.events.navBar.disableDiagramUploadButton);
    this._eventAggregator.publish(environment.events.statusBar.hideDiagramViewButtons);
  }

  /**
   * Saves the current diagram to disk and deploys it to the
   * process engine.
   */
  public async saveDiagramAndDeploy(): Promise<void> {
    this.showSaveBeforeDeployModal = false;
    await this._saveDiagram();
    await this.uploadProcess();
  }

  /**
   * Dismisses the saveBeforeDeploy modal.
   */
  public cancelSaveBeforeDeployModal(): void {
    this.showSaveBeforeDeployModal = false;
  }

  /**
   * Uploads the current diagram to the connected ProcessEngine.
   */
  public async uploadProcess(): Promise<void> {
    const rootElements: Array<IModdleElement> = this.bpmnio.modeler._definitions.rootElements;
    const payload: ProcessModelExecution.UpdateProcessDefinitionsRequestPayload = {
      xml: this.diagram.xml,
    };

    const processModel: IModdleElement = rootElements.find((definition: IModdleElement) => {
      return definition.$type === 'bpmn:Process';
    });
    const processModelId: string = processModel.id;

    const identity: IIdentity = this._getIdentity();

    try {
      await this
        ._managementClient
        .updateProcessDefinitionsByName(identity, processModelId, payload);

      this._notificationService
          .showNotification(NotificationType.SUCCESS, 'Diagram was successfully uploaded to the connected ProcessEngine.');

      // Since a new processmodel was uploaded, we need to refresh any processmodel lists.
      this._eventAggregator.publish(environment.events.refreshProcessDefs);

      this._router.navigateToRoute('processdef-detail', {
        processModelId: processModelId,
      });
    } catch (error) {
      this._notificationService
          .showNotification(NotificationType.ERROR, `Unable to update diagram: ${error}.`);
    }
  }

  /**
   * Saves the current diagram to disk.
   */
  private async _saveDiagram(): Promise<void> {

    if (this._diagramIsInvalid) {
      this._notificationService.showNotification(NotificationType.WARNING, `The could not be saved because it is invalid!`);

      return;
    }

    try {
      const xml: string = await this.bpmnio.getXML();
      this.diagram.xml = xml;

      this._solutionExplorerService.saveSingleDiagram(this.diagram, this._identity);
      this._diagramHasChanged = false;
      this._notificationService
          .showNotification(NotificationType.SUCCESS, `File saved!`);
    } catch (error) {
      this._notificationService
          .showNotification(NotificationType.ERROR, `Unable to save the file: ${error}.`);
    }
  }

  /**
   * Checks, if the diagram is saved before it can be deployed.
   *
   * If not, the user will be ask to save the diagram.
   */
  private async _checkIfDiagramIsSavedBeforeDeploy(): Promise<void> {
    if (this._diagramHasChanged) {
      this.showSaveBeforeDeployModal = true;
    } else {
      await this.uploadProcess();
    }
  }

  private _getIdentity(): IIdentity {
    const accessToken: string = this._authenticationService.getAccessToken();
    const identity: IIdentity = {
      token: accessToken,
    };

    return identity;
  }

  private _handleFormValidateEvents(event: ValidateEvent): void {
    const eventIsValidateEvent: boolean = event.type !== 'validate';

    if (eventIsValidateEvent) {
      return;
    }

    for (const result of event.results) {
      const resultIsNotValid: boolean = result.valid === false;

      if (resultIsNotValid) {
        this._eventAggregator
          .publish(environment.events.navBar.validationError);
        this._diagramIsInvalid = true;

        return;
      }
    }

    this._eventAggregator
      .publish(environment.events.navBar.noValidationError);
    this._diagramIsInvalid = false;
  }
}
