package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.ConsultaPacienteResponse;
import com.nutri4you.backend.dto.DisponibilidadeConsultaResponse;
import com.nutri4you.backend.dto.ReagendarConsultaRequest;
import com.nutri4you.backend.dto.SolicitarConsultaRequest;
import com.nutri4you.backend.exception.ConsultaConflitoException;
import com.nutri4you.backend.exception.ConsultaNaoEncontradaException;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class AgendaPacienteService {

    private static final ZoneId FUSO_HORARIO = ZoneId.of("America/Sao_Paulo");
    private static final int DURACAO_MINUTOS = 45;
    private static final List<LocalTime> HORARIOS_PADRAO = List.of(
            LocalTime.of(8, 0),
            LocalTime.of(9, 0),
            LocalTime.of(9, 30),
            LocalTime.of(10, 15),
            LocalTime.of(11, 0),
            LocalTime.of(14, 0),
            LocalTime.of(14, 45),
            LocalTime.of(15, 30));

    private final ConsultaRepository consultas;
    private final NutricionistaRepository nutricionistas;
    private final RelacaoClinicaRepository relacoes;

    public AgendaPacienteService(
            ConsultaRepository consultas,
            NutricionistaRepository nutricionistas,
            RelacaoClinicaRepository relacoes) {
        this.consultas = consultas;
        this.nutricionistas = nutricionistas;
        this.relacoes = relacoes;
    }

    @Transactional(readOnly = true)
    public List<ConsultaPacienteResponse> listar(Paciente paciente) {
        return consultas
                .findByPaciente_IdAndStatusNotAndDataHoraGreaterThanEqualOrderByDataHoraAsc(
                        paciente.getId(), "CANCELADA", LocalDateTime.now(FUSO_HORARIO))
                .stream()
                .map(this::resposta)
                .toList();
    }

    @Transactional(readOnly = true)
    public DisponibilidadeConsultaResponse disponibilidade(
            Paciente paciente,
            Integer nutricionistaId,
            LocalDate data) {
        if (data == null) {
            throw new IllegalArgumentException("Informe a data desejada.");
        }
        Nutricionista nutricionista = exigirNutricionistaVinculado(paciente, nutricionistaId);
        List<Consulta> ocupadas = consultas
                .findByNutricionista_IdAndStatusNotAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraAsc(
                        nutricionistaId,
                        "CANCELADA",
                        data.atStartOfDay(),
                        data.plusDays(1).atStartOfDay());
        LocalDateTime agora = LocalDateTime.now(FUSO_HORARIO);
        List<LocalDateTime> horarios = data.getDayOfWeek() == DayOfWeek.SUNDAY
                ? List.of()
                : HORARIOS_PADRAO.stream()
                        .map(data::atTime)
                        .filter(horario -> horario.isAfter(agora))
                        .filter(horario -> !possuiConflito(ocupadas, horario, null))
                        .toList();
        return new DisponibilidadeConsultaResponse(
                nutricionista.getId(),
                nutricionista.getNome(),
                "Nutricionista Clínico",
                DURACAO_MINUTOS,
                data,
                horarios);
    }

    @Transactional
    public ConsultaPacienteResponse solicitar(Paciente paciente, SolicitarConsultaRequest request) {
        if (request == null || request.nutricionistaId() == null) {
            throw new IllegalArgumentException("Informe o nutricionista.");
        }
        Nutricionista nutricionista = exigirNutricionistaVinculado(paciente, request.nutricionistaId());
        bloquearNutricionista(nutricionista.getId());
        validarHorario(request.dataHora());
        exigirHorarioLivre(nutricionista.getId(), request.dataHora(), null);
        Consulta consulta = consultas.save(new Consulta(paciente, nutricionista, request.dataHora()));
        consultas.flush();
        return resposta(consulta);
    }

    @Transactional
    public ConsultaPacienteResponse reagendar(
            Paciente paciente,
            Integer consultaId,
            ReagendarConsultaRequest request) {
        Consulta consulta = exigirConsulta(paciente, consultaId);
        if (!"CONFIRMADA".equals(consulta.getStatus())) {
            throw new IllegalArgumentException("Somente consultas confirmadas podem ser reagendadas.");
        }
        validarVersao(request == null ? null : request.versao(), consulta);
        bloquearNutricionista(consulta.getNutricionista().getId());
        validarHorario(request.dataHora());
        exigirHorarioLivre(consulta.getNutricionista().getId(), request.dataHora(), consulta.getId());
        consulta.reagendar(request.dataHora());
        consultas.flush();
        return resposta(consulta);
    }

    @Transactional
    public ConsultaPacienteResponse cancelar(Paciente paciente, Integer consultaId, Long versao) {
        Consulta consulta = exigirConsulta(paciente, consultaId);
        if (!"CONFIRMADA".equals(consulta.getStatus())) {
            throw new IllegalArgumentException("Somente consultas confirmadas podem ser canceladas pelo paciente.");
        }
        validarVersao(versao, consulta);
        consulta.cancelar();
        consultas.flush();
        return resposta(consulta);
    }

    private Nutricionista exigirNutricionistaVinculado(Paciente paciente, Integer nutricionistaId) {
        if (nutricionistaId == null) {
            throw new IllegalArgumentException("Informe o nutricionista.");
        }
        relacoes.findByPaciente_IdAndNutricionista_IdAndStatus(
                        paciente.getId(), nutricionistaId, StatusRelacaoClinica.ATIVA)
                .orElseThrow(() -> new IllegalArgumentException(
                        "O nutricionista informado não possui vínculo ativo com o paciente."));
        return nutricionistas.findById(nutricionistaId)
                .orElseThrow(() -> new IllegalArgumentException("Nutricionista não encontrado."));
    }

    private Consulta exigirConsulta(Paciente paciente, Integer consultaId) {
        return consultas.findByIdAndPaciente_Id(consultaId, paciente.getId())
                .orElseThrow(ConsultaNaoEncontradaException::new);
    }

    private void bloquearNutricionista(Integer nutricionistaId) {
        nutricionistas.findByIdForUpdate(nutricionistaId)
                .orElseThrow(() -> new IllegalArgumentException("Nutricionista não encontrado."));
    }

    private void validarHorario(LocalDateTime dataHora) {
        if (dataHora == null) {
            throw new IllegalArgumentException("Informe a data e a hora da consulta.");
        }
        if (!dataHora.isAfter(LocalDateTime.now(FUSO_HORARIO))) {
            throw new IllegalArgumentException("Escolha um horário futuro.");
        }
        if (dataHora.getDayOfWeek() == DayOfWeek.SUNDAY || !HORARIOS_PADRAO.contains(dataHora.toLocalTime())) {
            throw new IllegalArgumentException("O horário escolhido não está disponível.");
        }
    }

    private void exigirHorarioLivre(Integer nutricionistaId, LocalDateTime dataHora, Integer ignorarConsultaId) {
        List<Consulta> proximas = consultas
                .findByNutricionista_IdAndStatusNotAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraAsc(
                        nutricionistaId,
                        "CANCELADA",
                        dataHora.minusMinutes(DURACAO_MINUTOS),
                        dataHora.plusMinutes(DURACAO_MINUTOS));
        if (possuiConflito(proximas, dataHora, ignorarConsultaId)) {
            throw new ConsultaConflitoException("O horário selecionado já está ocupado.");
        }
    }

    private boolean possuiConflito(
            List<Consulta> consultasExistentes,
            LocalDateTime novoInicio,
            Integer ignorarConsultaId) {
        LocalDateTime novoFim = novoInicio.plusMinutes(DURACAO_MINUTOS);
        return consultasExistentes.stream()
                .filter(consulta -> ignorarConsultaId == null || !ignorarConsultaId.equals(consulta.getId()))
                .anyMatch(consulta -> consulta.getDataHora().isBefore(novoFim)
                        && consulta.getDataHora().plusMinutes(DURACAO_MINUTOS).isAfter(novoInicio));
    }

    private void validarVersao(Long versao, Consulta consulta) {
        if (versao == null) {
            throw new IllegalArgumentException("Versão da consulta obrigatória.");
        }
        if (!versao.equals(consulta.getVersao())) {
            throw new ConsultaConflitoException();
        }
    }

    private ConsultaPacienteResponse resposta(Consulta consulta) {
        return new ConsultaPacienteResponse(
                consulta.getId(),
                consulta.getNutricionista().getId(),
                consulta.getNutricionista().getNome(),
                consulta.getDataHora(),
                consulta.getStatus(),
                consulta.getVersao());
    }
}
