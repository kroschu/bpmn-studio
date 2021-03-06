import {IIdentity} from './IIdentity';

export interface IAuthenticationService {
  login(): Promise<void>;
  logout(): Promise<void>;
  isLoggedIn(): boolean;
  getAccessToken(): string;
  getIdentity(): Promise<IIdentity>;
}
