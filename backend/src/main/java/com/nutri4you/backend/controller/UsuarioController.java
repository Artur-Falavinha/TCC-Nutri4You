package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.UsuarioInfoDTO;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    @GetMapping("/me")
    public ResponseEntity<UsuarioInfoDTO> obterDadosDoUsuarioLogado(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof Paciente paciente) {
            return ResponseEntity.ok(new UsuarioInfoDTO(
                    paciente.getId(),
                    paciente.getNome(),
                    paciente.getEmail(),
                    "PACIENTE"));
        }

        if (principal instanceof Nutricionista nutricionista) {
            return ResponseEntity.ok(new UsuarioInfoDTO(
                    nutricionista.getId(),
                    nutricionista.getNome(),
                    nutricionista.getEmail(),
                    "NUTRICIONISTA"));
        }

        return ResponseEntity.badRequest().build();
    }
}