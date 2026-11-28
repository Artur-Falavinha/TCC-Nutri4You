package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.NotificacaoConsultaPacienteDTO;
import com.nutri4you.backend.email.AsyncEmailDispatcher;
import com.nutri4you.backend.email.ContaEmailTemplate;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.NotificacaoConsultaPaciente;
import com.nutri4you.backend.model.NotificacaoConsultaPaciente.Tipo;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.repository.NotificacaoConsultaPacienteRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificacaoConsultaPacienteService {
    private final NotificacaoConsultaPacienteRepository notificacoes;
    private final ApplicationEventPublisher eventos;
    private final ContaEmailTemplate modelo;
    private final AsyncEmailDispatcher dispatcher;
    private final Clock clock;

    public NotificacaoConsultaPacienteService(NotificacaoConsultaPacienteRepository notificacoes,
                                               ApplicationEventPublisher eventos, ContaEmailTemplate modelo,
                                               AsyncEmailDispatcher dispatcher, Clock clock) {
        this.notificacoes = notificacoes;
        this.eventos = eventos;
        this.modelo = modelo;
        this.dispatcher = dispatcher;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<NotificacaoConsultaPacienteDTO> listar(Paciente paciente) {
        return notificacoes.findTop50ByPacienteIdOrderByIdDesc(paciente.getId()).stream()
                .map(aviso -> new NotificacaoConsultaPacienteDTO(aviso.getId(), aviso.getConsultaId(), aviso.getTipo(),
                        aviso.getDataHora(), aviso.getCriadaEm()))
                .toList();
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(Consulta consulta, Tipo tipo) {
        notificacoes.save(new NotificacaoConsultaPaciente(consulta, tipo, clock.instant()));
        Paciente paciente = consulta.getPaciente();
        if (paciente.isEnabled()) {
            eventos.publishEvent(new EmailPaciente(paciente.getEmail(), tipo, consulta.getDataHora()));
        }
    }

    @TransactionalEventListener
    void enviarAposCommit(EmailPaciente evento) {
        String titulo = switch (evento.tipo()) {
            case CONFIRMADA -> "Consulta confirmada";
            case REAGENDADA -> "Consulta reagendada";
            case RECUSADA -> "Solicitação de consulta recusada";
            case CANCELADA -> "Consulta cancelada";
            case LEMBRETE_24H -> "Lembrete de consulta";
        };
        String introducao = switch (evento.tipo()) {
            case CONFIRMADA -> "Seu horário foi confirmado pelo nutricionista.";
            case REAGENDADA -> "O nutricionista confirmou o novo horário da sua consulta.";
            case RECUSADA -> "Sua solicitação de horário foi recusada. Você pode consultar outras disponibilidades no app.";
            case CANCELADA -> "Uma consulta da sua agenda foi cancelada.";
            case LEMBRETE_24H -> "Sua consulta está confirmada e se aproxima. Confira o horário abaixo.";
        };
        var conteudo = modelo.notificacaoConsultaPaciente(titulo, introducao, evento.dataHora());
        dispatcher.enviarFormatado(evento.destinatario(), titulo + " — Nutri4You", conteudo.texto(), conteudo.html());
    }

    record EmailPaciente(String destinatario, Tipo tipo, LocalDateTime dataHora) {
    }
}
