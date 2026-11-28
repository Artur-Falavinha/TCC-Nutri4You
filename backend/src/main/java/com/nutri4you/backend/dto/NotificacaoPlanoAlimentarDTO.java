package com.nutri4you.backend.dto;

import java.time.Instant;
import java.time.LocalDate;

public record NotificacaoPlanoAlimentarDTO(Long id, String titulo, boolean atualizacao,
                                         LocalDate vigenciaInicio, LocalDate vigenciaFim, Instant criadaEm, boolean edicaoAgendada) {
}
