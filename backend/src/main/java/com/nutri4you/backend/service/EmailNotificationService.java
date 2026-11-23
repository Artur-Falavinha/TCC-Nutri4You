package com.nutri4you.backend.service;

import com.nutri4you.backend.config.EmailProperties;
import com.nutri4you.backend.email.AsyncEmailDispatcher;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.TipoCadastro;
import com.nutri4you.backend.model.TokenEmail;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

@Service
public class EmailNotificationService {

    private final EmailProperties emailProperties;
    private final TokenEmailService tokenEmailService;
    private final AsyncEmailDispatcher asyncEmailDispatcher;

    public EmailNotificationService(
            EmailProperties emailProperties,
            TokenEmailService tokenEmailService,
            AsyncEmailDispatcher asyncEmailDispatcher) {
        this.emailProperties = emailProperties;
        this.tokenEmailService = tokenEmailService;
        this.asyncEmailDispatcher = asyncEmailDispatcher;
    }

    public void agendarInicioCadastro(String email, TipoCadastro tipoUsuario, UUID token) {
        String codigoParaAplicativo = tipoUsuario == TipoCadastro.PACIENTE
                ? "\nVocê também pode colar este código no aplicativo Nutri4You:\n" + token + "\n" : "";
        String corpo = """
                Abra o link e selecione Confirmar e-mail para continuar seu cadastro no Nutri4You:
                %s
                %s
                O link expira em %d horas até a confirmação. Depois de confirmar, você tem 30 minutos para concluir.
                Se você não solicitou, ignore este e-mail.
                """.formatted(emailProperties.linkCadastro(token), codigoParaAplicativo, emailProperties.getConfirmacaoTtlHoras());

        enviarConfirmacaoAposCommit(email, corpo);
    }

    @Transactional
    public void agendarRecuperacaoSenha(Paciente paciente) {
        TokenEmail token = tokenEmailService.criarTokenRecuperacao(paciente);
        enviarRecuperacaoAssincrona(paciente.getEmail(), paciente.getNome(), token);
    }

    @Transactional
    public void agendarRecuperacaoSenha(Nutricionista nutricionista) {
        TokenEmail token = tokenEmailService.criarTokenRecuperacao(nutricionista);
        enviarRecuperacaoAssincrona(nutricionista.getEmail(), nutricionista.getNome(), token);
    }

    private void enviarConfirmacaoAposCommit(String destinatario, String corpo) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                asyncEmailDispatcher.enviar(destinatario, "Confirme seu e-mail — Nutri4You", corpo);
            }
        });
    }

    private void enviarRecuperacaoAssincrona(String email, String nome, TokenEmail token) {
        String link = emailProperties.getWebBaseUrl() + "/redefinir-senha?token=" + token.getToken();
        asyncEmailDispatcher.enviar(
                email,
                "Recuperação de senha — Nutri4You",
                """
                        Olá, %s!

                        Para redefinir sua senha, acesse:
                        %s

                        O link expira em %d hora(s).
                        Se você não solicitou, ignore este e-mail.
                        """.formatted(nome, link, emailProperties.getRecuperacaoTtlHoras()));
    }
}
