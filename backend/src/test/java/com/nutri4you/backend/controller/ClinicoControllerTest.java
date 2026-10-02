package com.nutri4you.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ClinicoControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private NutricionistaRepository nutricionistaRepository;
    @Autowired
    private PacienteRepository pacienteRepository;
    @Autowired
    private ConsultaRepository consultaRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private Paciente paciente;
    private Paciente oculto;
    private Consulta consulta;

    @BeforeEach
    void seed() {
        Nutricionista nutricionista = nutricionistaRepository.save(TestDataFactory.nutricionista(passwordEncoder));
        paciente = pacienteRepository.save(TestDataFactory.pacienteConfirmado(passwordEncoder));
        oculto = pacienteRepository.save(TestDataFactory.outroPaciente(passwordEncoder));
        consulta = consultaRepository.save(TestDataFactory.consulta(paciente, nutricionista));
    }

    @Test
    void registraAvaliacaoCalculaImcEListaNoHistorico() throws Exception {
        String token = login();

        mockMvc.perform(post("/api/v1/gestao-pacientes/{id}/avaliacoes", paciente.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"peso":80,"altura":1.80,"circunferenciaCintura":80,"circunferenciaQuadril":100}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.imc").value(24.69))
                .andExpect(jsonPath("$.data.razaoCinturaQuadril").value(0.80));

        mockMvc.perform(get("/api/v1/gestao-pacientes/{id}/historico", paciente.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.consultas", hasSize(1)))
                .andExpect(jsonPath("$.data.avaliacoes", hasSize(1)));
    }

    @Test
    void avaliacaoSemRelacaoRetorna403() throws Exception {
        String token = login();

        mockMvc.perform(post("/api/v1/gestao-pacientes/{id}/avaliacoes", oculto.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"peso":70,"altura":1.70}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void avaliacaoRejeitaMedidasOpcionaisInvalidas() throws Exception {
        String token = login();

        mockMvc.perform(post("/api/v1/gestao-pacientes/{id}/avaliacoes", paciente.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"peso":80,"altura":1.80,"circunferenciaQuadril":0}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Circunferência do quadril deve ficar entre 0,1 e 300 cm."));

        mockMvc.perform(post("/api/v1/gestao-pacientes/{id}/avaliacoes", paciente.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"peso":80,"altura":1.80,"pregaTricipital":-1}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Prega tricipital deve ficar entre 0,1 e 100 mm."));
    }

    @Test
    void agendaIncluiConsultaDeHojeSemanaSexoIdadeEDozeMeses() throws Exception {
        paciente.setDataNascimento(LocalDate.now().minusYears(25));
        pacienteRepository.save(paciente);
        String token = login();

        mockMvc.perform(get("/api/v1/dashboard/consultas")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hoje", hasSize(1)))
                .andExpect(jsonPath("$.data.hoje[0].pacienteNome").value("Paciente Teste"))
                .andExpect(jsonPath("$.data.semana", hasSize(7)))
                .andExpect(jsonPath("$.data.semana[0].rotulo").value("Seg"))
                .andExpect(jsonPath("$.data.semana[6].rotulo").value("Dom"))
                .andExpect(jsonPath("$.data.totalSemana").value(1))
                .andExpect(jsonPath("$.data.sexo[?(@.rotulo == 'Masculino')].quantidade", hasItem(1)))
                .andExpect(jsonPath("$.data.faixaEtaria[?(@.rotulo == '20–29')].quantidade", hasItem(1)))
                .andExpect(jsonPath("$.data.ultimos12Meses", hasSize(12)))
                .andExpect(jsonPath("$.data.totalConsultas12Meses").value(1));
    }

    @Test
    void consultasCanceladasNaoAparecemNoHistoricoNemNaAgenda() throws Exception {
        consulta.cancelar();
        consultaRepository.save(consulta);
        String token = login();

        mockMvc.perform(get("/api/v1/gestao-pacientes/{id}/historico", paciente.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.consultas", hasSize(0)));

        mockMvc.perform(get("/api/v1/dashboard/consultas")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hoje", hasSize(0)))
                .andExpect(jsonPath("$.data.totalSemana").value(0))
                .andExpect(jsonPath("$.data.totalConsultas12Meses").value(0));
    }

    private String login() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nutri@teste.com","senha":"senha123"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.token");
    }
}
