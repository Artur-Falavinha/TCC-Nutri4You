package com.nutri4you.backend.controller;

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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

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
