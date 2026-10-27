package com.nutri4you.backend.dto;

import com.nutri4you.backend.model.PlanoAlimentar;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record PlanoAlimentarResponse(
        Integer id, Integer idPaciente, Integer idNutricionista, Integer idConsulta,
        String status, LocalDate vigenciaInicio, LocalDate vigenciaFim,
        BigDecimal metaKcal, BigDecimal metaCarboidratos, BigDecimal metaGordura,
        BigDecimal metaProteina, Instant criadoEm, Instant publicadoEm, long versao, java.util.List<RefeicaoResponse> refeicoes) {
    public static PlanoAlimentarResponse from(PlanoAlimentar plano) {
        return new PlanoAlimentarResponse(
                plano.getId(), plano.getPaciente().getId(), plano.getNutricionista().getId(),
                plano.getConsulta() == null ? null : plano.getConsulta().getId(), plano.getStatus(),
                plano.getVigenciaInicio(), plano.getVigenciaFim(), plano.getMetaKcal(),
                plano.getMetaCarboidratos(), plano.getMetaGordura(), plano.getMetaProteina(),
                plano.getCriadoEm(), plano.getPublicadoEm(), plano.getVersao(),
                plano.getRefeicoes().stream().map(RefeicaoResponse::from).toList());
    }
}
