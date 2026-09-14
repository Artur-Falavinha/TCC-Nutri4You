package com.nutri4you.backend.service;

public class PacienteNaoEncontradoException extends RuntimeException {

    public PacienteNaoEncontradoException() {
        super("Paciente não encontrado.");
    }
}