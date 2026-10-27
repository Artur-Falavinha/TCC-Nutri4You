package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.*;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.service.HorarioAtendimentoService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/agenda-nutricionista/horarios")
public class HorarioAtendimentoController {
    private final HorarioAtendimentoService service;
    public HorarioAtendimentoController(HorarioAtendimentoService service) { this.service = service; }
    @GetMapping
    public ApiResponse<List<HorarioAtendimentoDTO>> listar(Authentication auth) {
        return ApiResponse.ok(service.listar(nutri(auth)), "Horários carregados.");
    }
    @PutMapping
    public ApiResponse<List<HorarioAtendimentoDTO>> salvar(Authentication auth, @RequestBody List<HorarioAtendimentoDTO> horarios) {
        return ApiResponse.ok(service.salvar(nutri(auth), horarios), "Horários salvos.");
    }
    private Nutricionista nutri(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Nutricionista n)) {
            throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        }
        return n;
    }
}
