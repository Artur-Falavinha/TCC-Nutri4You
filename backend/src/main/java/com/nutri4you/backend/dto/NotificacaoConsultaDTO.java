package com.nutri4you.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.nutri4you.backend.model.Consulta;

import java.time.LocalDateTime;

public record NotificacaoConsultaDTO(
        Integer id,
        Integer pacienteId,
        String pacienteNome,
        LocalDateTime dataHora,
        long versao,
        boolean avulsa,
        @JsonIgnore Boolean reagendada) {

    public enum Tipo { PRIMEIRA_CONSULTA, ACOMPANHAMENTO, REAGENDAMENTO, CONSULTA }

    public Tipo getTipo() {
        if (Boolean.TRUE.equals(reagendada)) return Tipo.REAGENDAMENTO;
        if (avulsa) return Tipo.PRIMEIRA_CONSULTA;
        return reagendada == null ? Tipo.CONSULTA : Tipo.ACOMPANHAMENTO;
    }

    public int getDuracaoMinutos() {
        return Consulta.DURACAO_MINUTOS;
    }
}
