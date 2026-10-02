package com.nutri4you.backend.dto;

import java.math.BigDecimal;

public record AvaliacaoRequest(
        BigDecimal peso,
        BigDecimal altura,
        BigDecimal percentualGordura,
        BigDecimal massaMuscularKg,
        BigDecimal pregaBicipital,
        BigDecimal pregaTricipital,
        BigDecimal pregaSubescapular,
        BigDecimal pregaSuprailiaca,
        BigDecimal circunferenciaCintura,
        BigDecimal circunferenciaQuadril,
        BigDecimal circunferenciaBraco) {
}
