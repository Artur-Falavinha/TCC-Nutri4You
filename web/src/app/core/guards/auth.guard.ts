import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  if (!tokenStorage.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return authService.fetchMe().pipe(
    map((usuario) => {
      if (usuario.perfil !== 'NUTRICIONISTA') {
        tokenStorage.clear();
        return router.createUrlTree(['/login'], {
          queryParams: { erro: 'acesso-web-nutricionista' }
        });
      }
      tokenStorage.setPerfil(usuario.perfil);
      return true;
    }),
    catchError(() => {
      tokenStorage.clear();
      return of(router.createUrlTree(['/login']));
    })
  );
};
