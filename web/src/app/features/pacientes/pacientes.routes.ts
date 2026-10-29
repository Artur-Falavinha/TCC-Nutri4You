import { PlanoComponent, planoPendenteGuard } from '../plano-alimentar/plano.component';
import { Routes } from '@angular/router';

import { PacientesListaComponent } from './pages/lista/pacientes-lista.component';
import { DadosComponent } from '../clinico/dados/dados.component';
import { HistoricoComponent } from '../clinico/historico/historico.component';
import { ConsultasComponent, consultaPendenteGuard } from '../clinico/consultas/consultas.component';
import { DietaComponent, dietaPendenteGuard } from '../dieta/dieta.component';

export const PACIENTES_ROUTES: Routes = [
  {
    path: '',
    component: PacientesListaComponent,
    title: 'Gestão de Pacientes — Nutri4You'
  },
  { path: ':id/plano-alimentar', component: PlanoComponent, canDeactivate: [planoPendenteGuard], title: 'Plano alimentar — Nutri4You' },
  { path: ':id/dados', component: DadosComponent, title: 'Dados do paciente — Nutri4You' },
  { path: ':id/historico', component: HistoricoComponent, title: 'Histórico — Nutri4You' },
  { path: ':id/medidas', redirectTo: ':id/consultas', pathMatch: 'full' },
  { path: ':id/consultas', component: ConsultasComponent, title: 'Consultas — Nutri4You' },
  { path: ':id/consultas/nova', redirectTo: ':id/consultas', pathMatch: 'full' },
  {
    path: ':id/dieta',
    component: DietaComponent,
    canDeactivate: [dietaPendenteGuard],
    title: 'Dieta — Nutri4You'
  },
  {
    path: ':id/consultas/:consultaId',
    component: ConsultasComponent,
    data: { editor: true },
    canDeactivate: [consultaPendenteGuard],
    title: 'Consulta — Nutri4You'
  }
];
