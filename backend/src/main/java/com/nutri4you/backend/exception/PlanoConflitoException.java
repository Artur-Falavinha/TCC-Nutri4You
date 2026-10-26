package com.nutri4you.backend.exception;

public class PlanoConflitoException extends RuntimeException {
    public PlanoConflitoException(String mensagem) {
        super(mensagem);
    }
}
