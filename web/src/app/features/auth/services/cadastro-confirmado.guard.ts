import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { RegisterFlowService } from './register-flow.service';

export const cadastroConfirmadoGuard: CanActivateFn = () =>
  inject(RegisterFlowService).getEmailConfirmado() ? true : inject(Router).createUrlTree(['/cadastro']);
