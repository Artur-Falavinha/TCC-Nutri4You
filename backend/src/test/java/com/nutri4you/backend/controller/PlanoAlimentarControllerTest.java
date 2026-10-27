package com.nutri4you.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PlanoAlimentarControllerTest {
    @Autowired MockMvc mvc;
    @Autowired NutricionistaRepository nutricionistas;
    @Autowired PacienteRepository pacientes;
    @Autowired ConsultaRepository consultas;
    @Autowired PasswordEncoder encoder;

    private Paciente paciente;
    private Paciente semAcesso;
    private Nutricionista nutricionista;

    @BeforeEach
    void preparar() {
        nutricionista = nutricionistas.save(TestDataFactory.nutricionista(encoder));
        paciente = pacientes.save(TestDataFactory.pacienteConfirmado(encoder));
        semAcesso = pacientes.save(TestDataFactory.outroPaciente(encoder));
        consultas.save(new Consulta(paciente, nutricionista, java.time.LocalDateTime.now()));
    }

    @Test
    void rascunhoNaoApareceAoPacienteEPublicacaoAtivaPlano() throws Exception {
        String nutriToken = login("nutri@teste.com");
        String pacienteToken = login("paciente@teste.com");
        LocalDate hoje = hoje();
        int id = criar(nutriToken, paciente.getId(), hoje, null);

        mvc.perform(get("/api/v1/usuarios/me/dieta-ativa").header("Authorization", bearer(pacienteToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data").isEmpty());

        mvc.perform(get("/api/v1/gestao-pacientes/{id}/planos", paciente.getId())
                        .header("Authorization", bearer(nutriToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].status").value("RASCUNHO"));

        publicar(nutriToken, paciente.getId(), id, 0)
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("PUBLICADO"));

        mvc.perform(get("/api/v1/usuarios/me/dieta-ativa").header("Authorization", bearer(pacienteToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.id").value(id))
                .andExpect(jsonPath("$.data.metaKcal").value(1800));

        mvc.perform(put("/api/v1/gestao-pacientes/{id}/planos/{plano}", paciente.getId(), id)
                        .header("Authorization", bearer(nutriToken)).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(hoje.plusDays(1), null, 1)))
                .andExpect(status().isConflict());
    }

    @Test
    void novaPublicacaoSubstituiPlanoAnteriorSemSobreposicao() throws Exception {
        String token = login("nutri@teste.com");
        LocalDate hoje = hoje();
        int primeiro = criar(token, paciente.getId(), hoje, null);
        publicar(token, paciente.getId(), primeiro, 0).andExpect(status().isOk());

        int segundo = criar(token, paciente.getId(), hoje.plusDays(2), null);
        publicar(token, paciente.getId(), segundo, 0).andExpect(status().isOk());

        mvc.perform(get("/api/v1/gestao-pacientes/{id}/planos/{plano}", paciente.getId(), primeiro)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.vigenciaFim").value(hoje.plusDays(1).toString()));

        int terceiro = criar(token, paciente.getId(), hoje.plusDays(1), null);
        publicar(token, paciente.getId(), terceiro, 0).andExpect(status().isConflict());
    }

    @Test
    void bloqueiaAcessoIndevidoEVersaoAntiga() throws Exception {
        String nutriToken = login("nutri@teste.com");
        String pacienteToken = login("paciente@teste.com");
        int plano = criar(nutriToken, paciente.getId(), hoje(), null);

        mvc.perform(get("/api/v1/gestao-pacientes/{id}/planos/{plano}", semAcesso.getId(), plano)
                        .header("Authorization", bearer(nutriToken)))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/gestao-pacientes/{id}/planos", paciente.getId())
                        .header("Authorization", bearer(pacienteToken)))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/usuarios/me/dieta-ativa").header("Authorization", bearer(nutriToken)))
                .andExpect(status().isForbidden());

        mvc.perform(put("/api/v1/gestao-pacientes/{id}/planos/{plano}", paciente.getId(), plano)
                        .header("Authorization", bearer(nutriToken)).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(hoje().plusDays(1), null, 0)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.versao").value(1));

        publicar(nutriToken, paciente.getId(), plano, 0).andExpect(status().isConflict());
        publicar(nutriToken, paciente.getId(), plano, 1).andExpect(status().isOk());
    }

    @Test
    void outroNutricionistaComAcessoAoPacienteNaoVePlanoAlheio() throws Exception {
        String autorToken = login("nutri@teste.com");
        int plano = criar(autorToken, paciente.getId(), hoje(), null);
        Nutricionista outro = nutricionistas.save(new Nutricionista(
                "Outro Nutricionista", "outro.nutri@teste.com", encoder.encode("senha123"), "CRN8-88888"));
        consultas.save(new Consulta(paciente, outro, java.time.LocalDateTime.now()));
        String outroToken = login("outro.nutri@teste.com");

        mvc.perform(get("/api/v1/gestao-pacientes/{id}/planos/{plano}", paciente.getId(), plano)
                        .header("Authorization", bearer(outroToken)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/gestao-pacientes/{id}/planos", paciente.getId())
                        .header("Authorization", bearer(outroToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void rejeitaVigenciaInvalidaEPublicacaoRetroativa() throws Exception {
        String token = login("nutri@teste.com");
        int plano = criar(token, paciente.getId(), hoje().minusDays(1), null);
        publicar(token, paciente.getId(), plano, 0).andExpect(status().isBadRequest());

        mvc.perform(post("/api/v1/gestao-pacientes/{id}/planos", paciente.getId())
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(hoje().plusDays(1), hoje(), null)))
                .andExpect(status().isBadRequest());
    }

    private int criar(String token, int pacienteId, LocalDate inicio, LocalDate fim) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/gestao-pacientes/{id}/planos", pacienteId)
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(inicio, fim, null)))
                .andExpect(status().isCreated()).andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.id");
    }

    private org.springframework.test.web.servlet.ResultActions publicar(String token, int pacienteId, int planoId,
                                                                          long versao) throws Exception {
        return mvc.perform(post("/api/v1/gestao-pacientes/{id}/planos/{plano}/publicacao", pacienteId, planoId)
                .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"versao\":" + versao + "}"));
    }

    private String corpo(LocalDate inicio, LocalDate fim, Integer versao) {
        return "{\"vigenciaInicio\":\"" + inicio + "\",\"vigenciaFim\":"
                + (fim == null ? "null" : "\"" + fim + "\"")
                + ",\"metaKcal\":1800,\"versao\":" + (versao == null ? "null" : versao) + "}";
    }

    private String login(String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"senha\":\"senha123\"}"))
                .andExpect(status().isOk()).andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.token");
    }

    private String bearer(String token) { return "Bearer " + token; }
    private LocalDate hoje() { return LocalDate.now(ZoneId.of("America/Sao_Paulo")); }
}
