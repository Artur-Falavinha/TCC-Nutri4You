package com.nutri4you.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

public record ConsultaResponse(Integer id, Integer idPaciente, LocalDateTime dataHora, String status,
                               String observacao, long versao, AvaliacaoResponse avaliacao,
                               LocalDateTime iniciadaEm, java.time.OffsetDateTime inicioPermitidoDe,
                               java.time.OffsetDateTime inicioPermitidoAte, boolean podeIniciar,
                               ContextoClinico contextoClinico) {
    public record ContextoClinico(
            LocalDate dataNascimento,
            String sexo,
            Map<String, Object> anamneseFinalizada) {}
}
