package com.nutri4you.backend.controller;

import com.nutri4you.backend.model.ConsumoDiario;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.repository.ConsumoDiarioRepository;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.security.TokenService;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
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
class HidratacaoControllerTest {
    @Autowired MockMvc mvc;
    @Autowired PacienteRepository pacientes;
    @Autowired PasswordEncoder encoder;
    @Autowired TokenService tokens;
    @Autowired ConsumoDiarioRepository consumos;
    @Autowired EntityManager entityManager;
    @Autowired Clock clock;
    private Paciente paciente;

    private String token;

    @BeforeEach
    void preparar() {
        paciente = pacientes.save(TestDataFactory.pacienteConfirmado(encoder));
        token = tokens.gerarToken(paciente.getEmail());
    }

    @Test
    void hidratacaoComecaZeradaEPersisteAdicoesDoDia() throws Exception {
        mvc.perform(get("/api/v1/usuarios/me/hidratacao").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.consumidoMl").value(0))
                .andExpect(jsonPath("$.data.metaMl").value(2500));
        mvc.perform(post("/api/v1/usuarios/me/hidratacao")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantidadeMl\":250}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.consumidoMl").value(250));
        mvc.perform(get("/api/v1/usuarios/me/hidratacao").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.consumidoMl").value(250));
    }

    @Test
    void adicionaAguaQuandoSaldoLegadoENulo() throws Exception {
        var registro = consumos.saveAndFlush(new ConsumoDiario(paciente, LocalDate.now(clock), BigDecimal.ZERO, 0));
        entityManager.createNativeQuery("update consumo_diario set agua_ml_consumida = null where id_consumo = :id")
                .setParameter("id", registro.getId()).executeUpdate();
        entityManager.clear();

        mvc.perform(post("/api/v1/usuarios/me/hidratacao")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantidadeMl\":250}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.consumidoMl").value(250));
    }

    @Test
    void rejeitaQuantidadeInvalida() throws Exception {
        mvc.perform(post("/api/v1/usuarios/me/hidratacao")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantidadeMl\":0}"))
                .andExpect(status().isBadRequest());
    }
}
