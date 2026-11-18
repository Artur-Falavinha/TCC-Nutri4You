package com.nutri4you.backend.dto;

import java.time.LocalDateTime;

public record NotificacaoConsultaDTO(
        Integer id,
        Integer pacienteId,
        String pacienteNome,
        LocalDateTime dataHora,
        long versao,
        boolean avulsa) {}
