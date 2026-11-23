package com.nutri4you.backend.controller;

import com.nutri4you.backend.service.PrivacidadeService;
import com.nutri4you.backend.support.TestDataFactory;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.TipoTokenEmail;
import com.nutri4you.backend.model.TokenEmail;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.TokenEmailRepository;
import com.nutri4you.backend.security.TokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class NutricionistaControllerTest {
    @Autowired PrivacidadeService privacidade;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TokenEmailRepository tokenEmailRepository;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private NutricionistaRepository nutricionistas;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void cadastroLegadoBloqueiaAcessoAteConfirmarEmail() throws Exception {
        var cadastroLegado = nutricionistas.save(new Nutricionista("Nova Nutricionista",
                "nova.nutri@teste.com", passwordEncoder.encode("senhaSegura123"), "CRN8-55555"));
        TestDataFactory.registrarAceite(privacidade, cadastroLegado);
        tokenEmailRepository.save(TokenEmail.criarParaNutricionista(
                cadastroLegado, TipoTokenEmail.CONFIRMACAO_EMAIL, LocalDateTime.now().plusHours(1)));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nova.nutri@teste.com","senha":"senhaSegura123"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.data.token").doesNotExist());

        String jwt = tokenService.gerarToken("nova.nutri@teste.com");
        mockMvc.perform(get("/api/v1/usuarios/me").header("Authorization", "Bearer " + jwt))
                .andExpect(status().isUnauthorized());

        var token = tokenEmailRepository.findAll().stream()
                .filter(item -> item.getTipo() == TipoTokenEmail.CONFIRMACAO_EMAIL)
                .filter(item -> item.getNutricionista() != null)
                .filter(item -> item.getNutricionista().getEmail().equals("nova.nutri@teste.com"))
                .findFirst()
                .orElseThrow();

        mockMvc.perform(get("/api/v1/auth/confirmar-email")
                        .param("token", token.getToken().toString())
                        .accept("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location",
                        "http://localhost:4200/confirmar-email#token=" + token.getToken()));

        mockMvc.perform(post("/api/v1/auth/confirmar-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s"}
                                """.formatted(token.getToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tipoUsuario").value("NUTRICIONISTA"));

        mockMvc.perform(get("/api/v1/auth/confirmar-email").param("token", token.getToken().toString()))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nova.nutri@teste.com","senha":"senhaSegura123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tipoUsuario").value("NUTRICIONISTA"));
    }

    @Test
    void inicioCadastroRejeitaMaisDeUmDestinatario() throws Exception {
        mockMvc.perform(post("/api/v1/cadastros/iniciar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"primeiro@example.test,segundo@example.test", "tipoUsuario":"NUTRICIONISTA"}
                                """))
                .andExpect(status().isBadRequest());
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
