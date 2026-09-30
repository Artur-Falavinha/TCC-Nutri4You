package com.nutri4you.backend.exception;
import java.util.Map;
public class AnamneseValidationException extends RuntimeException {
    public final Map<String, String> fields;
    public AnamneseValidationException(Map<String, String> fields) {
        super("Revise os campos indicados.");
        this.fields = fields;
    }
}
