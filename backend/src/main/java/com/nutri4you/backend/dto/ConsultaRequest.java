package com.nutri4you.backend.dto;

import java.time.LocalDateTime;

public record ConsultaRequest(LocalDateTime dataHora, String status, String observacao,
                              AvaliacaoRequest avaliacao, Long versao) {}
