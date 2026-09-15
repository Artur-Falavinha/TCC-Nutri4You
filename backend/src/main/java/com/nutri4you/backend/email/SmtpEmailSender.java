package com.nutri4you.backend.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "email.provider", havingValue = "smtp")
public class SmtpEmailSender implements EmailSender {

    private final JavaMailSender mailSender;
    private final String remetente;

    public SmtpEmailSender(
            JavaMailSender mailSender,
            @Value("${email.from:noreply@nutri4you.local}") String remetente) {
        this.mailSender = mailSender;
        this.remetente = remetente;
    }

    @Override
    public void enviar(String destinatario, String assunto, String corpo) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(remetente);
        message.setTo(destinatario);
        message.setSubject(assunto);
        message.setText(corpo);
        mailSender.send(message);
    }
}
