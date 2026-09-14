package com.nutri4you.backend.dto;

public record UsuarioInfoDTO(
        Integer id,
        String nome,
        String email,
        String perfil) {
}