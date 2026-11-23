package com.nutri4you.backend.controller;

import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.security.TokenService;
import com.nutri4you.backend.service.PrivacidadeService;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private NutricionistaRepository nutricionistaRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PrivacidadeService privacidade;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private TokenService tokens;

    @BeforeEach
    void seed() {
        var nutricionista = nutricionistaRepository.save(TestDataFactory.nutricionista(passwordEncoder));
        var paciente = pacienteRepository.save(TestDataFactory.pacienteConfirmado(passwordEncoder));
        privacidade.aceitar(nutricionista, PrivacidadeService.VERSAO);
        privacidade.aceitar(paciente, PrivacidadeService.VERSAO);
    }

    @Test
    void loginNutricionistaRetornaToken() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nutri@teste.com","senha":"senha123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.tipoUsuario").value("NUTRICIONISTA"));
    }

    @Test
    void loginPacienteConfirmadoRetornaToken() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"paciente@teste.com","senha":"senha123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.tipoUsuario").value("PACIENTE"));
    }

    @Test
    void loginAceitaEmailSemDistincaoDeMaiusculas() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"Paciente@Teste.com","senha":"senha123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tipoUsuario").value("PACIENTE"));
    }

    @Test
    void loginComCredenciaisInvalidasRetorna401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nutri@teste.com","senha":"errada"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("NAO_AUTORIZADO"));
    }

    @Test
    void acessoSemAceiteEBloqueadoMesmoComJwtAnterior() throws Exception {
        var paciente = pacienteRepository.save(TestDataFactory.outroPaciente(passwordEncoder));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","senha":"senha123"}
                                """.formatted(paciente.getEmail())))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Sua conta não tem um aceite dos termos de uso registrado."));

        mockMvc.perform(get("/api/v1/privacidade/me/termos")
                        .header("Authorization", "Bearer " + tokens.gerarToken(paciente.getEmail())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void aceiteDeVersaoAnteriorMantemAcessoEADataOriginal() throws Exception {
        var paciente = pacienteRepository.save(TestDataFactory.outroPaciente(passwordEncoder));
        jdbc.update("""
                insert into aceite_termo(tipo, titular_id, versao, aceito_em)
                values ('PACIENTE', ?, '2026-11-19', '2026-11-19T18:00:00Z')
                """, paciente.getId());

        mockMvc.perform(get("/api/v1/privacidade/me/termos")
                        .header("Authorization", "Bearer " + tokens.gerarToken(paciente.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.versao").value("2026-11-19"))
                .andExpect(jsonPath("$.data.aceitoEm").value("2026-11-19T18:00:00Z"));
    }
}
