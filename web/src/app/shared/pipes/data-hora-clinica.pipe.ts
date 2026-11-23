import { Pipe, PipeTransform } from '@angular/core';
import { formatarDataBr, horarioCivilIso } from '../utils/data-br.util';

@Pipe({ name: 'dataHoraClinica' })
export class DataHoraClinicaPipe implements PipeTransform {
  transform(iso: string | null | undefined, formato: 'dataHora' | 'hora' = 'dataHora'): string {
    const horario = horarioCivilIso(iso ?? '');
    if (!horario || formato === 'hora') return horario;
    return `${formatarDataBr(iso?.slice(0, 10))} ${horario}`;
  }
}
