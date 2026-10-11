package com.nutri4you.backend.exception;

public class ConsultaConflitoException extends RuntimeException {
    public ConsultaConflitoException() {
        super("Esta consulta foi alterada por outra sessao. Recarregue antes de salvar.");
    }
}
