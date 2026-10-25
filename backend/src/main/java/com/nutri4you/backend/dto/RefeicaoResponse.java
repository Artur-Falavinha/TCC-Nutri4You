package com.nutri4you.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record RefeicaoResponse(
        Integer id,
        String nome,
        String horario,
        String diaSemana,
        String descricao,
        Integer ordem,
        BigDecimal totalKcal,
        BigDecimal totalProteina,
        BigDecimal totalCarboidratos,
        BigDecimal totalGordura,
        List<ItemRefeicaoResponse> itens) {
}

