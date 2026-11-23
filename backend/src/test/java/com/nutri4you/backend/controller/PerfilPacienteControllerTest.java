package com.nutri4you.backend.controller;

import com.nutri4you.backend.service.PrivacidadeService;
import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.RelacaoClinica;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PerfilPacienteControllerTest {
    @Autowired PrivacidadeService privacidade;

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private PacienteRepository pacienteRepository;
    @Autowired
    private NutricionistaRepository nutricionistaRepository;
    @Autowired
    private RelacaoClinicaRepository relacaoClinicaRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private Paciente paciente;
    private Nutricionista nutricionista;

    @BeforeEach
    void seed() {
        paciente = pacienteRepository.save(TestDataFactory.pacienteConfirmado(passwordEncoder));
        nutricionista = nutricionistaRepository.save(TestDataFactory.nutricionista(passwordEncoder));
        TestDataFactory.registrarAceite(privacidade, nutricionista, paciente);
        relacaoClinicaRepository.save(RelacaoClinica.criar(paciente, nutricionista));
    }

    @ParameterizedTest
    @ValueSource(strings = {"\"1992-02-29\"", "\"29/02/1992\"", "[1992, 2, 29]"})
    void pacienteAtualizaOsPropriosDados(String nascimentoJson) throws Exception {
        String token = login("paciente@teste.com");

        mockMvc.perform(put("/api/v1/usuarios/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Nome Novo","telefone":"41911112222","sexo":"Feminino","dataNascimento":%s}
                                """.formatted(nascimentoJson)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nome").value("Nome Novo"))
                .andExpect(jsonPath("$.data.email").value("paciente@teste.com"))
                .andExpect(jsonPath("$.data.sexo").value("Feminino"));

        mockMvc.perform(get("/api/v1/usuarios/me/perfil")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.telefone").value("41911112222"))
                .andExpect(jsonPath("$.data.dataNascimento").value("1992-02-29"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"29/02/1993", "31/04/1992", "1/02/1992"})
    void rejeitaDataDeNascimentoInvalida(String nascimento) throws Exception {
        mockMvc.perform(put("/api/v1/usuarios/me")
                        .header("Authorization", "Bearer " + login("paciente@teste.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Nome Novo","dataNascimento":"%s"}
                                """.formatted(nascimento)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("REQUISICAO_INVALIDA"))
                .andExpect(jsonPath("$.message").value("Confira os formatos de datas e valores informados."))
                .andExpect(jsonPath("$.path").value("/api/v1/usuarios/me"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"2024-02-29", "29/02/2024"})
    void pacienteConsultaConsumoEmUmaData(String data) throws Exception {
        mockMvc.perform(get("/api/v1/me/consumo")
                        .header("Authorization", "Bearer " + login("paciente@teste.com"))
                        .param("data", data))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.data").value("2024-02-29"));
    }

    @Test
    void nutricionistaNaoAlteraPerfilDePaciente() throws Exception {
        String token = login("nutri@teste.com");

        mockMvc.perform(put("/api/v1/usuarios/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Tentativa"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void pacienteListaNutricionistaVinculado() throws Exception {
        String token = login("paciente@teste.com");

        mockMvc.perform(get("/api/v1/usuarios/me/nutricionistas")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].nome").value("Nutricionista Teste"));
    }

    private String login(String email) throws Exception {
        MvcResult result = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","senha":"senha123"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.token");
    }
}
