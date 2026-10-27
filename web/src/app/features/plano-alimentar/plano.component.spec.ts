import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { PlanoComponent } from './plano.component';
import { Alimento, Plano, Refeicao } from './plano.models';

describe('PlanoComponent', () => {
  let api: jasmine.SpyObj<ApiService>;
  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    api.get.and.returnValue(of([]));
    TestBed.configureTestingModule({ imports: [PlanoComponent], providers: [provideRouter([]),
      { provide: ApiService, useValue: api },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } }
    ] });
  });
  it('cancela resultados antigos assim que a busca muda e volta a buscar após erro', fakeAsync(() => {
    const fixture = TestBed.createComponent(PlanoComponent);
    const c = fixture.componentInstance;
    c.ngOnInit();
    const antigo = new Subject<Alimento[]>();
    const novo = new Subject<Alimento[]>();
    api.get.and.returnValues(antigo, novo, of([]));
    c.buscar('ar'); tick(250);
    c.buscar('banana');
    antigo.next([{ id: 1, nome: 'Arroz' } as Alimento]);
    expect(c.resultados).toEqual([]);
    tick(250);
    novo.error(new Error('offline'));
    expect(c.erroBusca).toBeTruthy();
    c.buscar('abacate'); tick(250);
    expect(c.erroBusca).toBe('');
    expect(c.buscando).toBeFalse();
    fixture.destroy();
  }));
  it('não exclui a refeição quando a confirmação é recusada', () => {
    const c = TestBed.createComponent(PlanoComponent).componentInstance;
    c.plano = { id: 1, versao: 0 } as Plano;
    spyOn(window, 'confirm').and.returnValue(false);
    c.excluir({ id: 5, nome: 'Almoço' } as Refeicao);
    expect(api.delete).not.toHaveBeenCalled();
  });
  it('envia a versão e mantém os dados do editor quando o servidor rejeita a gravação', () => {
    const c = TestBed.createComponent(PlanoComponent).componentInstance;
    c.plano = { id: 1, versao: 4 } as Plano;
    c.editor = { id: null, nome: 'Almoço', horario: '12:00', itens: [{ alimentoId: 3, nome: 'Arroz', quantidadeGramas: 250 }] };
    const pedido = new Subject<Plano>(); api.post.and.returnValue(pedido);
    c.salvarRefeicao();
    expect(api.post).toHaveBeenCalledWith('/gestao-pacientes/1/planos/1/refeicoes', jasmine.objectContaining({ versaoPlano: 4 }));
    pedido.error({ message: 'Recarregue o plano.' });
    expect(c.editor?.itens[0].quantidadeGramas).toBe(250);
    expect(c.erro).toBe('Recarregue o plano.');
    expect(c.salvando).toBeFalse();
  });
});
