package com.nutri4you.backend.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "email.provider", havingValue = "console", matchIfMissing = true)
public class ConsoleEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(ConsoleEmailSender.class);

    @Override
    public void enviar(String destinatario, String assunto, String corpo) {
        log.info("""
                ----- E-mail (console) -----
                Para: {}
                Assunto: {}
                {}
                ----------------------------""",
                destinatario, assunto, corpo);
    }
}
