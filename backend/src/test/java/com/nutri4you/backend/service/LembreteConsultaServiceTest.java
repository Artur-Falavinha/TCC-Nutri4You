package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.NotificacaoConsultaPacienteDTO;
import com.nutri4you.backend.dto.PacienteUpdateDTO;
import com.nutri4you.backend.dto.PreferenciaLembreteConsultaDTO;
import com.nutri4you.backend.repository.NotificacaoConsultaPacienteRepository;
import com.nutri4you.backend.support.ClinicalServiceTestSupport;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.PlatformTransactionManager;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static com.nutri4you.backend.model.NotificacaoConsultaPaciente.Tipo.LEMBRETE_24H;
import static org.assertj.core.api.Assertions.assertThat;

class LembreteConsultaServiceTest extends ClinicalServiceTestSupport {
    @Autowired NotificacaoConsultaPacienteRepository avisos;
    @Autowired NotificacaoConsultaPacienteService notificacoes;
    @Autowired PlatformTransactionManager transacoes;
    @Autowired PerfilPacienteService perfis;
    @Autowired EntityManager entidades;

    @Test
    void registraUmLembretePorHorarioConfirmadoDentroDaJanela() {
        LocalDateTime agora = agora();
        var servico = servicoComHorario(agora);
        var elegivel = consulta(agora.plusHours(24), "CONFIRMADA");
        consulta(agora.plusHours(24).plusSeconds(1), "CONFIRMADA");
        consulta(agora, "CONFIRMADA");
        consulta(agora.plusHours(6), "CANCELADA");
        consulta(agora.plusHours(7), "AGUARDANDO_CONFIRMACAO");
        var iniciada = consulta(agora.plusHours(8), "CONFIRMADA");
        iniciada.iniciar(agora);
        consultas.flush();

        servico.processarPendentes();
        servico.processarPendentes();

        assertThat(notificacoes.listar(paciente)).singleElement().satisfies(aviso -> {
            assertThat(aviso.tipo()).isEqualTo(LEMBRETE_24H);
            assertThat(aviso.consultaId()).isEqualTo(elegivel.getId());
            assertThat(aviso.dataHora()).isEqualTo(elegivel.getDataHora());
        });
    }

    @Test
    void respeitaPreferenciaAoEditarPerfilEPermiteReativarAntesDaConsulta() {
        LocalDateTime agora = agora();
        var servico = servicoComHorario(agora);
        consulta(agora.plusHours(23), "CONFIRMADA");
        perfis.salvarPreferenciaLembretes(paciente, new PreferenciaLembreteConsultaDTO(false));
        perfis.atualizar(paciente, new PacienteUpdateDTO("Nome atualizado", null, null, null));
        entidades.flush();
        entidades.clear();

        servico.processarPendentes();
        assertThat(notificacoes.listar(paciente)).isEmpty();
        assertThat(pacientes.findById(paciente.getId()).orElseThrow().recebeLembretesConsulta()).isFalse();

        perfis.salvarPreferenciaLembretes(paciente, new PreferenciaLembreteConsultaDTO(true));
        entidades.clear();
        servico.processarPendentes();
        assertThat(notificacoes.listar(paciente)).singleElement()
                .extracting(NotificacaoConsultaPacienteDTO::tipo).isEqualTo(LEMBRETE_24H);
    }

    @Test
    void novoHorarioRecebeLembreteApenasAposSerConfirmado() {
        LocalDateTime agora = agora();
        var servico = servicoComHorario(agora);
        var consulta = consulta(agora.plusHours(20), "CONFIRMADA");
        servico.processarPendentes();

        var novoHorario = agora.plusHours(23);
        consulta.reagendar(novoHorario);
        consultas.flush();
        servico.processarPendentes();
        assertThat(notificacoes.listar(paciente)).hasSize(1);

        consulta.atualizar(novoHorario, "CONFIRMADA", null);
        consultas.flush();
        servico.processarPendentes();
        assertThat(notificacoes.listar(paciente)).extracting(NotificacaoConsultaPacienteDTO::dataHora)
                .containsExactly(novoHorario, agora.plusHours(20));
    }

    private LembreteConsultaService servicoComHorario(LocalDateTime agora) {
        ZoneId fusoClinica = ZoneId.of("America/Sao_Paulo");
        Clock clock = Clock.fixed(agora.atZone(fusoClinica).toInstant(), fusoClinica);
        return new LembreteConsultaService(consultas, avisos, notificacoes, clock, transacoes);
    }
}
