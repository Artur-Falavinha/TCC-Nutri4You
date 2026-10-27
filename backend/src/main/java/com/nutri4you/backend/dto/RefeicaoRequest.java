package com.nutri4you.backend.dto;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

public record RefeicaoRequest(String nome, LocalTime horario, Integer diaSemana, List<Item> itens, Long versaoPlano) {
    public record Item(Integer alimentoId, BigDecimal quantidadeGramas) {}
}
