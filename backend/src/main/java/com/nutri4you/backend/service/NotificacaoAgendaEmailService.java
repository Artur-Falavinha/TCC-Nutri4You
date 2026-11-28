package com.nutri4you.backend.service;

import com.nutri4you.backend.config.EmailProperties;
import com.nutri4you.backend.email.AsyncEmailDispatcher;
import com.nutri4you.backend.email.ContaEmailTemplate;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.Nutricionista;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class NotificacaoAgendaEmailService {
    private static final DateTimeFormatter FORMATO_HORARIO =
            DateTimeFormatter.ofPattern("dd/MM/uuuu 'às' HH:mm", Locale.forLanguageTag("pt-BR"));

    private final ApplicationEventPublisher eventos;
    private final EmailProperties configuracao;
    private final ContaEmailTemplate modelo;
    private final AsyncEmailDispatcher dispatcher;

    public NotificacaoAgendaEmailService(ApplicationEventPublisher eventos, EmailProperties configuracao,
                                         ContaEmailTemplate modelo, AsyncEmailDispatcher dispatcher) {
        this.eventos = eventos;
        this.configuracao = configuracao;
        this.modelo = modelo;
        this.dispatcher = dispatcher;
    }

    public void agendar(Consulta consulta, Tipo tipo) {
        LocalDateTime horario = consulta.getDataHora();
        agendar(consulta.getNutricionista(), tipo, tipo.rotuloHorario + horario.format(FORMATO_HORARIO));
    }

    public void agendarCancelamentosPorVinculo(Nutricionista nutricionista, int total) {
        if (total == 0) return;
        String detalhe = total == 1
                ? "Uma consulta foi cancelada com o encerramento do vínculo."
                : "%d consultas foram canceladas com o encerramento do vínculo.".formatted(total);
        agendar(nutricionista, Tipo.VINCULO_ENCERRADO, detalhe);
    }

    private void agendar(Nutricionista nutricionista, Tipo tipo, String detalhe) {
        if (nutricionista.notificaAgendaPorEmail()) {
            eventos.publishEvent(new Aviso(nutricionista.getEmail(), tipo, detalhe));
        }
    }

    @TransactionalEventListener
    void enviarAposCommit(Aviso aviso) {
        Tipo tipo = aviso.tipo();
        String link = configuracao.getWebBaseUrl().replaceFirst("/+$", "") + tipo.rota;
        var conteudo = modelo.notificacaoAgenda(tipo.titulo, tipo.descricao, aviso.detalhe(), tipo.acao, link);
        dispatcher.enviarFormatado(aviso.destinatario(), tipo.titulo + " — Nutri4You", conteudo.texto(), conteudo.html());
    }

    public enum Tipo {
        SOLICITADA("Nova solicitação de consulta", "Uma consulta foi solicitada e aguarda sua confirmação.",
                "Horário solicitado: ", "Ver solicitações", "/notificacoes"),
        REAGENDAMENTO_SOLICITADO("Solicitação de reagendamento", "Foi solicitado um novo horário para uma consulta. O pedido aguarda sua confirmação.",
                "Novo horário solicitado: ", "Ver solicitações", "/notificacoes"),
        CONFIRMADA("Consulta confirmada", "Uma consulta foi confirmada na sua agenda.",
                "Horário confirmado: ", "Abrir Nutri4You", "/dashboard"),
        RECUSADA("Solicitação de consulta recusada", "Uma solicitação de consulta foi recusada.",
                "Horário solicitado: ", "Abrir Nutri4You", "/dashboard"),
        CANCELADA("Consulta cancelada", "Uma consulta da sua agenda foi cancelada.",
                "Horário anterior: ", "Abrir Nutri4You", "/dashboard"),
        VINCULO_ENCERRADO("Consultas canceladas por encerramento de vínculo", "Sua agenda foi atualizada.",
                "", "Abrir Nutri4You", "/dashboard");

        private final String titulo;
        private final String descricao;
        private final String rotuloHorario;
        private final String acao;
        private final String rota;

        Tipo(String titulo, String descricao, String rotuloHorario, String acao, String rota) {
            this.titulo = titulo;
            this.descricao = descricao;
            this.rotuloHorario = rotuloHorario;
            this.acao = acao;
            this.rota = rota;
        }
    }

    record Aviso(String destinatario, Tipo tipo, String detalhe) {
    }
}
