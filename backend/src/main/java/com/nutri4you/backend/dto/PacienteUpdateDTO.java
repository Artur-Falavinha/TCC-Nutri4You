package com.nutri4you.backend.dto;

import java.time.LocalDate;

public record PacienteUpdateDTO(
        String nome,
        String telefone,
        String sexo,
        LocalDate dataNascimento) {
}