package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.AgendaResponse;
import com.nutri4you.backend.dto.AvaliacaoRequest;
import com.nutri4you.backend.dto.AvaliacaoResponse;
import com.nutri4you.backend.dto.ConsultaResumoDTO;
import com.nutri4you.backend.dto.HistoricoResponse;
import com.nutri4you.backend.model.AvaliacaoAntropometrica;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.repository.AvaliacaoAntropometricaRepository;
import com.nutri4you.backend.repository.ConsultaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ClinicoService {

    private final GestaoPacienteService gestaoPacienteService;
    private final AvaliacaoAntropometricaRepository avaliacaoRepository;
    private final ConsultaRepository consultaRepository;

    public ClinicoService(
            GestaoPacienteService gestaoPacienteService,
            AvaliacaoAntropometricaRepository avaliacaoRepository,
            ConsultaRepository consultaRepository) {
        this.gestaoPacienteService = gestaoPacienteService;
        this.avaliacaoRepository = avaliacaoRepository;
        this.consultaRepository = consultaRepository;
    }

    @Transactional
    public AvaliacaoResponse registrarAvaliacao(Nutricionista nutricionista, Integer pacienteId, AvaliacaoRequest request) {
        Paciente paciente = gestaoPacienteService.exigirAcesso(nutricionista, pacienteId);
        validarMedidas(request);
        AvaliacaoAntropometrica avaliacao = new AvaliacaoAntropometrica(paciente, LocalDateTime.now());
        aplicar(avaliacao, request);
        return paraResposta(avaliacaoRepository.save(avaliacao));
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoResponse> listarAvaliacoes(Nutricionista nutricionista, Integer pacienteId) {
        gestaoPacienteService.exigirAcesso(nutricionista, pacienteId);
        return avaliacaoRepository.findByPaciente_IdOrderByDataAvaliacaoDesc(pacienteId)
                .stream()
                .map(this::paraResposta)
                .toList();
    }

    @Transactional(readOnly = true)
    public HistoricoResponse historico(Nutricionista nutricionista, Integer pacienteId) {
        Paciente paciente = gestaoPacienteService.exigirAcesso(nutricionista, pacienteId);
        List<ConsultaResumoDTO> consultas = consultaRepository
                .findByPaciente_IdAndNutricionista_IdOrderByDataHoraDesc(paciente.getId(), nutricionista.getId())
                .stream()
                .map(this::paraConsulta)
                .toList();
        return new HistoricoResponse(consultas, listarAvaliacoes(nutricionista, pacienteId));
    }

    @Transactional(readOnly = true)
    public AgendaResponse agenda(Nutricionista nutricionista) {
        LocalDate hoje = LocalDate.now();
        LocalDateTime inicioHoje = hoje.atStartOfDay();
        LocalDateTime inicioAmanha = hoje.plusDays(1).atStartOfDay();
        LocalDateTime fimJanela = hoje.plusDays(8).atStartOfDay();
        return new AgendaResponse(
                consultasEntre(nutricionista.getId(), inicioHoje, inicioAmanha),
                consultasEntre(nutricionista.getId(), inicioAmanha, fimJanela));
    }

    private List<ConsultaResumoDTO> consultasEntre(Integer nutricionistaId, LocalDateTime inicio, LocalDateTime fim) {
        return consultaRepository
                .findByNutricionista_IdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraAsc(
                        nutricionistaId, inicio, fim)
                .stream()
                .map(this::paraConsulta)
                .toList();
    }

    private void validarMedidas(AvaliacaoRequest request) {
        if (request == null || request.peso() == null || request.altura() == null) {
            throw new IllegalArgumentException("Peso e altura são obrigatórios.");
        }
        if (request.peso().compareTo(BigDecimal.ONE) < 0 || request.peso().compareTo(new BigDecimal("500")) > 0) {
            throw new IllegalArgumentException("Peso deve ficar entre 1 e 500 kg.");
        }
        if (request.altura().compareTo(new BigDecimal("0.30")) < 0
                || request.altura().compareTo(new BigDecimal("2.70")) > 0) {
            throw new IllegalArgumentException("Altura deve ficar entre 0,30 e 2,70 m.");
        }
    }

    private void aplicar(AvaliacaoAntropometrica avaliacao, AvaliacaoRequest request) {
        avaliacao.setPeso(request.peso());
        avaliacao.setAltura(request.altura());
        avaliacao.setImc(IndicadoresCorporais.imc(request.peso(), request.altura()));
        avaliacao.setPercentualGordura(request.percentualGordura());
        avaliacao.setMassaMuscularKg(request.massaMuscularKg());
        avaliacao.setPregaBicipital(request.pregaBicipital());
        avaliacao.setPregaTricipital(request.pregaTricipital());
        avaliacao.setPregaSubescapular(request.pregaSubescapular());
        avaliacao.setPregaSuprailiaca(request.pregaSuprailiaca());
        avaliacao.setCircunferenciaCintura(request.circunferenciaCintura());
        avaliacao.setCircunferenciaQuadril(request.circunferenciaQuadril());
        avaliacao.setCircunferenciaBraco(request.circunferenciaBraco());
    }

    private AvaliacaoResponse paraResposta(AvaliacaoAntropometrica avaliacao) {
        return new AvaliacaoResponse(
                avaliacao.getId(),
                avaliacao.getDataAvaliacao(),
                avaliacao.getPeso(),
                avaliacao.getAltura(),
                avaliacao.getImc(),
                IndicadoresCorporais.razaoCinturaQuadril(
                        avaliacao.getCircunferenciaCintura(), avaliacao.getCircunferenciaQuadril()),
                avaliacao.getPercentualGordura(),
                avaliacao.getMassaMuscularKg(),
                avaliacao.getPregaBicipital(),
                avaliacao.getPregaTricipital(),
                avaliacao.getPregaSubescapular(),
                avaliacao.getPregaSuprailiaca(),
                avaliacao.getCircunferenciaCintura(),
                avaliacao.getCircunferenciaQuadril(),
                avaliacao.getCircunferenciaBraco());
    }

    private ConsultaResumoDTO paraConsulta(Consulta consulta) {
        return new ConsultaResumoDTO(
                consulta.getId(),
                consulta.getPaciente().getNome(),
                consulta.getDataHora());
    }
}
