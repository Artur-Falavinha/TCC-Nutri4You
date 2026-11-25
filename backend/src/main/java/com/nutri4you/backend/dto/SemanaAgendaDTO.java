package com.nutri4you.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public record SemanaAgendaDTO(LocalDate inicio, LocalDate hoje, int duracaoMinutos, List<Dia> dias) {
    public record Dia(LocalDate data, boolean temDisponibilidade, List<LocalTime> horariosLivres,
                      List<Compromisso> consultas) {}

    public record Compromisso(Integer id, LocalDateTime dataHora, String status, String pacienteNome,
                              boolean emAtendimento) {}
}
