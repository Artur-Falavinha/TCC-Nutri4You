import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { lerAceite } from '../../../core/perfil/privacidade';
import { Privacidade } from '../Privacidade';

jest.mock('../../../core/perfil/privacidade', () => ({
  ...jest.requireActual('../../../core/perfil/privacidade'),
  lerAceite: jest.fn()
}));

it('mostra a data registrada e permite ocultar e consultar o aceite novamente', async () => {
  (lerAceite as jest.Mock).mockResolvedValue({ versao: '2026-11-16', aceito: true, aceitoEm: '2026-11-17T01:00:00Z' });
  let tela: renderer.ReactTestRenderer;
  await act(async () => { tela = renderer.create(<Privacidade />); });
  const clicar = async (rotulo: string) => {
    const botao = tela!.root.findAll(item => typeof item.props.onPress === 'function'
      && item.findAllByType(Text).some(texto => texto.props.children === rotulo))[0];
    expect(botao).toBeDefined();
    await act(async () => { botao.props.onPress(); });
  };
  await clicar('Consultar aceite dos termos');
  expect(JSON.stringify(tela!.toJSON())).toContain('16/11/2026');
  await clicar('Ocultar aceite dos termos');
  expect(JSON.stringify(tela!.toJSON())).not.toContain('Aceito em');
  expect(lerAceite).toHaveBeenCalledTimes(1);
  await clicar('Consultar aceite dos termos');
  expect(lerAceite).toHaveBeenCalledTimes(2);
});
