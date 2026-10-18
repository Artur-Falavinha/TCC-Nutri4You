package com.nutri4you.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.ConsumoDiario;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.RelacaoClinica;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.ConsumoDiarioRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
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
import java.time.LocalDateTime;

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
    void consumoDiarioProgressoRetornaDadosPersistidos() throws Exception {
        consumoDiarioRepository.save(new ConsumoDiario(
                paciente,
                LocalDate.now(),
                new BigDecimal("1850.00"),
                2000
        ));
        String token = loginComoPaciente();

        mockMvc.perform(get("/api/v1/usuarios/me/consumo-diario/progresso")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.caloriasConsumidas").value(1850.0))
                .andExpect(jsonPath("$.data.metaCalorias").value(2100.0));
    }

    @Test
    void dashboardPacienteRetornaConsumoEProximaConsultaFutura() throws Exception {
        consumoDiarioRepository.save(new ConsumoDiario(
                paciente,
                LocalDate.now(),
                new BigDecimal("2100.00"),
                2200
        ));
        LocalDateTime futura = LocalDateTime.now().plusDays(3).withHour(14).withMinute(30).withSecond(0).withNano(0);
        Consulta consulta = new Consulta(paciente, nutricionista, futura);
        consulta.atualizar(futura, "CONFIRMADA", "Retorno agendado");
        consultaRepository.save(consulta);

        String token = loginComoPaciente();

        mockMvc.perform(get("/api/v1/usuarios/me/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nomePaciente").value(paciente.getNome()))
                .andExpect(jsonPath("$.data.consumo.caloriasConsumidas").value(2100.0))
                .andExpect(jsonPath("$.data.consumo.metaCalorias").value(2100.0))
                .andExpect(jsonPath("$.data.proximaConsulta.nutricionistaNome").value(nutricionista.getNome()))
                .andExpect(jsonPath("$.data.proximaConsulta.status").value("CONFIRMADA"));
    }

    private String loginComoPaciente() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"paciente@teste.com","senha":"senha123"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.token");
    }
}
