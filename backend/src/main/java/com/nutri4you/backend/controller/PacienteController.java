package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.MensagemResponse;
import com.nutri4you.backend.dto.PacienteCadastroDTO;
import com.nutri4you.backend.dto.PacienteResponseDTO;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.service.GestaoPacienteService;
import com.nutri4you.backend.service.PacienteNaoEncontradoException;
import com.nutri4you.backend.service.PacienteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pacientes")
public class PacienteController {

    private final PacienteService pacienteService;
    private final GestaoPacienteService gestaoPacienteService;

    public PacienteController(PacienteService pacienteService, GestaoPacienteService gestaoPacienteService) {
        this.pacienteService = pacienteService;
        this.gestaoPacienteService = gestaoPacienteService;
    }

    @PostMapping("/autocadastro")
    public ResponseEntity<ApiResponse<MensagemResponse>> autocadastro(@RequestBody PacienteCadastroDTO dto) {
        pacienteService.cadastrarPaciente(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                new MensagemResponse("Paciente cadastrado com sucesso!"),
                "Paciente cadastrado com sucesso!"));
    }

    @PostMapping
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public ResponseEntity<ApiResponse<PacienteResponseDTO>> criarPorNutricionista(
            Authentication authentication,
            @RequestBody PacienteCadastroDTO dto) {
        Nutricionista nutricionista = extrairNutricionista(authentication);
        PacienteResponseDTO criado = gestaoPacienteService.criarPaciente(nutricionista, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                criado,
                "Paciente cadastrado e vinculado com sucesso!"));
    }

    @PatchMapping("/{idPaciente}/inativar")
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public ResponseEntity<Void> inativar(
            Authentication authentication,
            @PathVariable Integer idPaciente) {
        Nutricionista nutricionista = extrairNutricionista(authentication);
        try {
            gestaoPacienteService.inativar(nutricionista, idPaciente);
            return ResponseEntity.noContent().build();
        } catch (PacienteNaoEncontradoException exception) {
            return ResponseEntity.notFound().build();
        } catch (AcessoNegadoException exception) {
            return ResponseEntity.status(403).build();
        }
    }

    @PatchMapping("/{idPaciente}/reativar")
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public ResponseEntity<ApiResponse<PacienteResponseDTO>> reativar(
            Authentication authentication,
            @PathVariable Integer idPaciente) {
        Nutricionista nutricionista = extrairNutricionista(authentication);
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                    gestaoPacienteService.reativar(nutricionista, idPaciente),
                    "Paciente reativado com sucesso."));
        } catch (PacienteNaoEncontradoException exception) {
            return ResponseEntity.notFound().build();
        } catch (AcessoNegadoException exception) {
            return ResponseEntity.status(403).build();
        }
    }

    private Nutricionista extrairNutricionista(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Nutricionista nutricionista)) {
            throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        }
        return nutricionista;
    }
}
