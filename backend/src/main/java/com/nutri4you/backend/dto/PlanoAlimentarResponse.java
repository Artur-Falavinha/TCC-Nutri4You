package com.nutri4you.backend.dto;

import com.nutri4you.backend.model.PlanoAlimentar;
import com.nutri4you.backend.model.StatusPlanoAlimentar;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record PlanoAlimentarResponse(
        Integer id, Integer idPaciente, Integer idNutricionista, Integer idConsulta,
        StatusPlanoAlimentar status, LocalDate vigenciaInicio, LocalDate vigenciaFim,
        BigDecimal metaKcal, BigDecimal metaCarboidratos, BigDecimal metaGordura,
        BigDecimal metaProteina, Instant criadoEm, Instant publicadoEm, long versao) {
    public static PlanoAlimentarResponse from(PlanoAlimentar plano) {
        return new PlanoAlimentarResponse(
                plano.getId(), plano.getPaciente().getId(), plano.getNutricionista().getId(),
                plano.getConsulta() == null ? null : plano.getConsulta().getId(), plano.getStatus(),
                plano.getVigenciaInicio(), plano.getVigenciaFim(), plano.getMetaKcal(),
                plano.getMetaCarboidratos(), plano.getMetaGordura(), plano.getMetaProteina(),
                plano.getCriadoEm(), plano.getPublicadoEm(), plano.getVersao());
    }
}
