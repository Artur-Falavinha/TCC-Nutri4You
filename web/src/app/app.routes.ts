import { Routes } from '@angular/router';

import { AnamneseComponent } from './features/anamnese/anamnese.component';
import { anamneseGuard } from './features/anamnese/anamnese.guard';
import { HealthComponent } from './features/health/health.component';
import { HomeComponent } from './features/home/home.component';
import { NotFoundComponent } from './features/not-found/not-found.component';

/**
 * Rotas base da Sprint 1. Módulos de negócio (autenticação, pacientes,
 * anamnese, prescrição, agenda, exames) entram como features próprias
 * a partir da Sprint 2, cada uma com seu próprio arquivo de rotas
 * carregado via loadChildren quando fizer sentido.
 */
export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Nutri4You' },
  { path: 'anamnese', component: AnamneseComponent, canDeactivate: [anamneseGuard], title: 'Anamnese | Nutri4You' },
  { path: 'pacientes/:id/anamnese', component: AnamneseComponent, canDeactivate: [anamneseGuard], title: 'Anamnese | Nutri4You' },
  { path: 'health', component: HealthComponent, title: 'Status da API' },
  { path: '**', component: NotFoundComponent, title: 'Página não encontrada' }
];
