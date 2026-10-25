package com.nutri4you.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record ItemSubstitutoResponse(
        Integer id,
        Integer alimentoId,
        Integer numeroTaco,
        String alimentoNome,
        String categoria,
        BigDecimal quantidadeGramas,
        BigDecimal kcal100g,
        BigDecimal proteina100g,
        BigDecimal carboidratos100g,
        BigDecimal gordura100g,
        BigDecimal kcalCalculado,
        BigDecimal proteinaCalculada,
        BigDecimal carboidratosCalculados,
        BigDecimal gorduraCalculada,
        Integer ordem) {
}

