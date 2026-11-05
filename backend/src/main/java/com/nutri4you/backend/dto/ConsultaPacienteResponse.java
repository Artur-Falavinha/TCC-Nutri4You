package com.nutri4you.backend.dto;

import java.time.LocalDateTime;

public record ConsultaPacienteResponse(
        Integer id,
        Integer nutricionistaId,
        String nutricionistaNome,
        LocalDateTime dataHora,
        String status,
        long versao, LocalDateTime iniciadaEm) {
}
