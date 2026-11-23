package com.nutri4you.backend.email;

public interface EmailSender {

    void enviar(String destinatario, String assunto, String corpo);

    default void enviarFormatado(String destinatario, String assunto, String texto, String html) {
        enviar(destinatario, assunto, texto);
    }
}
