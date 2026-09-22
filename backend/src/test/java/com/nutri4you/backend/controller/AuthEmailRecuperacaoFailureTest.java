package com.nutri4you.backend.controller;

import com.nutri4you.backend.email.EmailSender;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthEmailRecuperacaoFailureTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private NutricionistaRepository nutricionistaRepository;

    @MockitoBean
    private EmailSender emailSender;

    @BeforeEach
    void seed() {
        nutricionistaRepository.save(TestDataFactory.nutricionista(passwordEncoder));
    }

    @Test
    void recuperarSenhaComFalhaDeEmailRetornaMensagemGenerica() throws Exception {
        doThrow(new RuntimeException("SMTP indisponível"))
                .when(emailSender)
                .enviar(anyString(), anyString(), anyString());

        mockMvc.perform(post("/api/v1/auth/recuperar-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nutri@teste.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mensagem")
                        .value("Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha."));
    }
}
