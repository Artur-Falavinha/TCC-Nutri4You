package com.nutri4you.backend.exception;
public class ExameNaoEncontradoException extends RuntimeException {
    public ExameNaoEncontradoException() { super("Exame ou arquivo não encontrado."); }
}
