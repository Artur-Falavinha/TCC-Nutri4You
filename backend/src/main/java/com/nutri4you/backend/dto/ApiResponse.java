package com.nutri4you.backend.dto;

import java.time.Instant;

/**
 * Envelope padrão de respostas de sucesso (RNF09/RNF10).
 */
public record ApiResponse<T>(T data, String message, Instant timestamp) {

    public static <T> ApiResponse<T> ok(T data) {
        return ok(data, null);
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(data, message, Instant.now());
    }
}
