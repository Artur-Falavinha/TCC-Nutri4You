import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { DietaService } from './dieta.service';

describe('DietaService', () => {
  let api: jasmine.SpyObj<ApiService>;
  let service: DietaService;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['delete']);
    api.delete.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [DietaService, { provide: ApiService, useValue: api }]
    });
    service = TestBed.inject(DietaService);
  });

  it('envia a versão ao excluir um plano na ficha do paciente', () => {
    service.excluirPlano(12, 76, 3);

    expect(api.delete).toHaveBeenCalledWith(
      '/gestao-pacientes/12/planos-alimentares/76?versao=3'
    );
  });
});
