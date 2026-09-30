package com.nutri4you.backend.exception;
public class AnamneseConflictException extends RuntimeException {
    public AnamneseConflictException() {
        super("A anamnese foi alterada em outra sessão. Recarregue os dados antes de salvar.");
    }
}
