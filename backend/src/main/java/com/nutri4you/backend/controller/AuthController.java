package com.nutri4you.backend.controller;

import com.nutri4you.backend.config.EmailProperties;
import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.ConfirmacaoEmailRequest;
import com.nutri4you.backend.dto.ConfirmacaoEmailResponse;
import com.nutri4you.backend.dto.MensagemResponse;
import com.nutri4you.backend.dto.RecuperarSenhaRequest;
import com.nutri4you.backend.dto.RedefinirSenhaRequest;
import com.nutri4you.backend.exception.UnauthorizedException;
import com.nutri4you.backend.security.TokenService;
import com.nutri4you.backend.service.AuthEmailService;
import com.nutri4you.backend.service.PrivacidadeService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String MENSAGEM_EMAIL_NAO_CONFIRMADO =
            "Confirme seu e-mail antes de acessar o sistema.";

    private static final String MENSAGEM_EMAIL_CONFIRMADO = "E-mail confirmado com sucesso.";

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final AuthEmailService authEmailService;
    private final EmailProperties emailProperties;
    private final PrivacidadeService privacidade;

    public AuthController(
            AuthenticationManager authenticationManager,
            TokenService tokenService,
            AuthEmailService authEmailService,
            EmailProperties emailProperties,
            PrivacidadeService privacidade) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.authEmailService = authEmailService;
        this.emailProperties = emailProperties;
        this.privacidade = privacidade;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest dados) {
        try {
            var credentials = new UsernamePasswordAuthenticationToken(
                    normalizarEmail(dados.email()), dados.senha());
            var authentication = authenticationManager.authenticate(credentials);
            if (!privacidade.aceitou(authentication.getPrincipal())) {
                throw new UnauthorizedException("Sua conta não tem um aceite dos termos de uso registrado.");
            }
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
    public ResponseEntity<ApiResponse<ConfirmacaoEmailResponse>> abrirLinkLegado(
            @RequestParam("token") UUID token,
            @RequestHeader(value = HttpHeaders.ACCEPT, defaultValue = MediaType.APPLICATION_JSON_VALUE)
            String tiposAceitos) {
        boolean aceitaHtml = MediaType.parseMediaTypes(tiposAceitos).stream()
                .anyMatch(tipo -> MediaType.TEXT_HTML.equalsTypeAndSubtype(tipo) && tipo.getQualityValue() > 0);
        if (aceitaHtml) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(emailProperties.linkConfirmacao(token)))
                    .header("Referrer-Policy", "no-referrer")
                    .build();
        }
        return confirmarEmail(token);
    }

    @PostMapping("/confirmar-email")
    public ResponseEntity<ApiResponse<ConfirmacaoEmailResponse>> confirmarEmail(
            @RequestBody ConfirmacaoEmailRequest request) {
        if (request.token() == null) {
            throw new IllegalArgumentException("Token é obrigatório.");
        }
        return confirmarEmail(request.token());
    }

    private ResponseEntity<ApiResponse<ConfirmacaoEmailResponse>> confirmarEmail(UUID token) {
        String tipoUsuario = authEmailService.confirmarEmail(token);
        return ResponseEntity.ok(ApiResponse.ok(
                new ConfirmacaoEmailResponse(MENSAGEM_EMAIL_CONFIRMADO, tipoUsuario),
                MENSAGEM_EMAIL_CONFIRMADO));
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
        authEmailService.redefinirSenha(parseTokenUuid(request.token()), request.senha());
        return ResponseEntity.ok(ApiResponse.ok(
                new MensagemResponse("Senha redefinida com sucesso."),
                "Senha redefinida com sucesso."));
    }

    private static String normalizarEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private static UUID parseTokenUuid(String token) {
        try {
            return UUID.fromString(token.trim());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Token inválido ou expirado.");
        }
    }
}
