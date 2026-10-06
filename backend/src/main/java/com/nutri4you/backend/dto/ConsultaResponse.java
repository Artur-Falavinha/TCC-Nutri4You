package com.nutri4you.backend.dto;

import java.time.LocalDateTime;

public record ConsultaResponse(Integer id, Integer idPaciente, LocalDateTime dataHora, String status,
                               String observacao, long versao, AvaliacaoResponse avaliacao) {}
