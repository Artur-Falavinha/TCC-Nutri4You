package com.nutri4you.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record DisponibilidadeConsultaResponse(
        Integer nutricionistaId,
        String nutricionistaNome,
        String especialidade,
        int duracaoMinutos,
        LocalDate data,
        List<LocalDateTime> horarios) {
}
