package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.AtendimentoClinicoResponse;
import com.nutri4you.backend.dto.AtendimentoClinicoResponse.ContextoClinico;
import com.nutri4you.backend.dto.ConsultaRequest;
import com.nutri4you.backend.dto.ConsultaResponse;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.exception.ConsultaNaoEncontradaException;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AtendimentoClinicoService {
    private final ConsultaRepository consultas;
    private final ConsultaService consultaService;
    private final AnamneseService anamneses;
    private final RelacaoClinicaRepository relacoes;

    public AtendimentoClinicoService(
            ConsultaRepository consultas, ConsultaService consultaService,
            AnamneseService anamneses, RelacaoClinicaRepository relacoes) {
        this.consultas = consultas;
        this.consultaService = consultaService;
        this.anamneses = anamneses;
        this.relacoes = relacoes;
    }

    @Transactional(readOnly = true)
    public List<AtendimentoClinicoResponse> listar(Nutricionista nutricionista) {
        return consultas.listarAtendimentosAvulsos(nutricionista.getId()).stream()
                .map(consulta -> resposta(consulta, consultaService.resposta(consulta, null), false))
                .toList();
    }

    @Transactional(readOnly = true)
    public AtendimentoClinicoResponse buscar(Nutricionista nutricionista, Integer consultaId) {
        Consulta consulta = buscarAvulsa(nutricionista, consultaId);
        boolean temRegistro = temRegistro(consulta);
        if (!temRegistro && !"CONFIRMADA".equals(consulta.getStatus())) {
            throw new ConsultaNaoEncontradaException();
        }
        ConsultaResponse dados = temRegistro
                ? consultaService.respostaComMedidas(consulta)
                : consultaService.resposta(consulta, null);
        return resposta(consulta, dados, temRegistro);
    }

    @Transactional
    public AtendimentoClinicoResponse iniciar(Nutricionista nutricionista, Integer consultaId, Long versao) {
        consultaService.bloquearAgenda(nutricionista.getId());
        Consulta consulta = bloquearAvulsa(nutricionista, consultaId);
        Integer pacienteId = consulta.getPaciente().getId();
        if (consultas.temOutraConsultaInicialRealizadaOuIniciada(pacienteId, nutricionista.getId(), consultaId)
                && relacoes.findByPaciente_IdAndNutricionista_IdAndStatus(
                        pacienteId, nutricionista.getId(), StatusRelacaoClinica.ATIVA).isEmpty()) {
            throw new IllegalArgumentException("O paciente já utilizou a consulta inicial. Confirme um vínculo antes de iniciar outra consulta.");
        }
        consultaService.iniciarConsulta(consulta, versao);
        return resposta(consulta, consultaService.respostaComMedidas(consulta), true);
    }

    @Transactional
    public void cancelar(Nutricionista nutricionista, Integer consultaId, Long versao) {
        Consulta consulta = bloquearAvulsa(nutricionista, consultaId);
        if (!"CONFIRMADA".equals(consulta.getStatus())) {
            throw new IllegalArgumentException("Somente atendimentos confirmados podem ser cancelados.");
        }
        consultaService.cancelarConsulta(consulta, versao);
    }

    @Transactional
    public AtendimentoClinicoResponse atualizar(
            Nutricionista nutricionista, Integer consultaId, ConsultaRequest request) {
        consultaService.bloquearAgenda(nutricionista.getId());
        Consulta consulta = exigirEmAndamento(nutricionista, consultaId);
        return resposta(consulta, consultaService.atualizarConsulta(consulta, request), true);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Consulta exigirEmAndamento(Nutricionista nutricionista, Integer consultaId) {
        return exigirEmAndamento(nutricionista, consultaId, null);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Consulta exigirEmAndamento(Nutricionista nutricionista, Integer consultaId, Integer pacienteId) {
        Consulta consulta = bloquearAvulsa(nutricionista, consultaId);
        exigirMesmoPaciente(consulta, pacienteId);
        if (!emAndamento(consulta)) {
            throw new AcessoNegadoException("Este atendimento não está em andamento.");
        }
        return consulta;
    }

    @Transactional(readOnly = true)
    public Consulta exigirComRegistro(Nutricionista nutricionista, Integer consultaId) {
        return exigirComRegistro(nutricionista, consultaId, null);
    }

    @Transactional(readOnly = true)
    public Consulta exigirComRegistro(Nutricionista nutricionista, Integer consultaId, Integer pacienteId) {
        Consulta consulta = buscarAvulsa(nutricionista, consultaId);
        exigirMesmoPaciente(consulta, pacienteId);
        if (!temRegistro(consulta)) {
            throw new AcessoNegadoException("O atendimento não tem registro clínico disponível.");
        }
        return consulta;
    }

    private Consulta buscarAvulsa(Nutricionista nutricionista, Integer consultaId) {
        return consultas.findByIdAndNutricionista_IdAndAvulsaTrue(consultaId, nutricionista.getId())
                .filter(this::vinculoNaoEncerrado)
                .orElseThrow(ConsultaNaoEncontradaException::new);
    }

    private Consulta bloquearAvulsa(Nutricionista nutricionista, Integer consultaId) {
        return consultas.buscarAvulsaParaAtualizar(consultaId, nutricionista.getId())
                .filter(this::vinculoNaoEncerrado)
                .orElseThrow(ConsultaNaoEncontradaException::new);
    }

    private void exigirMesmoPaciente(Consulta consulta, Integer pacienteId) {
        if (pacienteId != null && !pacienteId.equals(consulta.getPaciente().getId())) {
            throw new ConsultaNaoEncontradaException();
        }
    }

    private boolean vinculoNaoEncerrado(Consulta consulta) {
        return !relacoes.existsByPaciente_IdAndNutricionista_IdAndEncerradaEmIsNotNull(
                consulta.getPaciente().getId(), consulta.getNutricionista().getId());
    }

    private boolean emAndamento(Consulta consulta) {
        return consulta.getIniciadaEm() != null && "CONFIRMADA".equals(consulta.getStatus());
    }

    private boolean temRegistro(Consulta consulta) {
        return emAndamento(consulta)
                || (consulta.getIniciadaEm() != null && "REALIZADA".equals(consulta.getStatus()));
    }

    private AtendimentoClinicoResponse resposta(Consulta consulta, ConsultaResponse dados, boolean incluirRegistro) {
        var paciente = consulta.getPaciente();
        ContextoClinico contexto = incluirRegistro && emAndamento(consulta)
                ? new ContextoClinico(paciente.getDataNascimento(), paciente.getSexo(),
                        anamneses.respostasFinalizadas(paciente.getId()))
                : null;
        return new AtendimentoClinicoResponse(
                dados.id(), paciente.getNome(), dados.dataHora(), dados.status(), dados.versao(),
                dados.iniciadaEm(), dados.podeIniciar(),
                incluirRegistro ? dados.idPaciente() : null, incluirRegistro ? dados.observacao() : null,
                incluirRegistro ? dados.avaliacao() : null, contexto);
    }
}
