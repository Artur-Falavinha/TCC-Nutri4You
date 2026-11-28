package com.nutri4you.backend.controller;

import com.nutri4you.backend.service.PrivacidadeService;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ConsultaControllerTest {
    @Autowired PrivacidadeService privacidade;
    @Autowired MockMvc mvc;
    @Autowired NutricionistaRepository nutricionistas;
    @Autowired PacienteRepository pacientes;
    @Autowired ConsultaRepository consultas;
    @Autowired RelacaoClinicaRepository relacoes;
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
        TestDataFactory.registrarAceite(privacidade, nutri, paciente);
        consultas.save(TestDataFactory.consulta(paciente, nutri));
        relacoes.save(RelacaoClinica.criar(paciente, nutri));
        base = "/api/v1/gestao-pacientes/" + paciente.getId() + "/consultas";
        token = login("nutri@teste.com");
    }

    @Test
    void registraConsultaIniciadaERecuperaAvaliacaoVinculada() throws Exception {
        String body = completa(80, "Exames apresentados.", "null");
        String json = criar(body).andExpect(status().isOk())
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
    void consultaConcluidaContinuaVisivelMasNaoPodeSerAlteradaOuReaberta() throws Exception {
        String corpo = completa(80, "Registro original", "null")
                .replace("\"status\":\"CONFIRMADA\"", "\"status\":\"REALIZADA\"");
        String json = criar(corpo).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(json, "$.data.id");
        int versao = JsonPath.read(json, "$.data.versao");
        for (String estado : java.util.List.of("REALIZADA", "CONFIRMADA")) {
            mvc.perform(put(base + "/" + id).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                            .content(completa(81, "Alterada", String.valueOf(versao))
                                    .replace("\"status\":\"CONFIRMADA\"", "\"status\":\"" + estado + "\"")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Consulta concluída está disponível somente para leitura."));
        }
        mvc.perform(get(base + "/" + id).header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("REALIZADA"))
                .andExpect(jsonPath("$.data.observacao").value("Registro original"))
                .andExpect(jsonPath("$.data.avaliacao.peso").value(80))
                .andExpect(jsonPath("$.data.versao").value(versao));
    }

    @Test
    void salvaSomenteUmaMedidaERecuperaSemObrigarPesoOuAltura() throws Exception {
        Consulta consulta = consultaIniciada();
        String corpo = """
                {"dataHora":"2025-01-15T14:30","status":"CONFIRMADA","versao":%d,
                 "avaliacao":{"pregaBicipital":12,"percentualGordura":20,"massaMuscularKg":30}}
                """.formatted(consulta.getVersao());
        mvc.perform(put(base + "/" + consulta.getId()).header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("CONFIRMADA"))
                .andExpect(jsonPath("$.data.avaliacao.pregaBicipital").value(12))
                .andExpect(jsonPath("$.data.avaliacao.peso").value(nullValue()))
                .andExpect(jsonPath("$.data.avaliacao.altura").value(nullValue()))
                .andExpect(jsonPath("$.data.avaliacao.imc").value(nullValue()))
                .andExpect(jsonPath("$.data.avaliacao.massaGordaKg").value(nullValue()));
        mvc.perform(get(base + "/" + consulta.getId()).header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.avaliacao.pregaBicipital").value(12))
                .andExpect(jsonPath("$.data.avaliacao.percentualGordura").value(20))
                .andExpect(jsonPath("$.data.avaliacao.massaMuscularKg").value(30));
    }

    @Test
    void bloqueiaAberturaPendentePelaUrlELiberaAposAprovar() throws Exception {
        Consulta pendente = consultas.saveAndFlush(new Consulta(paciente, nutri, LocalDateTime.now().plusDays(1)));
        String url = base + "/" + pendente.getId();
        mvc.perform(get(url).header("Authorization", token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Confirme a solicitação antes de abrir a consulta."));
        mvc.perform(post(url + "/confirmacao").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"versao\":" + pendente.getVersao() + "}"))
                .andExpect(status().isOk());
        mvc.perform(get(url).header("Authorization", token)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMADA"));
    }

    @Test
    void pendentePodeSerRecusadaMasNaoCanceladaEConfirmadaNaoPodeSerRecusada() throws Exception {
        Consulta pendente = consultas.saveAndFlush(new Consulta(paciente, nutri, LocalDateTime.now().plusDays(2)));
        String url = base + "/" + pendente.getId();
        String versao = "{\"versao\":" + pendente.getVersao() + "}";
        mvc.perform(post(url + "/cancelamento").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content(versao)).andExpect(status().isBadRequest());
        mvc.perform(post(url + "/recusa").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content(versao))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("RECUSADA"));
        mvc.perform(get(url).header("Authorization", token)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RECUSADA"));
        Consulta confirmada = consultaIniciada();
        mvc.perform(post(base + "/" + confirmada.getId() + "/recusa").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"versao\":" + confirmada.getVersao() + "}"))
                .andExpect(status().isBadRequest());
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
    void preservaGorduraManualComSetePregasEModoAposReabrir() throws Exception {
        paciente.setDataNascimento(LocalDate.of(1995, 1, 15));
        String json = criar(composicao("null", """
                "modoPercentualGordura":"MANUAL","percentualGordura":2,
                "massaGordaKg":80,"massaMagraKg":0,
                """ + setePregas("20")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avaliacao.percentualGordura").value(2))
                .andExpect(jsonPath("$.data.avaliacao.massaGordaKg").value(1.47))
                .andExpect(jsonPath("$.data.avaliacao.massaMagraKg").value(71.78))
                .andExpect(jsonPath("$.data.avaliacao.massaMuscularKg").value(nullValue()))
                .andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(json, "$.data.id");
        int versao = JsonPath.read(json, "$.data.versao");

        mvc.perform(get(base + "/" + id).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avaliacao.metodoPercentualGordura").value("Informado manualmente"))
                .andExpect(jsonPath("$.data.avaliacao.pregaCoxa").value(20));

        editarComposicao(id, versao, "\"pregaCoxa\":22")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avaliacao.metodoPercentualGordura").value("Informado manualmente"))
                .andExpect(jsonPath("$.data.avaliacao.pregaCoxa").value(22))
                .andExpect(jsonPath("$.data.avaliacao.percentualGordura").value(nullValue()));
    }

    @Test
    void recalculaAutomaticoELimpaResultadoInvalidoSemAlterarHistorico() throws Exception {
        paciente.setDataNascimento(LocalDate.of(1995, 1, 15));
        var anterior = new AvaliacaoAntropometrica(paciente, LocalDateTime.of(2024, 12, 10, 10, 0));
        anterior.setPercentualGordura(new BigDecimal("17.50"));
        anterior.setPregaPeitoral(new BigDecimal("15"));
        anterior = avaliacoes.saveAndFlush(anterior);

        String modo = "\"modoPercentualGordura\":\"AUTOMATICO\",";
        String json = criar(composicao("null", modo + setePregas("20")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avaliacao.percentualGordura").value(19.98))
                .andExpect(jsonPath("$.data.avaliacao.massaGordaKg").value(14.64))
                .andExpect(jsonPath("$.data.avaliacao.massaMagraKg").value(58.61))
                .andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(json, "$.data.id");
        int versao = JsonPath.read(json, "$.data.versao");
        String recalculada = editarComposicao(id, versao, modo + setePregas("22"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avaliacao.percentualGordura").value(21.69))
                .andExpect(jsonPath("$.data.avaliacao.massaGordaKg").value(15.89))
                .andExpect(jsonPath("$.data.avaliacao.massaMagraKg").value(57.36))
                .andReturn().getResponse().getContentAsString();
        versao = JsonPath.read(recalculada, "$.data.versao");

        editarComposicao(id, versao, modo + "\"percentualGordura\":19.98," + setePregas("0.1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avaliacao.percentualGordura").value(nullValue()))
                .andExpect(jsonPath("$.data.avaliacao.massaGordaKg").value(nullValue()))
                .andExpect(jsonPath("$.data.avaliacao.massaMagraKg").value(nullValue()));

        mvc.perform(get(base + "/" + id).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avaliacao.metodoPercentualGordura").value("Jackson-Pollock 7 pregas + Siri"))
                .andExpect(jsonPath("$.data.avaliacao.percentualGordura").value(nullValue()))
                .andExpect(jsonPath("$.data.avaliacao.pregaPeitoral").value(0.1));
        var registroAnterior = avaliacoes.findById(anterior.getId()).orElseThrow();
        assertThat(registroAnterior.getPercentualGordura()).isEqualByComparingTo("17.50");
        assertThat(registroAnterior.getPregaPeitoral()).isEqualByComparingTo("15");
        assertThat(registroAnterior.getMetodoPercentualGordura()).isNull();
    }

    @Test
    void registraPregasParciaisComCalculoIndisponivel() throws Exception {
        String modo = "\"modoPercentualGordura\":\"AUTOMATICO\",";
        String json = criar(composicao("null", modo + "\"pregaCoxa\":22"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avaliacao.pregaCoxa").value(22))
                .andExpect(jsonPath("$.data.avaliacao.pregaPeitoral").value(nullValue()))
                .andExpect(jsonPath("$.data.avaliacao.percentualGordura").value(nullValue()))
                .andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(json, "$.data.id");
        int versao = JsonPath.read(json, "$.data.versao");

        editarComposicao(id, versao, modo + setePregas("20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avaliacao.somaSetePregas").value(140))
                .andExpect(jsonPath("$.data.avaliacao.percentualGordura").value(nullValue()))
                .andExpect(jsonPath("$.data.avaliacao.massaGordaKg").value(nullValue()));
    }

    @Test
    void bloqueiaCriacaoLivreECancelaSemExcluir() throws Exception {
        mvc.perform(post(base).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"dataHora\":\"2030-06-01T10:00\",\"status\":\"CONFIRMADA\"}"))
                .andExpect(status().isBadRequest());
        Consulta c = new Consulta(paciente, nutri, LocalDateTime.of(2030, 6, 1, 10, 0));
        c.atualizar(c.getDataHora(), "CONFIRMADA", null);
        consultas.saveAndFlush(c);
        mvc.perform(post(base + "/" + c.getId() + "/cancelamento").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"versao\":" + c.getVersao() + "}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("CANCELADA"));
        assertThat(consultas.findById(c.getId())).isPresent();
    }

    @Test
    void criarRejeitaSobreposicaoEPermiteHorarioAposDuracaoDaConsulta() throws Exception {
        LocalDateTime horario = LocalDateTime.of(2030, 6, 1, 10, 0);
        Consulta existente = new Consulta(paciente, nutri, horario);
        existente.atualizar(horario, "CONFIRMADA", null);
        consultas.saveAndFlush(existente);

        criar(consultaConfirmada(horario.plusMinutes(44))).andExpect(status().isBadRequest());
        criar(consultaConfirmada(horario.plusMinutes(45))).andExpect(status().isBadRequest());
    }

    @Test
    void atualizarIgnoraPropriaConsultaMasRejeitaConflitoComOutra() throws Exception {
        LocalDateTime horario = LocalDateTime.of(2030, 6, 1, 10, 0);
        Consulta consulta = new Consulta(paciente, nutri, horario);
        consulta.atualizar(horario, "CONFIRMADA", null);
        consultas.saveAndFlush(consulta);
        LocalDateTime horarioVizinho = horario.plusHours(1);
        Consulta vizinha = new Consulta(paciente, nutri, horarioVizinho);
        vizinha.atualizar(horarioVizinho, "CONFIRMADA", null);
        consultas.saveAndFlush(vizinha);

        mvc.perform(put(base + "/" + consulta.getId()).header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(consultaConfirmada(horario, consulta.getVersao())))
                .andExpect(status().isBadRequest());

        mvc.perform(put(base + "/" + consulta.getId()).header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(consultaConfirmada(horario.plusMinutes(30), consulta.getVersao())))
                .andExpect(status().isBadRequest());
        assertThat(consultas.findById(consulta.getId()).orElseThrow().getDataHora()).isEqualTo(horario);
    }

    @Test
    void consultaCanceladaNaoBloqueiaHorarioEOutraNutricionistaPodeUsarMesmoHorario() throws Exception {
        LocalDateTime horario = LocalDateTime.of(2030, 6, 1, 10, 0);
        Consulta cancelada = new Consulta(paciente, nutri, horario);
        cancelada.cancelar();
        consultas.saveAndFlush(cancelada);

        criar(consultaConfirmada(horario)).andExpect(status().isBadRequest());

        Nutricionista outraNutricionista = nutricionistas.save(new Nutricionista(
                "Outra Nutricionista", "outra@teste.com", encoder.encode("senha123"), "CRN8-22222"));
        LocalDateTime outroHorario = horario.plusDays(1);
        Consulta consultaDeOutraNutri = new Consulta(paciente, outraNutricionista, outroHorario);
        consultaDeOutraNutri.atualizar(outroHorario, "CONFIRMADA", null);
        consultas.saveAndFlush(consultaDeOutraNutri);

        criar(consultaConfirmada(outroHorario)).andExpect(status().isBadRequest());
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
        "{\"dataHora\":\"2025-01-01T10:00\",\"status\":\"REALIZADA\",\"avaliacao\":{\"peso\":70,\"altura\":1.75,\"percentualGordura\":101}}",
        "{\"dataHora\":\"2025-01-15T14:30\",\"status\":\"REALIZADA\",\"avaliacao\":{\"peso\":70,\"altura\":1.75,\"percentualGordura\":0}}",
        "{\"dataHora\":\"2025-01-15T14:30\",\"status\":\"REALIZADA\",\"avaliacao\":{\"peso\":70,\"altura\":1.75,\"percentualGordura\":100}}",
        "{\"dataHora\":\"2025-01-15T14:30\",\"status\":\"REALIZADA\",\"avaliacao\":{\"peso\":70,\"altura\":1.75,\"massaMuscularKg\":0}}",
        "{\"dataHora\":\"2025-01-15T14:30\",\"status\":\"REALIZADA\",\"avaliacao\":{\"peso\":70,\"altura\":1.75,\"massaMuscularKg\":70}}",
        "{\"dataHora\":\"2025-01-15T14:30\",\"status\":\"REALIZADA\",\"avaliacao\":{\"peso\":70,\"altura\":1.75,\"massaMuscularKg\":70.01}}"
    })
    void rejeitaDadosInvalidosSemPersistenciaParcial(String body) throws Exception {
        Consulta c = consultaIniciada();
        long total = consultas.count();
        mvc.perform(put(base + "/" + c.getId()).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content(body)).andExpect(status().isBadRequest());
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
        Consulta consulta = consultaIniciada();
        String url = base + "/" + consulta.getId();
        mvc.perform(put(url).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content(completa(80, "x".repeat(5001), String.valueOf(consulta.getVersao()))))
                .andExpect(status().isBadRequest());
        mvc.perform(put(url).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content(completa(500, "x".repeat(5000), String.valueOf(consulta.getVersao()))
                                .replace("1.80", "0.30")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.avaliacao.imc").value(5555.56));
    }

    private ResultActions editarComposicao(int id, int versao, String medidas) throws Exception {
        return mvc.perform(put(base + "/" + id).header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content(composicao(Integer.toString(versao), medidas)));
    }

    private String composicao(String versao, String medidas) {
        return """
                {"dataHora":"2025-01-15T14:30","status":"CONFIRMADA","versao":%s,
                 "avaliacao":{"peso":73.25,"altura":1.80,%s}}
                """.formatted(versao, medidas);
    }

    private String setePregas(String valor) {
        return """
                "pregaPeitoral":%1$s,"pregaAxilarMedia":%1$s,"pregaTricipital":%1$s,"pregaSubescapular":%1$s,
                "pregaAbdominal":%1$s,"pregaSuprailiaca":%1$s,"pregaCoxa":%1$s
                """.formatted(valor);
    }

    private ResultActions criar(String body) throws Exception {
        Consulta c = consultaIniciada();
        return mvc.perform(put(base + "/" + c.getId()).header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content(body.replace("\"versao\":null", "\"versao\":" + c.getVersao())));
    }
    private Consulta consultaIniciada() {
        Consulta c = new Consulta(paciente, nutri, LocalDateTime.of(2025, 1, 15, 14, 30));
        c.atualizar(c.getDataHora(), "CONFIRMADA", null);
        c.iniciar(c.getDataHora());
        return consultas.saveAndFlush(c);
    }
    private String consultaConfirmada(LocalDateTime dataHora) {
        return consultaConfirmada(dataHora, null);
    }
    private String consultaConfirmada(LocalDateTime dataHora, Long versao) {
        return "{\"dataHora\":\"" + dataHora + "\",\"status\":\"CONFIRMADA\""
                + (versao == null ? "" : ",\"versao\":" + versao) + "}";
    }
    private String login(String email) throws Exception {
        String json = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"senha\":\"senha123\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonPath.read(json, "$.data.token");
    }
    private String completa(int peso, String observacao, String versao) {
        return """
                {"dataHora":"2025-01-15T14:30","status":"CONFIRMADA","observacao":"%s","versao":%s,
                 "avaliacao":{"peso":%d,"altura":1.80,"percentualGordura":20,"massaMuscularKg":35,
                 "pregaBicipital":10,"pregaTricipital":11,"pregaSubescapular":12,"pregaSuprailiaca":12.5,
                 "circunferenciaCintura":80,"circunferenciaQuadril":100,"circunferenciaBraco":30}}
                """.formatted(observacao, versao, peso);
    }
}
