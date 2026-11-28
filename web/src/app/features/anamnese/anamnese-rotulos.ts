const rotulosCorUrina: ReadonlyMap<string, string> = new Map([
  ['1 - Hidratado', '1 - Amarelo muito claro'],
  ['2 - Bem Hidratado', '2 - Amarelo claro'],
  ['3 - Levemente Hidratado', '3 - Amarelo dourado'],
  ['4 - Desidratado', '4 - Amarelo escuro'],
  ['5 - Muito Desidratado', '5 - Âmbar'],
  ['6 - Severamente Desidratado', '6 - Âmbar escuro']
]);

const rotulosBristol: ReadonlyMap<string, string> = new Map([
  ['Tipo 1 - Caroços duros separados (muito dura)', 'Tipo 1 - Caroços separados'],
  ['Tipo 2 - Em forma de salsicha, mas encaroçada (dura e encostada)', 'Tipo 2 - Forma encaroçada'],
  ['Tipo 3 - Em forma de salsicha, com fissuras na superfície', 'Tipo 3 - Com fissuras'],
  ['Tipo 4 - Em forma de salsicha ou cobra, suave e macia (ideal)', 'Tipo 4 - Lisa e macia'],
  ['Tipo 5 - Pedaços suaves com bordas bem definidas', 'Tipo 5 - Pedaços macios'],
  ['Tipo 6 - Pedaços esfarrapados, consistência pastosa (paposa)', 'Tipo 6 - Pastosa'],
  ['Tipo 7 - Aquosa, sem pedaços sólidos (totalmente líquida)', 'Tipo 7 - Aquosa']
]);

const rotulosPorCampo = new Map([
  ['urineColor', rotulosCorUrina],
  ['bristol', rotulosBristol]
]);

export function rotuloOpcaoAnamnese(campo: string, valor: string): string {
  return rotulosPorCampo.get(campo)?.get(valor) ?? valor;
}
