package com.nutri4you.backend.controller;

import com.nutri4you.backend.repository.PacienteRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PacienteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Test
    void autocadastroCriaPacienteComEmailNaoConfirmado() throws Exception {
        mockMvc.perform(post("/api/v1/pacientes/autocadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Maria Nova",
                                  "email": "maria.nova@teste.com",
                                  "senha": "senhaSegura8"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.mensagem").value("Paciente cadastrado com sucesso!"));

        var paciente = pacienteRepository.findByEmail("maria.nova@teste.com").orElseThrow();
        assertThat(paciente.isEmailConfirmado()).isFalse();
    }

    @Test
    void autocadastroSemNomeRetorna400() throws Exception {
        mockMvc.perform(post("/api/v1/pacientes/autocadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"sem.nome@teste.com","senha":"senha123"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("REQUISICAO_INVALIDA"));
    }
}
