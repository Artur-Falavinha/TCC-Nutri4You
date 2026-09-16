package com.nutri4you.backend.service;

import com.nutri4you.backend.config.EmailProperties;
import com.nutri4you.backend.email.EmailSender;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.TokenEmail;
import org.springframework.stereotype.Service;

@Service
public class EmailNotificationService {

    private final EmailSender emailSender;
    private final EmailProperties emailProperties;
    private final TokenEmailService tokenEmailService;

    public EmailNotificationService(
            EmailSender emailSender,
            EmailProperties emailProperties,
            TokenEmailService tokenEmailService) {
        this.emailSender = emailSender;
        this.emailProperties = emailProperties;
        this.tokenEmailService = tokenEmailService;
    }

    public void enviarConfirmacaoCadastro(Paciente paciente) {
        TokenEmail token = tokenEmailService.criarTokenConfirmacao(paciente);
        String link = emailProperties.getApiBaseUrl() + "/auth/confirmar-email?token=" + token.getToken();
        emailSender.enviar(
                paciente.getEmail(),
                "Confirme seu e-mail — Nutri4You",
                """
                        Olá, %s!

                        Confirme seu cadastro acessando o link:
                        %s

                        O link expira em %d horas.
                        """.formatted(paciente.getNome(), link, emailProperties.getConfirmacaoTtlHoras()));
    }

    public void enviarRecuperacaoSenha(Paciente paciente) {
        TokenEmail token = tokenEmailService.criarTokenRecuperacao(paciente);
        String link = emailProperties.getWebBaseUrl() + "/redefinir-senha?token=" + token.getToken();
        emailSender.enviar(
                paciente.getEmail(),
                "Recuperação de senha — Nutri4You",
                """
                        Olá, %s!

                        Para redefinir sua senha, acesse:
                        %s

                        O link expira em %d hora(s).
                        Se você não solicitou, ignore este e-mail.
                        """.formatted(paciente.getNome(), link, emailProperties.getRecuperacaoTtlHoras()));
    }
}
