package com.nutri4you.backend.controller;

import com.nutri4you.backend.model.TipoTokenEmail;
import com.nutri4you.backend.model.TokenEmail;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.TokenEmailRepository;
import com.nutri4you.backend.security.TokenService;
import com.nutri4you.backend.service.TokenEmailService;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthEmailControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private NutricionistaRepository nutricionistaRepository;

    @Autowired
    private TokenEmailRepository tokenEmailRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenService tokenService;

    @BeforeEach
    void seed() {
        nutricionistaRepository.save(TestDataFactory.nutricionista(passwordEncoder));
        pacienteRepository.save(TestDataFactory.pacienteConfirmado(passwordEncoder));
    }

    @Test
    void loginPacienteNaoConfirmadoRetornaMensagemEspecifica() throws Exception {
        mockMvc.perform(post("/api/v1/pacientes/autocadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Novo Paciente",
                                  "email": "nao.confirmado@teste.com",
                                  "senha": "senhaSegura123"
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nao.confirmado@teste.com","senha":"senhaSegura123"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Confirme seu e-mail antes de acessar o sistema."));
    }

    @Test
    void confirmarEmailAtivaConta() throws Exception {
        mockMvc.perform(post("/api/v1/pacientes/autocadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Confirmar Email",
                                  "email": "confirmar@teste.com",
                                  "senha": "senhaSegura123"
                                }
                                """))
                .andExpect(status().isCreated());

        var token = tokenEmailRepository.findAll().stream()
                .filter(t -> t.getTipo() == TipoTokenEmail.CONFIRMACAO_EMAIL)
                .filter(t -> t.getPaciente().getEmail().equals("confirmar@teste.com"))
                .findFirst()
                .orElseThrow();

        mockMvc.perform(get("/api/v1/auth/confirmar-email")
                        .param("token", token.getToken().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mensagem").value("E-mail confirmado com sucesso."));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"confirmar@teste.com","senha":"senhaSegura123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tipoUsuario").value("PACIENTE"));
    }

    @Test
    void jwtContaNaoConfirmadaNaoAutenticaRequisicao() throws Exception {
        mockMvc.perform(post("/api/v1/pacientes/autocadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "JWT Bloqueado",
                                  "email": "jwt.bloqueado@teste.com",
                                  "senha": "senhaSegura123"
                                }
                                """))
                .andExpect(status().isCreated());

        String token = tokenService.gerarToken("jwt.bloqueado@teste.com");

        mockMvc.perform(get("/api/v1/usuarios/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void redefinirSenhaConfirmaEmailDePacienteNaoConfirmado() throws Exception {
        mockMvc.perform(post("/api/v1/pacientes/autocadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Recuperar Confirmacao",
                                  "email": "recuperar.confirmacao@teste.com",
                                  "senha": "senhaSegura123"
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/recuperar-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"recuperar.confirmacao@teste.com"}
                                """))
                .andExpect(status().isOk());

        var token = tokenEmailRepository.findAll().stream()
                .filter(t -> t.getTipo() == TipoTokenEmail.RECUPERACAO_SENHA)
                .filter(t -> t.getPaciente().getEmail().equals("recuperar.confirmacao@teste.com"))
                .findFirst()
                .orElseThrow();

        mockMvc.perform(post("/api/v1/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s","senha":"novaSenha123"}
                                """.formatted(token.getToken())))
                .andExpect(status().isOk());

        assertThat(pacienteRepository.findByEmail("recuperar.confirmacao@teste.com").orElseThrow()
                .isEmailConfirmado()).isTrue();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"recuperar.confirmacao@teste.com","senha":"novaSenha123"}
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void recuperarSenhaRetornaMensagemGenerica() throws Exception {
        mockMvc.perform(post("/api/v1/auth/recuperar-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"inexistente@teste.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mensagem")
                        .value("Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha."));
    }

    @Test
    void redefinirSenhaComTokenValido() throws Exception {
        mockMvc.perform(post("/api/v1/auth/recuperar-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"paciente@teste.com"}
                                """))
                .andExpect(status().isOk());

        var token = tokenEmailRepository.findAll().stream()
                .filter(t -> t.getTipo() == TipoTokenEmail.RECUPERACAO_SENHA)
                .findFirst()
                .orElseThrow();

        mockMvc.perform(post("/api/v1/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s","senha":"novaSenha123"}
                                """.formatted(token.getToken())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"paciente@teste.com","senha":"novaSenha123"}
                                """))
                .andExpect(status().isOk());

        assertThat(tokenEmailRepository.findByToken(token.getToken()).orElseThrow().isUsado()).isTrue();
    }

    @Test
    void redefinirSenhaNutricionistaComTokenValido() throws Exception {
        mockMvc.perform(post("/api/v1/auth/recuperar-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nutri@teste.com"}
                                """))
                .andExpect(status().isOk());

        var token = tokenEmailRepository.findAll().stream()
                .filter(t -> t.getTipo() == TipoTokenEmail.RECUPERACAO_SENHA)
                .filter(t -> t.getNutricionista() != null)
                .filter(t -> t.getNutricionista().getEmail().equals("nutri@teste.com"))
                .findFirst()
                .orElseThrow();

        mockMvc.perform(post("/api/v1/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s","senha":"novaSenha123"}
                                """.formatted(token.getToken())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nutri@teste.com","senha":"novaSenha123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tipoUsuario").value("NUTRICIONISTA"));

        assertThat(tokenEmailRepository.findByToken(token.getToken()).orElseThrow().isUsado()).isTrue();
    }

    @Test
    void recuperarSenhaEmailCadastradoRetornaMensagemGenerica() throws Exception {
        mockMvc.perform(post("/api/v1/auth/recuperar-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nutri@teste.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mensagem")
                        .value("Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha."));
    }

    @Test
    void redefinirSenhaTokenInexistenteRetorna400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s","senha":"novaSenha123"}
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(TokenEmailService.MENSAGEM_TOKEN_INVALIDO));
    }

    @Test
    void redefinirSenhaTokenJaUsadoRetorna400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/recuperar-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"paciente@teste.com"}
                                """))
                .andExpect(status().isOk());

        var token = tokenEmailRepository.findAll().stream()
                .filter(t -> t.getTipo() == TipoTokenEmail.RECUPERACAO_SENHA)
                .findFirst()
                .orElseThrow();

        mockMvc.perform(post("/api/v1/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s","senha":"novaSenha123"}
                                """.formatted(token.getToken())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s","senha":"outraSenha123"}
                                """.formatted(token.getToken())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(TokenEmailService.MENSAGEM_TOKEN_INVALIDO));
    }

    @Test
    void redefinirSenhaSenhaCurtaRetorna400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s","senha":"curta"}
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("A senha deve ter no mínimo 8 caracteres."));
    }

    @Test
    void redefinirSenhaTokenExpiradoRetorna400() throws Exception {
        var paciente = pacienteRepository.findByEmail("paciente@teste.com").orElseThrow();
        TokenEmail expirado = TokenEmail.criarParaPaciente(
                paciente, TipoTokenEmail.RECUPERACAO_SENHA, LocalDateTime.now().minusHours(1));
        tokenEmailRepository.save(expirado);

        mockMvc.perform(post("/api/v1/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s","senha":"novaSenha123"}
                                """.formatted(expirado.getToken())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(TokenEmailService.MENSAGEM_TOKEN_INVALIDO));
    }

    @Test
    void confirmarEmailTokenInvalidoRetorna400() throws Exception {
        mockMvc.perform(get("/api/v1/auth/confirmar-email")
                        .param("token", UUID.randomUUID().toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(TokenEmailService.MENSAGEM_TOKEN_INVALIDO));
    }

    @Test
    void confirmarEmailTokenRecuperacaoNutricionistaRetorna400() throws Exception {
        var nutricionista = nutricionistaRepository.findByEmail("nutri@teste.com").orElseThrow();
        TokenEmail tokenRecuperacao = TokenEmail.criarParaNutricionista(
                nutricionista, TipoTokenEmail.RECUPERACAO_SENHA, LocalDateTime.now().plusHours(1));
        tokenEmailRepository.save(tokenRecuperacao);

        mockMvc.perform(get("/api/v1/auth/confirmar-email")
                        .param("token", tokenRecuperacao.getToken().toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(TokenEmailService.MENSAGEM_TOKEN_INVALIDO));
    }
}
