package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.model.ContaAutenticavel;
import com.nutri4you.backend.security.TokenService;
import com.nutri4you.backend.service.AlteracaoEmailService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/usuarios/me/email")
public class AlteracaoEmailController {
    private final AlteracaoEmailService alteracoes;
    private final TokenService tokens;

    public AlteracaoEmailController(AlteracaoEmailService alteracoes, TokenService tokens) {
        this.alteracoes = alteracoes;
        this.tokens = tokens;
    }

    @PostMapping("/iniciar")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ApiResponse<AlteracaoEmailService.Solicitacao> iniciar(@AuthenticationPrincipal ContaAutenticavel conta,
            @RequestBody Inicio dados) {
        return ApiResponse.ok(alteracoes.iniciar(conta, dados.novoEmail(), dados.senhaAtual()),
                "Código enviado ao novo e-mail.");
    }

    @PostMapping("/confirmar")
    public ApiResponse<Confirmacao> confirmar(@AuthenticationPrincipal ContaAutenticavel conta,
            @RequestBody Codigo dados) {
        ContaAutenticavel atualizada = alteracoes.confirmar(conta, dados.codigo());
        return ApiResponse.ok(new Confirmacao(atualizada.getEmail(), tokens.gerarToken(atualizada)),
                "E-mail atualizado com sucesso.");
    }

    public record Inicio(String novoEmail, String senhaAtual) {}
    public record Codigo(UUID codigo) {}
    public record Confirmacao(String email, String token) {}
}
