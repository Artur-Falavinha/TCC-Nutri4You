import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';

import { apiErrorInterceptor } from './core/interceptors/api-error.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { routes } from './app.routes';
import { ToastComponent } from './shared/components/toast/toast.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideToastr({
      toastComponent: ToastComponent,
      toastClass: 'toast-nutri',
      positionClass: 'toast-nutri-posicao',
      timeOut: 5000,
      extendedTimeOut: 2000,
      maxOpened: 3,
      preventDuplicates: true,
      tapToDismiss: false
    }),
    provideHttpClient(withInterceptors([authInterceptor, apiErrorInterceptor]))
  ]
};
