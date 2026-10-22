package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.AgendaResponse;
import com.nutri4you.backend.dto.AvaliacaoRequest;
import com.nutri4you.backend.dto.AvaliacaoResponse;
import com.nutri4you.backend.dto.ConsultaResumoDTO;
import com.nutri4you.backend.dto.ConsumoProgressoDTO;
import com.nutri4you.backend.dto.ContagemDTO;
import com.nutri4you.backend.dto.DashboardPacienteDTO;
import com.nutri4you.backend.dto.HistoricoResponse;
import com.nutri4you.backend.dto.PacienteResponseDTO;
import com.nutri4you.backend.model.AvaliacaoAntropometrica;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.ConsumoDiario;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.PlanoAlimentar;
import com.nutri4you.backend.repository.AvaliacaoAntropometricaRepository;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.ConsumoDiarioRepository;
import com.nutri4you.backend.repository.PlanoAlimentarRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.nutri4you.backend.service.MedidasAntropometricas.*;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class ClinicoService {

    private static final ZoneId FUSO_HORARIO = ZoneId.of("America/Sao_Paulo");
    private final GestaoPacienteService gestaoPacienteService;
    private final AvaliacaoAntropometricaRepository avaliacaoRepository;
    private static final String[] DIAS = {"Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"};
    private static final String[] FAIXAS = {"10–19", "20–29", "30–39", "40–49", "50–59", "60–69", "70–79", "80+"};
    private static final String[] MESES = {
            "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"
    };

    private final ConsultaRepository consultaRepository;
    private final ConsumoDiarioRepository consumoDiarioRepository;
    private final PlanoAlimentarRepository planoAlimentarRepository;

    public ClinicoService(
            GestaoPacienteService gestaoPacienteService,
            AvaliacaoAntropometricaRepository avaliacaoRepository,
            ConsultaRepository consultaRepository,
            ConsumoDiarioRepository consumoDiarioRepository,
            PlanoAlimentarRepository planoAlimentarRepository) {
        this.gestaoPacienteService = gestaoPacienteService;
        this.avaliacaoRepository = avaliacaoRepository;
        this.consultaRepository = consultaRepository;
        this.consumoDiarioRepository = consumoDiarioRepository;
        this.planoAlimentarRepository = planoAlimentarRepository;
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
        return listarAvaliacoes(pacienteId);
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoResponse> listarAvaliacoes(Integer pacienteId) {
        return avaliacaoRepository.findByPaciente_IdOrderByDataAvaliacaoDesc(pacienteId)
                .stream()
                .map(MedidasAntropometricas::paraResposta)
                .toList();
    }

    @Transactional(readOnly = true)
    public HistoricoResponse historico(Nutricionista nutricionista, Integer pacienteId) {
        Paciente paciente = gestaoPacienteService.exigirAcesso(nutricionista, pacienteId);
        List<ConsultaResumoDTO> consultas = consultaRepository
                .findByPaciente_IdAndNutricionista_IdOrderByDataHoraDesc(paciente.getId(), nutricionista.getId())
                .stream()
                .filter(this::naoCancelada)
                .map(this::paraConsulta)
                .toList();
        return new HistoricoResponse(consultas, listarAvaliacoes(pacienteId));
    }

    @Transactional(readOnly = true)
    public HistoricoResponse historico(Paciente paciente) {
        List<ConsultaResumoDTO> consultas = consultaRepository
                .findByPaciente_IdOrderByDataHoraDesc(paciente.getId())
                .stream()
                .filter(this::naoCancelada)
                .map(this::paraConsulta)
                .toList();
        return new HistoricoResponse(consultas, listarAvaliacoes(paciente.getId()));
    }

    @Transactional(readOnly = true)
    public ConsumoProgressoDTO consumoDiarioProgresso(Paciente paciente) {
        Optional<ConsumoDiario> consumo = consumoDiarioRepository
                .findByPaciente_IdAndDataRegistro(paciente.getId(), LocalDate.now(FUSO_HORARIO));
        MetasNutricionais metas = buscarMetasNutricionais(paciente.getId()).orElse(null);

        if (consumo.isEmpty() && metas == null) {
            return null;
        }

        ConsumoDiario registro = consumo.orElse(null);
        return new ConsumoProgressoDTO(
                "Hoje",
                numero(registro == null ? null : registro.getKcalConsumidas()),
                metas == null ? null : metas.calorias(),
                numero(registro == null ? null : registro.getProteinasConsumidas()),
                metas == null ? null : metas.proteinas(),
                numero(registro == null ? null : registro.getCarboidratosConsumidos()),
                metas == null ? null : metas.carboidratos(),
                numero(registro == null ? null : registro.getGordurasConsumidas()),
                metas == null ? null : metas.gorduras());
    }

    @Transactional(readOnly = true)
    public DashboardPacienteDTO dashboardPaciente(Paciente paciente) {
        ConsumoProgressoDTO consumo = consumoDiarioProgresso(paciente);
        DashboardPacienteDTO.DietaResumoDTO dietaAtiva = buscarPlanoAtivo(paciente.getId())
                .map(this::paraDietaResumo)
                .orElse(null);

        LocalDateTime agora = LocalDateTime.now(FUSO_HORARIO);
        DashboardPacienteDTO.ProximaConsultaDTO proximaConsulta = consultaRepository
                .findByPaciente_IdOrderByDataHoraDesc(paciente.getId())
                .stream()
                .filter(c -> !c.getDataHora().isBefore(agora))
                .filter(c -> !"REALIZADA".equalsIgnoreCase(c.getStatus()))
                .filter(this::naoCancelada)
                .min(Comparator.comparing(Consulta::getDataHora))
                .map(c -> new DashboardPacienteDTO.ProximaConsultaDTO(
                        c.getId(),
                        c.getNutricionista().getNome(),
                        c.getDataHora(),
                        c.getStatus()))
                .orElse(null);

        return new DashboardPacienteDTO(paciente.getNome(), consumo, proximaConsulta, dietaAtiva);
    }

    private Optional<PlanoAlimentar> buscarPlanoAtivo(Integer pacienteId) {
        List<PlanoAlimentar> planos = planoAlimentarRepository.findByPaciente_IdOrderByIdDesc(pacienteId);
        LocalDate hoje = LocalDate.now(FUSO_HORARIO);

        Optional<PlanoAlimentar> publicadoVigente = planos.stream()
                .filter(plano -> "PUBLICADO".equalsIgnoreCase(plano.getStatus()))
                .filter(plano -> plano.getVigenciaInicio() == null || !plano.getVigenciaInicio().isAfter(hoje))
                .filter(plano -> plano.getVigenciaFim() == null || !plano.getVigenciaFim().isBefore(hoje))
                .findFirst();

        return publicadoVigente;
    }

    private Optional<MetasNutricionais> buscarMetasNutricionais(Integer pacienteId) {
        return buscarPlanoAtivo(pacienteId).map(this::paraMetas);
    }

    private MetasNutricionais paraMetas(PlanoAlimentar plano) {
        return new MetasNutricionais(
                nullableNumero(plano.getMetaCalorias()),
                nullableNumero(plano.getMetaProteina()),
                nullableNumero(plano.getMetaCarboidratos()),
                nullableNumero(plano.getMetaGordura()));
    }

    private DashboardPacienteDTO.DietaResumoDTO paraDietaResumo(PlanoAlimentar plano) {
        return new DashboardPacienteDTO.DietaResumoDTO(
                plano.getId(),
                nullableNumero(plano.getMetaCalorias()),
                nullableNumero(plano.getMetaProteina()),
                nullableNumero(plano.getMetaCarboidratos()),
                nullableNumero(plano.getMetaGordura()),
                plano.getNutricionista().getNome());
    }

    private double numero(java.math.BigDecimal valor) {
        return valor == null ? 0.0 : valor.doubleValue();
    }

    private Double nullableNumero(java.math.BigDecimal valor) {
        return valor == null ? null : valor.doubleValue();
    }

    private record MetasNutricionais(
            Double calorias,
            Double proteinas,
            Double carboidratos,
            Double gorduras) {
    }

    @Transactional(readOnly = true)
    public AgendaResponse agenda(Nutricionista nutricionista) {
        LocalDate hoje = LocalDate.now();
        LocalDate segunda = hoje.with(DayOfWeek.MONDAY);
        YearMonth mesAtual = YearMonth.from(hoje);
        LocalDateTime inicio12 = mesAtual.minusMonths(11).atDay(1).atStartOfDay();
        LocalDateTime fim12 = mesAtual.plusMonths(1).atDay(1).atStartOfDay();
        List<Consulta> ano = consultaRepository
                .findByNutricionista_IdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraAsc(
                        nutricionista.getId(), inicio12, fim12)
                .stream()
                .filter(this::naoCancelada)
                .toList();
        List<Consulta> daSemana = consultaRepository
                .findByNutricionista_IdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraAsc(
                        nutricionista.getId(), segunda.atStartOfDay(), segunda.plusDays(7).atStartOfDay())
                .stream()
                .filter(this::naoCancelada)
                .toList();
        List<ContagemDTO> semana = contarSemana(daSemana);
        List<ContagemDTO> meses = contarMeses(mesAtual, ano);
        List<PacienteResponseDTO> pacientes = gestaoPacienteService.listarParaNutricionista(nutricionista);
        return new AgendaResponse(
                consultasEntre(nutricionista.getId(), hoje.atStartOfDay(), hoje.plusDays(1).atStartOfDay()),
                semana,
                somar(semana),
                contarSexo(pacientes),
                contarIdade(pacientes, hoje),
                meses,
                somar(meses));
    }

    private List<ContagemDTO> contarSemana(List<Consulta> consultas) {
        int[] quantidades = new int[7];
        for (Consulta consulta : consultas) {
            int indice = consulta.getDataHora().getDayOfWeek().getValue() - 1;
            quantidades[indice]++;
        }
        List<ContagemDTO> dias = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            dias.add(new ContagemDTO(DIAS[i], quantidades[i]));
        }
        return dias;
    }

    private List<ContagemDTO> contarMeses(YearMonth mesAtual, List<Consulta> consultas) {
        int[] quantidades = new int[12];
        YearMonth inicio = mesAtual.minusMonths(11);
        for (Consulta consulta : consultas) {
            YearMonth mes = YearMonth.from(consulta.getDataHora());
            int indice = (int) inicio.until(mes, java.time.temporal.ChronoUnit.MONTHS);
            if (indice >= 0 && indice < 12) {
                quantidades[indice]++;
            }
        }
        List<ContagemDTO> meses = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            YearMonth mes = inicio.plusMonths(i);
            meses.add(new ContagemDTO(MESES[mes.getMonthValue() - 1], quantidades[i]));
        }
        return meses;
    }

    private List<ContagemDTO> contarSexo(List<PacienteResponseDTO> pacientes) {
        int masculino = 0;
        int feminino = 0;
        int naoInformado = 0;
        for (PacienteResponseDTO paciente : pacientes) {
            String sexo = paciente.sexo() == null ? "" : paciente.sexo().trim();
            if (sexo.equalsIgnoreCase("Masculino")) {
                masculino++;
            } else if (sexo.equalsIgnoreCase("Feminino")) {
                feminino++;
            } else if (!sexo.isEmpty()) {
                naoInformado++;
            }
        }
        List<ContagemDTO> fatias = new ArrayList<>();
        fatias.add(new ContagemDTO("Masculino", masculino));
        fatias.add(new ContagemDTO("Feminino", feminino));
        if (naoInformado > 0) {
            fatias.add(new ContagemDTO("Não informado", naoInformado));
        }
        return fatias;
    }

    private List<ContagemDTO> contarIdade(List<PacienteResponseDTO> pacientes, LocalDate hoje) {
        int[] quantidades = new int[FAIXAS.length];
        for (PacienteResponseDTO paciente : pacientes) {
            if (paciente.dataNascimento() == null) {
                continue;
            }
            int idade = Period.between(paciente.dataNascimento(), hoje).getYears();
            if (idade < 10) {
                continue;
            }
            int indice = idade >= 80 ? FAIXAS.length - 1 : (idade / 10) - 1;
            quantidades[indice]++;
        }
        List<ContagemDTO> faixas = new ArrayList<>();
        for (int i = 0; i < FAIXAS.length; i++) {
            faixas.add(new ContagemDTO(FAIXAS[i], quantidades[i]));
        }
        return faixas;
    }

    private int somar(List<ContagemDTO> contagens) {
        return contagens.stream().mapToInt(ContagemDTO::quantidade).sum();
    }

    private List<ConsultaResumoDTO> consultasEntre(Integer nutricionistaId, LocalDateTime inicio, LocalDateTime fim) {
        return consultaRepository
                .findByNutricionista_IdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraAsc(
                        nutricionistaId, inicio, fim)
                .stream()
                .filter(this::naoCancelada)
                .map(this::paraConsulta)
                .toList();
    }

    private boolean naoCancelada(Consulta consulta) {
        return !"CANCELADA".equalsIgnoreCase(consulta.getStatus());
    }


    private ConsultaResumoDTO paraConsulta(Consulta consulta) {
        return new ConsultaResumoDTO(
                consulta.getId(),
                consulta.getPaciente().getNome(),
                consulta.getDataHora());
    }
}
