package com.nutri4you.backend.dto;

import java.time.LocalDate;

public record PacientePerfilDTO(
        Integer id,
        String nome,
        String email,
        String telefone,
        String sexo,
        LocalDate dataNascimento) {
}
