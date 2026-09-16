package com.nutri4you.backend.dto;

public record PacienteResumoDTO(
        Integer id,
        String nome,
        String email,
        String cpf) {
}
