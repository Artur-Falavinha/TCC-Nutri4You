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
        despachar(destinatario, () -> emailSender.enviar(destinatario, assunto, corpo));
    }

    @Async
    public void enviarFormatado(String destinatario, String assunto, String texto, String html) {
        despachar(destinatario, () -> emailSender.enviarFormatado(destinatario, assunto, texto, html));
    }

    private void despachar(String destinatario, Runnable envio) {
        try {
            envio.run();
        } catch (Exception exception) {
            log.error("Falha ao enviar e-mail para {}: {}", destinatario, exception.getMessage());
        }
    }
}
