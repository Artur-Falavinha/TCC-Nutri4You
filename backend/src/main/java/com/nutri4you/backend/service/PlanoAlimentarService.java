package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PlanoAlimentarRequest;
import com.nutri4you.backend.dto.PlanoAlimentarResponse;
import com.nutri4you.backend.exception.PlanoConflitoException;
import com.nutri4you.backend.exception.PlanoNaoEncontradoException;
import com.nutri4you.backend.model.*;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.PlanoAlimentarRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
public class PlanoAlimentarService {
    private static final ZoneId ZONA_CLINICA = ZoneId.of("America/Sao_Paulo");

    private final PlanoAlimentarRepository planos;
    private final PacienteRepository pacientes;
    private final ConsultaRepository consultas;
    private final GestaoPacienteService gestao;

    public PlanoAlimentarService(PlanoAlimentarRepository planos, PacienteRepository pacientes,
                                 ConsultaRepository consultas, GestaoPacienteService gestao) {
        this.planos = planos;
        this.pacientes = pacientes;
        this.consultas = consultas;
        this.gestao = gestao;
    }

    @Transactional
    public PlanoAlimentarResponse criar(Nutricionista nutricionista, Integer pacienteId, PlanoAlimentarRequest request) {
        Paciente paciente = gestao.exigirAcesso(nutricionista, pacienteId);
        validar(request, false);
        PlanoAlimentar plano = new PlanoAlimentar(paciente, nutricionista);
        aplicar(plano, pacienteId, nutricionista.getId(), request);
        return PlanoAlimentarResponse.from(planos.saveAndFlush(plano));
    }

