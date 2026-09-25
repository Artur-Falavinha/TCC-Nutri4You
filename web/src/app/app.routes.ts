import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { AnamneseComponent } from './features/anamnese/anamnese.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HealthComponent } from './features/health/health.component';
import { NotFoundComponent } from './features/not-found/not-found.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  ...AUTH_ROUTES,
  {
    path: 'dashboard',
    component: DashboardComponent,
    title: 'Dashboard — Nutri4You',
    canActivate: [authGuard]
  },
  {
    path: 'anamnese',
    component: AnamneseComponent,
    title: 'Anamnese | Nutri4You',
    canActivate: [authGuard]
  },
  { path: 'health', component: HealthComponent, title: 'Status da API' },
  { path: '**', component: NotFoundComponent, title: 'Página não encontrada' }
];
