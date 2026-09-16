package com.nutri4you.backend.email;

public interface EmailSender {

    void enviar(String destinatario, String assunto, String corpo);
}
