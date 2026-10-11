package com.nutri4you.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.*;
import com.nutri4you.backend.repository.*;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ConsultaControllerTest {
    @Autowired MockMvc mvc;
    @Autowired NutricionistaRepository nutricionistas;
    @Autowired PacienteRepository pacientes;
    @Autowired ConsultaRepository consultas;
    @Autowired AvaliacaoAntropometricaRepository avaliacoes;
    @Autowired PasswordEncoder encoder;
    private Nutricionista nutri;
    private Paciente paciente;
    private String token;
    private String base;

    @BeforeEach
    void preparar() throws Exception {
        nutri = nutricionistas.save(TestDataFactory.nutricionista(encoder));
        paciente = pacientes.save(TestDataFactory.pacienteConfirmado(encoder));
        consultas.save(TestDataFactory.consulta(paciente, nutri));
        base = "/api/v1/gestao-pacientes/" + paciente.getId() + "/consultas";
        token = login("nutri@teste.com");
    }

    @Test
    void criaConsultaCompletaERecuperaAvaliacaoVinculada() throws Exception {
        String body = completa(80, "Exames apresentados.", "null");
        String json = criar(body).andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.data.avaliacao.imc").value(24.69))
                .andExpect(jsonPath("$.data.avaliacao.pregaSuprailiaca").value(12.5))
                .andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(json, "$.data.id");
        mvc.perform(get(base + "/" + id).header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.observacao").value("Exames apresentados."))
                .andExpect(jsonPath("$.data.avaliacao.dataAvaliacao").value("2025-01-15T14:30:00"));
        assertThat(avaliacoes.findByConsulta_Id(id)).isPresent();
    }

    @Test
    void editaMedidasSemDuplicarERejeitaVersaoAntiga() throws Exception {
        String json = criar(completa(80, "", "null")).andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(json, "$.data.id");
        int versao = JsonPath.read(json, "$.data.versao");
        int avaliacaoId = JsonPath.read(json, "$.data.avaliacao.id");
        mvc.perform(put(base + "/" + id).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content(completa(81, "Atualizada", String.valueOf(versao))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.avaliacao.id").value(avaliacaoId))
                .andExpect(jsonPath("$.data.avaliacao.peso").value(81))
                .andExpect(jsonPath("$.data.versao").value(versao + 1));
        assertThat(avaliacoes.findByPaciente_IdOrderByDataAvaliacaoDesc(paciente.getId())).hasSize(1);
        mvc.perform(put(base + "/" + id).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content(completa(82, "Antiga", String.valueOf(versao))))
                .andExpect(status().isConflict());
        assertThat(avaliacoes.findByConsulta_Id(id).orElseThrow().getPeso()).isEqualByComparingTo("81");
    }

    @Test
    void agendaSemMedidasECancelaSemExcluir() throws Exception {
        String json = criar("""
                {"dataHora":"2030-06-01T10:00","status":"CONFIRMADA"}
                """).andExpect(status().isCreated()).andExpect(jsonPath("$.data.avaliacao").isEmpty())
                .andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(json, "$.data.id");
        mvc.perform(put(base + "/" + id).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                        {"dataHora":"2030-06-01T10:00","status":"CANCELADA","versao":0}
                        """))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("CANCELADA"));
        mvc.perform(get(base).header("Authorization", token)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(2))
                .andExpect(jsonPath("$.data.itens[0].id").value(id));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "{}",
        "{\"dataHora\":\"2025-01-01T10:00\",\"status\":\"INVENTADO\"}",
        "{\"dataHora\":\"2099-01-01T10:00\",\"status\":\"REALIZADA\"}",
        "{\"dataHora\":\"2025-02-30T10:00\",\"status\":\"CONFIRMADA\"}",
        "{\"dataHora\":\"2025-01-01T10:00\",\"status\":\"REALIZADA\"}",
        "{\"dataHora\":\"2025-01-01T10:00\",\"status\":\"REALIZADA\",\"avaliacao\":{\"peso\":70,\"altura\":1.755}}",
        "{\"dataHora\":\"2025-01-01T10:00\",\"status\":\"REALIZADA\",\"avaliacao\":{\"peso\":0,\"altura\":1.75}}",
        "{\"dataHora\":\"2025-01-01T10:00\",\"status\":\"CONFIRMADA\",\"avaliacao\":{\"peso\":70}}",
        "{\"dataHora\":\"2025-01-01T10:00\",\"status\":\"REALIZADA\",\"avaliacao\":{\"peso\":70,\"altura\":1.75,\"percentualGordura\":101}}"
    })
    void rejeitaDadosInvalidosSemPersistenciaParcial(String body) throws Exception {
        long total = consultas.count();
        criar(body).andExpect(status().isBadRequest());
        assertThat(consultas.count()).isEqualTo(total);
        assertThat(avaliacoes.count()).isZero();
    }

    @Test
    void requerAutenticacaoEVinculo() throws Exception {
        mvc.perform(get(base)).andExpect(status().isUnauthorized());
        Paciente outro = pacientes.save(TestDataFactory.outroPaciente(encoder));
        mvc.perform(get("/api/v1/gestao-pacientes/" + outro.getId() + "/consultas").header("Authorization", token))
                .andExpect(status().isForbidden());
        String tokenPaciente = login("paciente@teste.com");
        mvc.perform(get(base).header("Authorization", tokenPaciente)).andExpect(status().isForbidden());
        mvc.perform(get(base + "/2147483647").header("Authorization", token)).andExpect(status().isNotFound());
    }

    @Test
    void naoExpoeConsultaDeOutroNutricionistaMesmoComPacienteCompartilhado() throws Exception {
        Nutricionista outro = nutricionistas.save(new Nutricionista("Outro", "segundo@teste.com", encoder.encode("senha123"), "CRN8-33333"));
        Consulta consultaAlheia = consultas.save(TestDataFactory.consulta(paciente, outro));
        mvc.perform(get(base).header("Authorization", token)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itens", hasSize(1)));
        mvc.perform(get(base + "/" + consultaAlheia.getId()).header("Authorization", token)).andExpect(status().isNotFound());
        mvc.perform(put(base + "/" + consultaAlheia.getId()).header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content(completa(70, "", "0")))
                .andExpect(status().isNotFound());
    }

    @Test
    void paginacaoEstavelELimitada() throws Exception {
        for (int i = 0; i < 12; i++) consultas.save(new Consulta(paciente, nutri, LocalDateTime.of(2025, 1, 1, 10, 0)));
        mvc.perform(get(base).header("Authorization", token)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itens", hasSize(10))).andExpect(jsonPath("$.data.total").value(13));
        mvc.perform(get(base).param("pagina", "1").header("Authorization", token)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itens", hasSize(3)));
        mvc.perform(get(base).param("pagina", "-1").header("Authorization", token)).andExpect(status().isBadRequest());
    }

    @Test
    void naoRemoveAvaliacaoExistenteSilenciosamente() throws Exception {
        String json = criar(completa(80, "", "null")).andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(json, "$.data.id");
        mvc.perform(put(base + "/" + id).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                        {"dataHora":"2025-01-15T14:30","status":"CANCELADA","versao":0}
                        """))
                .andExpect(status().isBadRequest());
        assertThat(avaliacoes.findByConsulta_Id(id)).isPresent();
    }

    @Test
    void observacaoLongaEImcExtremoNaoEstouramColunas() throws Exception {
        criar(completa(80, "x".repeat(5001), "null")).andExpect(status().isBadRequest());
        criar(completa(500, "x".repeat(5000), "null").replace("1.80", "0.30"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.avaliacao.imc").value(5555.56));
    }

    private ResultActions criar(String body) throws Exception {
        return mvc.perform(post(base).header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(body));
    }
    private String login(String email) throws Exception {
        String json = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"senha\":\"senha123\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonPath.read(json, "$.data.token");
    }
    private String completa(int peso, String observacao, String versao) {
        return """
                {"dataHora":"2025-01-15T14:30","status":"REALIZADA","observacao":"%s","versao":%s,
                 "avaliacao":{"peso":%d,"altura":1.80,"percentualGordura":20,"massaMuscularKg":35,
                 "pregaBicipital":10,"pregaTricipital":11,"pregaSubescapular":12,"pregaSuprailiaca":12.5,
                 "circunferenciaCintura":80,"circunferenciaQuadril":100,"circunferenciaBraco":30}}
                """.formatted(observacao, versao, peso);
    }
}
