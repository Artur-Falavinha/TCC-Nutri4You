package com.nutri4you.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.ConsumoDiario;
import com.nutri4you.backend.model.PlanoAlimentar;
import com.nutri4you.backend.model.RelacaoClinica;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.ConsumoDiarioRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.PlanoAlimentarRepository;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UsuarioControllerTest {

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
        planoAlimentarRepository.save(new PlanoAlimentar(
                consulta,
                new BigDecimal("2200.00"),
                new BigDecimal("250.00"),
                new BigDecimal("65.00"),
                new BigDecimal("160.00")));
        consumoDiarioRepository.save(new ConsumoDiario(
                paciente,
                LocalDate.now(),
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
    void consumoDiarioNaoReaproveitaRegistroDeOutroDia() throws Exception {
        consumoDiarioRepository.save(new ConsumoDiario(
                paciente,
                LocalDate.now().minusDays(1),
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
