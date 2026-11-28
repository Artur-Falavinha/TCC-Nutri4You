package com.nutri4you.backend.dto;

import com.nutri4you.backend.model.NotificacaoExame.Tipo;

import java.time.Instant;

public record NotificacaoExameDTO(Long id, Tipo tipo, String exameNome, Instant criadaEm) {
    public record Resultado(Long id, Integer pacienteId, String pacienteNome, Integer atendimentoId,
                            String exameNome, Instant criadaEm) {
    }
}
