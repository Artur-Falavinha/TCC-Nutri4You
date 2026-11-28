import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StyleSheet, TextInput } from 'react-native';

import { NutritionistCatalog } from '../components/NutritionistCatalog';

jest.mock('../../../core/perfil/foto-perfil.service', () => ({
  carregarFotoNutricionistaNaAgenda: jest.fn().mockResolvedValue(null)
}));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, Ionicons: () => null }));

describe('Catálogo de nutricionistas da agenda', () => {
  function medirCampo(tree: renderer.ReactTestRenderer) {
    tree.root.findByProps({ testID: 'agenda-busca-campo' }).props.onLayout({
      nativeEvent: { layout: { x: 16, y: 145, width: 260, height: 50 } }
    });
  }

  it('pesquisa profissionais disponíveis e seleciona a agenda desejada', async () => {
    const onSelect = jest.fn();
    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <NutritionistCatalog
          nutritionists={[
            { id: 1, nome: 'Gabriel de Paula Brasil', vinculado: false },
            { id: 2, nome: 'Mariana Costa', vinculado: false }
          ]}
          onSelect={onSelect}
        />
      );
    });

    expect(JSON.stringify(tree!.toJSON())).not.toContain('Mariana Costa');

    await act(async () => {
      medirCampo(tree!);
      tree!.root.findByType(TextInput).props.onChangeText('Mariana');
    });

    const rendered = JSON.stringify(tree!.toJSON());
    expect(rendered).toContain('Mariana Costa');
    expect(rendered).not.toContain('Gabriel de Paula Brasil');
    expect(StyleSheet.flatten(tree!.root.findByProps({ testID: 'agenda-sugestoes' }).props.style))
      .toMatchObject({ position: 'absolute', top: 199, left: 16, width: 260 });

    await act(async () => {
      tree!.root.findByProps({ accessibilityLabel: 'Selecionar Mariana Costa' }).props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('limita as sugestões, ignora acentos e esconde os resultados ao limpar', async () => {
    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <NutritionistCatalog
          nutritionists={Array.from({ length: 9 }, (_, indice) => ({
            id: indice + 1,
            nome: `João da Silva ${indice + 1}`,
            vinculado: false
          }))}
          onSelect={jest.fn()}
        />
      );
    });

    const buscar = (valor: string) => act(async () => {
      medirCampo(tree!);
      tree!.root.findByType(TextInput).props.onChangeText(valor);
    });
    const painel = () => JSON.stringify(tree!.toJSON());
    await buscar('   ');
    expect(painel()).not.toContain('João da Silva');

    await buscar('joao');
    expect(painel()).toContain('João da Silva 1');
    expect(painel()).not.toContain('João da Silva 9');
    expect(painel()).toContain('Digite mais do nome para refinar');

    await buscar('joao   da silva 9');
    expect(painel()).toContain('João da Silva 9');
    expect(painel()).not.toContain('João da Silva 1');

    await buscar('ana');
    expect(painel()).toContain('Nenhum nutricionista encontrado');
    await act(async () => {
      tree!.root.findByProps({ accessibilityLabel: 'Limpar busca' }).props.onPress();
    });
    expect(tree!.root.findByType(TextInput).props.value).toBe('');
    expect(painel()).not.toContain('Nenhum nutricionista encontrado');
    expect(painel()).not.toContain('João da Silva');
  });

  it('oferece a escolha da data diretamente quando já existe vínculo', async () => {
    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <NutritionistCatalog
          nutritionists={[{ id: 2, nome: 'Mariana Costa', vinculado: true }]}
          onSelect={jest.fn()}
        />
      );
    });
    expect(JSON.stringify(tree!.toJSON())).toContain('Escolher data e horário');
    expect(tree!.root.findAllByType(TextInput)).toHaveLength(0);
  });
});
