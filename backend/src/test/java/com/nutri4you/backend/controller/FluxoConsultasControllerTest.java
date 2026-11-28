package com.nutri4you.backend.controller;

import com.nutri4you.backend.security.DatabaseUserDetailsService;
import com.nutri4you.backend.security.TokenService;
import com.nutri4you.backend.service.PrivacidadeService;
import com.nutri4you.backend.support.ClinicalServiceTestSupport;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
class FluxoConsultasControllerTest extends ClinicalServiceTestSupport {
    @Autowired MockMvc mvc;
    @Autowired TokenService tokens;
    @Autowired DatabaseUserDetailsService titulares;
    @Autowired PrivacidadeService privacidade;
    private String token;

    @BeforeEach
    void autenticar() {
        TestDataFactory.registrarAceite(privacidade, nutri, paciente);
        token = "Bearer " + tokens.gerarToken(titulares.loadUserByUsername(nutri.getEmail()));
    }

    @ParameterizedTest
    @ValueSource(strings = {"/atendimentos", "/atendimentos/1", "/atendimentos/1/acesso", "/solicitacoes-avulsas"})
    void rotasDeAtendimentoAvulsoNaoEstaoDisponiveis(String caminho) throws Exception {
        mvc.perform(get("/api/v1/agenda-nutricionista" + caminho).header("Authorization", token))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @ValueSource(strings = {"/atendimentos/1/inicio", "/atendimentos/1/cancelamento", "/solicitacoes-avulsas/1/decisao"})
    void acoesAntigasNaoEstaoDisponiveis(String caminho) throws Exception {
        mvc.perform(post("/api/v1/agenda-nutricionista" + caminho).header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"versao\":0,\"aceitar\":true}"))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @ValueSource(strings = {"exames", "planos-alimentares"})
    void parametroAntigoNaoReabreEscopoAvulso(String recurso) throws Exception {
        String url = "/api/v1/gestao-pacientes/" + paciente.getId() + "/" + recurso;
        mvc.perform(get(url).header("Authorization", token).param("atendimentoId", "1"))
                .andExpect(status().isBadRequest());
        mvc.perform(post(url).header("Authorization", token).param("atendimentoId", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"nome\":\"Exame\",\"titulo\":\"Dieta\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get(url).header("Authorization", token)).andExpect(status().isOk());
    }
}
