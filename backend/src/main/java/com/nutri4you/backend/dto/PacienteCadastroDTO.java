package com.nutri4you.backend.dto;

import java.time.LocalDate;

public record PacienteCadastroDTO(
        String nome,
        String cpf,
        LocalDate dataNascimento,
        String sexo,
        String telefone,
        String email,
        String senha) {
}