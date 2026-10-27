package com.nutri4you.backend.dto;

import com.nutri4you.backend.model.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalTime;
import java.util.List;
import java.util.function.Function;

public record RefeicaoResponse(Integer id, String nome, LocalTime horario, int diaSemana, List<Item> itens,
                               BigDecimal kcal, BigDecimal proteina, BigDecimal carboidratos, BigDecimal gordura) {
    public record Item(Integer alimentoId, String nome, BigDecimal quantidadeGramas,
                       BigDecimal kcal, BigDecimal proteina, BigDecimal carboidratos, BigDecimal gordura) {}
    public static RefeicaoResponse from(Refeicao r) {
        var itens = r.getItens().stream().map(i -> new Item(i.getAlimento().getId(), i.getAlimento().getNome(),
                i.getQuantidadeGramas(), porcao(i, Alimento::getKcal), porcao(i, Alimento::getProteina),
                porcao(i, Alimento::getCarboidratos), porcao(i, Alimento::getGordura))).toList();
        return new RefeicaoResponse(r.getId(), r.getNome(), r.getHorario(), r.getDiaSemana(), itens,
                somar(itens, Item::kcal), somar(itens, Item::proteina), somar(itens, Item::carboidratos), somar(itens, Item::gordura));
    }
    private static BigDecimal porcao(ItemRefeicao i, Function<Alimento, BigDecimal> nutriente) {
        var valor = nutriente.apply(i.getAlimento());
        return valor == null ? null : valor.multiply(i.getQuantidadeGramas()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }
    public static <T> BigDecimal somar(List<T> itens, Function<T, BigDecimal> valor) {
        if (itens.stream().anyMatch(i -> valor.apply(i) == null)) return null;
        return itens.stream().map(valor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
