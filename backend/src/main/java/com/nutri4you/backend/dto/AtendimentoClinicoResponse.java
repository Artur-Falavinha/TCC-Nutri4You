package com.nutri4you.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Map;

public record AtendimentoClinicoResponse(
        Integer id,
        String pacienteNome,
        LocalDateTime dataHora,
        String status,
        long versao,
        LocalDateTime iniciadaEm,
        OffsetDateTime janelaInicio,
        OffsetDateTime janelaFim,
        boolean podeIniciar,
        Integer pacienteId,
        String observacao,
        AvaliacaoResponse avaliacao,
        ContextoClinico contextoClinico) {

    public record ContextoClinico(
            LocalDate dataNascimento,
            String sexo,
            Map<String, Object> anamneseFinalizada) {}
}
