package com.nutri4you.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.RelacaoClinica;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AgendaPacienteControllerTest {

    private static final ZoneId FUSO_HORARIO = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter JSON_DATE_TIME =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    @Autowired com.nutri4you.backend.service.HorarioAtendimentoService horarios;
    @Autowired MockMvc mvc;
    @Autowired PacienteRepository pacientes;
    @Autowired NutricionistaRepository nutricionistas;
    @Autowired RelacaoClinicaRepository relacoes;
    @Autowired ConsultaRepository consultas;
    @Autowired PasswordEncoder encoder;

    private Paciente paciente;
    private Nutricionista nutricionista;
    private String tokenPaciente;
    private String tokenNutricionista;

    @BeforeEach
    void preparar() throws Exception {
        nutricionista = nutricionistas.save(TestDataFactory.nutricionista(encoder));
        paciente = pacientes.save(TestDataFactory.pacienteConfirmado(encoder));
        relacoes.save(RelacaoClinica.criar(paciente, nutricionista));
        var configuracao = new java.util.ArrayList<com.nutri4you.backend.dto.HorarioAtendimentoDTO>();
        for (int dia = 1; dia <= 6; dia++) {
            for (String h : java.util.List.of("08:00", "09:00", "09:30", "10:15", "11:00", "14:00", "14:45", "15:30")) {
                configuracao.add(new com.nutri4you.backend.dto.HorarioAtendimentoDTO(dia, java.time.LocalTime.parse(h)));
            }
        }
        horarios.salvar(nutricionista, configuracao);
        tokenPaciente = login("paciente@teste.com");
        tokenNutricionista = login("nutri@teste.com");
    }

    @Test
    void listaSomenteConsultasFuturasNaoCanceladasDoPaciente() throws Exception {
        LocalDateTime futura = proximoDiaAtendimento(3).atTime(10, 15);
        Consulta confirmada = new Consulta(paciente, nutricionista, futura);
        confirmada.atualizar(futura, "CONFIRMADA", null);
        consultas.save(confirmada);
        Consulta cancelada = new Consulta(paciente, nutricionista, proximoDiaAtendimento(4).atTime(11, 0));
        cancelada.cancelar();
        consultas.save(cancelada);

        mvc.perform(get("/api/v1/agenda/consultas").header("Authorization", tokenPaciente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(confirmada.getId()))
                .andExpect(jsonPath("$.data[0].nutricionistaNome").value("Nutricionista Teste"))
                .andExpect(jsonPath("$.data[0].status").value("CONFIRMADA"));
    }

    @Test
    void solicitaConsultaPendenteEImpedeConflitoDeHorario() throws Exception {
        LocalDateTime horario = proximoDiaAtendimento(5).atTime(10, 15);
        String body = solicitacao(horario);
        mvc.perform(post("/api/v1/agenda/consultas")
                        .header("Authorization", tokenPaciente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.data.status").value("AGUARDANDO_CONFIRMACAO"))
                .andExpect(jsonPath("$.data.dataHora").value(jsonDateTime(horario)));

        mvc.perform(post("/api/v1/agenda/consultas")
                        .header("Authorization", tokenPaciente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(solicitacao(horario.plusMinutes(45))))
                .andExpect(status().isCreated());

        mvc.perform(post("/api/v1/agenda/consultas")
                        .header("Authorization", tokenPaciente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(solicitacao(horario)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("CONFLITO"));
    }

    @Test
    void disponibilidadeOcultaSobreposicoesEDomingoNaoPossuiHorarios() throws Exception {
        LocalDate dia = proximoDiaAtendimento(6);
        consultas.save(new Consulta(paciente, nutricionista, dia.atTime(9, 0)));

        mvc.perform(get("/api/v1/agenda/disponibilidade")
                        .header("Authorization", tokenPaciente)
                        .param("nutricionistaId", nutricionista.getId().toString())
                        .param("data", dia.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.duracaoMinutos").value(45))
                .andExpect(jsonPath("$.data.horarios", not(hasItem(jsonDateTime(dia.atTime(9, 0))))))
                .andExpect(jsonPath("$.data.horarios", not(hasItem(jsonDateTime(dia.atTime(9, 30))))))
                .andExpect(jsonPath("$.data.horarios", hasItem(jsonDateTime(dia.atTime(10, 15)))));

        LocalDate domingo = proximoDomingo();
        mvc.perform(get("/api/v1/agenda/disponibilidade")
                        .header("Authorization", tokenPaciente)
                        .param("nutricionistaId", nutricionista.getId().toString())
                        .param("data", domingo.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.horarios.length()").value(0));
    }

    @Test
    void cancelaConfirmadaELiberaHorarioMasProtegePendente() throws Exception {
        LocalDateTime horario = proximoDiaAtendimento(7).atTime(14, 0);
        Consulta confirmada = new Consulta(paciente, nutricionista, horario);
        confirmada.atualizar(horario, "CONFIRMADA", null);
        consultas.saveAndFlush(confirmada);

        mvc.perform(post("/api/v1/agenda/consultas/{id}/cancelamento", confirmada.getId())
                        .header("Authorization", tokenPaciente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"versao\":" + confirmada.getVersao() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELADA"));

        mvc.perform(get("/api/v1/agenda/disponibilidade")
                        .header("Authorization", tokenPaciente)
                        .param("nutricionistaId", nutricionista.getId().toString())
                        .param("data", horario.toLocalDate().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.horarios", hasItem(jsonDateTime(horario))));

        Consulta pendente = consultas.save(new Consulta(
                paciente, nutricionista, proximoDiaAtendimento(8).atTime(15, 30)));
        mvc.perform(post("/api/v1/agenda/consultas/{id}/cancelamento", pendente.getId())
                        .header("Authorization", tokenPaciente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"versao\":" + pendente.getVersao() + "}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void reagendamentoVoltaParaAguardandoConfirmacao() throws Exception {
        LocalDateTime original = proximoDiaAtendimento(9).atTime(8, 0);
        LocalDateTime novo = proximoDiaAtendimento(10).atTime(11, 0);
        Consulta consulta = new Consulta(paciente, nutricionista, original);
        consulta.atualizar(original, "CONFIRMADA", null);
        consultas.saveAndFlush(consulta);

        mvc.perform(put("/api/v1/agenda/consultas/{id}/reagendamento", consulta.getId())
                        .header("Authorization", tokenPaciente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dataHora\":\"" + novo + "\",\"versao\":" + consulta.getVersao() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("AGUARDANDO_CONFIRMACAO"))
                .andExpect(jsonPath("$.data.dataHora").value(jsonDateTime(novo)));
    }

    @Test
    void restringeAgendaAoPacienteEVinculoAtivo() throws Exception {
        LocalDateTime horario = proximoDiaAtendimento(11).atTime(10, 15);
        mvc.perform(get("/api/v1/agenda/consultas"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/agenda/consultas").header("Authorization", tokenNutricionista))
                .andExpect(status().isForbidden());

        Nutricionista outro = nutricionistas.save(new Nutricionista(
                "Outro", "outro-nutri@teste.com", encoder.encode("senha123"), "CRN8-11111"));
        mvc.perform(post("/api/v1/agenda/consultas")
                        .header("Authorization", tokenPaciente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nutricionistaId\":" + outro.getId()
                                + ",\"dataHora\":\"" + horario + "\"}"))
                .andExpect(status().isBadRequest());
    }

    private String solicitacao(LocalDateTime horario) {
        return "{\"nutricionistaId\":" + nutricionista.getId()
                + ",\"dataHora\":\"" + horario + "\"}";
    }

    private String jsonDateTime(LocalDateTime horario) {
        return horario.format(JSON_DATE_TIME);
    }

    private LocalDate proximoDiaAtendimento(int dias) {
        LocalDate data = LocalDate.now(FUSO_HORARIO).plusDays(dias);
        while (data.getDayOfWeek() == DayOfWeek.SUNDAY) {
            data = data.plusDays(1);
        }
        return data;
    }

    private LocalDate proximoDomingo() {
        LocalDate data = LocalDate.now(FUSO_HORARIO).plusDays(1);
        while (data.getDayOfWeek() != DayOfWeek.SUNDAY) {
            data = data.plusDays(1);
        }
        return data;
    }

    private String login(String email) throws Exception {
        String json = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"senha\":\"senha123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonPath.read(json, "$.data.token");
    }
}
