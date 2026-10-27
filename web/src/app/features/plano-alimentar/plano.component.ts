import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, CanDeactivateFn, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, of, switchMap, timer } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ApiErrorResponse } from '../../core/models/api-response.model';
import { PatientTabsComponent } from '../../shared/components/patient-tabs/patient-tabs.component';
import { FormAlertComponent } from '../../shared/components/form-alert/form-alert.component';
import { Alimento, Plano, Refeicao, percentual, totaisDoDia } from './plano.models';

@Component({
  selector: 'app-plano-alimentar',
  imports: [FormsModule, DecimalPipe, RouterLink, PatientTabsComponent, FormAlertComponent],
  templateUrl: './plano.component.html', styleUrl: './plano.component.css'
})
export class PlanoComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly patientId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly base = `/gestao-pacientes/${this.patientId}/planos`;
  readonly dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  readonly percentual = percentual;
  readonly min = Math.min;
  planos: Plano[] = [];
  plano: Plano | null = null;
  dia = 1;
  erro = ''; mensagem = ''; carregando = false; salvando = false; carregado = false;
  editandoMetas = false;
  metas = { vigenciaInicio: '', vigenciaFim: '', metaKcal: null as number | null, metaProteina: null as number | null,
    metaCarboidratos: null as number | null, metaGordura: null as number | null };
  editor: { id: number | null; nome: string; horario: string; itens: { alimentoId: number; nome: string; quantidadeGramas: number }[] } | null = null;
  busca = ''; buscando = false; resultados: Alimento[] = []; erroBusca = '';
  private readonly termos = new Subject<string>();
  replicando: Refeicao | null = null;
  destinos = new Set<number>();

  ngOnInit() {
    // Cancel immediately on every keystroke, including while the debounce timer is running.
    this.termos.pipe(switchMap(q => {
      this.resultados = []; this.erroBusca = ''; this.buscando = q.trim().length >= 2;
      return q.trim().length < 2 ? of({ itens: [] as Alimento[], erro: '' })
        : timer(250).pipe(switchMap(() => this.api.get<Alimento[]>('/alimentos', { params: { q: q.trim() } })),
          map(itens => ({ itens, erro: '' })), catchError(() => of({ itens: [] as Alimento[], erro: 'Não foi possível buscar alimentos. Digite novamente para tentar.' })));
    }), takeUntilDestroyed(this.destroyRef)).subscribe(r => { this.resultados = r.itens; this.erroBusca = r.erro; this.buscando = false; });
    this.carregar();
  }
  carregar() {
    if (this.salvando) return;
    this.carregando = true; this.erro = '';
    this.api.get<Plano[]>(this.base).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: p => { this.planos = p; this.plano = p.find(x => x.id === this.plano?.id) || p[0] || null; this.carregando = false; this.carregado = true; },
      error: (e: ApiErrorResponse) => { this.erro = e.message; this.carregando = false; }
    });
  }
  selecionar(p: Plano) {
    if (!this.podeSair()) return;
    this.editor = null; this.editandoMetas = false; this.replicando = null; this.destinos.clear(); this.plano = p;
  }
  recarregar() {
    if (this.carregando || !this.podeSair()) return;
    this.editor = null; this.editandoMetas = false; this.replicando = null; this.destinos.clear();
    this.carregar();
  }
  get refeicoes() { return (this.plano?.refeicoes || []).filter(r => r.diaSemana === this.dia).sort((a, b) => a.horario.localeCompare(b.horario)); }
  get indicadores() {
    const t = totaisDoDia(this.plano?.refeicoes || [], this.dia);
    return [{ nome: 'Energia', valor: t.kcal, meta: this.plano?.metaKcal ?? null, unidade: 'kcal' },
      { nome: 'Proteínas', valor: t.proteina, meta: this.plano?.metaProteina ?? null, unidade: 'g' },
      { nome: 'Carboidratos', valor: t.carboidratos, meta: this.plano?.metaCarboidratos ?? null, unidade: 'g' },
      { nome: 'Gorduras', valor: t.gordura, meta: this.plano?.metaGordura ?? null, unidade: 'g' }];
  }
  abrirMetas(novo = false) {
    if (!this.podeSair()) return;
    this.editor = null; this.editandoMetas = true;
    if (novo) this.plano = null;
    const p = this.plano;
    this.metas = { vigenciaInicio: p?.vigenciaInicio || '', vigenciaFim: p?.vigenciaFim || '',
      metaKcal: p?.metaKcal ?? null, metaProteina: p?.metaProteina ?? null,
      metaCarboidratos: p?.metaCarboidratos ?? null, metaGordura: p?.metaGordura ?? null };
  }
  salvarMetas() {
    const payload = { ...this.metas, vigenciaInicio: this.metas.vigenciaInicio || null,
      vigenciaFim: this.metas.vigenciaFim || null, versao: this.plano?.versao, idConsulta: this.plano?.idConsulta ?? null };
    this.executar(this.plano ? this.api.put<Plano>(`${this.base}/${this.plano.id}`, payload) : this.api.post<Plano>(this.base, payload));
  }
  publicar() {
    if (!this.plano || !window.confirm('Publicar este plano? Após a publicação ele não poderá ser editado.')) return;
    this.executar(this.api.post<Plano>(`${this.base}/${this.plano.id}/publicacao`, { versao: this.plano.versao }));
  }
  abrirRefeicao(r?: Refeicao) {
    if (!this.podeSair()) return;
    this.editandoMetas = false;
    this.editor = r ? { id: r.id, nome: r.nome, horario: r.horario.slice(0, 5), itens: r.itens.map(i => ({ ...i })) }
      : { id: null, nome: '', horario: '08:00', itens: [] };
    this.buscar('');
  }
  buscar(q: string) { this.busca = q; this.termos.next(q); }
  adicionar(a: Alimento) {
    if (!this.editor || this.editor.itens.some(i => i.alimentoId === a.id)) return;
    this.editor.itens.push({ alimentoId: a.id, nome: a.nome, quantidadeGramas: 100 });
    this.buscar('');
  }
  salvarRefeicao() {
    if (!this.plano || !this.editor) return;
    const r = this.editor;
    const payload = { nome: r.nome, horario: r.horario, diaSemana: this.dia, versaoPlano: this.plano.versao,
      itens: r.itens.map(i => ({ alimentoId: i.alimentoId, quantidadeGramas: i.quantidadeGramas })) };
    const path = `${this.base}/${this.plano.id}/refeicoes`;
    this.executar(r.id ? this.api.put<Plano>(`${path}/${r.id}`, payload) : this.api.post<Plano>(path, payload));
  }
  excluir(r: Refeicao) {
    if (!this.plano || !window.confirm(`Excluir a refeição “${r.nome}” de ${this.dias[this.dia - 1]}?`)) return;
    this.executar(this.api.delete<Plano>(`${this.base}/${this.plano.id}/refeicoes/${r.id}?versaoPlano=${this.plano.versao}`));
  }
  escolherDestino(dia: number) { if (this.destinos.has(dia)) this.destinos.delete(dia); else this.destinos.add(dia); }
  replicar() {
    if (!this.plano || !this.replicando) return;
    this.executar(this.api.post<Plano>(`${this.base}/${this.plano.id}/refeicoes/${this.replicando.id}/replicacao`,
      { dias: [...this.destinos], versaoPlano: this.plano.versao }));
  }
  private executar(pedido: Observable<Plano>) {
    if (this.salvando) return;
    this.salvando = true; this.erro = ''; this.mensagem = '';
    pedido.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: p => { this.plano = p; this.planos = [p, ...this.planos.filter(x => x.id !== p.id)];
        this.salvando = false; this.editor = null; this.editandoMetas = false; this.replicando = null; this.destinos.clear(); this.mensagem = 'Plano atualizado.'; },
      error: (e: ApiErrorResponse) => { this.erro = e.message; this.salvando = false; }
    });
  }
  podeSair() { return !this.salvando && (!(this.editor || this.editandoMetas) || window.confirm('Descartar os dados ainda não salvos?')); }
  cancelarEditor() { if (this.podeSair()) { this.editor = null; this.editandoMetas = false; } }
  @HostListener('window:beforeunload', ['$event'])
  antesDeFechar(event: BeforeUnloadEvent) { if (this.editor || this.editandoMetas || this.salvando) event.preventDefault(); }
}
export const planoPendenteGuard: CanDeactivateFn<PlanoComponent> = c => c.podeSair();
