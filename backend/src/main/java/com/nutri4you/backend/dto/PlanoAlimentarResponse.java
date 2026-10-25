package com.nutri4you.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record PlanoAlimentarResponse(
        Integer id,
        Integer consultaId,
        Integer pacienteId,
        Integer nutricionistaId,
        String nutricionistaNome,
        String titulo,
        String observacoes,
        String status,
        boolean vigente,
        LocalDate vigenciaInicio,
        LocalDate vigenciaFim,
        BigDecimal metaCalorias,
        BigDecimal metaCarboidratos,
        BigDecimal metaGordura,
        BigDecimal metaProteina,
        OffsetDateTime criadoEm,
        OffsetDateTime publicadoEm,
        Long versao,
        List<RefeicaoResponse> refeicoes) {
}

