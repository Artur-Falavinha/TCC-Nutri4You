import { Routes } from '@angular/router';

import { PacientesLayoutComponent } from './layout/pacientes-layout.component';
import { PacientesListaComponent } from './pages/lista/pacientes-lista.component';
import { DadosComponent } from '../clinico/dados/dados.component';
import { HistoricoComponent } from '../clinico/historico/historico.component';
import { ConsultasComponent, consultaPendenteGuard } from '../clinico/consultas/consultas.component';

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
      { path: ':id/medidas', redirectTo: ':id/consultas', pathMatch: 'full' },
      { path: ':id/consultas', component: ConsultasComponent, title: 'Consultas — Nutri4You' },
      { path: ':id/consultas/nova', component: ConsultasComponent, data: { editor: true },
        canDeactivate: [consultaPendenteGuard], title: 'Nova consulta — Nutri4You' },
      { path: ':id/consultas/:consultaId', component: ConsultasComponent, data: { editor: true },
        canDeactivate: [consultaPendenteGuard], title: 'Consulta — Nutri4You' }
    ]
  }
];
