package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.AdicionarAguaRequest;
import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.HidratacaoDTO;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.service.HidratacaoService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/usuarios/me/hidratacao")
public class HidratacaoController {
    private final HidratacaoService hidratacao;

    public HidratacaoController(HidratacaoService hidratacao) {
        this.hidratacao = hidratacao;
    }

    @GetMapping
    public ApiResponse<HidratacaoDTO> hoje(Authentication auth) {
        return ApiResponse.ok(hidratacao.hoje(paciente(auth)));
    }

    @PostMapping
    public ApiResponse<HidratacaoDTO> adicionar(
            Authentication auth, @RequestBody AdicionarAguaRequest request) {
        return ApiResponse.ok(
                hidratacao.adicionar(paciente(auth), request == null ? null : request.quantidadeMl()),
                "Consumo de água atualizado.");
    }

    private Paciente paciente(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Paciente paciente)) {
            throw new AcessoNegadoException("Acesso restrito ao paciente titular.");
        }
        return paciente;
    }
}
