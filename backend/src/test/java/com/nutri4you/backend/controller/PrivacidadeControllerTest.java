package com.nutri4you.backend.controller;

import com.nutri4you.backend.service.PrivacidadeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PrivacidadeControllerTest {
    @Autowired MockMvc mvc;

    @Test
    void termosSaoServidosComoPdfParaExibicaoMesmoSemLogin() throws Exception {
        var resposta = mvc.perform(get("/api/v1/privacidade/termos"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", "inline; filename=termos-nutri4you.pdf"))
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(resposta).startsWith((byte) '%', (byte) 'P', (byte) 'D', (byte) 'F', (byte) '-');
    }

    @Test
    void disponibilizaVersaoExataDoCadastro() throws Exception {
        var versaoAtual = mvc.perform(get("/api/v1/privacidade/termos"))
                .andReturn().getResponse().getContentAsByteArray();
        mvc.perform(get("/api/v1/privacidade/termos/{versao}", PrivacidadeService.VERSAO))
                .andExpect(status().isOk())
                .andExpect(content().bytes(versaoAtual));
        mvc.perform(get("/api/v1/privacidade/termos/{versao}", "2026-11-19"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF));
        mvc.perform(get("/api/v1/privacidade/termos/{versao}", "inexistente"))
                .andExpect(status().isNotFound());
    }
}
