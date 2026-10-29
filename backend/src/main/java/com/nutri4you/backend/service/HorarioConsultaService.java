package com.nutri4you.backend.service;

import com.nutri4you.backend.exception.ConsultaConflitoException;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class HorarioConsultaService {
    private static final String STATUS_CANCELADA = "CANCELADA";
    public static final int DURACAO_MINUTOS = 45;

    private final ConsultaRepository consultas;
    private final NutricionistaRepository nutricionistas;

    public HorarioConsultaService(ConsultaRepository consultas, NutricionistaRepository nutricionistas) {
        this.consultas = consultas;
        this.nutricionistas = nutricionistas;
    }

    @Transactional
    public void exigirHorarioLivre(Integer nutricionistaId, LocalDateTime dataHora, Integer ignorarConsultaId) {
        nutricionistas.findByIdForUpdate(nutricionistaId)
                .orElseThrow(() -> new IllegalArgumentException("Nutricionista não encontrado."));

        List<Consulta> consultasProximas = consultas
                .findByNutricionista_IdAndStatusNotAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraAsc(
                        nutricionistaId,
                        STATUS_CANCELADA,
                        dataHora.minusMinutes(DURACAO_MINUTOS),
                        dataHora.plusMinutes(DURACAO_MINUTOS));

        if (possuiConflito(consultasProximas, dataHora, ignorarConsultaId)) {
            throw new ConsultaConflitoException("O horário selecionado já está ocupado.");
        }
    }

    public boolean possuiConflito(
            List<Consulta> consultasExistentes,
            LocalDateTime novoInicio,
            Integer ignorarConsultaId) {
        LocalDateTime novoFim = novoInicio.plusMinutes(DURACAO_MINUTOS);
        return consultasExistentes.stream()
                .filter(consulta -> !STATUS_CANCELADA.equals(consulta.getStatus()))
                .filter(consulta -> ignorarConsultaId == null || !ignorarConsultaId.equals(consulta.getId()))
                .anyMatch(consulta -> consulta.getDataHora().isBefore(novoFim)
                        && consulta.getDataHora().plusMinutes(DURACAO_MINUTOS).isAfter(novoInicio));
    }
}
