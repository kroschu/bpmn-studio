import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {bindable, computedFrom, inject} from 'aurelia-framework';
import {OpenIdConnect} from 'aurelia-open-id-connect';
import {Router} from 'aurelia-router';

import {IAuthenticationService} from '../../contracts/authentication/IAuthenticationService';
import {AuthenticationStateEvent, NotificationType} from '../../contracts/index';
import environment from '../../environment';
import {oidcConfig} from '../../open-id-connect-configuration';
import {NotificationService} from '../notification/notification.service';

@inject(Router, 'NotificationService', EventAggregator, 'AuthenticationService', OpenIdConnect, 'InternalProcessEngineBaseRoute')
export class ConfigPanel {
  @bindable public baseRoute: string;
  @bindable public authority: string;
  public readonly defaultAuthority: string = environment.openIdConnect.defaultAuthority;
  public isLoggedInToProcessEngine: boolean;
  public internalProcessEngineBaseRoute: string | null;

  private _router: Router;
  private _notificationService: NotificationService;
  private _eventAggregator: EventAggregator;
  private _authenticationService: IAuthenticationService;
  private _subscriptions: Array<Subscription>;
  // We use any here, because we need to call private members (see below)
  private _openIdConnect: OpenIdConnect | any;

  constructor(router: Router,
              notificationService: NotificationService,
              eventAggregator: EventAggregator,
              authenticationService: IAuthenticationService,
              openIdConnect: OpenIdConnect,
              internalProcessEngineBaseRoute: string | null,
            ) {

    this._router = router;
    this._notificationService = notificationService;
    this._eventAggregator = eventAggregator;
    this._authenticationService = authenticationService;
    this._openIdConnect = openIdConnect;
    this.internalProcessEngineBaseRoute = internalProcessEngineBaseRoute;
  }

  public attached(): void {
    this.baseRoute = environment.baseRoute;

    // If there is a route set in the localstorage, we prefer this setting.
    const customProcessEngineRoute: string = window.localStorage.getItem('processEngineRoute');
    const isCustomProcessEngineRouteSet: boolean = customProcessEngineRoute !== ''
                                                && customProcessEngineRoute !== null;

    const baseRouteConfiguredInLocalStorage: string = isCustomProcessEngineRouteSet
    ? customProcessEngineRoute
    : window.localStorage.getItem('InternalProcessEngineRoute') ;

    if (baseRouteConfiguredInLocalStorage) {
      this.baseRoute = baseRouteConfiguredInLocalStorage;
    }

    const customOpenIdRoute: string = window.localStorage.getItem('openIdRoute');
    const customOpenIdRouteIsSet: boolean = customOpenIdRoute !== null
                                         && customOpenIdRoute !== undefined
                                         && customOpenIdRoute !== '';

    if (customOpenIdRouteIsSet) {
      this.authority = customOpenIdRoute;
    }

    this.isLoggedInToProcessEngine = this._authenticationService.isLoggedIn();

    this._subscriptions = [
      this._eventAggregator.subscribe(AuthenticationStateEvent.LOGOUT, () => {
        this.isLoggedInToProcessEngine = this._authenticationService.isLoggedIn();
      }),
      this._eventAggregator.subscribe(AuthenticationStateEvent.LOGIN, () => {
        this.isLoggedInToProcessEngine = this._authenticationService.isLoggedIn();
      }),
    ];
  }

  public detached(): void {
    for (const subscription of this._subscriptions) {
      subscription.dispose();
    }
  }

  public async updateSettings(): Promise<void> {

    const accessTokenIsNotDummy: boolean = this._authenticationService.getAccessToken() !== 'ZHVtbXlfdG9rZW4=';
    if (accessTokenIsNotDummy) {
      await this._authenticationService.logout();
    }

    this._eventAggregator.publish(environment.events.configPanel.processEngineRouteChanged, this.baseRoute);

    const baseRouteIsInternalProcessEngine: boolean = this.baseRoute === window.localStorage.getItem('InternalProcessEngineRoute');
    if (baseRouteIsInternalProcessEngine) {
      window.localStorage.setItem('processEngineRoute', '');
    } else {
      window.localStorage.setItem('processEngineRoute', this.baseRoute);
    }

    const authorityIsSet: boolean = this.authority !== undefined
                                 && this.authority !== null
                                 && this.authority !== '';

    if (authorityIsSet) {
      window.localStorage.setItem('openIdRoute', this.authority);
    }

    oidcConfig.userManagerSettings.authority = this.authority;

    // This dirty way to update the settings is the only way during runtime
    this._openIdConnect.configuration.userManagerSettings.authority = this.authority;
    this._openIdConnect.userManager._settings._authority = this.authority;

    this._notificationService.showNotification(NotificationType.SUCCESS, 'Successfully saved settings!');

    this._router.navigateBack();
  }

  public authorityChanged(): void {
    /*
     * TODO: The environment variables should not carry state. This should be done via a configurationService.
     * https://github.com/process-engine/bpmn-studio/issues/673
     */
    environment.openIdConnect.authority = this.authority;
  }

  public setDefaultAuthority(): void {
    this.authority = this.defaultAuthority;
  }

  public cancelUpdate(): void {
    this._notificationService.showNotification(NotificationType.WARNING, 'Settings dismissed!');
    this._router.navigateBack();
  }

  @computedFrom('baseRoute')
  public get isBaseRouteNotSetToInternalProcessEngine(): boolean {
    return this.internalProcessEngineBaseRoute !== this.baseRoute;
  }

  public hasInternalProcessEngineBaseRouteSet(): boolean {
    return this.internalProcessEngineBaseRoute !== null;
  }

  public setBaseRouteToInternalProcessEngine(): void {
    this.baseRoute = this.internalProcessEngineBaseRoute;
  }

}
