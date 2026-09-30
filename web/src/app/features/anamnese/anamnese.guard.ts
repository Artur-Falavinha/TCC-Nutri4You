import { CanDeactivateFn } from '@angular/router';
import { AnamneseComponent } from './anamnese.component';

export const anamneseGuard: CanDeactivateFn<AnamneseComponent> =
  component => component.canLeave();
