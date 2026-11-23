package com.nutri4you.backend.email;

import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
@ConditionalOnProperty(name = "email.provider", havingValue = "smtp")
public class SmtpEmailSender implements EmailSender {

    private static final ClassPathResource LOGO = new ClassPathResource("email/logo-nutri4you.png");

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

    @Override
    public void enviarFormatado(String destinatario, String assunto, String texto, String html) {
        var mensagem = mailSender.createMimeMessage();
        try {
            var assistente = new MimeMessageHelper(mensagem, MimeMessageHelper.MULTIPART_MODE_RELATED,
                    StandardCharsets.UTF_8.name());
            assistente.setFrom(remetente);
            assistente.setTo(destinatario);
            assistente.setSubject(assunto);
            assistente.setText(texto, html);
            assistente.addInline("logo-nutri4you", LOGO, "image/png");
        } catch (MessagingException exception) {
            throw new MailPreparationException("Não foi possível preparar o e-mail formatado.", exception);
        }
        mailSender.send(mensagem);
    }
}
