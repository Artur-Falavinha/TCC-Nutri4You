import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BuscaAlimentosComponent } from './busca-alimentos.component';

describe('BuscaAlimentosComponent', () => {
  it('atualiza resultados com o último termo digitado e ao mudar a categoria', fakeAsync(() => {
    const fixture = TestBed.createComponent(BuscaAlimentosComponent);
    const component = fixture.componentInstance;
    const buscar = spyOn(component.buscar, 'emit');
    const alterar = spyOn(component.buscaAlimentoChange, 'emit');
    component.alterarBusca('ar'); tick(100); component.alterarBusca('arroz');
    tick(249); expect(buscar).not.toHaveBeenCalled(); tick(1);
    expect(alterar).toHaveBeenCalledWith('arroz'); expect(buscar).toHaveBeenCalledOnceWith(0);
    component.alterarCategoria('Cereais'); expect(buscar).toHaveBeenCalledTimes(2);
    fixture.destroy();
  }));
});
