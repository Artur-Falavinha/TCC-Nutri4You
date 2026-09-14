package com.nutri4you.backend.dto;

public record NutricionistaCadastroDTO(
        String nome,
        String email,
        String senha,
        String crn) {
}