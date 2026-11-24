package com.nutri4you.backend.service;

import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.NotificacaoConsultaPacienteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.LocalDateTime;

import static com.nutri4you.backend.model.NotificacaoConsultaPaciente.Tipo.LEMBRETE_24H;

@Service
public class LembreteConsultaService {
    private static final Logger log = LoggerFactory.getLogger(LembreteConsultaService.class);
    private static final int TAMANHO_LOTE = 100;

    private final ConsultaRepository consultas;
    private final NotificacaoConsultaPacienteRepository avisos;
    private final NotificacaoConsultaPacienteService notificacoes;
    private final Clock clock;
    private final TransactionTemplate transacao;

    public LembreteConsultaService(ConsultaRepository consultas, NotificacaoConsultaPacienteRepository avisos,
                                 NotificacaoConsultaPacienteService notificacoes, Clock clock,
                                 PlatformTransactionManager transacoes) {
        this.consultas = consultas;
        this.avisos = avisos;
        this.notificacoes = notificacoes;
        this.clock = clock;
        this.transacao = new TransactionTemplate(transacoes);
    }

    public void processarPendentes() {
        LocalDateTime agora = LocalDateTime.now(clock);
        var pendentes = consultas.buscarIdsComLembretePendente(
                agora, agora.plusHours(24), LEMBRETE_24H, PageRequest.of(0, TAMANHO_LOTE));
        for (Integer id : pendentes) {
            try {
                transacao.executeWithoutResult(status -> consultas.bloquearParaLembrete(id)
                        .ifPresent(this::registrarSePendente));
            } catch (RuntimeException falha) {
                log.error("Falha ao registrar lembrete da consulta {}", id, falha);
            }
        }
    }

    private void registrarSePendente(Consulta consulta) {
        LocalDateTime agora = LocalDateTime.now(clock);
        LocalDateTime horario = consulta.getDataHora();
        if ("CONFIRMADA".equals(consulta.getStatus()) && consulta.getIniciadaEm() == null
                && horario.isAfter(agora) && !horario.isAfter(agora.plusHours(24))
                && consulta.getPaciente().recebeLembretesConsulta()
                && !avisos.existsByConsultaIdAndTipoAndDataHora(consulta.getId(), LEMBRETE_24H, horario)) {
            notificacoes.registrar(consulta, LEMBRETE_24H);
        }
    }
}
