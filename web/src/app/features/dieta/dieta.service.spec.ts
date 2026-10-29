import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { ListaCompras } from './dieta.models';
import { DietaService } from './dieta.service';

describe('DietaService', () => {
  let api: jasmine.SpyObj<ApiService>;
  let service: DietaService;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['get']);
    api.get.and.returnValue(of({} as ListaCompras));

    TestBed.configureTestingModule({
      providers: [DietaService, { provide: ApiService, useValue: api }]
    });
    service = TestBed.inject(DietaService);
  });

  it('requests the read-only preview for the selected saved plan and period', () => {
    service.previsualizarListaCompras(12, 76, 14);

    expect(api.get).toHaveBeenCalledWith(
      '/gestao-pacientes/12/planos-alimentares/76/lista-compras',
      { params: { dias: 14 } }
    );
  });
});
