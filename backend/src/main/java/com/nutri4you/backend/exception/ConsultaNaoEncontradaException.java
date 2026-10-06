package com.nutri4you.backend.exception;

public class ConsultaNaoEncontradaException extends RuntimeException {
    public ConsultaNaoEncontradaException() { super("Consulta nao encontrada."); }
}
