package com.nutri4you.backend.controller;

import com.nutri4you.backend.model.Anamnese;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.PerguntaAnamnese;
import com.nutri4you.backend.model.RelacaoClinica;
import com.nutri4you.backend.model.RespostaAnamnese;
import com.nutri4you.backend.repository.AnamneseRepository;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.PerguntaAnamneseRepository;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import com.nutri4you.backend.repository.RespostaAnamneseRepository;
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
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AtendimentoClinicoControllerTest {
    private static final String BASE = "/api/v1/agenda-nutricionista/atendimentos";
    private static final String GESTAO = "/api/v1/gestao-pacientes";

    @Autowired MockMvc mvc;
    @Autowired ConsultaRepository consultas;
    @Autowired NutricionistaRepository nutricionistas;
    @Autowired PacienteRepository pacientes;
    @Autowired RelacaoClinicaRepository relacoes;
    @Autowired AnamneseRepository anamneses;
    @Autowired PerguntaAnamneseRepository perguntas;
    @Autowired RespostaAnamneseRepository respostas;
    @Autowired PasswordEncoder encoder;
    @Autowired TokenService tokens;
    @Autowired Clock clock;

    private Nutricionista nutricionista;
    private Nutricionista outraNutricionista;
    private Paciente paciente;
    private String token;

    @BeforeEach
    void preparar() {
        nutricionista = nutricionistas.save(TestDataFactory.nutricionista(encoder));
        outraNutricionista = nutricionistas.save(TestDataFactory.nutricionistaConfirmado("Outra nutricionista",
                "outra@teste.com", encoder.encode("senha123"), "CRN8-22222"));
        paciente = pacientes.save(TestDataFactory.pacienteConfirmado(encoder));
        token = bearer(nutricionista.getEmail());
    }

    @Test
    void permiteRegistrarApenasDepoisDeIniciarELimitaLeituraAposConclusao() throws Exception {
        Consulta consulta = consulta(nutricionista, agora().minusMinutes(5), "CONFIRMADA", true);
        registrarAnamnese();
        String url = BASE + "/" + consulta.getId();
        String ficha = GESTAO + "/" + paciente.getId();

        mvc.perform(get(BASE).header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].pacienteNome").value(paciente.getNome()))
                .andExpect(jsonPath("$.data[0].pacienteId").doesNotExist());
        mvc.perform(get(url).header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.podeIniciar").value(true))
                .andExpect(jsonPath("$.data.pacienteId").doesNotExist())
                .andExpect(jsonPath("$.data.contextoClinico").doesNotExist());
        mvc.perform(put(url).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content(registro(consulta))).andExpect(status().isForbidden());

        mvc.perform(post(url + "/inicio").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"versao\":99}"))
                .andExpect(status().isConflict());
        mvc.perform(post(url + "/inicio").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"versao\":0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pacienteId").value(paciente.getId()))
                .andExpect(jsonPath("$.data.iniciadaEm").exists())
                .andExpect(jsonPath("$.data.contextoClinico.anamneseFinalizada.allergy").value("Sim"))
                .andExpect(jsonPath("$.data.contextoClinico.anamneseFinalizada.height").value(1.72))
                .andExpect(jsonPath("$.data.contextoClinico.anamneseFinalizada.weight").value(70.5))
                .andExpect(jsonPath("$.data.contextoClinico.anamneseFinalizada.phone").doesNotExist())
                .andExpect(jsonPath("$.data.contextoClinico.anamneseFinalizada.diagnoses").doesNotExist());
        mvc.perform(get(ficha + "/anamnese").header("Authorization", token))
                .andExpect(status().isForbidden());
        mvc.perform(get(ficha).header("Authorization", token))
                .andExpect(status().isForbidden());

        mvc.perform(put(url).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content(registro(consulta)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REALIZADA"))
                .andExpect(jsonPath("$.data.avaliacao.peso").value(75))
                .andExpect(jsonPath("$.data.contextoClinico").doesNotExist());
        mvc.perform(get(url).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.observacao").value("Registro próprio"))
                .andExpect(jsonPath("$.data.contextoClinico").doesNotExist());
        mvc.perform(put(url).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content(registro(consulta))).andExpect(status().isForbidden());

        relacoes.saveAndFlush(RelacaoClinica.criar(paciente, nutricionista));
        mvc.perform(get(ficha + "/consultas/" + consulta.getId()).header("Authorization", token))
                .andExpect(status().isNotFound());
        mvc.perform(get(ficha + "/avaliacoes").header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    void restringeAcessoAoResponsavelEPermiteIniciarAvulsasConfirmadasAntesOuDepois() throws Exception {
        Consulta futura = consulta(nutricionista, agora().plusHours(1), "CONFIRMADA", true);
        Consulta cancelada = consulta(nutricionista, agora().plusHours(2), "CANCELADA", true);
        var outroPaciente = pacientes.save(TestDataFactory.outroPaciente(encoder));
        Consulta falta = new Consulta(outroPaciente, nutricionista, agora().minusHours(1), true);
        falta.atualizar(falta.getDataHora(), "CONFIRMADA", null);
        consultas.saveAndFlush(falta);
        Consulta realizadaSemInicio = new Consulta(outroPaciente, outraNutricionista, agora().minusHours(2), true);
        realizadaSemInicio.atualizar(realizadaSemInicio.getDataHora(), "REALIZADA", null);
        consultas.saveAndFlush(realizadaSemInicio);
        Consulta alheia = consulta(outraNutricionista, agora(), "CONFIRMADA", true);

        mvc.perform(get(BASE)).andExpect(status().isUnauthorized());
        mvc.perform(get(BASE).header("Authorization", bearer(paciente.getEmail())))
                .andExpect(status().isForbidden());
        mvc.perform(get(BASE).header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].podeIniciar").value(true));
        for (Consulta excluida : java.util.List.of(cancelada, realizadaSemInicio, alheia)) {
            mvc.perform(get(BASE + "/" + excluida.getId()).header("Authorization", token))
                    .andExpect(status().isNotFound());
        }
        for (Consulta confirmada : java.util.List.of(futura, falta)) {
            mvc.perform(post(BASE + "/" + confirmada.getId() + "/inicio").header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON).content("{\"versao\":0}"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data.iniciadaEm").exists());
        }
        Consulta duplicadaLegada = consulta(nutricionista, agora().plusDays(1), "CONFIRMADA", true);
        mvc.perform(post(BASE + "/" + duplicadaLegada.getId() + "/inicio").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"versao\":0}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void permiteCancelarSomenteAvulsaConfirmadaNaoIniciadaDoResponsavel() throws Exception {
        Consulta futura = consulta(nutricionista, agora().plusHours(2), "CONFIRMADA", true);
        Consulta passada = consulta(nutricionista, agora().minusMinutes(5), "CONFIRMADA", true);
        Consulta iniciada = consulta(nutricionista, agora().plusMinutes(5), "CONFIRMADA", true);
        iniciada.iniciar(agora());
        consultas.flush();
        String url = BASE + "/" + futura.getId();

        cancelar(futura, bearer(outraNutricionista.getEmail()), futura.getVersao())
                .andExpect(status().isNotFound());
        cancelar(futura, token, futura.getVersao() + 1).andExpect(status().isConflict());
        cancelar(passada, token, passada.getVersao()).andExpect(status().isOk());
        cancelar(iniciada, token, iniciada.getVersao()).andExpect(status().isBadRequest());
        cancelar(futura, token, futura.getVersao()).andExpect(status().isOk());
        mvc.perform(get(url).header("Authorization", token)).andExpect(status().isNotFound());
    }

    @Test
    void preservaConsultaLegadaMasBloqueiaLeituraEEscritaSemVinculo() throws Exception {
        Consulta legada = consulta(nutricionista, agora().minusHours(2), "REALIZADA", false);
        String ficha = GESTAO + "/" + paciente.getId();
        String url = ficha + "/consultas/" + legada.getId();
        mvc.perform(get(GESTAO).header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(0)));
        mvc.perform(get(ficha).header("Authorization", token)).andExpect(status().isForbidden());
        mvc.perform(get(url).header("Authorization", token))
                .andExpect(status().isForbidden());
        mvc.perform(put(url).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content(registro(legada))).andExpect(status().isForbidden());
    }

    private ResultActions cancelar(Consulta consulta, String token, long versao)
            throws Exception {
        return mvc.perform(post(BASE + "/" + consulta.getId() + "/cancelamento").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"versao\":" + versao + "}"));
    }

    private Consulta consulta(Nutricionista profissional, LocalDateTime horario, String status, boolean avulsa) {
        Consulta consulta = new Consulta(paciente, profissional, horario, avulsa);
        consulta.atualizar(horario, status, null);
        return consultas.saveAndFlush(consulta);
    }

    private void registrarAnamnese() {
        var anamnese = new Anamnese();
        anamnese.pacienteId = paciente.getId();
        anamnese.nutricionistaId = outraNutricionista.getId();
        anamnese.finalizadaEm = Instant.now();
        anamnese.atualizadaEm = Instant.now();
        anamnese.rascunho = "{\"diagnoses\":[\"Rascunho de outra nutricionista\"]}";
        anamneses.save(anamnese);
        publicarResposta("allergy", "\"Sim\"");
        publicarResposta("phone", "\"41999990000\"");
        publicarResposta("height", "1.72", false);
        publicarResposta("weight", "70.5", false);
    }

    private void publicarResposta(String campo, String valor) {
        publicarResposta(campo, valor, true);
    }

    private void publicarResposta(String campo, String valor, boolean ativo) {
        var pergunta = new PerguntaAnamnese();
        pergunta.codigo = campo;
        pergunta.texto = campo;
        pergunta.categoria = "Histórico de Saúde";
        pergunta.tipo = "text";
        pergunta.ativo = ativo;
        var resposta = new RespostaAnamnese();
        resposta.pergunta = perguntas.save(pergunta);
        resposta.pacienteId = paciente.getId();
        resposta.texto = valor;
        resposta.atualizadaEm = agora();
        respostas.save(resposta);
    }

    private String registro(Consulta consulta) {
        return """
                {"dataHora":"%s","status":"REALIZADA","observacao":"Registro próprio","versao":%d,
                 "avaliacao":{"peso":75,"altura":1.80}}
                """.formatted(consulta.getDataHora(), consulta.getVersao());
    }

    private LocalDateTime agora() {
        return LocalDateTime.now(clock).withNano(0);
    }

    private String bearer(String email) {
        return "Bearer " + tokens.gerarToken(email);
    }
}
