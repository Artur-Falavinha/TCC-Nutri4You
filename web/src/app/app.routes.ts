import { AgendaComponent, agendaPendenteGuard } from './features/agenda/agenda.component';
import { ConsultasComponent, consultaPendenteGuard } from './features/clinico/consultas/consultas.component';
import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { AnamneseComponent } from './features/anamnese/anamnese.component';
import { anamneseGuard } from './features/anamnese/anamnese.guard';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ConfiguracoesComponent } from './features/configuracoes/configuracoes.component';
import { HealthComponent } from './features/health/health.component';
import { AppShellComponent } from './layout/app-shell.component';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { NotificacoesComponent } from './features/notificacoes/notificacoes.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  ...AUTH_ROUTES,
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'agenda/atendimentos/:consultaId', component: ConsultasComponent, data: { editor: true, atendimento: true }, canDeactivate: [consultaPendenteGuard], title: 'Atendimento — Nutri4You' },
      { path: 'agenda', component: AgendaComponent, canDeactivate: [agendaPendenteGuard], title: 'Agenda — Nutri4You' },
      {
        path: 'dashboard',
        component: DashboardComponent,
        title: 'Dashboard — Nutri4You'
      },
      {
        path: 'configuracoes',
        component: ConfiguracoesComponent,
        title: 'Configurações — Nutri4You',
      },
      { path: 'notificacoes', component: NotificacoesComponent, title: 'Notificações — Nutri4You' },
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
