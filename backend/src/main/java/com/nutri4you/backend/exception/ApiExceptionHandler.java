package com.nutri4you.backend.exception;

import com.nutri4you.backend.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
            IllegalArgumentException exception,
            HttpServletRequest request) {
        return ResponseEntity.badRequest().body(ApiErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "REQUISICAO_INVALIDA",
                exception.getMessage(),
                request.getRequestURI()));
    }

    @ExceptionHandler({AuthenticationException.class, UnauthorizedException.class})
    public ResponseEntity<ApiErrorResponse> handleAuthentication(
            RuntimeException exception,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "NAO_AUTORIZADO",
                exception.getMessage(),
                request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(
            Exception exception,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "ERRO_INTERNO",
                "Ocorreu um erro inesperado. Tente novamente mais tarde.",
                request.getRequestURI()));
    }
}
