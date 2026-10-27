package com.nutri4you.backend.exception;

public class PlanoNaoEncontradoException extends RuntimeException {
    public PlanoNaoEncontradoException() { super("Plano alimentar não encontrado."); }
}
