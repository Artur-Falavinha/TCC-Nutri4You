package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.PlanoAlimentarRequest;
import com.nutri4you.backend.dto.PlanoAlimentarResponse;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.service.PlanoAlimentarService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
public class PlanoAlimentarController {
    private final PlanoAlimentarService service;

    public PlanoAlimentarController(PlanoAlimentarService service) { this.service = service; }

    @PostMapping("/api/v1/gestao-pacientes/{pacienteId}/planos")
    public ResponseEntity<ApiResponse<PlanoAlimentarResponse>> criar(Authentication auth,
            @PathVariable Integer pacienteId, @RequestBody PlanoAlimentarRequest request) {
        PlanoAlimentarResponse plano = service.criar(nutricionista(auth), pacienteId, request);
        return ResponseEntity.created(URI.create("/api/v1/gestao-pacientes/" + pacienteId + "/planos/" + plano.id()))
                .body(ApiResponse.ok(plano, "Rascunho criado."));
    }

    @GetMapping("/api/v1/gestao-pacientes/{pacienteId}/planos")
    public ResponseEntity<ApiResponse<List<PlanoAlimentarResponse>>> listar(Authentication auth,
            @PathVariable Integer pacienteId) {
        return ResponseEntity.ok(ApiResponse.ok(service.listar(nutricionista(auth), pacienteId), "Planos carregados."));
    }

    @GetMapping("/api/v1/gestao-pacientes/{pacienteId}/planos/{planoId}")
    public ResponseEntity<ApiResponse<PlanoAlimentarResponse>> detalhar(Authentication auth,
            @PathVariable Integer pacienteId, @PathVariable Integer planoId) {
        return ResponseEntity.ok(ApiResponse.ok(service.detalhar(nutricionista(auth), pacienteId, planoId), "Plano carregado."));
    }

    @PutMapping("/api/v1/gestao-pacientes/{pacienteId}/planos/{planoId}")
    public ResponseEntity<ApiResponse<PlanoAlimentarResponse>> editar(Authentication auth,
            @PathVariable Integer pacienteId, @PathVariable Integer planoId, @RequestBody PlanoAlimentarRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.editar(nutricionista(auth), pacienteId, planoId, request),
                "Rascunho atualizado."));
    }

    @PostMapping("/api/v1/gestao-pacientes/{pacienteId}/planos/{planoId}/publicacao")
    public ResponseEntity<ApiResponse<PlanoAlimentarResponse>> publicar(Authentication auth,
            @PathVariable Integer pacienteId, @PathVariable Integer planoId, @RequestBody PublicacaoRequest request) {
        if (request == null || request.versao() == null)
            throw new IllegalArgumentException("Informe a versão do rascunho.");
        return ResponseEntity.ok(ApiResponse.ok(service.publicar(nutricionista(auth), pacienteId, planoId, request.versao()),
                "Plano publicado."));
    }

    @GetMapping("/api/v1/usuarios/me/dieta-ativa")
    public ResponseEntity<ApiResponse<PlanoAlimentarResponse>> dietaAtiva(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Paciente paciente))
            throw new AcessoNegadoException("Acesso restrito a pacientes.");
        return ResponseEntity.ok(ApiResponse.ok(service.dietaAtiva(paciente), "Dieta ativa carregada."));
    }

    private Nutricionista nutricionista(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Nutricionista nutricionista))
            throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        return nutricionista;
    }

    public record PublicacaoRequest(Long versao) {}
}
