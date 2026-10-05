package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.AgendaResponse;
import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.AvaliacaoRequest;
import com.nutri4you.backend.dto.AvaliacaoResponse;
import com.nutri4you.backend.dto.HistoricoResponse;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.service.ClinicoService;
import com.nutri4you.backend.service.PacienteNaoEncontradoException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ClinicoController {

    private final ClinicoService clinicoService;

    public ClinicoController(ClinicoService clinicoService) {
        this.clinicoService = clinicoService;
    }

    @GetMapping("/api/v1/dashboard/consultas")
    public ResponseEntity<ApiResponse<AgendaResponse>> agenda(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(
                clinicoService.agenda(nutricionista(authentication)),
                "Agenda carregada."));
    }

    @GetMapping("/api/v1/gestao-pacientes/{id}/historico")
    public ResponseEntity<ApiResponse<HistoricoResponse>> historico(
            Authentication authentication, @PathVariable Integer id) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                    clinicoService.historico(nutricionista(authentication), id),
                    "Histórico carregado."));
        } catch (PacienteNaoEncontradoException exception) {
            return ResponseEntity.notFound().build();
        } catch (AcessoNegadoException exception) {
            return ResponseEntity.status(403).build();
        }
    }

    @GetMapping("/api/v1/gestao-pacientes/{id}/avaliacoes")
    public ResponseEntity<ApiResponse<List<AvaliacaoResponse>>> listarAvaliacoes(
            Authentication authentication, @PathVariable Integer id) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                    clinicoService.listarAvaliacoes(nutricionista(authentication), id),
                    "Avaliações carregadas."));
        } catch (PacienteNaoEncontradoException exception) {
            return ResponseEntity.notFound().build();
        } catch (AcessoNegadoException exception) {
            return ResponseEntity.status(403).build();
        }
    }

    @PostMapping("/api/v1/gestao-pacientes/{id}/avaliacoes")
    public ResponseEntity<ApiResponse<AvaliacaoResponse>> registrarAvaliacao(
            Authentication authentication,
            @PathVariable Integer id,
            @RequestBody AvaliacaoRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                    clinicoService.registrarAvaliacao(nutricionista(authentication), id, request),
                    "Avaliação registrada."));
        } catch (PacienteNaoEncontradoException exception) {
            return ResponseEntity.notFound().build();
        } catch (AcessoNegadoException exception) {
            return ResponseEntity.status(403).build();
        }
    }

    private Nutricionista nutricionista(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Nutricionista nutricionista)) {
            throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        }
        return nutricionista;
    }
}
