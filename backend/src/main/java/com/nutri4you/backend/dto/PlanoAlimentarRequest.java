package com.nutri4you.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PlanoAlimentarRequest(
        Integer idConsulta, LocalDate vigenciaInicio, LocalDate vigenciaFim,
        BigDecimal metaKcal, BigDecimal metaCarboidratos,
        BigDecimal metaGordura, BigDecimal metaProteina, Long versao) {}
