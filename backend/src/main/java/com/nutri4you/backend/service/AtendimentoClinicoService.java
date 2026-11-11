package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.AtendimentoClinicoResponse;
import com.nutri4you.backend.dto.AtendimentoClinicoResponse.ContextoClinico;
import com.nutri4you.backend.dto.ConsultaRequest;
import com.nutri4you.backend.dto.ConsultaResponse;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.exception.ConsultaNaoEncontradaException;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.repository.ConsultaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AtendimentoClinicoService {
    private final ConsultaRepository consultas;
    private final ConsultaService consultaService;
    private final AnamneseService anamneses;
    private final JanelaConsulta janela;

    public AtendimentoClinicoService(
            ConsultaRepository consultas, ConsultaService consultaService,
            AnamneseService anamneses, JanelaConsulta janela) {
        this.consultas = consultas;
        this.consultaService = consultaService;
        this.anamneses = anamneses;
        this.janela = janela;
    }

    @Transactional(readOnly = true)
    public List<AtendimentoClinicoResponse> listar(Nutricionista nutricionista) {
        return consultas.listarAtendimentosAvulsos(nutricionista.getId(), janela.primeiroHorarioIniciavel()).stream()
                .map(consulta -> resposta(consulta, consultaService.resposta(consulta, null), false))
                .toList();
    }

    @Transactional(readOnly = true)
    public AtendimentoClinicoResponse buscar(Nutricionista nutricionista, Integer consultaId) {
        Consulta consulta = buscarAvulsa(nutricionista, consultaId);
        boolean temRegistro = temRegistro(consulta);
        if (!temRegistro && (!"CONFIRMADA".equals(consulta.getStatus())
                || consulta.getDataHora().isBefore(janela.primeiroHorarioIniciavel()))) {
            throw new ConsultaNaoEncontradaException();
        }
        ConsultaResponse dados = temRegistro
                ? consultaService.respostaComMedidas(consulta)
                : consultaService.resposta(consulta, null);
        return resposta(consulta, dados, temRegistro);
    }

    @Transactional
    public AtendimentoClinicoResponse iniciar(Nutricionista nutricionista, Integer consultaId, Long versao) {
        Consulta consulta = bloquearAvulsa(nutricionista, consultaId);
        consultaService.iniciarConsulta(consulta, versao);
        return resposta(consulta, consultaService.respostaComMedidas(consulta), true);
    }

    @Transactional
    public void cancelar(Nutricionista nutricionista, Integer consultaId, Long versao) {
        Consulta consulta = bloquearAvulsa(nutricionista, consultaId);
        if (!"CONFIRMADA".equals(consulta.getStatus()) || !consulta.getDataHora().isAfter(janela.agora())) {
            throw new IllegalArgumentException("Somente atendimentos confirmados e futuros podem ser cancelados.");
        }
        consultaService.cancelarConsulta(consulta, versao);
    }

    @Transactional
    public AtendimentoClinicoResponse atualizar(
            Nutricionista nutricionista, Integer consultaId, ConsultaRequest request) {
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
                .orElseThrow(ConsultaNaoEncontradaException::new);
    }

    private Consulta bloquearAvulsa(Nutricionista nutricionista, Integer consultaId) {
        return consultas.buscarAvulsaParaAtualizar(consultaId, nutricionista.getId())
                .orElseThrow(ConsultaNaoEncontradaException::new);
    }

    private void exigirMesmoPaciente(Consulta consulta, Integer pacienteId) {
        if (pacienteId != null && !pacienteId.equals(consulta.getPaciente().getId())) {
            throw new ConsultaNaoEncontradaException();
        }
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
                dados.iniciadaEm(), dados.inicioPermitidoDe(), dados.inicioPermitidoAte(), dados.podeIniciar(),
                incluirRegistro ? dados.idPaciente() : null, incluirRegistro ? dados.observacao() : null,
                incluirRegistro ? dados.avaliacao() : null, contexto);
    }
}
