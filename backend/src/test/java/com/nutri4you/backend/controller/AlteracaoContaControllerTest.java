package com.nutri4you.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.ContaAutenticavel;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.TipoCadastro;
import com.nutri4you.backend.model.TipoTokenEmail;
import com.nutri4you.backend.model.TokenEmail;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.TokenEmailRepository;
import com.nutri4you.backend.security.TokenService;
import com.nutri4you.backend.service.EmailNotificationService;
import com.nutri4you.backend.service.PrivacidadeService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AlteracaoContaControllerTest {
    private static final String SENHA = "SenhaAtual123";
    private static final String NOVO_EMAIL = "novo@example.test";
    private static final String EMAIL = "/api/v1/usuarios/me/email";
    private static final String PERFIL = "/api/v1/nutricionistas/me/perfil";

    @Autowired MockMvc mvc;
    @Autowired PacienteRepository pacientes;
    @Autowired NutricionistaRepository nutricionistas;
    @Autowired TokenEmailRepository recuperacoes;
    @Autowired PrivacidadeService privacidade;
    @Autowired PasswordEncoder senhas;
    @Autowired TokenService tokens;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entidades;
    @MockitoBean EmailNotificationService emails;

    private Paciente paciente;
    private Nutricionista nutricionista;

    @BeforeEach
    void configurar() {
        paciente = new Paciente("Paciente Teste", "paciente@example.test", senhas.encode(SENHA));
        paciente.setEmailConfirmado(true);
        pacientes.save(paciente);
        nutricionista = new Nutricionista("Nutricionista Teste", "nutri@example.test", senhas.encode(SENHA), "CRN8-12345");
        nutricionista.confirmarEmail();
        nutricionistas.save(nutricionista);
        privacidade.aceitar(paciente, PrivacidadeService.VERSAO);
        privacidade.aceitar(nutricionista, PrivacidadeService.VERSAO);
    }

    @ParameterizedTest
    @EnumSource(TipoCadastro.class)
    void confirmaNovoEmailERenovaApenasASessaoAtual(TipoCadastro tipo) throws Exception {
        ContaAutenticavel conta = tipo == TipoCadastro.PACIENTE ? paciente : nutricionista;
        String anterior = conta.getEmail();
        String sessao = bearer(conta);
        TokenEmail recuperacao = recuperacoes.save(tipo == TipoCadastro.PACIENTE
                ? TokenEmail.criarParaPaciente(paciente, TipoTokenEmail.RECUPERACAO_SENHA, LocalDateTime.now().plusHours(1))
                : TokenEmail.criarParaNutricionista(nutricionista, TipoTokenEmail.RECUPERACAO_SENHA, LocalDateTime.now().plusHours(1)));

        iniciar(sessao, NOVO_EMAIL, SENHA).andExpect(status().isAccepted())
                .andExpect(jsonPath("$.data.email").value(NOVO_EMAIL))
                .andExpect(jsonPath("$.data.codigo").doesNotExist());
        buscarConta(sessao).andExpect(jsonPath("$.data.email").value(anterior));

        UUID codigo = codigoEnviado();
        confirmar(bearer(tipo == TipoCadastro.PACIENTE ? nutricionista : paciente), codigo)
                .andExpect(status().isBadRequest());
        String resposta = confirmar(sessao, codigo)
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.email").value(NOVO_EMAIL))
                .andReturn().getResponse().getContentAsString();

        String novaSessao = "Bearer " + JsonPath.<String>read(resposta, "$.data.token");
        buscarConta(novaSessao).andExpect(jsonPath("$.data.id").value(conta.getId()))
                .andExpect(jsonPath("$.data.email").value(NOVO_EMAIL));
        buscarConta(sessao).andExpect(status().isUnauthorized());
        confirmar(novaSessao, codigo).andExpect(status().isBadRequest());
        verify(emails).agendarAvisoAlteracaoEmail(anterior);
        login(anterior).andExpect(status().isUnauthorized());
        login(NOVO_EMAIL).andExpect(status().isOk());
        mvc.perform(post("/api/v1/auth/redefinir-senha").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"token":"%s","senha":"SenhaOutra123"}
                        """.formatted(recuperacao.getToken())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void recusaSenhaIncorretaEnderecoEmUsoEConfirmacaoExpirada() throws Exception {
        String sessao = bearer(paciente);
        iniciar(sessao, NOVO_EMAIL, "errada").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("A senha atual está incorreta."));
        iniciar(sessao, "NUTRI@example.test", SENHA).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Este e-mail já está em uso."));
        iniciar(sessao, NOVO_EMAIL, SENHA).andExpect(status().isAccepted());
        iniciar(sessao, "outro@example.test", SENHA).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Aguarde um minuto antes de solicitar outro código."));
        jdbc.update("update alteracao_email_pendente set expira_em = current_timestamp - interval '1' minute");
        entidades.clear();
        confirmar(sessao, codigoEnviado()).andExpect(status().isBadRequest());
        buscarConta(sessao).andExpect(jsonPath("$.data.email").value("paciente@example.test"));
    }

    @Test
    void recusaEnderecoOcupadoDepoisDoEnvioDoCodigo() throws Exception {
        String sessao = bearer(paciente);
        iniciar(sessao, NOVO_EMAIL, SENHA).andExpect(status().isAccepted());
        nutricionista.alterarEmail(NOVO_EMAIL);
        nutricionistas.flush();
        confirmar(sessao, codigoEnviado()).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Este e-mail já está em uso."));
        buscarConta(sessao).andExpect(jsonPath("$.data.email").value("paciente@example.test"));
    }

    @Test
    void renovaAceiteApenasQuandoNutricionistaAlteraCrn() throws Exception {
        String sessao = bearer(nutricionista);
        jdbc.update("update aceite_termo set aceito_em = current_timestamp - interval '1' day where tipo = 'NUTRICIONISTA'");
        var aceiteAnterior = privacidade.consultarAceite(nutricionista);

        atualizarPerfil(bearer(paciente), "{\"nome\":\"Outro nome\"}").andExpect(status().isForbidden());
        atualizarPerfil(sessao, "{\"nome\":\"Nome atualizado\"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.crn").value("CRN8-12345"));
        assertThat(privacidade.consultarAceite(nutricionista)).isEqualTo(aceiteAnterior);

        atualizarPerfil(sessao, "{\"nome\":\"Outro nome\",\"crn\":\"CRN8-54321\"}").andExpect(status().isBadRequest());
        atualizarPerfil(sessao, """
                {"nome":"Outro nome","crn":"CRN8-54321","versaoTermos":"%s"}
                """.formatted(PrivacidadeService.VERSAO)).andExpect(status().isBadRequest());
        atualizarPerfil(sessao, """
                {"nome":"Nome final","crn":"crn8-54321","versaoTermos":"%s","crnDeclarado":true}
                """.formatted(PrivacidadeService.VERSAO))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.crn").value("CRN8-54321"));
        buscarConta(sessao).andExpect(jsonPath("$.data.nome").value("Nome final"));
        assertThat(privacidade.consultarAceite(nutricionista).aceitoEm()).isAfter(aceiteAnterior.aceitoEm());
    }

    private UUID codigoEnviado() {
        ArgumentCaptor<UUID> captura = ArgumentCaptor.forClass(UUID.class);
        verify(emails).agendarConfirmacaoAlteracaoEmail(eq(NOVO_EMAIL), captura.capture(), eq(30L));
        return captura.getValue();
    }

    private String bearer(ContaAutenticavel conta) {
        return "Bearer " + tokens.gerarToken(conta);
    }

    private ResultActions buscarConta(String sessao) throws Exception {
        return mvc.perform(get("/api/v1/usuarios/me").header("Authorization", sessao));
    }

    private ResultActions iniciar(String sessao, String email, String senha) throws Exception {
        return mvc.perform(post(EMAIL + "/iniciar").header("Authorization", sessao)
                .contentType(MediaType.APPLICATION_JSON).content("""
                        {"novoEmail":"%s","senhaAtual":"%s"}
                        """.formatted(email, senha)));
    }

    private ResultActions confirmar(String sessao, UUID codigo) throws Exception {
        return mvc.perform(post(EMAIL + "/confirmar").header("Authorization", sessao)
                .contentType(MediaType.APPLICATION_JSON).content("""
                        {"codigo":"%s"}
                        """.formatted(codigo)));
    }

    private ResultActions login(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                {"email":"%s","senha":"%s"}
                """.formatted(email, SENHA)));
    }

    private ResultActions atualizarPerfil(String sessao, String dados) throws Exception {
        return mvc.perform(put(PERFIL).header("Authorization", sessao)
                .contentType(MediaType.APPLICATION_JSON).content(dados));
    }
}
