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
        BigDecimal massaMagraKg,
        BigDecimal massaGordaKg,
        BigDecimal massaMuscularKg,
        BigDecimal pregaBicipital,
        BigDecimal pregaPeitoral,
        BigDecimal pregaAxilarMedia,
        BigDecimal pregaTricipital,
        BigDecimal pregaSubescapular,
        BigDecimal pregaAbdominal,
        BigDecimal pregaSuprailiaca,
        BigDecimal pregaCoxa,
        BigDecimal somaSetePregas,
        String metodoPercentualGordura,
        BigDecimal circunferenciaCintura,
        BigDecimal circunferenciaQuadril,
        BigDecimal circunferenciaBraco) {
}
