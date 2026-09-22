package com.nutri4you.backend.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class AsyncEmailDispatcher {

    private static final Logger log = LoggerFactory.getLogger(AsyncEmailDispatcher.class);

    private final EmailSender emailSender;

    public AsyncEmailDispatcher(EmailSender emailSender) {
        this.emailSender = emailSender;
    }

    @Async
    public void enviar(String destinatario, String assunto, String corpo) {
        try {
            emailSender.enviar(destinatario, assunto, corpo);
        } catch (Exception exception) {
            log.error("Falha ao enviar e-mail para {}: {}", destinatario, exception.getMessage());
        }
    }
}
