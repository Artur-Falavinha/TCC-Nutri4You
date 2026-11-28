type TipoToast = 'sucesso' | 'erro' | 'aviso' | 'informacao';

export interface MensagemToast {
  id: number;
  tipo: TipoToast;
  mensagem: string;
}

const ouvintes = new Set<() => void>();
let mensagens: MensagemToast[] = [];
let proximoId = 0;

function atualizar(novas: MensagemToast[]): void {
  mensagens = novas;
  ouvintes.forEach(notificar => notificar());
}

function mostrar(tipo: TipoToast, mensagem: string): void {
  if (!mensagem.trim() || mensagens.some(item => item.tipo === tipo && item.mensagem === mensagem)) return;
  atualizar([{ id: ++proximoId, tipo, mensagem }, ...mensagens].slice(0, 3));
}

export const toast = {
  sucesso: (mensagem: string) => mostrar('sucesso', mensagem),
  erro: (mensagem: string) => mostrar('erro', mensagem),
  aviso: (mensagem: string) => mostrar('aviso', mensagem),
  informacao: (mensagem: string) => mostrar('informacao', mensagem)
};

export function listarToasts(): MensagemToast[] {
  return mensagens;
}

export function observarToasts(notificar: () => void): () => void {
  ouvintes.add(notificar);
  return () => { ouvintes.delete(notificar); };
}

export function fecharToast(id: number): void {
  atualizar(mensagens.filter(item => item.id !== id));
}
