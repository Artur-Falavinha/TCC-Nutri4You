package com.nutri4you.backend.dto;

import java.time.LocalDateTime;

public record SolicitarConsultaRequest(Integer nutricionistaId, LocalDateTime dataHora) {
}
