package com.nutri4you.backend.service;

import com.nutri4you.backend.email.AsyncEmailDispatcher;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.Nutricionista;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;

import static com.nutri4you.backend.service.NotificacaoAgendaEmailService.Tipo.CANCELADA;
import static com.nutri4you.backend.service.NotificacaoAgendaEmailService.Tipo.SOLICITADA;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@SpringBootTest
class NotificacaoAgendaEmailServiceTest {
    private static final String EMAIL = "nutri@example.com";

    @Autowired NotificacaoAgendaEmailService notificacoes;
    @Autowired PlatformTransactionManager transacoes;
    @MockitoBean AsyncEmailDispatcher dispatcher;

    private final Nutricionista nutricionista = new Nutricionista("Nutri Teste", EMAIL, "hash", "CRN8-12345");
    private final Consulta consulta = new Consulta(null, nutricionista, LocalDateTime.of(2027, 1, 15, 9, 30));

    @Test
    void enviaAvisoFormatadoSomenteDepoisDoCommit() {
        nutricionista.definirNotificacoesEmailAgenda(true);
        new TransactionTemplate(transacoes).executeWithoutResult(status -> {
            notificacoes.agendar(consulta, SOLICITADA);
            verifyNoInteractions(dispatcher);
        });

        verify(dispatcher).enviarFormatado(eq(EMAIL), eq("Nova solicitação de consulta — Nutri4You"),
                contains("15/01/2027 às 09:30"), contains("/notificacoes"));
    }

    @Test
    void respeitaPreferenciaDesativada() {
        new TransactionTemplate(transacoes).executeWithoutResult(status -> notificacoes.agendar(consulta, SOLICITADA));

        verifyNoInteractions(dispatcher);
    }

    @Test
    void descartaAvisoSeOperacaoFizerRollback() {
        nutricionista.definirNotificacoesEmailAgenda(true);
        new TransactionTemplate(transacoes).executeWithoutResult(status -> {
            notificacoes.agendar(consulta, CANCELADA);
            status.setRollbackOnly();
        });

        verifyNoInteractions(dispatcher);
    }

    @Test
    void agrupaCancelamentosDeUmVinculoEmUmEmail() {
        nutricionista.definirNotificacoesEmailAgenda(true);
        new TransactionTemplate(transacoes).executeWithoutResult(status ->
                notificacoes.agendarCancelamentosPorVinculo(nutricionista, 3));

        verify(dispatcher).enviarFormatado(eq(EMAIL), contains("encerramento de vínculo"),
                contains("3 consultas foram canceladas"), contains("/dashboard"));
    }
}
