package com.nutri4you.backend.controller;

import com.nutri4you.backend.model.TipoCadastro;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.service.EmailNotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CadastroEmailControllerTest {

    private static final String SENHA = "SenhaTeste123";

    @Autowired
    private MockMvc mvc;
    @Autowired
    private NutricionistaRepository nutricionistas;
    @Autowired
    private PacienteRepository pacientes;
    @MockitoSpyBean
    private EmailNotificationService notificacoes;

    @ParameterizedTest
    @EnumSource(TipoCadastro.class)
    void soCriaContaDepoisDaConfirmacaoEDaSenha(TipoCadastro perfil) throws Exception {
        String email = "cadastro+" + perfil.name().toLowerCase(Locale.ROOT) + "@example.test";
        UUID token = iniciar(email, perfil);
        verificarContaInexistente(email);

        confirmar(token, perfil)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.tipoUsuario").value(perfil.name()))
                .andExpect(jsonPath("$.data.expiraEm").isNotEmpty());
        verificarContaInexistente(email);

        concluir(perfil, email, token, true).andExpect(status().isCreated());
        enviar("/api/v1/auth/login", """
                {"email":"%s","senha":"%s"}
                """.formatted(email, SENHA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tipoUsuario").value(perfil.name()));

        confirmar(token, perfil).andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @EnumSource(TipoCadastro.class)
    void cadastroMobileRecusaEmailDeQualquerContaExistente(TipoCadastro perfilExistente) throws Exception {
        String email = "email-em-uso-" + perfilExistente.name().toLowerCase(Locale.ROOT) + "@example.test";
        UUID token = iniciar(email, perfilExistente);
        confirmar(token, perfilExistente).andExpect(status().isOk());
        concluir(perfilExistente, email, token, true).andExpect(status().isCreated());

        solicitarInicio(email.toUpperCase(Locale.ROOT), TipoCadastro.PACIENTE)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("EMAIL_EM_USO"))
                .andExpect(jsonPath("$.message").value("Já existe uma conta com esse e-mail."));
        solicitarInicio(email, TipoCadastro.NUTRICIONISTA)
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.data.token").doesNotExist());

        verify(notificacoes, times(1)).agendarInicioCadastro(eq(email), any(TipoCadastro.class), any(UUID.class));
    }

    @Test
    void cadastroDeNutricionistaExigeConfirmacaoPrevia() throws Exception {
        String email = "sem-confirmacao@example.test";
        UUID token = iniciar(email, TipoCadastro.NUTRICIONISTA);
        concluir(TipoCadastro.NUTRICIONISTA, email, token, true).andExpect(status().isBadRequest());
        verificarContaInexistente(email);
    }

    @Test
    void comprovanteNaoAutorizaOutroPerfilOuEmail() throws Exception {
        String email = "vinculo-comprovante@example.test";
        UUID token = iniciar(email, TipoCadastro.PACIENTE);
        confirmar(token, TipoCadastro.PACIENTE).andExpect(status().isOk());

        concluir(TipoCadastro.NUTRICIONISTA, email, token, true).andExpect(status().isBadRequest());
        concluir(TipoCadastro.PACIENTE, "outro@example.test", token, true).andExpect(status().isBadRequest());
        verificarContaInexistente(email);
        verificarContaInexistente("outro@example.test");
    }

    @Test
    void exigeDeclaracaoDoCrnAntesDeCriarNutricionista() throws Exception {
        String email = "sem-declaracao@example.test";
        UUID token = iniciar(email, TipoCadastro.NUTRICIONISTA);
        confirmar(token, TipoCadastro.NUTRICIONISTA).andExpect(status().isOk());
        concluir(TipoCadastro.NUTRICIONISTA, email, token, false).andExpect(status().isBadRequest());
        verificarContaInexistente(email);
    }

    private UUID iniciar(String email, TipoCadastro perfil) throws Exception {
        solicitarInicio(email, perfil)
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.data.token").doesNotExist());

        var captura = ArgumentCaptor.forClass(UUID.class);
        verify(notificacoes).agendarInicioCadastro(eq(email), eq(perfil), captura.capture());
        return captura.getValue();
    }

    private ResultActions solicitarInicio(String email, TipoCadastro perfil) throws Exception {
        return enviar("/api/v1/cadastros/iniciar", """
                {"email":"%s","tipoUsuario":"%s"}
                """.formatted(email, perfil));
    }

    private ResultActions confirmar(UUID token, TipoCadastro perfil) throws Exception {
        return enviar("/api/v1/cadastros/confirmar", """
                {"token":"%s","tipoUsuario":"%s"}
                """.formatted(token, perfil));
    }

    private ResultActions concluir(TipoCadastro perfil, String email, UUID token, boolean declarouCrn) throws Exception {
        if (perfil == TipoCadastro.PACIENTE) {
            return enviar("/api/v1/pacientes/autocadastro", """
                    {"nome":"Paciente Teste","email":"%s","tokenCadastro":"%s",
                     "versaoTermos":"2026-11-19","senha":"%s"}
                    """.formatted(email, token, SENHA));
        }
        return enviar("/api/v1/nutricionistas/autocadastro", """
                {"nome":"Nutricionista Teste","email":"%s","tokenCadastro":"%s",
                 "crn":"CRN8-70290","crnDeclarado":%s,"versaoTermos":"2026-11-19","senha":"%s"}
                """.formatted(email, token, declarouCrn, SENHA));
    }

    private ResultActions enviar(String caminho, String corpo) throws Exception {
        return mvc.perform(post(caminho).contentType(MediaType.APPLICATION_JSON).content(corpo));
    }

    private void verificarContaInexistente(String email) {
        assertThat(nutricionistas.existsByEmail(email)).isFalse();
        assertThat(pacientes.existsByEmail(email)).isFalse();
    }
}
