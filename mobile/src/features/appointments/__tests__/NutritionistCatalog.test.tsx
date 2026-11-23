import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TextInput } from 'react-native';

import { NutritionistCatalog } from '../components/NutritionistCatalog';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));

describe('Catálogo de nutricionistas da agenda', () => {
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
      tree!.root.findByType(TextInput).props.onChangeText('Mariana');
    });

    const rendered = JSON.stringify(tree!.toJSON());
    expect(rendered).toContain('Mariana Costa');
    expect(rendered).not.toContain('Gabriel de Paula Brasil');

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

  it('informa que a aceitação do agendamento cria o vínculo', async () => {
    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <NutritionistCatalog
          nutritionists={[{ id: 2, nome: 'Mariana Costa', vinculado: false }]}
          selected={{ id: 2, nome: 'Mariana Costa', vinculado: false }}
          onSelect={jest.fn()}
        />
      );
    });
    expect(JSON.stringify(tree!.toJSON())).toContain(
      'O vínculo será criado automaticamente quando o nutricionista aceitar o agendamento.'
    );
  });
});
