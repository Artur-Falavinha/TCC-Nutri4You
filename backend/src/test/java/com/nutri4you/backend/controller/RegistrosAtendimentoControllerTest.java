package com.nutri4you.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.Alimento;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.security.TokenService;
import com.nutri4you.backend.support.ClinicalServiceTestSupport;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class RegistrosAtendimentoControllerTest extends ClinicalServiceTestSupport {
    @Autowired MockMvc mvc;
    @Autowired TokenService tokens;

    @Test
    void exameFicaNoAtendimentoMesmoComVinculoEPermiteAnaliseAposConclusao() throws Exception {
        var atendimento = avulsa(paciente, 0, false);
        var outroAtendimento = avulsa(paciente, 60, true);
        String url = "/api/v1/gestao-pacientes/" + paciente.getId() + "/exames";
        String token = bearer(nutri.getEmail());
        String pacienteToken = bearer(paciente.getEmail());
        String solicitacao = """
                {"nome":"Hemograma"}
                """;

        mvc.perform(post(url).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .param("atendimentoId", atendimento.getId().toString()).content(solicitacao))
                .andExpect(status().isForbidden());
        atendimento.iniciar(agora());
        consultas.saveAndFlush(atendimento);

        mvc.perform(post(url).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content(solicitacao))
                .andExpect(status().isCreated());
        String criado = mvc.perform(post(url).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .param("atendimentoId", atendimento.getId().toString()).content(solicitacao))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        int exame = JsonPath.read(criado, "$.data.id");
        Integer versao = JsonPath.read(criado, "$.data.versao");

        mvc.perform(get(url).header("Authorization", token).param("atendimentoId", atendimento.getId().toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.itens[0].id").value(exame));
        mvc.perform(get(url).header("Authorization", token).param("atendimentoId", outroAtendimento.getId().toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(0));
        mvc.perform(get(url).header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(1));
        mvc.perform(get("/api/v1/usuarios/me/exames").header("Authorization", pacienteToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(2));

        byte[] pdf = "%PDF-1.4".getBytes(StandardCharsets.US_ASCII);
        var arquivo = new MockMultipartFile("arquivo", "resultado.pdf", "application/pdf", pdf);
        String enviado = mvc.perform(multipart("/api/v1/usuarios/me/exames/{id}/arquivo", exame)
                        .file(arquivo).param("versao", versao.toString()).header("Authorization", pacienteToken))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        Integer versaoEnviada = JsonPath.read(enviado, "$.data.versao");
        concluir(atendimento);

        mvc.perform(get(url + "/{id}/arquivo", exame).header("Authorization", token))
                .andExpect(status().isNotFound());
        mvc.perform(get(url + "/{id}/arquivo", exame).header("Authorization", token)
                        .param("atendimentoId", outroAtendimento.getId().toString()))
                .andExpect(status().isNotFound());
        mvc.perform(get(url + "/{id}/arquivo", exame).header("Authorization", token)
                        .param("atendimentoId", atendimento.getId().toString()))
                .andExpect(status().isOk()).andExpect(content().bytes(pdf));
        mvc.perform(post(url + "/{id}/analise", exame).header("Authorization", token)
                        .param("atendimentoId", atendimento.getId().toString()).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"parecer":"Revisado","versao":%d}
                                """.formatted(versaoEnviada)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("ANALISADO"));
        mvc.perform(post(url).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .param("atendimentoId", atendimento.getId().toString()).content(solicitacao))
                .andExpect(status().isForbidden());
    }

    @Test
    void planoAvulsoNaoPodeMudarDeConsultaEContinuaVisivelAoPaciente() throws Exception {
        var avulso = pacientes.saveAndFlush(TestDataFactory.outroPaciente(encoder));
        var atendimento = avulsa(avulso, 0, true);
        var outroAtendimento = avulsa(avulso, 60, true);
        var alimento = alimentos.saveAndFlush(new Alimento("Feijão", BigDecimal.TEN,
                BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE));
        String token = bearer(nutri.getEmail());
        String url = "/api/v1/gestao-pacientes/" + avulso.getId() + "/planos-alimentares";
        String corpo = """
                {"titulo":"Dieta da consulta","vigenciaInicio":"%s","vigenciaFim":"%s",
                 "refeicoes":[{"nome":"Almoço","horario":"12:00","itens":[{"alimentoId":%d,"quantidadeGramas":100}]}]}
                """.formatted(hoje(), hoje().plusDays(7), alimento.getId()).stripTrailing();
        String criado = mvc.perform(post(url).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .param("atendimentoId", atendimento.getId().toString()).content(corpo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.consultaId").value(atendimento.getId()))
                .andReturn().getResponse().getContentAsString();
        int plano = JsonPath.read(criado, "$.data.id");
        Integer versao = JsonPath.read(criado, "$.data.versao");

        mvc.perform(get(url + "/{id}", plano).header("Authorization", token))
                .andExpect(status().isForbidden());
        mvc.perform(get(url + "/{id}", plano).header("Authorization", token)
                        .param("atendimentoId", outroAtendimento.getId().toString()))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/gestao-pacientes/{id}/planos", paciente.getId()).header("Authorization", token)
                        .param("atendimentoId", atendimento.getId().toString()))
                .andExpect(status().isNotFound());
        String reatribuicao = corpo.substring(0, corpo.length() - 1) + """
                ,"consultaId":%d,"versao":%d}
                """.formatted(outroAtendimento.getId(), versao);
        mvc.perform(put(url + "/{id}", plano).header("Authorization", token)
                        .param("atendimentoId", atendimento.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON).content(reatribuicao))
                .andExpect(status().isBadRequest());

        mvc.perform(post(url + "/{id}/publicacao", plano).header("Authorization", token)
                        .param("atendimentoId", atendimento.getId().toString()).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"versao":%d}
                                """.formatted(versao)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("PUBLICADO"));
        concluir(atendimento);
        mvc.perform(get(url).header("Authorization", token).param("atendimentoId", atendimento.getId().toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].id").value(plano));
        mvc.perform(get("/api/v1/usuarios/me/dieta-ativa").header("Authorization", bearer(avulso.getEmail())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.id").value(plano));
        mvc.perform(put(url + "/{id}", plano).header("Authorization", token)
                        .param("atendimentoId", atendimento.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isForbidden());
    }

    private Consulta avulsa(Paciente titular, int minutos, boolean iniciada) {
        var horario = agora().plusMinutes(minutos);
        var consulta = new Consulta(titular, nutri, horario, true);
        consulta.atualizar(horario, "CONFIRMADA", null);
        if (iniciada) consulta.iniciar(horario);
        return consultas.saveAndFlush(consulta);
    }

    private void concluir(Consulta consulta) {
        consulta.atualizar(consulta.getDataHora(), "REALIZADA", null);
        consultas.saveAndFlush(consulta);
    }

    private String bearer(String email) {
        return "Bearer " + tokens.gerarToken(email);
    }
}
