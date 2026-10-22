import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { AnamneseComponent } from './features/anamnese/anamnese.component';
import { anamneseGuard } from './features/anamnese/anamnese.guard';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { FeatureUnavailableComponent } from './features/feature-unavailable/feature-unavailable.component';
import { HealthComponent } from './features/health/health.component';
import { AppShellComponent } from './layout/app-shell.component';
import { NotFoundComponent } from './features/not-found/not-found.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  ...AUTH_ROUTES,
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        title: 'Dashboard — Nutri4You'
      },
      {
        path: 'agenda',
        component: FeatureUnavailableComponent,
        title: 'Agenda — Nutri4You',
        data: {
          titulo: 'Agenda',
          descricao: 'A agenda completa ainda não está disponível. Consulte e gerencie os atendimentos no perfil de cada paciente.',
          destino: '/pacientes',
          acao: 'Ver pacientes'
        }
      },
      {
        path: 'configuracoes',
        component: FeatureUnavailableComponent,
        title: 'Configurações — Nutri4You',
        data: {
          titulo: 'Configurações',
          descricao: 'As configurações da conta ainda não estão disponíveis.',
          destino: '/dashboard',
          acao: 'Voltar para o dashboard'
        }
      },
      {
        path: 'anamnese',
        component: AnamneseComponent,
        title: 'Anamnese | Nutri4You',
        canDeactivate: [anamneseGuard]
      },
      {
        path: 'pacientes/:id/anamnese',
        component: AnamneseComponent,
        title: 'Anamnese | Nutri4You',
        canDeactivate: [anamneseGuard]
      },
      {
        path: 'pacientes',
        loadChildren: () =>
          import('./features/pacientes/pacientes.routes').then(
            (m) => m.PACIENTES_ROUTES
          ),
        title: 'Gestão de Pacientes — Nutri4You'
      }
    ]
  },
  { path: 'health', component: HealthComponent, title: 'Status da API' },
  { path: '**', component: NotFoundComponent, title: 'Página não encontrada' }
];
