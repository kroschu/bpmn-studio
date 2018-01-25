import {IProcessRef} from './IProcessRef';

export interface IModdleElement {
  id: string;
  name: string;
  documentation: string;
  get: any;
  $type: string;
  $attrs?: any;
  $parent?: IModdleElement;
  di?: any;
  processRef?: IProcessRef;
  eventDefinitions?: Array<IModdleElement>;
  messageRef?: IModdleElement;
  signalRef?: IModdleElement;
  errorRef?: IModdleElement;
  script?: string;
  scriptFormat?: string;
  resultVariable?: string;
  calledElement?: string;
  calledElementTenantId?: string;
  variableMappingClass?: string;
  variableMappingDelegateExpression?: string;
  calledElementBinding?: string;
  calledElementVersion?: string;
  targetRef?: IModdleElement;
  conditionExpression?: IModdleElement;
  body?: string;
  extensionElements?: IModdleElement;
  values?: Array<IModdleElement>;
  formKey?: string;
  fields?: Array<IModdleElement>;
  type?: string;
  label?: string;
  defaultValue?: string;
  errorCode?: string;
  errorMessageVariable?: string;
}
