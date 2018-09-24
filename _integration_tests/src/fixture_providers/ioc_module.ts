'use strict';

import {IamServiceMock} from '../mocks/index';

export function registerInContainer(container: any): void {
  // This removes the necessity for having a running IdentityServer during testing.
  container.register('IamService', IamServiceMock);
}
