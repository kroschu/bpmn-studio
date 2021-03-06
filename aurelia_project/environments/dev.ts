const processEngineRoute: string = 'http://localhost:8000';
const electronHost: string = 'bpmn-studio:/';

const isRunningInElectron: boolean = Boolean((window as any).nodeRequire);

// tslint:disable-next-line no-default-export
export default {
  debug: true,
  testing: true,
  appHost: isRunningInElectron
    ? electronHost
    : `http://${window.location.host}`,
  processlist: {
    pageLimit: 10,
  },
  openIdConnect: {
    authority: 'http://localhost:5000',
    defaultAuthority: 'http://localhost:5000',
  },
  processengine: {
    waitingRoomPollingIntervalInMs: 200,
    solutionExplorerPollingIntervalInMs: 5000,
    processDefListPollingIntervalInMs: 5000,
    dashboardPollingIntervalInMs: 1500,
    routes: {
      processes: `${processEngineRoute}/datastore/ProcessDef`,
      startProcess: `${processEngineRoute}/processengine/start`,
      iam: `${processEngineRoute}/iam`,
      userTasks: `${processEngineRoute}/datastore/UserTask`,
      importBPMN: `${processEngineRoute}/processengine/create_bpmn_from_xml`,
    },
  },
  events: {
    differsFromOriginal: 'differsFromOriginal',
    xmlChanged: 'xmlChanged',
    refreshProcessDefs: 'processdefs:refresh',
    statusBar: {
      showDiagramViewButtons: 'statusbar:diagramviewbuttons:show',
      hideDiagramViewButtons: 'statusbar:diagramviewbuttons:hide',
      setXmlIdentifier: 'statusbar:xmlIdentifier',
      showInspectViewButtons: 'statusbar:inspectviewbuttons',
      showInspectCorrelationButtons: 'statusbar:inspectcorrelationbuttons',
    },
    configPanel: {
      processEngineRouteChanged: 'configpanel:processEngineRoute:changed',
    },
    navBar: {
      showTools: 'navbar:tools:show',
      hideTools: 'navbar:tools:hide',
      disableStartButton: 'navbar:startButton:disable',
      enableStartButton: 'navbar:startButton:enable',
      showProcessName: 'navbar:processName:show',
      hideProcessName: 'navbar:processName:hide',
      updateProcess: 'navbar:process:update',
      validationError: 'navbar:validationError:true',
      noValidationError: 'navbar:validationError:false',
      setProcessEngineIcon: 'navbar:setOriginIcon:processEngine',
      updateProcessName: 'navbar:processName:update',
      disableSaveButton: 'navbar:saveButton:disable',
      enableSaveButton: 'navbar:saveButton:enable',
      disableDiagramUploadButton: 'navbar:diagramUploadButton:disable',
      enableDiagramUploadButton: 'navbar:diagramUploadButton:enable',
      inspectNavigateToHeatmap: 'navbar:inspectLink:navigateToHeatmap',
      inspectNavigateToDashboard: 'navbar:inspectLink:navigateToDashboard',
      showInspectButtons: 'navbar:tools:showButtonsOnInspect',
      hideInspectButtons: 'navbar:tools:hideButtonsOnInspect',
      toggleDashboardView: 'navbar:tools:inspectButtons:toggleDashboardView',
      toggleHeatmapView: 'navbar:tools:inspectButtons:toggleHeatmapView',
      toggleInspectCorrelationView: 'navbar:tools:inspectButtons:toggleInspectCorrelationView',
      diagramSuccessfullySaved: 'navbar:diagram:saved',
    },
    diagramDetail: {
      onDiagramDeployed: 'diagramdetail:diagram:ondeployed',
    },
    processDefDetail: {
      printDiagram: 'processdefdetail:diagram:print',
      saveDiagram: 'processdefdetail:diagram:save',
      exportDiagramAs: 'processdefdetail:diagram:exportas',
      startProcess: 'processdefdetail:process:start',
      toggleXMLView: 'processdefdetail:xmlview:toggle',
      uploadProcess: 'processdefdetail:process:upload',
    },
    bpmnio: {
      toggleXMLView: 'processdefdetail:xmlview:toggle',
      toggleDiffView: 'processdefdetail:diffview:toggle',
      showDiffDestinationButton: 'processdefdetail:diffDestinationButton:toggle',
    },
    diffView: {
      changeDiffMode: 'diffview:diffmode:change',
      toggleChangeList: 'diffview:changelist:toggle',
      setDiffDestination: 'diffview:diffDestination:set',
    },
    diagramChange: 'diagram:change',
    processSolutionPanel: {
      toggleProcessSolutionExplorer: 'processSolutionPanel:processsolutionexplorer:toggle',
      navigateToInspect: 'processSolutionPanel:processEngineLinks:navigateToInspect',
      navigateToDesigner: 'processSolutionPanel:processEngineLinks:navigateToDesigner',
    },
    inspect: {
      shouldDisableTokenViewerButton: 'inspect:tokenViewerButton:disable',
    },
    inspectCorrelation: {
      showInspectPanel: 'inspectCorrelation:inspectPanel:show',
      showTokenViewer: 'inspectCorrelation:tokenViewer:show',
    },
  },
  baseRoute: processEngineRoute,
  propertyPanel: {
    defaultWidth: 250,
  },
  colorPickerSettings: {
    preferredFormat: 'hex',
    clickoutFiresChange: true,
    showPalette: true,
    maxSelectionSize: 8,
    showInitial: true,
    showInput: true,
    allowEmpty: true,
    showButtons: false,
    containerClassName: 'colorpicker-container',
  },
};
