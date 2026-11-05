package com.nutri4you.backend.dto;

import java.time.LocalTime;

/** ISO weekday: Monday = 1, Sunday = 7. Clinic wall time in America/Sao_Paulo. */
public record HorarioAtendimentoDTO(Integer diaSemana, LocalTime horario) {}
