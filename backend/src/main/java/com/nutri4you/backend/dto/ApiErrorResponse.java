package com.nutri4you.backend.dto;

import java.time.Instant;

/**
 * Envelope padrão de respostas de erro (RNF09/RNF10).
 */
public record ApiErrorResponse(
        int status,
        String error,
        String message,
        String path,
        Instant timestamp) {

    public static ApiErrorResponse of(int status, String error, String message, String path) {
        return new ApiErrorResponse(status, error, message, path, Instant.now());
    }
}
