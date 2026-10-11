package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.*;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.service.ConsultaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/gestao-pacientes/{pacienteId}/consultas")
public class ConsultaController {
    private final ConsultaService service;

    public ConsultaController(ConsultaService service) { this.service = service; }

    @GetMapping
    public ApiResponse<ConsultasResponse> listar(Authentication auth, @PathVariable Integer pacienteId,
                                                @RequestParam(defaultValue = "0") int pagina) {
        return ApiResponse.ok(service.listar(nutricionista(auth), pacienteId, pagina), "Consultas carregadas.");
    }

    @GetMapping("/{id}")
    public ApiResponse<ConsultaResponse> buscar(Authentication auth, @PathVariable Integer pacienteId,
                                               @PathVariable Integer id) {
        return ApiResponse.ok(service.buscar(nutricionista(auth), pacienteId, id), "Consulta carregada.");
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConsultaResponse>> criar(Authentication auth, @PathVariable Integer pacienteId,
                                                               @RequestBody ConsultaRequest request) {
        var resposta = service.criar(nutricionista(auth), pacienteId, request);
        return ResponseEntity.created(URI.create("/api/v1/gestao-pacientes/" + pacienteId + "/consultas/" + resposta.id()))
                .body(ApiResponse.ok(resposta, "Consulta registrada."));
    }

    @PutMapping("/{id}")
    public ApiResponse<ConsultaResponse> atualizar(Authentication auth, @PathVariable Integer pacienteId,
                                                  @PathVariable Integer id, @RequestBody ConsultaRequest request) {
        return ApiResponse.ok(service.atualizar(nutricionista(auth), pacienteId, id, request), "Consulta atualizada.");
    }

    private Nutricionista nutricionista(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Nutricionista n)) {
            throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        }
        return n;
    }
}
