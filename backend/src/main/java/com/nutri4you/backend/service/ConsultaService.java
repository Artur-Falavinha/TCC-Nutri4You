package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.*;
import com.nutri4you.backend.exception.ConsultaConflitoException;
import com.nutri4you.backend.exception.ConsultaNaoEncontradaException;
import com.nutri4you.backend.model.*;
import com.nutri4you.backend.repository.AvaliacaoAntropometricaRepository;
import com.nutri4you.backend.repository.ConsultaRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ConsultaService {
    private static final Set<String> STATUS = Set.of(
            "AGUARDANDO_CONFIRMACAO", "CONFIRMADA", "REALIZADA", "CANCELADA");
    private final JanelaConsulta janela;
    private final com.nutri4you.backend.repository.NutricionistaRepository nutricionistas;
    private final GestaoPacienteService pacientes;
    private final ConsultaRepository consultas;
    private final AvaliacaoAntropometricaRepository avaliacoes;
    private final HorarioConsultaService horarios;

    public ConsultaService(GestaoPacienteService pacientes, ConsultaRepository consultas,
                           AvaliacaoAntropometricaRepository avaliacoes, JanelaConsulta janela,
                           com.nutri4you.backend.repository.NutricionistaRepository nutricionistas,
                           HorarioConsultaService horarios) {
        this.pacientes = pacientes;
        this.consultas = consultas;
        this.avaliacoes = avaliacoes;
        this.janela = janela;
        this.nutricionistas = nutricionistas;
        this.horarios = horarios;

    }

    @Transactional(readOnly = true)
    public ConsultasResponse listar(Nutricionista nutricionista, Integer pacienteId, int pagina) {
        pacientes.exigirAcesso(nutricionista, pacienteId);
        if (pagina < 0 || pagina > 100000) throw new IllegalArgumentException("Pagina invalida.");
        var page = consultas.findByPaciente_IdAndNutricionista_Id(pacienteId, nutricionista.getId(),
                PageRequest.of(pagina, 10, Sort.by(Sort.Direction.DESC, "dataHora", "id")));
        Map<Integer, AvaliacaoAntropometrica> medidas = page.isEmpty() ? Map.of()
                : avaliacoes.findByConsulta_IdIn(page.stream().map(Consulta::getId).toList()).stream()
                .collect(Collectors.toMap(a -> a.getConsulta().getId(), a -> a));
        return new ConsultasResponse(page.stream().map(c -> resposta(c, medidas.get(c.getId()))).toList(),
                pagina, page.getTotalPages(), page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public ConsultaResponse buscar(Nutricionista nutricionista, Integer pacienteId, Integer id) {
        pacientes.exigirAcesso(nutricionista, pacienteId);
        Consulta consulta = exigirConsulta(nutricionista, pacienteId, id);
        return resposta(consulta, avaliacoes.findByConsulta_Id(id).orElse(null));
    }

    @Transactional
    public ConsultaResponse criar(Nutricionista nutricionista, Integer pacienteId, ConsultaRequest request) {
        pacientes.exigirAcesso(nutricionista, pacienteId);
        throw new IllegalArgumentException("Solicite um agendamento e use Iniciar Consulta no horário permitido.");
    }

    @Transactional
    public ConsultaResponse iniciar(Nutricionista nutricionista, Integer pacienteId, Integer id, Long versao) {
        pacientes.exigirAcesso(nutricionista, pacienteId);
        Consulta consulta = exigirConsulta(nutricionista, pacienteId, id);
        exigirVersao(consulta, versao);
        if (!"CONFIRMADA".equals(consulta.getStatus()) || consulta.getIniciadaEm() != null) {
            throw new IllegalArgumentException("Somente consultas confirmadas e ainda não iniciadas podem começar.");
        }
        if (!janela.permite(consulta.getDataHora())) {
            throw new IllegalArgumentException("A consulta está fora da janela permitida para início.");
        }
        consulta.iniciar(janela.agora());

        consultas.flush();
        return resposta(consulta, avaliacoes.findByConsulta_Id(id).orElse(null));
    }

    @Transactional
    public ConsultaResponse confirmar(Nutricionista nutricionista, Integer pacienteId, Integer id, Long versao) {
        pacientes.exigirAcesso(nutricionista, pacienteId);
        Consulta consulta = exigirConsulta(nutricionista, pacienteId, id);
        exigirVersao(consulta, versao);
        if (!"AGUARDANDO_CONFIRMACAO".equals(consulta.getStatus()) || !consulta.getDataHora().isAfter(janela.agora())) {
            throw new IllegalArgumentException("Somente solicitações futuras pendentes podem ser confirmadas.");
        }
        exigirSemConflito(consulta);
        consulta.atualizar(consulta.getDataHora(), "CONFIRMADA", consulta.getObservacao());
        consultas.flush();
        return resposta(consulta, null);
    }

    @Transactional
    public ConsultaResponse cancelar(Nutricionista nutricionista, Integer pacienteId, Integer id, Long versao) {
        pacientes.exigirAcesso(nutricionista, pacienteId);
        Consulta consulta = exigirConsulta(nutricionista, pacienteId, id);
        exigirVersao(consulta, versao);
        if (!("AGUARDANDO_CONFIRMACAO".equals(consulta.getStatus()) || "CONFIRMADA".equals(consulta.getStatus()))
                || consulta.getIniciadaEm() != null) {
            throw new IllegalArgumentException("Somente consultas pendentes ou confirmadas ainda não iniciadas podem ser canceladas.");
        }
        consulta.cancelar();
        consultas.flush();
        return resposta(consulta, null);
    }

    private void exigirVersao(Consulta c, Long versao) {
        if (versao == null) throw new IllegalArgumentException("Versão da consulta obrigatória.");
        if (versao != c.getVersao()) throw new ConsultaConflitoException();
    }

    private void exigirSemConflito(Consulta c) {
        nutricionistas.findByIdForUpdate(c.getNutricionista().getId()).orElseThrow();
        var proximas = consultas.findByNutricionista_IdAndStatusNotAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraAsc(
                c.getNutricionista().getId(), "CANCELADA", c.getDataHora().minusMinutes(45), c.getDataHora().plusMinutes(45));
        if (proximas.stream().anyMatch(outra -> !outra.getId().equals(c.getId())
                && outra.getDataHora().plusMinutes(45).isAfter(c.getDataHora()))) {
            throw new ConsultaConflitoException("O horário selecionado já está ocupado.");
        }
    }

    @Transactional
    public ConsultaResponse atualizar(Nutricionista nutricionista, Integer pacienteId, Integer id,
                                      ConsultaRequest request) {
        pacientes.exigirAcesso(nutricionista, pacienteId);
        Consulta consulta = exigirConsulta(nutricionista, pacienteId, id);
        validar(request);
        if (!request.dataHora().equals(consulta.getDataHora())) {
            throw new IllegalArgumentException("Use o fluxo de reagendamento para alterar o horário.");
        }
        if (consulta.getIniciadaEm() == null && !"REALIZADA".equals(consulta.getStatus())) {
            throw new IllegalArgumentException("Inicie a consulta antes de registrar o atendimento.");
        }
        if (!("CONFIRMADA".equals(request.status()) || "REALIZADA".equals(request.status()))
                || ("REALIZADA".equals(consulta.getStatus()) && !"REALIZADA".equals(request.status()))
                || "CANCELADA".equals(consulta.getStatus())) {
            throw new IllegalArgumentException("Transição de status inválida. Use as ações da agenda.");
        }
        if (request.versao() == null) throw new IllegalArgumentException("Versao da consulta obrigatoria.");
        if (!request.versao().equals(consulta.getVersao())) throw new ConsultaConflitoException();
        AvaliacaoAntropometrica existente = avaliacoes.findByConsulta_Id(id).orElse(null);
        if (existente != null && request.avaliacao() == null) {
            throw new IllegalArgumentException("Mantenha peso e altura da avaliacao ja registrada.");
        }
        validarHorarioLivre(consulta.getNutricionista().getId(), request, consulta.getId());
        consulta.atualizar(request.dataHora(), request.status(), observacao(request));
        AvaliacaoAntropometrica avaliacao = salvarMedidas(consulta, request.avaliacao(), existente);
        consultas.flush();
        return resposta(consulta, avaliacao);
    }

    private Consulta exigirConsulta(Nutricionista nutricionista, Integer pacienteId, Integer id) {
        return consultas.findByIdAndPaciente_IdAndNutricionista_Id(id, pacienteId, nutricionista.getId())
                .orElseThrow(ConsultaNaoEncontradaException::new);
    }

    private AvaliacaoAntropometrica salvarMedidas(Consulta consulta, AvaliacaoRequest request,
                                                AvaliacaoAntropometrica existente) {
        if (request == null) return null;
        AvaliacaoAntropometrica avaliacao = existente == null
                ? new AvaliacaoAntropometrica(consulta.getPaciente(), consulta.getDataHora()) : existente;
        avaliacao.vincularConsulta(consulta);
        MedidasAntropometricas.aplicar(avaliacao, request);
        return avaliacoes.save(avaliacao);
    }

    private void validar(ConsultaRequest request) {
        if (request == null || request.dataHora() == null) {
            throw new IllegalArgumentException("Informe a data e a hora da consulta.");
        }
        if (request.dataHora().getYear() < 1900 || request.dataHora().getYear() > 2100) {
            throw new IllegalArgumentException("Data da consulta deve estar entre 1900 e 2100.");
        }
        if (request.status() == null || !STATUS.contains(request.status())) {
            throw new IllegalArgumentException("Status da consulta invalido.");
        }
        if ("REALIZADA".equals(request.status())
                && request.dataHora().isAfter(janela.agora())) {
            throw new IllegalArgumentException("Uma consulta futura nao pode ser concluida.");
        }
        if (request.observacao() != null && request.observacao().length() > 5000) {
            throw new IllegalArgumentException("Observacoes devem ter no maximo 5000 caracteres.");
        }
        AvaliacaoRequest a = request.avaliacao();
        if (a != null || "REALIZADA".equals(request.status())) {
            MedidasAntropometricas.validarMedidas(a);
            for (BigDecimal valor : Arrays.asList(a.peso(), a.altura(), a.percentualGordura(),
                    a.massaMuscularKg(), a.pregaBicipital(), a.pregaTricipital(), a.pregaSubescapular(),
                    a.pregaSuprailiaca(), a.circunferenciaCintura(), a.circunferenciaQuadril(),
                    a.circunferenciaBraco())) {
                if (valor != null && valor.stripTrailingZeros().scale() > 2) {
                    throw new IllegalArgumentException("As medidas aceitam no maximo duas casas decimais; altura em centimetros inteiros.");
                }
            }
        }
    }

    private String observacao(ConsultaRequest request) {
        return request.observacao() == null || request.observacao().isBlank() ? null : request.observacao().trim();
    }

    private void validarHorarioLivre(Integer nutricionistaId, ConsultaRequest request, Integer ignorarConsultaId) {
        if (!"CANCELADA".equals(request.status())) {
            horarios.exigirHorarioLivre(nutricionistaId, request.dataHora(), ignorarConsultaId);
        }
    }

    private ConsultaResponse resposta(Consulta c, AvaliacaoAntropometrica a) {
        return new ConsultaResponse(c.getId(), c.getPaciente().getId(), c.getDataHora(), c.getStatus(),
                c.getObservacao(), c.getVersao(), a == null ? null : MedidasAntropometricas.paraResposta(a),
                c.getIniciadaEm(), janela.inicio(c.getDataHora()).atZone(ZoneId.of("America/Sao_Paulo")).toOffsetDateTime(),
                janela.fim(c.getDataHora()).atZone(ZoneId.of("America/Sao_Paulo")).toOffsetDateTime(),
                "CONFIRMADA".equals(c.getStatus()) && c.getIniciadaEm() == null && janela.permite(c.getDataHora()));
    }
}
