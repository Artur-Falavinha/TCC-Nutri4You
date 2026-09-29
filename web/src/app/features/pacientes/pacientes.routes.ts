import { Routes } from '@angular/router';

import { PacientesLayoutComponent } from './layout/pacientes-layout.component';
import { PacientesListaComponent } from './pages/lista/pacientes-lista.component';

export const PACIENTES_ROUTES: Routes = [
  {
    path: '',
    component: PacientesLayoutComponent,
    children: [
      {
        path: '',
        component: PacientesListaComponent,
        title: 'Gestão de Pacientes — Nutri4You'
      }
    ]
  }
];
