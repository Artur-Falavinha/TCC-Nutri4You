const rotulosCorUrina: ReadonlyMap<string, string> = new Map([
  ['1 - Hidratado', '1 - Amarelo muito claro'],
  ['2 - Bem Hidratado', '2 - Amarelo claro'],
  ['3 - Levemente Hidratado', '3 - Amarelo dourado'],
  ['4 - Desidratado', '4 - Amarelo escuro'],
  ['5 - Muito Desidratado', '5 - Âmbar'],
  ['6 - Severamente Desidratado', '6 - Âmbar escuro']
]);

export function rotuloOpcaoAnamnese(campo: string, valor: string): string {
  return (campo === 'urineColor' ? rotulosCorUrina.get(valor) : undefined) ?? valor;
}
