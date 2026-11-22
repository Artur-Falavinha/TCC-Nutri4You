package com.nutri4you.backend.dto;

import java.time.LocalDate;
import java.util.UUID;

public record PacienteCadastroDTO(
        String nome,
        String cpf,
        LocalDate dataNascimento,
        String sexo,
        String telefone,
        String email,
        String senha,
        String versaoTermos,
        UUID tokenCadastro) {
}
