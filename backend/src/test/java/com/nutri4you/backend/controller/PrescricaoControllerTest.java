package com.nutri4you.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.Alimento;
import com.nutri4you.backend.model.ListaCompras;
import com.nutri4you.backend.model.PlanoAlimentar;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.ListaComprasRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.security.TokenService;
import com.nutri4you.backend.support.TestDataFactory;

import jakarta.persistence.EntityManager;

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

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PrescricaoControllerTest {
    @Autowired MockMvc mvc;
    @Autowired PacienteRepository pacientes;
    @Autowired NutricionistaRepository nutricionistas;
    @Autowired ConsultaRepository consultas;
    @Autowired PasswordEncoder encoder;
    @Autowired TokenService tokens;
    @Autowired EntityManager em;
    @Autowired ListaComprasRepository listas;
    Paciente paciente;
    Paciente outro;
    Nutricionista nutri;
    Nutricionista segundo;
    String autorToken;
    String pacienteToken;
    String outroToken;
    String segundoToken;
    String url;
    final LocalDate hoje = LocalDate.now(ZoneId.of("America/Sao_Paulo"));

    @BeforeEach
    void preparar() {
        nutri = nutricionistas.save(TestDataFactory.nutricionista(encoder));
        segundo =
                nutricionistas.save(
                        new Nutricionista(
                                "Outro Nutri",
                                "segundo@teste.com",
                                encoder.encode("senha123"),
                                "CRN8-88888"));
        paciente = pacientes.save(TestDataFactory.pacienteConfirmado(encoder));
        outro = pacientes.save(TestDataFactory.outroPaciente(encoder));
        consultas.save(TestDataFactory.consulta(paciente, nutri));
        consultas.save(TestDataFactory.consulta(paciente, segundo));
        autorToken = tokens.gerarToken(nutri.getEmail());
        pacienteToken = tokens.gerarToken(paciente.getEmail());
        outroToken = tokens.gerarToken(outro.getEmail());
        segundoToken = tokens.gerarToken(segundo.getEmail());
        url = "/api/v1/gestao-pacientes/" + paciente.getId() + "/planos-alimentares";
        inserirAlimento(1001, "Feijão", "feijao", "Leguminosas", true, true);
        inserirAlimento(1002, "Arroz", "arroz", "Cereais", true, true);
        inserirAlimento(1003, "Incompleto", "incompleto", "Cereais", false, true);
        inserirAlimento(1004, "Legado", "legado", "Cereais", true, false);
    }

    void inserirAlimento(
            int id,
            String nome,
            String busca,
            String categoria,
            boolean calculavel,
            boolean ativo) {
        em.createNativeQuery(
                        "insert into alimento (id_alimento, codigo_taco, nome, nome_busca,"
                            + " categoria, kcal_100g, proteina_100g, carboidratos_100g,"
                            + " gordura_100g, disponivel_prescricao, catalogo_ativo, fonte,"
                            + " versao_fonte) values"
                            + " (:id,:id,:nome,:busca,:categoria,128.456789,2.5,28.1,:gordura,:calculavel,:ativo,'NEPA/UNICAMP','TACO"
                            + " 4')")
                .setParameter("id", id)
                .setParameter("nome", nome)
                .setParameter("busca", busca)
                .setParameter("categoria", categoria)
                .setParameter("gordura", calculavel ? new java.math.BigDecimal("0.25") : null)
                .setParameter("calculavel", calculavel)
                .setParameter("ativo", ativo)
                .executeUpdate();
    }

    String corpo(LocalDate inicio, LocalDate fim, Long versao) {
        return """
{"titulo":"Plano diário","orientacoes":"Orientação","vigenciaInicio":%s,"vigenciaFim":%s,"versao":%s,
 "metas":{"kcal":2000,"proteinas":100,"carboidratos":250,"gorduras":60},
 "refeicoes":[{"nome":"Almoço","horario":"12:00","itens":[{"alimentoId":1001,"quantidadeGramas":33.33}]},
 {"nome":"Jantar","horario":"19:00","itens":[{"alimentoId":1001,"quantidadeGramas":33.33}]}]}
"""
                .formatted(data(inicio), data(fim), versao == null ? "null" : versao);
    }

    String data(LocalDate data) {
        return data == null ? "null" : "\"" + data + "\"";
    }

    MvcResult criar(String token, String corpo) throws Exception {
        return mvc.perform(
                        post(url)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(corpo))
                .andExpect(status().isCreated())
                .andReturn();
    }

    int id(MvcResult result) throws Exception {
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.id");
    }

    long versao(MvcResult result) throws Exception {
        return ((Number) JsonPath.read(result.getResponse().getContentAsString(), "$.data.versao"))
                .longValue();
    }

    MvcResult publicar(int id, long versao, String token) throws Exception {
        return mvc.perform(
                        post(url + "/" + id + "/publicacao")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"versao\":" + versao + "}"))
                .andExpect(status().isOk())
                .andReturn();
    }

    @Test
    void buscaNormalizaAcentosFiltraPaginaEExcluiLegados() throws Exception {
        mvc.perform(
                        get("/api/v1/alimentos")
                                .param("nome", "FEIJÃO")
                                .param("categoria", "Leguminosas")
                                .header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.alimentos", hasSize(1)))
                .andExpect(jsonPath("$.data.alimentos[0].nome").value("Feijão"))
                .andExpect(jsonPath("$.data.alimentos[0].fonte").value("NEPA/UNICAMP"));
        mvc.perform(
                        get("/api/v1/alimentos")
                                .param("tamanho", "1")
                                .param("pagina", "1")
                                .header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElementos").value(3))
                .andExpect(jsonPath("$.data.totalPaginas").value(3));
        mvc.perform(
                        get("/api/v1/alimentos")
                                .param("nome", "%")
                                .header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.alimentos", hasSize(0)));
        mvc.perform(
                        get("/api/v1/alimentos/categorias")
                                .header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)));
    }

    @Test
    void rascunhoPersisteCalculosSemSomarValoresJaArredondados() throws Exception {
        MvcResult criado = criar(autorToken, corpo(hoje, hoje.plusDays(20), null));
        int planoId = id(criado);
        em.clear();
        mvc.perform(get(url + "/" + planoId).header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totais.kcal").value(85.63))
                .andExpect(jsonPath("$.data.refeicoes[0].totais.kcal").value(42.81))
                .andExpect(jsonPath("$.data.metas.kcal").value(2000));
        mvc.perform(
                        get("/api/v1/me/plano-alimentar")
                                .header("Authorization", "Bearer " + pacienteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void edicaoIncrementaVersaoPreservaConflitosEPermiteExcluirRascunho() throws Exception {
        MvcResult criado = criar(autorToken, corpo(null, null, null));
        int planoId = id(criado);
        MvcResult atualizado =
                mvc.perform(
                                put(url + "/" + planoId)
                                        .header("Authorization", "Bearer " + autorToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(corpo(hoje, hoje.plusDays(1), versao(criado))))
                        .andExpect(status().isOk())
                        .andReturn();
        assertThat(versao(atualizado)).isGreaterThan(versao(criado));
        em.clear();
        ListaCompras listaLegada = new ListaCompras(em.find(PlanoAlimentar.class, planoId), 7);
        listaLegada.marcar(em.find(Alimento.class, 1001), true);
        listas.saveAndFlush(listaLegada);
        mvc.perform(
                        put(url + "/" + planoId)
                                .header("Authorization", "Bearer " + autorToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(corpo(hoje, hoje.plusDays(1), versao(criado))))
                .andExpect(status().isConflict());
        mvc.perform(
                        delete(url + "/" + planoId)
                                .param("versao", Long.toString(versao(criado)))
                                .header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isConflict());
        mvc.perform(
                        delete(url + "/" + planoId)
                                .param("versao", Long.toString(versao(atualizado)))
                                .header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isNoContent());
        mvc.perform(get(url + "/" + planoId).header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void publicadoFicaImutavelESobreposicaoEntreAutoresEhBloqueada() throws Exception {
        MvcResult primeiro = criar(autorToken, corpo(hoje, hoje.plusDays(10), null));
        MvcResult publicado = publicar(id(primeiro), versao(primeiro), autorToken);
        em.clear();
        mvc.perform(
                        put(url + "/" + id(primeiro))
                                .header("Authorization", "Bearer " + autorToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(corpo(hoje, hoje.plusDays(2), versao(publicado))))
                .andExpect(status().isConflict());
        mvc.perform(
                        delete(url + "/" + id(primeiro))
                                .param("versao", Long.toString(versao(publicado)))
                                .header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isConflict());
        MvcResult sobreposto =
                criar(segundoToken, corpo(hoje.plusDays(10), hoje.plusDays(15), null));
        mvc.perform(
                        post(url + "/" + id(sobreposto) + "/publicacao")
                                .header("Authorization", "Bearer " + segundoToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"versao\":" + versao(sobreposto) + "}"))
                .andExpect(status().isConflict());
        MvcResult adjacente =
                criar(segundoToken, corpo(hoje.plusDays(11), hoje.plusDays(15), null));
        publicar(id(adjacente), versao(adjacente), segundoToken);
        mvc.perform(
                        get("/api/v1/me/plano-alimentar")
                                .header("Authorization", "Bearer " + pacienteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(id(primeiro)));
    }

    @Test
    void comprasAgrupamMultiplicamEPersistemPorPeriodoSemEscreverNoGet() throws Exception {
        MvcResult criado = criar(autorToken, corpo(hoje, hoje.plusDays(20), null));
        publicar(id(criado), versao(criado), autorToken);
        em.clear();
        mvc.perform(
                        get("/api/v1/me/lista-compras")
                                .header("Authorization", "Bearer " + pacienteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.dias").value(7))
                .andExpect(jsonPath("$.data.itens", hasSize(1)))
                .andExpect(jsonPath("$.data.itens[0].quantidadeGramas").value(466.62));
        assertThat(listas.count()).isZero();
        mvc.perform(
                        put("/api/v1/me/lista-compras/itens/1001")
                                .header("Authorization", "Bearer " + pacienteToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"planoId\":"
                                                + id(criado)
                                                + ",\"dias\":7,\"comprado\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itensComprados").value(1));
        em.clear();
        mvc.perform(
                        get("/api/v1/me/lista-compras")
                                .header("Authorization", "Bearer " + pacienteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itens[0].comprado").value(true));
        mvc.perform(
                        get("/api/v1/me/lista-compras")
                                .param("dias", "1")
                                .header("Authorization", "Bearer " + pacienteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itens[0].quantidadeGramas").value(66.66))
                .andExpect(jsonPath("$.data.itens[0].comprado").value(false));
        mvc.perform(
                        put("/api/v1/me/lista-compras/itens/1001")
                                .header("Authorization", "Bearer " + pacienteToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"planoId\":"
                                                + id(criado)
                                                + ",\"dias\":7,\"comprado\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itensPendentes").value(1));
    }

    @Test
    void validaPublicacaoVaziaDatasQuantidadesCatalogoELimites() throws Exception {
        MvcResult semDatas = criar(autorToken, corpo(null, null, null));
        mvc.perform(
                        post(url + "/" + id(semDatas) + "/publicacao")
                                .header("Authorization", "Bearer " + autorToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"versao\":0}"))
                .andExpect(status().isBadRequest());
        MvcResult vazio =
                criar(
                        autorToken,
                        "{\"titulo\":\"Vazio\",\"refeicoes\":[],\"vigenciaInicio\":\""
                                + hoje
                                + "\",\"vigenciaFim\":\""
                                + hoje
                                + "\"}");
        mvc.perform(
                        post(url + "/" + id(vazio) + "/publicacao")
                                .header("Authorization", "Bearer " + autorToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"versao\":0}"))
                .andExpect(status().isBadRequest());
        for (String invalido :
                new String[] {
                    corpo(hoje, hoje.minusDays(1), null),
                    corpo(hoje, hoje, null).replace("33.33", "0"),
                    corpo(hoje, hoje, null).replace("33.33", "10000.01"),
                    corpo(hoje, hoje, null).replace("33.33", "1.001"),
                    corpo(hoje, hoje, null).replace("1001", "1003"),
                    corpo(hoje, hoje, null).replace("1001", "1004"),
                    corpo(hoje, hoje, null).replace("1001", "9999")
                }) {
            mvc.perform(
                            post(url)
                                    .header("Authorization", "Bearer " + autorToken)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(invalido))
                    .andExpect(status().isBadRequest());
        }
        for (String dias : new String[] {"0", "31", "-1", "abc"}) {
            mvc.perform(
                            get("/api/v1/me/lista-compras")
                                    .param("dias", dias)
                                    .header("Authorization", "Bearer " + pacienteToken))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(
                        get("/api/v1/alimentos")
                                .param("tamanho", "51")
                                .header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isBadRequest());
        mvc.perform(
                        get("/api/v1/alimentos")
                                .param("pagina", "-1")
                                .header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void acessosIsolamAutorEPacienteMesmoComVinculoClinico() throws Exception {
        MvcResult criado = criar(autorToken, corpo(hoje, hoje, null));
        mvc.perform(get(url)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/me/plano-alimentar")).andExpect(status().isUnauthorized());
        mvc.perform(get(url).header("Authorization", "Bearer " + pacienteToken))
                .andExpect(status().isForbidden());
        mvc.perform(
                        get("/api/v1/me/plano-alimentar")
                                .header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isForbidden());
        mvc.perform(get(url + "/" + id(criado)).header("Authorization", "Bearer " + segundoToken))
                .andExpect(status().isNotFound());
        mvc.perform(get(url).header("Authorization", "Bearer " + segundoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
        mvc.perform(
                        get("/api/v1/gestao-pacientes/" + outro.getId() + "/planos-alimentares")
                                .header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isForbidden());
        mvc.perform(
                        get("/api/v1/gestao-pacientes/99999/planos-alimentares")
                                .header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isNotFound());
        publicar(id(criado), versao(criado), autorToken);
        mvc.perform(
                        get("/api/v1/me/plano-alimentar")
                                .header("Authorization", "Bearer " + outroToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
        mvc.perform(get("/api/v1/me/lista-compras").header("Authorization", "Bearer " + outroToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
        mvc.perform(
                        put("/api/v1/me/lista-compras/itens/1001")
                                .header("Authorization", "Bearer " + outroToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"planoId\":"
                                                + id(criado)
                                                + ",\"dias\":7,\"comprado\":true}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void futurosEExpiradosNaoAparecemComoAtivos() throws Exception {
        MvcResult futuro = criar(autorToken, corpo(hoje.plusDays(1), hoje.plusDays(10), null));
        publicar(id(futuro), versao(futuro), autorToken);
        MvcResult antigo = criar(autorToken, corpo(hoje.minusDays(10), hoje.minusDays(1), null));
        publicar(id(antigo), versao(antigo), autorToken);
        mvc.perform(
                        get("/api/v1/me/plano-alimentar")
                                .header("Authorization", "Bearer " + pacienteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void rejeitaAlteracoesDeOutroAutorEVersaoDesatualizadaNaPublicacao() throws Exception {
        MvcResult criado = criar(autorToken, corpo(hoje, hoje.plusDays(2), null));
        int planoId = id(criado);
        mvc.perform(
                        put(url + "/" + planoId)
                                .header("Authorization", "Bearer " + segundoToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(corpo(hoje, hoje, versao(criado))))
                .andExpect(status().isNotFound());
        mvc.perform(
                        delete(url + "/" + planoId)
                                .param("versao", "0")
                                .header("Authorization", "Bearer " + segundoToken))
                .andExpect(status().isNotFound());
        mvc.perform(
                        post(url + "/" + planoId + "/publicacao")
                                .header("Authorization", "Bearer " + segundoToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"versao\":0}"))
                .andExpect(status().isNotFound());
        mvc.perform(
                        post(url + "/" + planoId + "/publicacao")
                                .header("Authorization", "Bearer " + autorToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"versao\":99}"))
                .andExpect(status().isConflict());
        mvc.perform(
                        put(url + "/" + planoId)
                                .header("Authorization", "Bearer " + autorToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(corpo(hoje, hoje, null)))
                .andExpect(status().isBadRequest());
        mvc.perform(delete(url + "/" + planoId).header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isBadRequest());
        mvc.perform(
                        post(url)
                                .header("Authorization", "Bearer " + autorToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(corpo(hoje, hoje, null).replace("2000", "0")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void nutrientesPublicadosPermanecemCongeladosEMarcacaoExigeAlimentoDoPlano() throws Exception {
        MvcResult criado = criar(autorToken, corpo(hoje, hoje.plusDays(2), null));
        publicar(id(criado), versao(criado), autorToken);
        em.createNativeQuery("update alimento set kcal_100g = 999 where id_alimento = 1001")
                .executeUpdate();
        em.clear();
        mvc.perform(
                        get("/api/v1/me/plano-alimentar")
                                .header("Authorization", "Bearer " + pacienteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totais.kcal").value(85.63));
        mvc.perform(
                        get("/api/v1/me/lista-compras")
                                .param("dias", "30")
                                .header("Authorization", "Bearer " + pacienteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itens[0].quantidadeGramas").value(1999.80));
        mvc.perform(
                        put("/api/v1/me/lista-compras/itens/1002")
                                .header("Authorization", "Bearer " + pacienteToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"planoId\":"
                                                + id(criado)
                                                + ",\"dias\":7,\"comprado\":true}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void planoLegadoPublicadoComVigenciaAbertaPermaneceAtivoEBloqueiaSobreposicao()
            throws Exception {
        MvcResult legado = criar(autorToken, corpo(hoje, hoje.plusDays(1), null));
        publicar(id(legado), versao(legado), autorToken);
        em.createNativeQuery(
                        "update plano_alimentar set vigencia_inicio = null, vigencia_fim = null"
                                + " where id_plano = :id")
                .setParameter("id", id(legado))
                .executeUpdate();
        em.clear();
        mvc.perform(
                        get("/api/v1/me/plano-alimentar")
                                .header("Authorization", "Bearer " + pacienteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(id(legado)));
        mvc.perform(
                        get("/api/v1/me/lista-compras")
                                .header("Authorization", "Bearer " + pacienteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.planoId").value(id(legado)));
        MvcResult novo = criar(segundoToken, corpo(hoje.plusDays(5), hoje.plusDays(10), null));
        mvc.perform(
                        post(url + "/" + id(novo) + "/publicacao")
                                .header("Authorization", "Bearer " + segundoToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"versao\":0}"))
                .andExpect(status().isConflict());
    }

    @Test
    void parametrosDeQueryECaminhoMalformadosRecebem400() throws Exception {
        mvc.perform(
                        get("/api/v1/alimentos")
                                .param("pagina", "abc")
                                .header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isBadRequest());
        mvc.perform(get(url + "/abc").header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isBadRequest());
        mvc.perform(
                        get("/api/v1/gestao-pacientes/abc/planos-alimentares")
                                .header("Authorization", "Bearer " + autorToken))
                .andExpect(status().isBadRequest());
    }
}
