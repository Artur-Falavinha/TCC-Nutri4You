package com.nutri4you.backend.controller;

import com.nutri4you.backend.model.TipoCadastro;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.service.CadastroEmailService;
import com.nutri4you.backend.service.EmailNotificationService;
import com.nutri4you.backend.service.PrivacidadeService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
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

    @Autowired
    private CadastroEmailService cadastroEmail;

    @MockitoSpyBean
    private EmailNotificationService notificacoes;

    @Test
    void autocadastroRecusaMesmoCpfComPontuacaoDiferente() throws Exception {
        String emailOriginal = "cpf.original@example.test";
        String emailDuplicado = "cpf.duplicado@example.test";

        cadastrarComCpf(emailOriginal, "012.345.678-90").andExpect(status().isCreated());
        cadastrarComCpf(emailDuplicado, "01234567890")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("CPF_EM_USO"));

        assertThat(pacienteRepository.findByEmail(emailOriginal)).hasValueSatisfying(
                paciente -> assertThat(paciente.getCpf()).isEqualTo("01234567890"));
        assertThat(pacienteRepository.existsByEmail(emailDuplicado)).isFalse();
    }

    @Test
    void autocadastroDePacienteExigeConfirmacaoPrevia() throws Exception {
        mockMvc.perform(post("/api/v1/pacientes/autocadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Maria Nova",
                                  "email": "maria.nova@teste.com",
                                  "senha": "senhaSegura8", "versaoTermos": "%s"
                                }
                                """.formatted(PrivacidadeService.VERSAO)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Código de cadastro inválido, expirado ou já utilizado."));

        assertThat(pacienteRepository.existsByEmail("maria.nova@teste.com")).isFalse();
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

    private ResultActions cadastrarComCpf(String email, String cpf) throws Exception {
        cadastroEmail.iniciar(email, TipoCadastro.PACIENTE);
        var captura = ArgumentCaptor.forClass(UUID.class);
        verify(notificacoes).agendarInicioCadastro(eq(email), eq(TipoCadastro.PACIENTE), captura.capture());
        UUID token = captura.getValue();
        cadastroEmail.confirmar(token, TipoCadastro.PACIENTE);

        return mockMvc.perform(post("/api/v1/pacientes/autocadastro")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"nome":"Paciente Teste","email":"%s","senha":"SenhaTeste123",
                         "cpf":"%s","versaoTermos":"%s","tokenCadastro":"%s"}
                        """.formatted(email, cpf, PrivacidadeService.VERSAO, token)));
    }
}
