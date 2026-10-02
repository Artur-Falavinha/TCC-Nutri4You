package com.nutri4you.backend.dto;

import java.util.List;

public record AgendaResponse(List<ConsultaResumoDTO> hoje, List<ConsultaResumoDTO> proximosSeteDias) {
}
