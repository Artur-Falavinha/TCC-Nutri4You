package com.nutri4you.backend.controller;

import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.TipoTokenEmail;
import com.nutri4you.backend.model.TokenEmail;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.TokenEmailRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class DevEmailPreviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TokenEmailRepository tokenEmailRepository;

    @Autowired
    private PacienteRepository pacientes;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void previewRetornaLinksDoToken() throws Exception {
        var paciente = pacientes.save(new Paciente("Preview Dev", null, null, null, null,
                "preview@teste.com", passwordEncoder.encode("senhaSegura123")));
        var token = tokenEmailRepository.save(TokenEmail.criarParaPaciente(
                paciente, TipoTokenEmail.CONFIRMACAO_EMAIL, LocalDateTime.now().plusHours(1)));

        mockMvc.perform(get("/api/v1/dev/email-preview/{token}", token.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.emailDestinatario").value("preview@teste.com"))
                .andExpect(jsonPath("$.data.linkConfirmacao").value(
                        "http://localhost:4200/confirmar-email#token=" + token.getToken()));
    }
}
