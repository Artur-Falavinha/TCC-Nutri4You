package com.nutri4you.backend.controller;

import com.nutri4you.backend.model.TipoTokenEmail;
import com.nutri4you.backend.repository.TokenEmailRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@TestPropertySource(properties = "app.email.auto-confirm=false")
@Transactional
class DevEmailPreviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TokenEmailRepository tokenEmailRepository;

    @Test
    void previewRetornaLinksDoToken() throws Exception {
        mockMvc.perform(post("/api/v1/pacientes/autocadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Preview Dev",
                                  "email": "preview@teste.com",
                                  "senha": "senhaSegura123"
                                }
                                """))
                .andExpect(status().isCreated());

        var token = tokenEmailRepository.findAll().stream()
                .filter(t -> t.getTipo() == TipoTokenEmail.CONFIRMACAO_EMAIL)
                .findFirst()
                .orElseThrow();

        mockMvc.perform(get("/api/v1/dev/email-preview/{token}", token.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.emailDestinatario").value("preview@teste.com"))
                .andExpect(jsonPath("$.data.linkConfirmacao").exists());
    }
}
