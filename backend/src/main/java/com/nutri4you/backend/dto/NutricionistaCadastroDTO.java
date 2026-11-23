package com.nutri4you.backend.dto;

import java.util.UUID;

public record NutricionistaCadastroDTO(
        String nome,
        String email,
        String senha,
        String crn,
        String versaoTermos,
        boolean crnDeclarado,
        UUID tokenCadastro) {
}
