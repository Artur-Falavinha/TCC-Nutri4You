package com.nutri4you.backend.service;

import com.nutri4you.backend.config.EmailProperties;
import com.nutri4you.backend.email.AsyncEmailDispatcher;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.TokenEmail;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public void agendarConfirmacaoCadastro(Paciente paciente) {
        TokenEmail token = tokenEmailService.criarTokenConfirmacao(paciente);
        String link = emailProperties.getApiBaseUrl() + "/auth/confirmar-email?token=" + token.getToken();
        asyncEmailDispatcher.enviar(
                paciente.getEmail(),
                "Confirme seu e-mail — Nutri4You",
                """
                        Olá, %s!

                        Confirme seu cadastro acessando o link:
                        %s

                        O link expira em %d horas.
                        """.formatted(paciente.getNome(), link, emailProperties.getConfirmacaoTtlHoras()));
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
