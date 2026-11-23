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
