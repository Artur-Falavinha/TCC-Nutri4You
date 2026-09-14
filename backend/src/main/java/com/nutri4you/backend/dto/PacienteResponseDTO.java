package com.nutri4you.backend.dto;

import java.time.LocalDate;

public record PacienteResponseDTO(
        Integer id,
        String nome,
        String cpf,
        String email,
        String telefone,
        String sexo,
        LocalDate dataNascimento) {
}