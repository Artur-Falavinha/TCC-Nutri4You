package com.nutri4you.backend.dto;

import java.util.List;

public record AgendaResponse(
        List<ConsultaResumoDTO> hoje,
        List<ContagemDTO> semana,
        int totalSemana,
        List<ContagemDTO> sexo,
        List<ContagemDTO> faixaEtaria,
        List<ContagemDTO> ultimos12Meses,
        int totalConsultas12Meses) {
}
