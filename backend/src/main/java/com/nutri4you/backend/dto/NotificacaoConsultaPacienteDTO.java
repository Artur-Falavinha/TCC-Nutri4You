package com.nutri4you.backend.dto;

import com.nutri4you.backend.model.NotificacaoConsultaPaciente.Tipo;

import java.time.Instant;
import java.time.LocalDateTime;

public record NotificacaoConsultaPacienteDTO(Long id, Integer consultaId, Tipo tipo, LocalDateTime dataHora, Instant criadaEm) {
}
