package com.nutri4you.backend.dto;

import java.time.LocalDateTime;

public record SolicitacaoAvulsaDTO(Integer id, String pacienteNome, LocalDateTime dataHora, long versao) {}
