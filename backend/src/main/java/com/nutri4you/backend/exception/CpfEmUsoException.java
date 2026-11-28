package com.nutri4you.backend.exception;

public class CpfEmUsoException extends RuntimeException {

    public CpfEmUsoException() {
        super("CPF já está em uso no sistema.");
    }
}
