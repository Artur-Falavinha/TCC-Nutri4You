package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.service.ConsumoRefeicaoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

import static com.nutri4you.backend.config.FormatoDataConfig.DATA_BRASILEIRA;

@RestController
@RequestMapping("/api/v1/me/consumo")
public class ConsumoRefeicaoController {
    private final ConsumoRefeicaoService service;
    public ConsumoRefeicaoController(ConsumoRefeicaoService service) { this.service = service; }
    @GetMapping
    public ApiResponse<ConsumoRefeicaoService.Diario> consultar(Authentication auth,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE, fallbackPatterns = DATA_BRASILEIRA) LocalDate data) {
        return ApiResponse.ok(service.consultar(paciente(auth), data));
    }
    @PutMapping("/refeicoes/{id}")
    public ApiResponse<ConsumoRefeicaoService.Diario> marcar(Authentication auth, @PathVariable Integer id,
            @RequestBody ConsumoRefeicaoService.Marcacao request) {
        return ApiResponse.ok(service.marcar(paciente(auth), id, request));
    }
    private Paciente paciente(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Paciente p)) throw new AcessoNegadoException("Acesso restrito ao paciente titular.");
        return p;
    }
}
