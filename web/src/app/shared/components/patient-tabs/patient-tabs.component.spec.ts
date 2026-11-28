import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PatientTabsComponent } from './patient-tabs.component';

@Component({
  imports: [PatientTabsComponent],
  template: '<app-patient-tabs [patientId]="12" (reabrir)="detalhe = false" /><p>{{ detalhe ? "Detalhe" : "Lista" }}</p>'
})
class SecaoTesteComponent { detalhe = true; }

describe('PatientTabsComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideRouter([
      { path: 'pacientes/:id/dieta', component: SecaoTesteComponent },
      { path: 'pacientes/:id/dados', component: SecaoTesteComponent },
      { path: 'pacientes/:id/consultas/:consultaId', component: SecaoTesteComponent },
      { path: 'pacientes/:id/consultas', component: SecaoTesteComponent }
    ])]
  }));

  it('reabre a seção atual mesmo sem mudança de URL', async () => {
    const harness = await RouterTestingHarness.create();
    const secao = await harness.navigateByUrl('/pacientes/12/dieta', SecaoTesteComponent);
    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a[href="/pacientes/12/dieta"]')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/pacientes/12/dieta');
    expect(secao.detalhe).toBeFalse();
    expect(harness.routeNativeElement!.textContent).toContain('Lista');
  });

  it('navega entre abas e volta de uma consulta para a lista', async () => {
    const harness = await RouterTestingHarness.create('/pacientes/12/dieta');
    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a[href="/pacientes/12/dados"]')!.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/pacientes/12/dados');
    await harness.navigateByUrl('/pacientes/12/consultas/7');
    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a[href="/pacientes/12/consultas"]')!.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/pacientes/12/consultas');
  });
});
