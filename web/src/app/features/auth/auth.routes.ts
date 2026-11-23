import { Routes } from '@angular/router';

import { guestGuard } from '../../core/guards/guest.guard';
import { cadastroConfirmadoGuard } from './services/cadastro-confirmado.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
    title: 'Login — Nutri4You',
    canActivate: [guestGuard]
  },
  {
    path: 'esqueci-senha',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
    title: 'Recuperar senha — Nutri4You',
    canActivate: [guestGuard]
  },
  {
    path: 'redefinir-senha',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
    title: 'Nova senha — Nutri4You'
  },
  {
    path: 'confirmar-email',
    loadComponent: () =>
      import('./pages/confirmar-email/confirmar-email.component').then(
        (m) => m.ConfirmarEmailComponent
      ),
    title: 'Confirmar e-mail — Nutri4You'
  },
  {
    path: 'cadastro',
    loadComponent: () =>
      import('./pages/cadastro-email/cadastro-email.component').then((m) => m.CadastroEmailComponent),
    title: 'Criar conta — Nutri4You',
    canActivate: [guestGuard]
  },
  {
    path: 'cadastro/dados',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
    title: 'Dados do cadastro — Nutri4You',
    canActivate: [guestGuard, cadastroConfirmadoGuard]
  },
  {
    path: 'cadastro/senha',
    loadComponent: () =>
      import('./pages/register-password/register-password.component').then(
        (m) => m.RegisterPasswordComponent
      ),
    title: 'Criar senha — Nutri4You',
    canActivate: [guestGuard, cadastroConfirmadoGuard]
  }
];
