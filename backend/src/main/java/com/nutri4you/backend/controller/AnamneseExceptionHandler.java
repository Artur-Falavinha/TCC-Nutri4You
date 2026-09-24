package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiErrorResponse;
import com.nutri4you.backend.exception.*;
import com.nutri4you.backend.service.PacienteNaoEncontradoException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestControllerAdvice(assignableTypes = AnamneseController.class)
@Order(0)
public class AnamneseExceptionHandler {
    @ExceptionHandler(AnamneseValidationException.class)
    public ResponseEntity<?> validation(AnamneseValidationException e) {
        return ResponseEntity.unprocessableContent().body(Map.of(
            "status", 422, "error", "VALIDACAO", "message", e.getMessage(), "fields", e.fields));
    }
    @ExceptionHandler(AnamneseConflictException.class)
    public ResponseEntity<?> conflict(AnamneseConflictException e, HttpServletRequest request) {
        return ResponseEntity.status(409).body(ApiErrorResponse.of(
            409, "CONFLITO_VERSAO", e.getMessage(), request.getRequestURI()));
    }
    @ExceptionHandler(PacienteNaoEncontradoException.class)
    public ResponseEntity<?> missing(HttpServletRequest request) {
        return ResponseEntity.status(404).body(ApiErrorResponse.of(
            404, "PACIENTE_NAO_ENCONTRADO", "Paciente não encontrado.", request.getRequestURI()));
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> malformed(HttpServletRequest request) {
        return ResponseEntity.badRequest().body(ApiErrorResponse.of(
            400, "REQUISICAO_INVALIDA", "Corpo da requisição inválido.", request.getRequestURI()));
    }
}
