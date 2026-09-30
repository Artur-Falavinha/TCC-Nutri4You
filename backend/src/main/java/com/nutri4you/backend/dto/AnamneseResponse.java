package com.nutri4you.backend.dto;
import java.time.Instant;
import java.util.Map;
public record AnamneseResponse(PacienteResponseDTO paciente, Long versao, String status,
    Map<String, Object> respostas, Map<String, Object> rascunho,
    Instant finalizadaEm, Instant atualizadaEm) {}
