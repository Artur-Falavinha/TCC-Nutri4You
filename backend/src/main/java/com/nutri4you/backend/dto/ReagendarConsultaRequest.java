package com.nutri4you.backend.dto;

import java.time.LocalDateTime;

public record ReagendarConsultaRequest(LocalDateTime dataHora, Long versao) {
}
