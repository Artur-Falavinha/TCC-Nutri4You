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
    private final GestaoPacienteService pacientes;
    private final ConsultaRepository consultas;
    private final AvaliacaoAntropometricaRepository avaliacoes;

    public ConsultaService(GestaoPacienteService pacientes, ConsultaRepository consultas,
                           AvaliacaoAntropometricaRepository avaliacoes) {
        this.pacientes = pacientes;
        this.consultas = consultas;
        this.avaliacoes = avaliacoes;
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
        Paciente paciente = pacientes.exigirAcesso(nutricionista, pacienteId);
        validar(request);
        Consulta consulta = new Consulta(paciente, nutricionista, request.dataHora());
        consulta.atualizar(request.dataHora(), request.status(), observacao(request));
        consultas.save(consulta);
        AvaliacaoAntropometrica avaliacao = salvarMedidas(consulta, request.avaliacao(), null);
        consultas.flush();
        return resposta(consulta, avaliacao);
    }

    @Transactional
    public ConsultaResponse atualizar(Nutricionista nutricionista, Integer pacienteId, Integer id,
                                      ConsultaRequest request) {
        pacientes.exigirAcesso(nutricionista, pacienteId);
        Consulta consulta = exigirConsulta(nutricionista, pacienteId, id);
        validar(request);
        if (request.versao() == null) throw new IllegalArgumentException("Versao da consulta obrigatoria.");
        if (request.versao() != consulta.getVersao()) throw new ConsultaConflitoException();
        AvaliacaoAntropometrica existente = avaliacoes.findByConsulta_Id(id).orElse(null);
        if (existente != null && request.avaliacao() == null) {
            throw new IllegalArgumentException("Mantenha peso e altura da avaliacao ja registrada.");
        }
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
                && request.dataHora().isAfter(LocalDateTime.now(ZoneId.of("America/Sao_Paulo")))) {
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

    private ConsultaResponse resposta(Consulta c, AvaliacaoAntropometrica a) {
        return new ConsultaResponse(c.getId(), c.getPaciente().getId(), c.getDataHora(), c.getStatus(),
                c.getObservacao(), c.getVersao(), a == null ? null : MedidasAntropometricas.paraResposta(a));
    }
}
