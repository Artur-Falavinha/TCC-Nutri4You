package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.*;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.service.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/gestao-pacientes")
public class AnamneseController {
    private final AnamneseService service;
    private final AnamneseCatalog catalog;
    public AnamneseController(AnamneseService service, AnamneseCatalog catalog) {
        this.service = service;
        this.catalog = catalog;
    }
    @GetMapping("/anamnese/campos")
    public ApiResponse<List<AnamneseCatalog.Field>> fields(Authentication auth) {
        nutritionist(auth);
        return ApiResponse.ok(catalog.fields(), "Campos da anamnese.");
    }
    @GetMapping("/{id}/anamnese")
    public ApiResponse<AnamneseResponse> get(Authentication auth, @PathVariable Integer id) {
        return ApiResponse.ok(service.get(nutritionist(auth), id), "Anamnese carregada.");
    }
    @PutMapping("/{id}/anamnese/rascunho")
    public ApiResponse<AnamneseResponse> draft(Authentication auth, @PathVariable Integer id,
        @RequestBody AnamneseRequest request) {
        return ApiResponse.ok(service.save(nutritionist(auth), id, request, false), "Rascunho salvo.");
    }
    @PutMapping("/{id}/anamnese")
    public ApiResponse<AnamneseResponse> finalizeRecord(Authentication auth, @PathVariable Integer id,
        @RequestBody AnamneseRequest request) {
        return ApiResponse.ok(service.save(nutritionist(auth), id, request, true), "Anamnese finalizada.");
    }
    @DeleteMapping("/{id}/anamnese/rascunho")
    public ApiResponse<AnamneseResponse> discard(Authentication auth, @PathVariable Integer id,
        @RequestParam Long versao) {
        return ApiResponse.ok(service.discard(nutritionist(auth), id, versao), "Rascunho descartado.");
    }
    private Nutricionista nutritionist(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Nutricionista user))
            throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        return user;
    }
}
