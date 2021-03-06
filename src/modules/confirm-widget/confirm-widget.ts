import {bindable, inject} from 'aurelia-framework';

import {UserTaskConfig, UserTaskFormField, UserTaskFormFieldType} from '@process-engine/management_api_contracts';

import {NotificationType} from '../../contracts/index';
import {NotificationService} from '../notification/notification.service';

@inject('NotificationService')
export class ConfirmWidget {

  @bindable()
  public userTaskConfig: UserTaskConfig;
  public formFields: Array<UserTaskFormField>;
  public confirmMessage: string;

  private _notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this._notificationService = notificationService;
  }

  public attached(): void {
    const firstBooleanFormField: UserTaskFormField = this._getFirstBooleanFormField();
    const userTaskHasNoBooleanFormField: boolean = firstBooleanFormField === undefined;

    if (userTaskHasNoBooleanFormField) {
      const errorMessage: string = 'Confirm UserTasks must have a form field of type boolean that should get confirmed.';

      this._notificationService.showNotification(NotificationType.ERROR, errorMessage);
    }

    this.confirmMessage = firstBooleanFormField.label;
    this.formFields = this._getAllOtherFormFields(firstBooleanFormField);
  }

  // TODO: Move this to a UserTaskControlFactory
  public getFieldControl(field: UserTaskFormField): string {
    switch (field.type) {
      case UserTaskFormFieldType.enum:
        return 'dropdown';
      case UserTaskFormFieldType.string:
        return 'textbox';
      case UserTaskFormFieldType.boolean:
        return 'checkbox';
      case UserTaskFormFieldType.long:
        return 'number';
      default:
        const notSupportedType: string = field.type !== undefined ? field.type : 'Custom Type';
        const errorMessage: string = `Not supported form field type: ${notSupportedType}.`
                                   + `</br>Please change the form field type with id "${field.id}".`;

        this._notificationService.showNotification(NotificationType.ERROR, errorMessage);
        return null;
    }
  }

  private _getAllOtherFormFields(formField: UserTaskFormField): Array<UserTaskFormField> {
    const booleanFormFieldIndex: number = this.userTaskConfig.formFields.indexOf(formField);

    const otherFormFields: Array<UserTaskFormField> = this.userTaskConfig.formFields.slice();
    otherFormFields.splice(booleanFormFieldIndex, 1);

    return otherFormFields;
  }

  private _getFirstBooleanFormField(): UserTaskFormField {
    const formFields: Array<UserTaskFormField> = this.userTaskConfig.formFields;

    return formFields.find((formField: UserTaskFormField): boolean => {
      return formField.type === UserTaskFormFieldType.boolean;
    });
  }
}
