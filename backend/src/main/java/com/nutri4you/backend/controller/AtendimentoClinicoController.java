package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.AtendimentoClinicoResponse;
import com.nutri4you.backend.dto.CancelarConsultaRequest;
import com.nutri4you.backend.dto.ConsultaRequest;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.service.AtendimentoClinicoService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/agenda-nutricionista/atendimentos")
public class AtendimentoClinicoController {
    private final AtendimentoClinicoService atendimentos;

    public AtendimentoClinicoController(AtendimentoClinicoService atendimentos) {
        this.atendimentos = atendimentos;
    }

    @GetMapping
    public ApiResponse<List<AtendimentoClinicoResponse>> listar(Authentication auth) {
        return ApiResponse.ok(atendimentos.listar(nutricionista(auth)), "Atendimentos carregados.");
    }

    @GetMapping("/{id}")
    public ApiResponse<AtendimentoClinicoResponse> buscar(Authentication auth, @PathVariable Integer id) {
        return ApiResponse.ok(atendimentos.buscar(nutricionista(auth), id), "Atendimento carregado.");
    }

    @PostMapping("/{id}/inicio")
    public ApiResponse<AtendimentoClinicoResponse> iniciar(
            Authentication auth, @PathVariable Integer id, @RequestBody CancelarConsultaRequest request) {
        return ApiResponse.ok(atendimentos.iniciar(nutricionista(auth), id, request.versao()), "Atendimento iniciado.");
    }

    @PostMapping("/{id}/cancelamento")
    public ApiResponse<Void> cancelar(
            Authentication auth, @PathVariable Integer id, @RequestBody CancelarConsultaRequest request) {
        atendimentos.cancelar(nutricionista(auth), id, request.versao());
        return ApiResponse.ok(null, "Atendimento cancelado.");
    }

    @PutMapping("/{id}")
    public ApiResponse<AtendimentoClinicoResponse> atualizar(
            Authentication auth, @PathVariable Integer id, @RequestBody ConsultaRequest request) {
        return ApiResponse.ok(atendimentos.atualizar(nutricionista(auth), id, request), "Atendimento atualizado.");
    }

    private Nutricionista nutricionista(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Nutricionista nutricionista)) {
            throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        }
        return nutricionista;
    }
}
