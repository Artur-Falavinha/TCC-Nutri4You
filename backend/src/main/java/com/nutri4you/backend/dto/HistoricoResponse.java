package com.nutri4you.backend.dto;

import java.util.List;

public record HistoricoResponse(List<ConsultaResumoDTO> consultas, List<AvaliacaoResponse> avaliacoes) {
}
