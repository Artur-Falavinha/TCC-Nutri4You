import { Component } from '@angular/core';

interface NavItem {
  label: string;
  icon: string;
  active?: boolean;
}

interface TabItem {
  label: string;
  active?: boolean;
}

interface CheckboxGroup {
  label: string;
  options: string[];
}

type RangeKey = 'emotionalHunger' | 'bodySatisfaction' | 'mealPleasure';
type SelectionKey =
  | 'origin'
  | 'diet'
  | 'supplement'
  | 'medication'
  | 'allergy'
  | 'laxative'
  | 'recentExams'
  | 'exam'
  | 'familyHistory'
  | 'familyCondition'
  | 'physicalActivity'
  | 'deadline';

@Component({
  selector: 'app-anamnese',
  standalone: true,
  templateUrl: './anamnese.component.html'
})
export class AnamneseComponent {
  readonly sexOptions = ['Feminino', 'Masculino', 'Outro', 'Prefiro não informar'];
  readonly originOptions = ['Indicação de paciente', 'Instagram', 'Google', 'Convênio', 'Evento ou palestra', 'Outro'];
  readonly yesNoOptions = ['Sim', 'Não'];
  readonly dietOptions = ['Não sigo dieta específica', 'Vegetariana', 'Vegana', 'Low carb', 'Sem glúten', 'Sem lactose', 'Outra'];
  readonly frequencyOptions = ['1 vez ao dia', '2 vezes ao dia', '3 a 4 vezes ao dia', 'A cada 2 dias', 'Menos de 3 vezes por semana'];
  readonly urineColorOptions = ['1 - Muito clara', '2 - Clara', '3 - Amarelo claro', '4 - Amarelo', '5 - Amarelo escuro', '6 - Âmbar', '7 - Marrom'];
  readonly examOptions = ['Hemograma', 'Glicemia', 'Colesterol e frações', 'Triglicerídeos', 'Ferritina', 'Vitamina D', 'TSH/T4 livre', 'Outro'];
  readonly familyConditionOptions = ['Diabetes', 'Hipertensão', 'Obesidade', 'Doença cardiovascular', 'Dislipidemia', 'Câncer', 'Outra'];
  readonly weeklyFrequencyOptions = ['1 vez por semana', '2 vezes por semana', '3 vezes por semana', '4 a 5 vezes por semana', 'Diariamente'];
  readonly intensityOptions = ['Leve', 'Moderada', 'Intensa', 'Muito intensa'];
  readonly sleepHoursOptions = ['Menos de 5 horas', '5 a 6 horas', '7 a 8 horas', 'Mais de 8 horas'];
  readonly deadlineOptions = ['Não tenho prazo', 'Até 1 mês', '1 a 3 meses', '3 a 6 meses', '6 a 12 meses', 'Mais de 1 ano'];

  readonly rangeValues: Record<RangeKey, number> = {
    emotionalHunger: 5,
    bodySatisfaction: 5,
    mealPleasure: 5
  };

  readonly selected: Record<SelectionKey, string> = {
    origin: '',
    diet: '',
    supplement: '',
    medication: '',
    allergy: '',
    laxative: '',
    recentExams: '',
    exam: '',
    familyHistory: '',
    familyCondition: '',
    physicalActivity: '',
    deadline: ''
  };

  readonly navItems: NavItem[] = [
    { label: 'Home', icon: '⌂' },
    { label: 'Pacientes', icon: '○', active: true },
    { label: 'Agenda', icon: '□' },
    { label: 'Configurações', icon: '◇' }
  ];

  readonly tabs: TabItem[] = [
    { label: 'Dados' },
    { label: 'Documentos' },
    { label: 'Histórico' },
    { label: 'Consultas' },
    { label: 'Dieta' },
    { label: 'Anamnese', active: true }
  ];

  readonly healthHistory: CheckboxGroup = {
    label: 'Diagnóstico atual',
    options: ['Diabetes', 'Hipertensão', 'Doenças cardíacas', 'Problemas gastrointestinais', 'Dislipidemia', 'Outro']
  };

  readonly physicalActivities: CheckboxGroup = {
    label: 'Tipo de atividade',
    options: ['Caminhada', 'Corrida', 'Musculação', 'Yoga/Pilates', 'Outro']
  };

  readonly objectives: CheckboxGroup = {
    label: 'Quais seus principais objetivos?',
    options: ['Perder peso', 'Ganhar massa muscular', 'Melhorar saúde geral / disposição e hábitos alimentares', 'Outro']
  };

  maskDate(event: Event): void {
    const input = this.getInput(event);
    const digits = this.onlyDigits(input.value).slice(0, 8);
    input.value = digits
      .replace(/^(\d{2})(\d)/, '$1/$2')
      .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
  }

  maskPhone(event: Event): void {
    const input = this.getInput(event);
    const digits = this.onlyDigits(input.value).slice(0, 11);

    if (digits.length <= 10) {
      input.value = digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
      return;
    }

    input.value = digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  maskHeight(event: Event): void {
    const input = this.getInput(event);
    const digits = this.onlyDigits(input.value).slice(0, 3);

    if (digits.length <= 1) {
      input.value = digits;
      return;
    }

    input.value = `${digits.slice(0, 1)},${digits.slice(1)}`;
  }

  maskWeight(event: Event): void {
    const input = this.getInput(event);
    const digits = this.onlyDigits(input.value).slice(0, 5);

    if (digits.length <= 3) {
      input.value = digits;
      return;
    }

    input.value = `${digits.slice(0, -1)},${digits.slice(-1)}`;
  }

  limitInteger(event: Event, maxDigits: number): void {
    const input = this.getInput(event);
    input.value = this.onlyDigits(input.value).slice(0, maxDigits);
  }

  setSelection(key: SelectionKey, event: Event): void {
    this.selected[key] = this.getSelect(event).value;

    if (key === 'recentExams' && this.selected.recentExams !== 'Sim') {
      this.selected.exam = '';
    }

    if (key === 'familyHistory' && this.selected.familyHistory !== 'Sim') {
      this.selected.familyCondition = '';
    }
  }

  updateRange(key: RangeKey, event: Event): void {
    this.rangeValues[key] = Number(this.getInput(event).value);
  }

  rangePosition(key: RangeKey): string {
    const value = this.rangeValues[key];
    return `${((value - 1) / 9) * 100}%`;
  }

  clearCheckboxGroupValidity(event: Event): void {
    const checkbox = this.getInput(event);
    const fieldset = checkbox.closest('[data-checkbox-group]');
    const firstCheckbox = fieldset?.querySelector<HTMLInputElement>('input[type="checkbox"]');
    firstCheckbox?.setCustomValidity('');
  }

  finishAnamnese(event: SubmitEvent): void {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    this.validateCheckboxGroups(form);

    if (!form.reportValidity()) {
      return;
    }
  }

  private validateCheckboxGroups(form: HTMLFormElement): void {
    form.querySelectorAll<HTMLElement>('[data-checkbox-group]').forEach((group) => {
      const checkboxes = Array.from(group.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
      const hasCheckedOption = checkboxes.some((checkbox) => checkbox.checked);
      checkboxes[0]?.setCustomValidity(hasCheckedOption ? '' : 'Selecione pelo menos uma opção.');
    });
  }

  private getInput(event: Event): HTMLInputElement {
    return event.target as HTMLInputElement;
  }

  private getSelect(event: Event): HTMLSelectElement {
    return event.target as HTMLSelectElement;
  }

  private onlyDigits(value: string): string {
    return value.replace(/\D/g, '');
  }
}
