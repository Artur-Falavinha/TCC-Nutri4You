import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ApiErrorResponse } from '../../core/models/api-response.model';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiCheckboxComponent } from '../../shared/components/ui-checkbox/ui-checkbox.component';
import { AnamneseService } from './anamnese.service';
import { Anamnese, AnamneseField, Answers, Answer, Patient } from './anamnese.models';

@Component({
  selector: 'app-anamnese',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink, UiButtonComponent, UiCheckboxComponent],
  templateUrl: './anamnese.component.html',
  styleUrl: './anamnese.component.css'
})
export class AnamneseComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(AnamneseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  fields: AnamneseField[] = [];
  sections: string[] = [];
  patients: Patient[] = [];
  data: Anamnese | null = null;
  answers: Answers = {};
  errors: Record<string, string> = {};
  patientId: number | null = null;
  nutritionist = '';
  email = '';
  password = '';
  loading = false;
  saving = false;
  editing = false;
  error = '';
  message = '';
  conflict = false;
  private original = '{}';

  ngOnInit(): void {
    if (this.auth.authenticated) void this.initialize();
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = Number(params.get('id'));
      if (this.fields.length && this.auth.authenticated && id > 0 && id !== this.patientId) {
        void this.loadPatient(id);
      }
    });
  }

  async login(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await firstValueFrom(this.auth.login(this.email, this.password));
      this.password = '';
      if (!this.editing) await this.initialize();
    } catch (error) { this.handleError(error); }
    finally { this.loading = false; }
  }

  async initialize(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const result = await firstValueFrom(forkJoin({
        fields: this.api.fields(), patients: this.api.patients(), user: this.api.user()
      }));
      this.fields = result.fields;
      this.sections = [...new Set(this.fields.map(f => f.section))];
      this.patients = result.patients;
      this.nutritionist = result.user.nome;
      const routeId = this.route.snapshot.paramMap.get('id') ?? this.route.snapshot.queryParamMap.get('pacienteId');
      if (routeId) {
        const id = Number(routeId);
        if (!Number.isSafeInteger(id) || id < 1) throw new Error('Paciente inválido.');
        await this.loadPatient(id);
      }
    } catch (error) { this.handleError(error); }
    finally { this.loading = false; }
  }

  async selectPatient(id: number): Promise<void> {
    if (!this.canLeave()) return;
    if (id > 0) {
      await this.loadPatient(id);
      await this.router.navigate(['/pacientes', id, 'anamnese'], { replaceUrl: true });
    }
  }

  async loadPatient(id: number): Promise<void> {
    this.loading = true;
    this.error = '';
    this.message = '';
    this.data = null;
    this.editing = false;
    this.patientId = id;
    try { this.data = await firstValueFrom(this.api.get(id)); this.conflict = false; }
    catch (error) { this.handleError(error); }
    finally { this.loading = false; }
  }

  startEditing(): void {
    if (!this.data) return;
    this.answers = structuredClone(this.data.rascunho ?? this.data.respostas);
    this.original = JSON.stringify(this.answers);
    this.errors = {};
    this.error = '';
    this.message = '';
    this.editing = true;
  }

  cancel(): void {
    if (!this.canLeave()) return;
    this.answers = {};
    this.editing = false;
    this.errors = {};
    this.error = '';
    this.message = '';
    this.conflict = false;
  }

  get dirty(): boolean { return this.editing && JSON.stringify(this.answers) !== this.original; }
  canLeave(): boolean {
    return !this.saving && (!this.dirty || window.confirm('Descartar as alterações não salvas?'));
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty || this.saving) { event.preventDefault(); event.returnValue = ''; }
  }

  logout(): void {
    if (!this.canLeave()) return;
    this.auth.logout();
    this.data = null;
    this.patients = [];
    this.answers = {};
    this.editing = false;
    this.message = '';
    this.error = '';
  }

  fieldsFor(section: string): AnamneseField[] { return this.fields.filter(f => f.section === section); }

  visible(field: AnamneseField, answers: Answers = this.answers): boolean {
    if (!field.when) return true;
    const parent = this.fields.find(f => f.key === field.when?.key);
    if (!parent || !this.visible(parent, answers)) return false;
    const answer = answers[parent.key];
    return Array.isArray(answer)
      ? answer.some(value => field.when?.values.includes(value))
      : field.when.values.includes(String(answer ?? ''));
  }

  change(field: AnamneseField, value: Answer): void {
    this.answers[field.key] = value;
    delete this.errors[field.key];
    for (const dependent of this.fields) {
      if (!this.visible(dependent)) {
        delete this.answers[dependent.key];
        delete this.errors[dependent.key];
      }
    }
  }

  checked(key: string, option: string): boolean {
    const value = this.answers[key];
    return Array.isArray(value) && value.includes(option);
  }

  toggle(field: AnamneseField, option: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const value = this.answers[field.key];
    let options = Array.isArray(value) ? [...value] : [];
    if (!checked) options = options.filter(v => v !== option);
    else if (option === field.exclusive) options = [option];
    else options = [...options.filter(v => v !== field.exclusive), option];
    this.change(field, options);
  }

  toggleValue(field: AnamneseField, option: string, checked: boolean): void {
    const value = this.answers[field.key];
    let options = Array.isArray(value) ? [...value] : [];
    if (!checked) options = options.filter(item => item !== option);
    else if (option === field.exclusive) options = [option];
    else options = [...options.filter(item => item !== field.exclusive), option];
    this.change(field, options);
  }

  phoneInput(field: AnamneseField, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    const localLength = digits.length > 10 ? 5 : 4;
    let formatted = digits.length > 2 ? `(${digits.slice(0, 2)}) ${digits.slice(2)}` : digits;
    if (digits.length > 2 + localLength)
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 2 + localLength)}-${digits.slice(2 + localLength)}`;
    input.value = formatted;
    this.change(field, formatted);
  }

  rangeInput(field: AnamneseField, event: Event): void {
    this.change(field, Number((event.target as HTMLInputElement).value));
  }

  rangePosition(field: AnamneseField): string {
    const percent = (Number(this.answers[field.key] ?? 5) - 1) / 9;
    return `calc(${percent * 100}% + ${(0.5 - percent) * 24}px)`;
  }

  display(value: Answer | undefined): string {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'number') return new Intl.NumberFormat('pt-BR').format(value);
    return value === null || value === undefined || value === '' ? 'Não informado' : String(value);
  }

  async save(draft: boolean, form: HTMLFormElement): Promise<void> {
    if (!this.data || this.saving || this.conflict) return;
    this.errors = {};
    this.error = '';
    this.message = '';
    if (!draft) {
      for (const field of this.fields) {
        const value = this.answers[field.key];
        if (this.visible(field) && field.required &&
            (value === null || value === undefined || typeof value === 'string' && !value.trim() ||
              Array.isArray(value) && !value.length)) this.errors[field.key] = 'Campo obrigatório.';
      }
      if (Object.keys(this.errors).length) { this.focusError(); return; }
      if (!form.reportValidity()) return;
    }
    this.saving = true;
    try {
      this.data = await firstValueFrom(this.api.save(this.data.paciente.id, this.data.versao, this.answers, draft));
      this.original = JSON.stringify(this.answers);
      this.editing = false;
      this.message = draft ? 'Rascunho salvo.' : 'Anamnese finalizada e salva.';
    } catch (error) { this.handleError(error); this.focusError(); }
    finally { this.saving = false; }
  }

  async discardDraft(): Promise<void> {
    if (!this.data || this.data.versao === null || this.saving ||
        !window.confirm('Descartar o rascunho salvo? A última anamnese finalizada será mantida.')) return;
    this.saving = true;
    this.error = '';
    try {
      this.data = await firstValueFrom(this.api.discard(this.data.paciente.id, this.data.versao));
      this.message = 'Rascunho descartado.';
    } catch (error) { this.handleError(error); }
    finally { this.saving = false; }
  }

  async reload(): Promise<void> {
    if (this.patientId && this.canLeave()) await this.loadPatient(this.patientId);
  }

  private focusError(): void {
    const key = Object.keys(this.errors)[0] ?? 'anamnese-error';
    setTimeout(() => document.getElementById(key)?.focus());
  }

  private handleError(error: unknown): void {
    const apiError = error as ApiErrorResponse;
    this.error = apiError.status === 0
      ? 'Não foi possível conectar à API. Tente novamente.'
      : apiError.message || 'Não foi possível concluir a operação.';
    this.errors = apiError.fields ?? {};
    this.conflict = apiError.status === 409;
    if (apiError.status === 401) {
      this.auth.logout();
      this.error = 'Sua sessão expirou. Entre novamente para continuar.';
    }
  }
}
