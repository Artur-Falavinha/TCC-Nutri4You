package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.MensagemResponse;
import com.nutri4you.backend.dto.PacienteResumoDTO;
import com.nutri4you.backend.dto.PacienteResponseDTO;
import com.nutri4you.backend.dto.PacienteUpdateDTO;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.service.GestaoPacienteService;
import com.nutri4you.backend.service.PacienteNaoEncontradoException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/gestao-pacientes")
public class GestaoPacienteController {

    private final GestaoPacienteService gestaoPacienteService;

    public GestaoPacienteController(GestaoPacienteService gestaoPacienteService) {
        this.gestaoPacienteService = gestaoPacienteService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PacienteResponseDTO>>> listar(Authentication authentication) {
        Nutricionista nutricionista = extrairNutricionista(authentication);
        return ResponseEntity.ok(ApiResponse.ok(
                gestaoPacienteService.listarParaNutricionista(nutricionista),
                "Pacientes listados com sucesso."));
    }

    @GetMapping("/busca")
    public ResponseEntity<ApiResponse<PacienteResumoDTO>> buscar(
            Authentication authentication,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String cpf) {
        extrairNutricionista(authentication);
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                    gestaoPacienteService.buscarPaciente(email, cpf),
                    "Paciente encontrado com sucesso."));
        } catch (PacienteNaoEncontradoException exception) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PacienteResponseDTO>> buscarPorId(
            Authentication authentication,
            @PathVariable Integer id) {
        Nutricionista nutricionista = extrairNutricionista(authentication);
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                    gestaoPacienteService.buscarPorId(nutricionista, id),
                    "Paciente encontrado com sucesso."));
        } catch (PacienteNaoEncontradoException exception) {
            return ResponseEntity.notFound().build();
        } catch (AcessoNegadoException exception) {
            return ResponseEntity.status(403).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PacienteResponseDTO>> atualizar(
            Authentication authentication,
            @PathVariable Integer id,
            @RequestBody PacienteUpdateDTO dto) {
        Nutricionista nutricionista = extrairNutricionista(authentication);
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                    gestaoPacienteService.atualizar(nutricionista, id, dto),
                    "Paciente atualizado com sucesso."));
        } catch (PacienteNaoEncontradoException exception) {
            return ResponseEntity.notFound().build();
        } catch (AcessoNegadoException exception) {
            return ResponseEntity.status(403).build();
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/vincular")
    public ResponseEntity<ApiResponse<MensagemResponse>> vincular(
            Authentication authentication,
            @PathVariable Integer id) {
        Nutricionista nutricionista = extrairNutricionista(authentication);
        try {
            gestaoPacienteService.vincular(nutricionista, id);
            return ResponseEntity.ok(ApiResponse.ok(
                    new MensagemResponse("Paciente vinculado com sucesso."),
                    "Paciente vinculado com sucesso."));
        } catch (PacienteNaoEncontradoException exception) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}/relacao")
    public ResponseEntity<ApiResponse<MensagemResponse>> desvincular(
            Authentication authentication,
            @PathVariable Integer id) {
        Nutricionista nutricionista = extrairNutricionista(authentication);
        try {
            gestaoPacienteService.desvincularNutricionista(nutricionista, id);
            return ResponseEntity.ok(ApiResponse.ok(
                    new MensagemResponse("Relação recorrente encerrada com sucesso."),
                    "Relação recorrente encerrada com sucesso."));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().build();
        }
    }

    private Nutricionista extrairNutricionista(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Nutricionista nutricionista)) {
            throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        }
        return nutricionista;
    }
}
