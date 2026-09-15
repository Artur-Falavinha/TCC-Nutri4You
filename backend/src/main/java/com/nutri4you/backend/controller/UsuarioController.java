package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.MensagemResponse;
import com.nutri4you.backend.dto.UsuarioInfoDTO;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.service.GestaoPacienteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    private final GestaoPacienteService gestaoPacienteService;

    public UsuarioController(GestaoPacienteService gestaoPacienteService) {
        this.gestaoPacienteService = gestaoPacienteService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UsuarioInfoDTO>> obterDadosDoUsuarioLogado(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof Paciente paciente) {
            return ResponseEntity.ok(ApiResponse.ok(
                    new UsuarioInfoDTO(
                            paciente.getId(),
                            paciente.getNome(),
                            paciente.getEmail(),
                            "PACIENTE"),
                    "Usuário autenticado."));
        }

        if (principal instanceof Nutricionista nutricionista) {
            return ResponseEntity.ok(ApiResponse.ok(
                    new UsuarioInfoDTO(
                            nutricionista.getId(),
                            nutricionista.getNome(),
                            nutricionista.getEmail(),
                            "NUTRICIONISTA"),
                    "Usuário autenticado."));
        }

        return ResponseEntity.badRequest().build();
    }

    @DeleteMapping("/me/nutricionistas/{idNutricionista}/relacao")
    public ResponseEntity<ApiResponse<MensagemResponse>> desvincularNutricionista(
            Authentication authentication,
            @PathVariable Integer idNutricionista) {
        if (!(authentication.getPrincipal() instanceof Paciente paciente)) {
            throw new AcessoNegadoException("Acesso restrito a pacientes.");
        }

        try {
            gestaoPacienteService.desvincularPaciente(paciente, idNutricionista);
            return ResponseEntity.ok(ApiResponse.ok(
                    new MensagemResponse("Relação recorrente encerrada com sucesso."),
                    "Relação recorrente encerrada com sucesso."));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().build();
        }
    }
}
