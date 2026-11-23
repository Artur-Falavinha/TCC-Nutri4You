package com.nutri4you.backend.dto;

import java.time.LocalDateTime;

public record ConsultaResumoDTO(Integer id, Integer pacienteId, String pacienteNome, LocalDateTime dataHora) {
}
