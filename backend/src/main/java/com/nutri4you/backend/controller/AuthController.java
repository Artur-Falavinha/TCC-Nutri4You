package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.exception.UnauthorizedException;
import com.nutri4you.backend.security.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;

    public AuthController(AuthenticationManager authenticationManager, TokenService tokenService) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
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
        } catch (AuthenticationException exception) {
            throw new UnauthorizedException("E-mail ou senha incorretos.");
        }
    }
}
