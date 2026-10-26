package com.nutri4you.backend.model;

import java.io.Serializable;
import java.util.Objects;

public class ItemRefeicaoId implements Serializable {
    private Integer refeicao;
    private Integer alimento;

    public ItemRefeicaoId() {}

    @Override
    public boolean equals(Object objeto) {
        return objeto instanceof ItemRefeicaoId outro
                && Objects.equals(refeicao, outro.refeicao)
                && Objects.equals(alimento, outro.alimento);
    }

    @Override
    public int hashCode() {
        return Objects.hash(refeicao, alimento);
    }
}
