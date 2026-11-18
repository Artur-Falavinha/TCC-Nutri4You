package com.nutri4you.backend.dto;

import java.math.BigDecimal;

public record AvaliacaoRequest(
        BigDecimal peso,
        BigDecimal altura,
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
        BigDecimal circunferenciaCintura,
        BigDecimal circunferenciaQuadril,
        BigDecimal circunferenciaBraco) {
}
