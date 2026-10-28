package com.nutri4you.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.*;
import com.nutri4you.backend.repository.*;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @Transactional
class FluxosClinicosControllerTest {
    @Autowired MockMvc mvc;
    @Autowired NutricionistaRepository nutris;
    @Autowired PacienteRepository pacientes;
    @Autowired ConsultaRepository consultas;
    @Autowired RelacaoClinicaRepository relacoes;
    @Autowired PlanoAlimentarRepository planos;
    @Autowired AlimentoRepository alimentos;
    @Autowired ExameRepository exames;
    @Autowired PasswordEncoder encoder;
    private Nutricionista n;
    private Paciente p;
    private String nutriToken, pacienteToken, base;
    @BeforeEach void preparar() throws Exception {
        n = nutris.save(TestDataFactory.nutricionista(encoder));
        p = pacientes.save(TestDataFactory.pacienteConfirmado(encoder));
        relacoes.save(RelacaoClinica.criar(p, n));
        nutriToken = login(n.getEmail()); pacienteToken = login(p.getEmail());
        base = "/api/v1/gestao-pacientes/" + p.getId();
    }
    @Test void agendaConfiguravelAceitaDomingoEFechaSemApagarReservas() throws Exception {
        var domingo = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusWeeks(1).with(java.time.temporal.TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        mvc.perform(put("/api/v1/agenda-nutricionista/horarios").header("Authorization", nutriToken)
                .contentType(MediaType.APPLICATION_JSON).content("[{\"diaSemana\":7,\"horario\":\"13:00\"}]"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/agenda/disponibilidade").header("Authorization", pacienteToken)
                .param("nutricionistaId", n.getId().toString()).param("data", domingo.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.horarios.length()").value(1));
        mvc.perform(post("/api/v1/agenda/consultas").header("Authorization", pacienteToken)
                .contentType(MediaType.APPLICATION_JSON).content("{\"nutricionistaId\":" + n.getId() + ",\"dataHora\":\"" + domingo + "T13:00\"}"))
                .andExpect(status().isCreated());
        mvc.perform(put("/api/v1/agenda-nutricionista/horarios").header("Authorization", nutriToken)
                .contentType(MediaType.APPLICATION_JSON).content("[]")).andExpect(status().isOk());
        assertThat(consultas.findByPaciente_IdOrderByDataHoraDesc(p.getId())).hasSize(1);
        mvc.perform(get("/api/v1/agenda/disponibilidade").header("Authorization", pacienteToken)
                .param("nutricionistaId", n.getId().toString()).param("data", domingo.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.horarios.length()").value(0));
    }
    @Test void agendaValidaDuplicatasPerfilEHorarioNaoConfigurado() throws Exception {
        mvc.perform(get("/api/v1/agenda-nutricionista/horarios").header("Authorization", pacienteToken)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/agenda-nutricionista/horarios")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/v1/agenda-nutricionista/horarios").header("Authorization", nutriToken)
                .contentType(MediaType.APPLICATION_JSON).content("[{\"diaSemana\":1,\"horario\":\"09:00\"},{\"diaSemana\":1,\"horario\":\"09:00\"}]"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/agenda/consultas").header("Authorization", pacienteToken)
                .contentType(MediaType.APPLICATION_JSON).content("{\"nutricionistaId\":" + n.getId() + ",\"dataHora\":\"2030-01-07T09:00\"}"))
                .andExpect(status().isBadRequest());
    }
    @Test void consultaExigeConfirmacaoJanelaEVersaoEImpedeReinicio() throws Exception {
        Consulta c = consultas.saveAndFlush(new Consulta(p, n, agora().plusMinutes(5)));
        acao(c, "inicio", 0).andExpect(status().isBadRequest());
        acao(c, "confirmacao", 0).andExpect(status().isOk());
        acao(c, "inicio", 0).andExpect(status().isConflict());
        long versao = c.getVersao();
        acao(c, "inicio", versao).andExpect(status().isOk()).andExpect(jsonPath("$.data.iniciadaEm").isNotEmpty())
                .andExpect(jsonPath("$.data.podeIniciar").value(false));
        acao(c, "inicio", c.getVersao()).andExpect(status().isBadRequest());
        acao(c, "cancelamento", c.getVersao()).andExpect(status().isBadRequest());
    }
    @Test void consultaForaDaJanelaENaoIniciadaNaoAceitaAtendimento() throws Exception {
        Consulta c = new Consulta(p, n, agora().plusHours(1)); c.atualizar(c.getDataHora(), "CONFIRMADA", null); consultas.saveAndFlush(c);
        acao(c, "inicio", c.getVersao()).andExpect(status().isBadRequest());
        mvc.perform(put(base + "/consultas/" + c.getId()).header("Authorization", nutriToken)
                .contentType(MediaType.APPLICATION_JSON).content("{\"dataHora\":\"" + c.getDataHora() + "\",\"status\":\"CONFIRMADA\",\"versao\":0,\"observacao\":\"não iniciado\"}"))
                .andExpect(status().isBadRequest());
    }
    @Test void consultaPassadaNaoPodeSerReagendadaPeloPaciente() throws Exception {
        Consulta c = new Consulta(p, n, agora().minusDays(1)); c.atualizar(c.getDataHora(), "CONFIRMADA", null); consultas.saveAndFlush(c);
        mvc.perform(put("/api/v1/agenda/consultas/" + c.getId() + "/reagendamento").header("Authorization", pacienteToken)
                .contentType(MediaType.APPLICATION_JSON).content("{\"dataHora\":\"2030-01-07T09:00\",\"versao\":0}"))
                .andExpect(status().isBadRequest());
    }
    @Test void refeicoesCalculamPorcaoPermitemExcessoEReplicamComIndependencia() throws Exception {
        PlanoAlimentar plano = rascunho();
        Alimento alimento = alimentos.save(new Alimento("Arroz teste", new BigDecimal("100"), new BigDecimal("10"), new BigDecimal("20"), null));
        String path = base + "/planos/" + plano.getId() + "/refeicoes";
        String json = mvc.perform(post(path).header("Authorization", nutriToken).contentType(MediaType.APPLICATION_JSON)
                .content(refeicao(alimento, 250, 1, plano.getVersao()))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.refeicoes[0].kcal").value(250))
                .andExpect(jsonPath("$.data.refeicoes[0].gordura").isEmpty()).andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(json, "$.data.refeicoes[0].id");
        long versao = ((Number) JsonPath.read(json, "$.data.versao")).longValue();
        mvc.perform(post(path + "/" + id + "/replicacao").header("Authorization", nutriToken).contentType(MediaType.APPLICATION_JSON)
                .content("{\"dias\":[2,7],\"versaoPlano\":" + versao + "}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.refeicoes.length()").value(3));
        mvc.perform(put(path + "/" + id).header("Authorization", nutriToken).contentType(MediaType.APPLICATION_JSON)
                .content(refeicao(alimento, 100, 1, plano.getVersao()))).andExpect(status().isOk());
        assertThat(plano.getRefeicoes().stream().filter(r -> r.getDiaSemana() == 2).findFirst().orElseThrow().getItens().getFirst().getQuantidadeGramas()).isEqualByComparingTo("250");
        mvc.perform(delete(path + "/" + id).param("versaoPlano", Long.toString(plano.getVersao())).header("Authorization", nutriToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.refeicoes.length()").value(2));
    }
    @Test void refeicoesProtegemVersaoPublicacaoEPropriedade() throws Exception {
        PlanoAlimentar plano = rascunho();
        Alimento a = alimentos.save(new Alimento("Banana teste", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE));
        String path = base + "/planos/" + plano.getId() + "/refeicoes";
        mvc.perform(post(path).header("Authorization", nutriToken).contentType(MediaType.APPLICATION_JSON).content(refeicao(a, 0, 1, 0)))
                .andExpect(status().isBadRequest());
        mvc.perform(post(path).header("Authorization", nutriToken).contentType(MediaType.APPLICATION_JSON).content(refeicao(a, 100, 8, 0)))
                .andExpect(status().isBadRequest());
        mvc.perform(post(path).header("Authorization", nutriToken).contentType(MediaType.APPLICATION_JSON).content(refeicao(a, 100, 1, 999)))
                .andExpect(status().isConflict());
        mvc.perform(post(path).header("Authorization", pacienteToken).contentType(MediaType.APPLICATION_JSON).content(refeicao(a, 100, 1, 0)))
                .andExpect(status().isForbidden());
        plano.publicar(); planos.flush();
        mvc.perform(post(path).header("Authorization", nutriToken).contentType(MediaType.APPLICATION_JSON).content(refeicao(a, 100, 1, plano.getVersao())))
                .andExpect(status().isConflict());
    }
    @Test void buscaAlimentosRespondeAoTermoESemVazarParaPaciente() throws Exception {
        alimentos.save(new Alimento("Arroz integral", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE));
        alimentos.save(new Alimento("Banana", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE));
        mvc.perform(get("/api/v1/alimentos").param("q", "ARROZ").header("Authorization", nutriToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1)).andExpect(jsonPath("$.data[0].nome").value("Arroz integral"));
        mvc.perform(get("/api/v1/alimentos").param("q", "a").header("Authorization", nutriToken)).andExpect(jsonPath("$.data.length()").value(0));
        mvc.perform(get("/api/v1/alimentos").param("q", "arroz").header("Authorization", pacienteToken)).andExpect(status().isForbidden());
    }
    @Test void examesSolicitacaoUploadDownloadEAnaliseSemBlobNaListagem() throws Exception {
        int id = solicitarExame();
        enviar(id, "%PDF-1.7\nconteudo".getBytes(), "application/pdf", 0).andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("ENVIADO"));
        mvc.perform(get("/api/v1/usuarios/me/exames").header("Authorization", pacienteToken)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itens[0].arquivo").doesNotExist()).andExpect(jsonPath("$.data.itens[0].arquivoTipo").value("application/pdf"));
        mvc.perform(get(base + "/exames/" + id + "/arquivo").header("Authorization", nutriToken))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store, private"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
        mvc.perform(post(base + "/exames/" + id + "/analise").header("Authorization", nutriToken)
                .contentType(MediaType.APPLICATION_JSON).content("{\"parecer\":\"Recebido e analisado\",\"versao\":1}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("ANALISADO"));
        enviar(id, "%PDF-1.7\nnovo".getBytes(), "application/pdf", 2).andExpect(status().isBadRequest());
    }
    @Test void buscaTacoIgnoraAcentosPontuacaoEOrdemDasPalavras() throws Exception {
        alimentos.save(new Alimento("Feijão, carioca, cozido", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE));
        alimentos.save(new Alimento("Feijão, carioca, cru", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE));
        mvc.perform(get("/api/v1/alimentos").param("q", " COZIDO  feijao ").header("Authorization", nutriToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].nome").value("Feijão, carioca, cozido"))
                .andExpect(jsonPath("$.data[0].nomeBusca").doesNotExist());
        mvc.perform(get("/api/v1/alimentos").param("q", "%%").header("Authorization", nutriToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(0));
    }
    @Test void buscaTacoPaginaSemRepetirResultadosEValidaLimites() throws Exception {
        for (int i = 0; i < 35; i++) alimentos.save(new Alimento("Catalogo " + String.format("%02d", i), BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE));
        mvc.perform(get("/api/v1/alimentos").param("q", "catalogo").header("Authorization", nutriToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(30))
                .andExpect(jsonPath("$.data[29].nome").value("Catalogo 29"));
        mvc.perform(get("/api/v1/alimentos").param("q", "catalogo").param("pagina", "1").header("Authorization", nutriToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(5))
                .andExpect(jsonPath("$.data[0].nome").value("Catalogo 30"));
        mvc.perform(get("/api/v1/alimentos").param("q", "catalogo").param("pagina", "-1").header("Authorization", nutriToken))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/alimentos").param("q", "a".repeat(151)).header("Authorization", nutriToken))
                .andExpect(status().isBadRequest());
    }
    @Test void examesRejeitamTiposTamanhoEConcorrencia() throws Exception {
        int id = solicitarExame();
        enviar(id, "<html>malicioso</html>".getBytes(), "application/pdf", 0).andExpect(status().isBadRequest());
        enviar(id, "%PDF-1.7".getBytes(), "image/png", 0).andExpect(status().isBadRequest());
        enviar(id, new byte[5 * 1024 * 1024 + 1], "application/pdf", 0).andExpect(status().isBadRequest());
        enviar(id, new byte[0], "application/pdf", 0).andExpect(status().isBadRequest());
        enviar(id, "%PDF-1.7".getBytes(), "application/pdf", 9).andExpect(status().isConflict());
        assertThat(exames.findById(id).orElseThrow().getArquivo()).isNull();
    }
    @Test void examesIsolamPacientesENutricionistas() throws Exception {
        int id = solicitarExame();
        Paciente outro = pacientes.save(TestDataFactory.outroPaciente(encoder));
        String outroToken = login(outro.getEmail());
        mvc.perform(get("/api/v1/usuarios/me/exames/" + id + "/arquivo").header("Authorization", outroToken)).andExpect(status().isNotFound());
        mvc.perform(multipart("/api/v1/usuarios/me/exames/" + id + "/arquivo")
                .file(new MockMultipartFile("arquivo", "x.pdf", "application/pdf", "%PDF-1.7".getBytes()))
                .param("versao", "0").header("Authorization", outroToken)).andExpect(status().isNotFound());
        Nutricionista outroNutri = nutris.save(new Nutricionista("Outro", "outro@teste.com", encoder.encode("senha123"), "CRN8-98765"));
        relacoes.save(RelacaoClinica.criar(p, outroNutri));
        mvc.perform(get(base + "/exames/" + id + "/arquivo").header("Authorization", login(outroNutri.getEmail()))).andExpect(status().isNotFound());
        mvc.perform(get(base + "/exames").header("Authorization", login(outroNutri.getEmail())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(0));
        mvc.perform(get("/api/v1/usuarios/me/exames")).andExpect(status().isUnauthorized());
    }
    private PlanoAlimentar rascunho() {
        PlanoAlimentar plano = new PlanoAlimentar(p, n);
        plano.editar(null, LocalDate.now(), null, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN);
        return planos.saveAndFlush(plano);
    }
    private String refeicao(Alimento a, int gramas, int dia, long versao) {
        return "{\"nome\":\"Almoço\",\"horario\":\"12:00\",\"diaSemana\":" + dia + ",\"versaoPlano\":" + versao
                + ",\"itens\":[{\"alimentoId\":" + a.getId() + ",\"quantidadeGramas\":" + gramas + "}]}";
    }
    private int solicitarExame() throws Exception {
        String json = mvc.perform(post(base + "/exames").header("Authorization", nutriToken).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Hemograma\",\"descricao\":\"Anexar resultado\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.data.id");
    }
    private ResultActions enviar(int id, byte[] bytes, String tipo, long versao) throws Exception {
        return mvc.perform(multipart("/api/v1/usuarios/me/exames/" + id + "/arquivo")
                .file(new MockMultipartFile("arquivo", "../../exame.pdf", tipo, bytes)).param("versao", Long.toString(versao)).header("Authorization", pacienteToken));
    }
    private ResultActions acao(Consulta c, String acao, long versao) throws Exception {
        return mvc.perform(post(base + "/consultas/" + c.getId() + "/" + acao).header("Authorization", nutriToken)
                .contentType(MediaType.APPLICATION_JSON).content("{\"versao\":" + versao + "}"));
    }
    private LocalDateTime agora() { return LocalDateTime.now(ZoneId.of("America/Sao_Paulo")).withNano(0); }
    private String login(String email) throws Exception {
        String json = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"senha\":\"senha123\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonPath.read(json, "$.data.token");
    }
}
