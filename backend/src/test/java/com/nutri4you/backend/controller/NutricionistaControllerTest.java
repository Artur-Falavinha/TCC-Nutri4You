package com.nutri4you.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class NutricionistaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void autocadastroPublicoCriaContaELiberaLogin() throws Exception {
        mockMvc.perform(post("/api/v1/nutricionistas/autocadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Nova Nutricionista",
                                  "email": "nova.nutri@teste.com",
                                  "senha": "senhaSegura123",
                                  "crn": "CRN8-55555"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.mensagem").value("Nutricionista cadastrado com sucesso!"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nova.nutri@teste.com","senha":"senhaSegura123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tipoUsuario").value("NUTRICIONISTA"));
    }

    @Test
    void cadastroProtegidoSemJwtRetorna401() throws Exception {
        mockMvc.perform(post("/api/v1/nutricionistas/cadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Bloqueada",
                                  "email": "bloqueada@teste.com",
                                  "senha": "senhaSegura123",
                                  "crn": "CRN8-66666"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }
}
