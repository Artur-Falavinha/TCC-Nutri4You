package com.nutri4you.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AvaliacaoResponse(
        Integer id,
        LocalDateTime dataAvaliacao,
        BigDecimal peso,
        BigDecimal altura,
        BigDecimal imc,
        BigDecimal razaoCinturaQuadril,
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
