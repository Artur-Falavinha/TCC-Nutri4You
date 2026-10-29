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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class AgendaPacienteService {

    private static final ZoneId FUSO_HORARIO = ZoneId.of("America/Sao_Paulo");
    private static final int DURACAO_MINUTOS = 45;
    private final ConsultaRepository consultas;
    private final NutricionistaRepository nutricionistas;
    private final RelacaoClinicaRepository relacoes;
    private final HorarioAtendimentoService horarios;


    public AgendaPacienteService(
            ConsultaRepository consultas,
            NutricionistaRepository nutricionistas,
            RelacaoClinicaRepository relacoes, HorarioAtendimentoService horarios) {
        this.consultas = consultas;
        this.nutricionistas = nutricionistas;
        this.relacoes = relacoes;
        this.horarios = horarios;

    }

    @Transactional(readOnly = true)
    public List<ConsultaPacienteResponse> listar(Paciente paciente) {
        return consultas
                .listarAgendaPaciente(paciente.getId(), LocalDateTime.now(FUSO_HORARIO))
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
        List<LocalDateTime> disponiveis = horarios.horarios(nutricionistaId, data.getDayOfWeek().getValue()).stream()
                        .map(data::atTime)
                        .filter(horario -> horario.isAfter(agora))
                        .filter(horario -> !possuiConflito(ocupadas, horario, null))
                        .toList();
        return new DisponibilidadeConsultaResponse(
                nutricionista.getId(),
                nutricionista.getNome(),
                "Nutricionista Clínico",
                HorarioConsultaService.DURACAO_MINUTOS,
                data,
                disponiveis);
    }

    @Transactional
    public ConsultaPacienteResponse solicitar(Paciente paciente, SolicitarConsultaRequest request) {
        if (request == null || request.nutricionistaId() == null) {
            throw new IllegalArgumentException("Informe o nutricionista.");
        }
        Nutricionista nutricionista = exigirNutricionistaVinculado(paciente, request.nutricionistaId());
        bloquearNutricionista(nutricionista.getId());
        validarHorario(nutricionista.getId(), request.dataHora());
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
        if (!"CONFIRMADA".equals(consulta.getStatus()) || consulta.getIniciadaEm() != null) {
            throw new IllegalArgumentException("Somente consultas confirmadas podem ser reagendadas.");
        }
        exigirFutura(consulta);
        exigirNutricionistaVinculado(paciente, consulta.getNutricionista().getId());
        validarVersao(request == null ? null : request.versao(), consulta);
        bloquearNutricionista(consulta.getNutricionista().getId());
        validarHorario(consulta.getNutricionista().getId(), request.dataHora());
        exigirHorarioLivre(consulta.getNutricionista().getId(), request.dataHora(), consulta.getId());

        consulta.reagendar(request.dataHora());
        consultas.flush();
        return resposta(consulta);
    }

    @Transactional
    public ConsultaPacienteResponse cancelar(Paciente paciente, Integer consultaId, Long versao) {
        Consulta consulta = exigirConsulta(paciente, consultaId);
        if (!"CONFIRMADA".equals(consulta.getStatus()) || consulta.getIniciadaEm() != null) {
            throw new IllegalArgumentException("Somente consultas confirmadas podem ser canceladas pelo paciente.");
        }
        exigirFutura(consulta);
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

    private void validarHorario(Integer nutricionistaId, LocalDateTime dataHora) {

        if (dataHora == null) {
            throw new IllegalArgumentException("Informe a data e a hora da consulta.");
        }
        if (!dataHora.isAfter(LocalDateTime.now(FUSO_HORARIO))) {
            throw new IllegalArgumentException("Escolha um horário futuro.");
        }
        horarios.exigirDisponivel(nutricionistaId, dataHora);
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

    private void exigirFutura(Consulta consulta) {
        if (!consulta.getDataHora().isAfter(LocalDateTime.now(FUSO_HORARIO))) {
            throw new IllegalArgumentException("Consultas passadas não podem ser canceladas ou reagendadas pelo paciente.");
        }
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
                consulta.getVersao(), consulta.getIniciadaEm());
    }
}
