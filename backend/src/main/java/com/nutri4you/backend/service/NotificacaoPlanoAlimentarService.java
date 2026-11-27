package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.NotificacaoPlanoAlimentarDTO;
import com.nutri4you.backend.email.AsyncEmailDispatcher;
import com.nutri4you.backend.email.ContaEmailTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import com.nutri4you.backend.model.NotificacaoPlanoAlimentar;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.PlanoAlimentar;
import com.nutri4you.backend.repository.NotificacaoPlanoAlimentarRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificacaoPlanoAlimentarService {
    private static final Logger LOG = LoggerFactory.getLogger(NotificacaoPlanoAlimentarService.class);
    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM/uuuu");
    private final NotificacaoPlanoAlimentarRepository avisos;
    private final ApplicationEventPublisher eventos;
    private final ContaEmailTemplate modelo;
    private final AsyncEmailDispatcher dispatcher;

    public NotificacaoPlanoAlimentarService(NotificacaoPlanoAlimentarRepository avisos,
            ApplicationEventPublisher eventos, ContaEmailTemplate modelo, AsyncEmailDispatcher dispatcher) {
        this.avisos = avisos;
        this.eventos = eventos;
        this.modelo = modelo;
        this.dispatcher = dispatcher;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(PlanoAlimentar plano, boolean atualizacao) {
        avisos.save(new NotificacaoPlanoAlimentar(plano, atualizacao));
        if (plano.getPlanoAnterior() != null) {
            eventos.publishEvent(new EdicaoPublicada(plano.getPaciente().getEmail(), plano.getVigenciaInicio()));
        }
    }

    @TransactionalEventListener
    void enviarAposCommit(EdicaoPublicada aviso) {
        try {
            var conteudo = modelo.notificacaoEdicaoDieta(aviso.inicio().format(DATA_BR));
            dispatcher.enviarFormatado(aviso.destinatario(), "Sua dieta foi atualizada — Nutri4You",
                    conteudo.texto(), conteudo.html());
        } catch (RuntimeException e) {
            LOG.warn("Não foi possível agendar o envio do aviso de atualização da dieta.");
        }
    }

    record EdicaoPublicada(String destinatario, LocalDate inicio) {}

    @Transactional(readOnly = true)
    public List<NotificacaoPlanoAlimentarDTO> listar(Paciente paciente) {
        return avisos.findTop50ByPacienteIdOrderByIdDesc(paciente.getId()).stream()
                .map(aviso -> new NotificacaoPlanoAlimentarDTO(aviso.getId(), aviso.getTitulo(), aviso.isAtualizacao(),
                        aviso.getVigenciaInicio(), aviso.getVigenciaFim(), aviso.getCriadaEm(), aviso.isEdicaoAgendada()))
                .toList();
    }
}
