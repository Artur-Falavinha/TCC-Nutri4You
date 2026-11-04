package com.nutri4you.backend.controller;

import com.nutri4you.backend.security.TokenService;
import com.nutri4you.backend.support.ClinicalServiceTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class PlanoAlimentarControllerTest extends ClinicalServiceTestSupport {
    @Autowired MockMvc mvc;
    @Autowired TokenService tokens;
    @Test void aliasesCompartilhamContratoEAutorizacao() throws Exception {
        var plano = rascunho(hoje(), hoje());
        String nutriToken = "Bearer " + tokens.gerarToken(nutri.getEmail());
        String pacienteToken = "Bearer " + tokens.gerarToken(paciente.getEmail());
        for (String recurso : new String[]{"planos", "planos-alimentares"}) {
            mvc.perform(get("/api/v1/gestao-pacientes/{id}/" + recurso + "/{plano}", paciente.getId(), plano.getId()).header("Authorization", nutriToken))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data.titulo").value("Plano alimentar"))
                    .andExpect(jsonPath("$.data.metas.kcal").value(10));
            mvc.perform(get("/api/v1/gestao-pacientes/{id}/" + recurso, paciente.getId()).header("Authorization", pacienteToken)).andExpect(status().isForbidden());
        }
        for (String url : new String[]{"/api/v1/me/plano-alimentar", "/api/v1/usuarios/me/dieta-ativa"}) {
            mvc.perform(get(url).header("Authorization", pacienteToken)).andExpect(status().isOk()).andExpect(jsonPath("$.data").isEmpty());
            mvc.perform(get(url).header("Authorization", nutriToken)).andExpect(status().isForbidden());
        }
    }
    @Test void aliasNaoPublicaPlanoVazioNemVersaoAntiga() throws Exception {
        var plano = rascunho(hoje(), hoje());
        String token = "Bearer " + tokens.gerarToken(nutri.getEmail());
        String url = "/api/v1/gestao-pacientes/" + paciente.getId() + "/planos/" + plano.getId() + "/publicacao";
        mvc.perform(post(url).header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content("{\"versao\":99}"))
                .andExpect(status().isConflict());
        mvc.perform(post(url).header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content("{\"versao\":0}"))
                .andExpect(status().isBadRequest());
    }
}
