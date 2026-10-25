package com.nutri4you.backend.dto;

import java.math.BigDecimal;

public record AlimentoResponseDTO(
        Integer id,
        Integer numeroTaco,
        String nome,
        String categoria,
        BigDecimal kcal100g,
        BigDecimal proteina100g,
        BigDecimal carboidratos100g,
        BigDecimal gordura100g,
        BigDecimal fibra100g) {
}

