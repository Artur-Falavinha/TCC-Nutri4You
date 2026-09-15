package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.MensagemResponse;
import com.nutri4you.backend.dto.RecuperarSenhaRequest;
import com.nutri4you.backend.dto.RedefinirSenhaRequest;
import com.nutri4you.backend.exception.UnauthorizedException;
import com.nutri4you.backend.security.TokenService;
import com.nutri4you.backend.service.AuthEmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String MENSAGEM_EMAIL_NAO_CONFIRMADO =
            "Confirme seu e-mail antes de acessar o sistema.";

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final AuthEmailService authEmailService;

    public AuthController(
            AuthenticationManager authenticationManager,
            TokenService tokenService,
            AuthEmailService authEmailService) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.authEmailService = authEmailService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest dados) {
        try {
            var credentials = new UsernamePasswordAuthenticationToken(dados.email(), dados.senha());
            var authentication = authenticationManager.authenticate(credentials);
            String tipoUsuario = authentication.getAuthorities().stream()
                    .findFirst()
                    .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                    .orElse("USUARIO");

            return ResponseEntity.ok(ApiResponse.ok(
                    new LoginResponse(
                            tokenService.gerarToken(authentication.getName()),
                            tipoUsuario),
                    "Login realizado com sucesso."));
        } catch (DisabledException exception) {
            throw new UnauthorizedException(MENSAGEM_EMAIL_NAO_CONFIRMADO);
        } catch (BadCredentialsException exception) {
            throw new UnauthorizedException("E-mail ou senha incorretos.");
        } catch (AuthenticationException exception) {
            throw new UnauthorizedException("E-mail ou senha incorretos.");
        }
    }

    @GetMapping("/confirmar-email")
    public ResponseEntity<ApiResponse<MensagemResponse>> confirmarEmail(@RequestParam("token") UUID token) {
        authEmailService.confirmarEmail(token);
        return ResponseEntity.ok(ApiResponse.ok(
                new MensagemResponse("E-mail confirmado com sucesso."),
                "E-mail confirmado com sucesso."));
    }

    @PostMapping("/recuperar-senha")
    public ResponseEntity<ApiResponse<MensagemResponse>> recuperarSenha(
            @RequestBody RecuperarSenhaRequest request) {
        String mensagem = authEmailService.solicitarRecuperacaoSenha(
                request != null ? request.email() : null);
        return ResponseEntity.ok(ApiResponse.ok(
                new MensagemResponse(mensagem),
                mensagem));
    }

    @PostMapping("/redefinir-senha")
    public ResponseEntity<ApiResponse<MensagemResponse>> redefinirSenha(
            @RequestBody RedefinirSenhaRequest request) {
        if (request == null || request.token() == null || request.token().isBlank()) {
            throw new IllegalArgumentException("Token é obrigatório.");
        }
        authEmailService.redefinirSenha(UUID.fromString(request.token()), request.senha());
        return ResponseEntity.ok(ApiResponse.ok(
                new MensagemResponse("Senha redefinida com sucesso."),
                "Senha redefinida com sucesso."));
    }
}
