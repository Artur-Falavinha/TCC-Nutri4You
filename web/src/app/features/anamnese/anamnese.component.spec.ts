import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AnamneseComponent } from './anamnese.component';
import { AnamneseService } from './anamnese.service';
import { Anamnese, AnamneseField } from './anamnese.models';

describe('AnamneseComponent', () => {
  let fixture: ComponentFixture<AnamneseComponent>;
  let component: AnamneseComponent;
  let api: jasmine.SpyObj<AnamneseService>;
  const auth = { authenticated: false, logout: jasmine.createSpy('logout') };
  const patient = { id: 10, nome: 'Paciente Teste', email: 'test@example.test', sexo: 'Feminino', dataNascimento: '1995-03-12', telefone: null };
  const empty: Anamnese = { paciente: patient, versao: null, status: 'NAO_INICIADA', respostas: {}, rascunho: null, finalizadaEm: null, atualizadaEm: null };
  const field = (key: string, extra: Partial<AnamneseField> = {}): AnamneseField => ({
    key, label: key, section: 'Teste', type: 'text', required: true, maxLength: 80,
    min: null, max: null, step: null, pattern: null, options: null, exclusive: null,
    when: null, image: null, imageAlt: null, ...extra
  });

  beforeEach(async () => {
    auth.authenticated = false;
    api = jasmine.createSpyObj('AnamneseService', ['fields', 'patients', 'user', 'get', 'save', 'discard']);
    await TestBed.configureTestingModule({
      imports: [AnamneseComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }, { provide: AnamneseService, useValue: api }]
    }).compileComponents();
    fixture = TestBed.createComponent(AnamneseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    auth.authenticated = true;
    component.data = structuredClone(empty);
    component.patients = [patient];
    component.patientId = patient.id;
    component.fields = [field('profession')];
    component.sections = ['Teste'];
    fixture.detectChanges();
  });

  function form(): HTMLFormElement {
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.anamnese-form') as HTMLFormElement;
  }

  it('keeps clinical fields hidden until creation starts and identification disabled', () => {
    expect(fixture.nativeElement.querySelector('.anamnese-form')).toBeNull();
    component.startEditing();
    expect(form().querySelector('input:disabled')).not.toBeNull();
    expect(form().querySelector('#profession')).not.toBeNull();
  });

  it('cancels local edits without overwriting the saved draft', () => {
    component.data = { ...empty, versao: 2, status: 'RASCUNHO', rascunho: { profession: 'Professor' } };
    component.startEditing();
    component.change(component.fields[0], 'Outra profissão');
    const confirm = spyOn(window, 'confirm').and.returnValue(false);
    component.cancel();
    expect(component.editing).toBeTrue();
    confirm.and.returnValue(true);
    component.cancel();
    expect(component.editing).toBeFalse();
    expect(component.data.rascunho?.['profession']).toBe('Professor');
    expect(api.save).not.toHaveBeenCalled();
    component.startEditing();
    expect(component.answers['profession']).toBe('Professor');
  });

  it('saves incomplete drafts and resumes the server values', async () => {
    const draft: Anamnese = { ...empty, versao: 0, status: 'RASCUNHO', rascunho: {} };
    api.save.and.returnValue(of(draft));
    component.startEditing();
    await component.save(true, form());
    expect(api.save).toHaveBeenCalledWith(patient.id, null, {}, true);
    expect(component.editing).toBeFalse();
    component.startEditing();
    expect(component.answers).toEqual({});
  });

  it('blocks finalization of blank required answers without calling the API', async () => {
    component.startEditing();
    component.answers['profession'] = '   ';
    await component.save(false, form());
    expect(component.errors['profession']).toBe('Campo obrigatório.');
    expect(api.save).not.toHaveBeenCalled();
  });

  it('clears nested inactive answers and their validation errors', () => {
    component.fields = [
      field('recentExams', { type: 'select', options: ['Sim', 'Não'] }),
      field('exam', { when: { key: 'recentExams', values: ['Sim'] } }),
      field('examOther', { when: { key: 'exam', values: ['Outro'] } })
    ];
    component.answers = { recentExams: 'Sim', exam: 'Outro', examOther: 'Exame anterior' };
    component.errors['examOther'] = 'Campo obrigatório.';
    component.change(component.fields[0], 'Não');
    expect(component.answers).toEqual({ recentExams: 'Não' });
    expect(component.visible(component.fields[2])).toBeFalse();
    expect(component.errors['examOther']).toBeUndefined();
  });

  it('keeps edits available after network failure and shows the error', async () => {
    api.save.and.returnValue(throwError(() => ({ status: 0 })));
    component.startEditing();
    component.answers['profession'] = 'Analista';
    await component.save(true, form());
    expect(component.editing).toBeTrue();
    expect(component.answers['profession']).toBe('Analista');
    expect(component.saving).toBeFalse();
    expect(component.error).toContain('conectar');
  });

  it('stops further saves on a version conflict', async () => {
    api.save.and.returnValue(throwError(() => ({ status: 409, message: 'Conflito' })));
    component.startEditing();
    await component.save(true, form());
    await component.save(true, form());
    expect(api.save).toHaveBeenCalledTimes(1);
    expect(component.conflict).toBeTrue();
    expect(component.editing).toBeTrue();
  });

  it('does not silently answer a scale before the user selects its value', async () => {
    component.fields = [field('emotionalHunger', { type: 'range', min: 1, max: 10, step: 1 })];
    component.startEditing();
    await component.save(false, form());
    expect(component.errors['emotionalHunger']).toBe('Campo obrigatório.');
    expect(api.save).not.toHaveBeenCalled();
  });

  it('makes the none diagnosis option exclusive', () => {
    const diagnosis = field('diagnoses', { type: 'checkbox', options: ['Nenhum', 'Diabetes'], exclusive: 'Nenhum' });
    component.answers['diagnoses'] = ['Diabetes'];
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    component.toggle(diagnosis, 'Nenhum', { target: checkbox } as unknown as Event);
    expect(component.answers['diagnoses']).toEqual(['Nenhum']);
    component.toggle(diagnosis, 'Diabetes', { target: checkbox } as unknown as Event);
    expect(component.answers['diagnoses']).toEqual(['Diabetes']);
  });
});
