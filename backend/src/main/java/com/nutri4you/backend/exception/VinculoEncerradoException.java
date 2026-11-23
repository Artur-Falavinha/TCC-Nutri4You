package com.nutri4you.backend.exception;

public class VinculoEncerradoException extends AcessoNegadoException {
    public VinculoEncerradoException() {
        super("O vínculo com este paciente foi encerrado. As consultas em aberto foram canceladas.");
    }
}
