package com.nutri4you.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.ConsumoDiario;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.PlanoAlimentar;
import com.nutri4you.backend.model.RelacaoClinica;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.ConsumoDiarioRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.PlanoAlimentarRepository;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import com.nutri4you.backend.support.TestDataFactory;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.stream.Stream;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UsuarioControllerTest {

    private static final ZoneId FUSO_HORARIO = ZoneId.of("America/Sao_Paulo");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private NutricionistaRepository nutricionistaRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private RelacaoClinicaRepository relacaoClinicaRepository;

    @Autowired
    private ConsultaRepository consultaRepository;

    @Autowired
    private ConsumoDiarioRepository consumoDiarioRepository;

    @Autowired
    private PlanoAlimentarRepository planoAlimentarRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Nutricionista nutricionista;
    private Paciente paciente;

    @BeforeEach
    void seed() {
        nutricionista = nutricionistaRepository.save(TestDataFactory.nutricionista(passwordEncoder));
        paciente = pacienteRepository.save(TestDataFactory.pacienteConfirmado(passwordEncoder));
        relacaoClinicaRepository.save(RelacaoClinica.criar(paciente, nutricionista));
    }

    @Test
    void meRetornaEnvelopeComDadosDoPaciente() throws Exception {
        String token = loginComoPaciente();

        mockMvc.perform(get("/api/v1/usuarios/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("paciente@teste.com"))
                .andExpect(jsonPath("$.data.perfil").value("PACIENTE"));
    }

    @Test
    void pacienteDesvinculaNutricionista() throws Exception {
        String token = loginComoPaciente();

        mockMvc.perform(delete("/api/v1/usuarios/me/nutricionistas/{id}/relacao", nutricionista.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mensagem").value("Relação recorrente encerrada com sucesso."));
    }

    @Test
    void consumoDiarioProgressoRetornaDados() throws Exception {
        Consulta consulta = consultaRepository.save(TestDataFactory.consulta(paciente, nutricionista));
        PlanoAlimentar plano = planoAlimentarRepository.save(new PlanoAlimentar(
                consulta,
                new BigDecimal("2200.00"),
                new BigDecimal("250.00"),
                new BigDecimal("65.00"),
                new BigDecimal("160.00")));
        definirStatusEVigencia(plano, "PUBLICADO", LocalDate.now(FUSO_HORARIO), LocalDate.now(FUSO_HORARIO));
        consumoDiarioRepository.save(new ConsumoDiario(
                paciente,
                LocalDate.now(FUSO_HORARIO),
                new BigDecimal("1234.50"),
                new BigDecimal("91.20"),
                new BigDecimal("180.30"),
                new BigDecimal("42.10"),
                1800));
        String token = loginComoPaciente();

        mockMvc.perform(get("/api/v1/usuarios/me/consumo-diario/progresso")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.data").value("Hoje"))
                .andExpect(jsonPath("$.data.caloriasConsumidas").value(1234.5))
                .andExpect(jsonPath("$.data.metaCalorias").value(2200.0))
                .andExpect(jsonPath("$.data.proteinas").value(91.2))
                .andExpect(jsonPath("$.data.metaProteinas").value(160.0))
                .andExpect(jsonPath("$.data.carboidratos").value(180.3))
                .andExpect(jsonPath("$.data.gorduras").value(42.1));
    }

    @Test
    void dashboardPacienteRetornaConsumoDietaEProximaConsultaFutura() throws Exception {
        LocalDateTime agora = LocalDateTime.now(FUSO_HORARIO);
        LocalDateTime passada = agora.minusMinutes(30).withSecond(0).withNano(0);
        Consulta consultaPassada = new Consulta(paciente, nutricionista, passada);
        consultaPassada.atualizar(passada, "CONFIRMADA", "Consulta recente");
        consultaRepository.save(consultaPassada);

        LocalDateTime realizadaFutura = agora.plusHours(1).withSecond(0).withNano(0);
        Consulta consultaRealizada = new Consulta(paciente, nutricionista, realizadaFutura);
        consultaRealizada.atualizar(realizadaFutura, "REALIZADA", "Consulta concluída");
        consultaRepository.save(consultaRealizada);

        LocalDateTime futura = agora.plusDays(3)
                .withHour(14).withMinute(30).withSecond(0).withNano(0);
        Consulta consulta = new Consulta(paciente, nutricionista, futura);
        consulta.atualizar(futura, "CONFIRMADA", "Retorno agendado");
        consulta = consultaRepository.save(consulta);
        PlanoAlimentar plano = planoAlimentarRepository.save(new PlanoAlimentar(
                consulta,
                new BigDecimal("2100.00"),
                new BigDecimal("245.00"),
                new BigDecimal("65.00"),
                new BigDecimal("180.00")));
        definirStatusEVigencia(plano, "PUBLICADO", LocalDate.now(FUSO_HORARIO), LocalDate.now(FUSO_HORARIO));
        consumoDiarioRepository.save(new ConsumoDiario(
                paciente,
                LocalDate.now(FUSO_HORARIO),
                new BigDecimal("1850.00"),
                new BigDecimal("140.00"),
                new BigDecimal("210.00"),
                new BigDecimal("55.00"),
                2200));

        String token = loginComoPaciente();

        mockMvc.perform(get("/api/v1/usuarios/me/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nomePaciente").value(paciente.getNome()))
                .andExpect(jsonPath("$.data.consumo.caloriasConsumidas").value(1850.0))
                .andExpect(jsonPath("$.data.consumo.metaCalorias").value(2100.0))
                .andExpect(jsonPath("$.data.dietaAtiva.metaProteina").value(180.0))
                .andExpect(jsonPath("$.data.proximaConsulta.id").value(consulta.getId()))
                .andExpect(jsonPath("$.data.proximaConsulta.nutricionistaNome").value(nutricionista.getNome()))
                .andExpect(jsonPath("$.data.proximaConsulta.status").value("CONFIRMADA"));
    }

    @Test
    void dashboardPacienteNaoRetornaConsultaPassada() throws Exception {
        LocalDateTime passada = LocalDateTime.now(FUSO_HORARIO).minusMinutes(30).withSecond(0).withNano(0);
        Consulta consulta = new Consulta(paciente, nutricionista, passada);
        consulta.atualizar(passada, "CONFIRMADA", "Consulta recente");
        consultaRepository.save(consulta);
        String token = loginComoPaciente();

        mockMvc.perform(get("/api/v1/usuarios/me/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.proximaConsulta").value(nullValue()));
    }

    @ParameterizedTest
    @MethodSource("planosNaoAtivos")
    void consumoDiarioNaoUsaPlanoNaoPublicadoOuForaDaVigencia(
            String statusPlano,
            LocalDate vigenciaInicio,
            LocalDate vigenciaFim) throws Exception {
        Consulta consulta = consultaRepository.save(TestDataFactory.consulta(paciente, nutricionista));
        PlanoAlimentar plano = planoAlimentarRepository.save(new PlanoAlimentar(
                consulta,
                new BigDecimal("2200.00"),
                new BigDecimal("250.00"),
                new BigDecimal("65.00"),
                new BigDecimal("160.00")));
        definirStatusEVigencia(plano, statusPlano, vigenciaInicio, vigenciaFim);
        consumoDiarioRepository.save(new ConsumoDiario(
                paciente,
                LocalDate.now(FUSO_HORARIO),
                new BigDecimal("1234.50"),
                new BigDecimal("91.20"),
                new BigDecimal("180.30"),
                new BigDecimal("42.10"),
                1800));
        String token = loginComoPaciente();

        mockMvc.perform(get("/api/v1/usuarios/me/consumo-diario/progresso")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.caloriasConsumidas").value(1234.5))
                .andExpect(jsonPath("$.data.metaCalorias").value(nullValue()))
                .andExpect(jsonPath("$.data.metaProteinas").value(nullValue()));
    }

    @Test
    void consumoDiarioNaoReaproveitaRegistroDeOutroDia() throws Exception {
        consumoDiarioRepository.save(new ConsumoDiario(
                paciente,
                LocalDate.now(FUSO_HORARIO).minusDays(1),
                new BigDecimal("999.00"),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                0));
        String token = loginComoPaciente();

        mockMvc.perform(get("/api/v1/usuarios/me/consumo-diario/progresso")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void consumoDiarioRejeitaNutricionista() throws Exception {
        String token = login("nutri@teste.com");

        mockMvc.perform(get("/api/v1/usuarios/me/consumo-diario/progresso")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    private String loginComoPaciente() throws Exception {
        return login("paciente@teste.com");
    }

    private static Stream<Arguments> planosNaoAtivos() {
        LocalDate hoje = LocalDate.now(FUSO_HORARIO);
        return Stream.of(
                Arguments.of("RASCUNHO", hoje.minusDays(1), hoje.plusDays(1)),
                Arguments.of("SUBSTITUIDO", hoje.minusDays(1), hoje.plusDays(1)),
                Arguments.of("PUBLICADO", hoje.minusDays(2), hoje.minusDays(1)),
                Arguments.of("PUBLICADO", hoje.plusDays(1), null));
    }

    private void definirStatusEVigencia(
            PlanoAlimentar plano,
            String status,
            LocalDate vigenciaInicio,
            LocalDate vigenciaFim) {
        entityManager.flush();
        jdbcTemplate.update(
                "UPDATE Plano_Alimentar SET status = ?, vigencia_inicio = ?, vigencia_fim = ? WHERE id_plano = ?",
                status,
                vigenciaInicio,
                vigenciaFim,
                plano.getId());
        entityManager.refresh(plano);
    }

    private String login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"email":"%s","senha":"senha123"}
                                """, email)))
                .andExpect(status().isOk())
                .andReturn();

        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.token");
    }
}