    @Transactional(readOnly = true)
    public List<PlanoAlimentarResponse> listar(Nutricionista nutricionista, Integer pacienteId) {
        gestao.exigirAcesso(nutricionista, pacienteId);
        return planos.findByPaciente_IdAndNutricionista_IdOrderByIdDesc(pacienteId, nutricionista.getId())
                .stream().map(PlanoAlimentarResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PlanoAlimentarResponse detalhar(Nutricionista nutricionista, Integer pacienteId, Integer planoId) {
        gestao.exigirAcesso(nutricionista, pacienteId);
        return PlanoAlimentarResponse.from(exigirPlano(nutricionista, pacienteId, planoId));
    }

    @Transactional
    public PlanoAlimentarResponse editar(Nutricionista nutricionista, Integer pacienteId,
                                          Integer planoId, PlanoAlimentarRequest request) {
        gestao.exigirAcesso(nutricionista, pacienteId);
        validar(request, true);
        PlanoAlimentar plano = exigirPlano(nutricionista, pacienteId, planoId);
        exigirRascunhoEVersao(plano, request.versao());
        aplicar(plano, pacienteId, nutricionista.getId(), request);
        return PlanoAlimentarResponse.from(planos.saveAndFlush(plano));
    }

    @Transactional
    public PlanoAlimentarResponse publicar(Nutricionista nutricionista, Integer pacienteId,
                                            Integer planoId, long versao) {
        // Todas as publicações do mesmo paciente são serializadas, inclusive entre nutricionistas.
        Paciente paciente = pacientes.findByIdForUpdate(pacienteId)
                .orElseThrow(PacienteNaoEncontradoException::new);
        gestao.exigirAcesso(nutricionista, paciente.getId());
        PlanoAlimentar plano = exigirPlano(nutricionista, pacienteId, planoId);
        exigirRascunhoEVersao(plano, versao);
        LocalDate hoje = LocalDate.now(ZONA_CLINICA);
        LocalDate inicio = plano.getVigenciaInicio();
        if (inicio == null || inicio.isBefore(hoje)) {
            throw new IllegalArgumentException("A vigência inicial deve ser hoje ou uma data futura.");
        }

        for (PlanoAlimentar anterior : planos.findByPaciente_IdAndStatus(pacienteId, StatusPlanoAlimentar.PUBLICADO)) {
            if (!sobrepoe(anterior, inicio, plano.getVigenciaFim())) continue;
            if (anterior.getVigenciaInicio().isAfter(inicio)) {
                throw new PlanoConflitoException("Já existe um plano futuro publicado com vigência sobreposta.");
            }
            if (anterior.getVigenciaInicio().equals(inicio)) anterior.substituir();
            else anterior.terminarEm(inicio.minusDays(1));
        }
        plano.publicar();
        return PlanoAlimentarResponse.from(planos.saveAndFlush(plano));
    }

    @Transactional(readOnly = true)
    public PlanoAlimentarResponse dietaAtiva(Paciente paciente) {
        LocalDate hoje = LocalDate.now(ZONA_CLINICA);
        return planos.findByPaciente_IdAndStatus(paciente.getId(), StatusPlanoAlimentar.PUBLICADO)
                .stream()
                .filter(p -> !p.getVigenciaInicio().isAfter(hoje)
                        && (p.getVigenciaFim() == null || !p.getVigenciaFim().isBefore(hoje)))
                .findFirst().map(PlanoAlimentarResponse::from).orElse(null);
    }

    private boolean sobrepoe(PlanoAlimentar anterior, LocalDate inicio, LocalDate fim) {
        return (fim == null || !anterior.getVigenciaInicio().isAfter(fim))
                && (anterior.getVigenciaFim() == null || !anterior.getVigenciaFim().isBefore(inicio));
    }

    private PlanoAlimentar exigirPlano(Nutricionista nutricionista, Integer pacienteId, Integer planoId) {
        return planos.findByIdAndPaciente_IdAndNutricionista_Id(planoId, pacienteId, nutricionista.getId())
                .orElseThrow(PlanoNaoEncontradoException::new);
    }

    private void exigirRascunhoEVersao(PlanoAlimentar plano, long versao) {
        if (plano.getStatus() != StatusPlanoAlimentar.RASCUNHO)
            throw new PlanoConflitoException("Plano publicado não pode ser editado ou publicado novamente.");
        if (plano.getVersao() != versao)
            throw new PlanoConflitoException("O rascunho foi alterado. Recarregue antes de continuar.");
    }

    private void aplicar(PlanoAlimentar plano, Integer pacienteId, Integer nutricionistaId,
                        PlanoAlimentarRequest request) {
        Consulta consulta = null;
        if (request.idConsulta() != null) {
            consulta = consultas.findById(request.idConsulta())
                    .orElseThrow(() -> new IllegalArgumentException("Consulta não encontrada."));
            if (!consulta.getPaciente().getId().equals(pacienteId)
                    || !consulta.getNutricionista().getId().equals(nutricionistaId))
                throw new IllegalArgumentException("Consulta não pertence a este atendimento.");
            if (planos.existsByConsulta_IdAndIdNot(consulta.getId(), plano.getId() == null ? -1 : plano.getId()))
                throw new PlanoConflitoException("Consulta já possui um plano alimentar.");
        }
        plano.editar(consulta, request.vigenciaInicio(), request.vigenciaFim(), request.metaKcal(),
                request.metaCarboidratos(), request.metaGordura(), request.metaProteina());
    }

    private void validar(PlanoAlimentarRequest request, boolean exigirVersao) {
        if (request == null) throw new IllegalArgumentException("Informe os dados do plano.");
        if (exigirVersao && request.versao() == null) throw new IllegalArgumentException("Informe a versão do rascunho.");
        if (request.vigenciaFim() != null && request.vigenciaInicio() == null)
            throw new IllegalArgumentException("Informe o início da vigência quando houver data final.");
        if (request.vigenciaFim() != null && request.vigenciaFim().isBefore(request.vigenciaInicio()))
            throw new IllegalArgumentException("A vigência final deve ser igual ou posterior à inicial.");
        validarMeta(request.metaKcal(), "metaKcal");
        validarMeta(request.metaCarboidratos(), "metaCarboidratos");
        validarMeta(request.metaGordura(), "metaGordura");
        validarMeta(request.metaProteina(), "metaProteina");
    }

    private void validarMeta(BigDecimal valor, String nome) {
        if (valor != null && (valor.signum() < 0 || valor.compareTo(new BigDecimal("9999.99")) > 0
                || valor.stripTrailingZeros().scale() > 2))
            throw new IllegalArgumentException(nome + " deve ficar entre 0 e 9999,99.");
    }
}
