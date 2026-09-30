import { Routes } from '@angular/router';

import { PacientesLayoutComponent } from './layout/pacientes-layout.component';
import { PacientesListaComponent } from './pages/lista/pacientes-lista.component';
import { DadosComponent } from '../clinico/dados/dados.component';
import { HistoricoComponent } from '../clinico/historico/historico.component';
import { MedidasComponent } from '../clinico/medidas/medidas.component';

export const PACIENTES_ROUTES: Routes = [
  {
    path: '',
    component: PacientesLayoutComponent,
    children: [
      {
        path: '',
        component: PacientesListaComponent,
        title: 'Gestão de Pacientes — Nutri4You'
      },
      { path: ':id/dados', component: DadosComponent, title: 'Dados do paciente — Nutri4You' },
      { path: ':id/historico', component: HistoricoComponent, title: 'Histórico — Nutri4You' },
      { path: ':id/medidas', component: MedidasComponent, title: 'Medidas — Nutri4You' }
    ]
  }
];
