package com.nutri4you.backend.dto;

import java.time.LocalDateTime;

public record DashboardPacienteDTO(
        String nomePaciente,
        ConsumoProgressoDTO consumo,
        ProximaConsultaDTO proximaConsulta,
        DietaResumoDTO dietaAtiva
) {
    public record ProximaConsultaDTO(
            Integer id,
            String nutricionistaNome,
            LocalDateTime dataHora,
            String status
    ) {
    }

    public record DietaResumoDTO(
            Integer idPlano,
            Double metaKcal,
            Double metaProteina,
            Double metaCarboidratos,
            Double metaGordura,
            String nutricionistaNome
    ) {
    }
}

