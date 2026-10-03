package com.nutri4you.backend.exception;

import com.nutri4you.backend.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(PlanoNaoEncontradoException.class)
    public ResponseEntity<ApiErrorResponse> handlePlanoNaoEncontrado(
            PlanoNaoEncontradoException exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiErrorResponse.of(
                404, "NAO_ENCONTRADO", exception.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(PlanoConflitoException.class)
    public ResponseEntity<ApiErrorResponse> handlePlanoConflito(
            PlanoConflitoException exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiErrorResponse.of(
                409, "CONFLITO", exception.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiErrorResponse> handleEdicaoConcorrente(
            ObjectOptimisticLockingFailureException exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiErrorResponse.of(
                409, "CONFLITO", "O rascunho foi alterado. Recarregue antes de continuar.", request.getRequestURI()));
    }

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

    @ExceptionHandler(AcessoNegadoException.class)
    public ResponseEntity<ApiErrorResponse> handleAcessoNegado(
            AcessoNegadoException exception,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiErrorResponse.of(
                HttpStatus.FORBIDDEN.value(),
                "ACESSO_NEGADO",
                exception.getMessage(),
                request.getRequestURI()));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMetodoNaoPermitido(
            HttpRequestMethodNotSupportedException exception,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(ApiErrorResponse.of(
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                "METODO_NAO_PERMITIDO",
                "Operação não disponível.",
                request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(
            Exception exception,
            HttpServletRequest request) {
        log.error("Erro não tratado em {}", request.getRequestURI(), exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "ERRO_INTERNO",
                "Ocorreu um erro inesperado. Tente novamente mais tarde.",
                request.getRequestURI()));
    }
}
