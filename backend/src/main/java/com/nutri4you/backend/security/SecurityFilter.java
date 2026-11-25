package com.nutri4you.backend.security;

import com.nutri4you.backend.service.PrivacidadeService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class SecurityFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final DatabaseUserDetailsService userDetailsService;
    private final PrivacidadeService privacidade;

    public SecurityFilter(TokenService tokenService, DatabaseUserDetailsService userDetailsService,
            PrivacidadeService privacidade) {
        this.tokenService = tokenService;
        this.userDetailsService = userDetailsService;
        this.privacidade = privacidade;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String token = recuperarToken(request);

        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            var sessao = tokenService.validarToken(token);
            if (sessao != null) {
                try {
                    var user = userDetailsService.buscarTitular(sessao.tipo(), sessao.titularId());
                    if (user.getVersaoCredencial() == sessao.versaoCredencial()
                            && user.isEnabled() && privacidade.aceitou(user)) {
                        var authentication = new UsernamePasswordAuthenticationToken(
                                user,
                                null,
                                user.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    } else {
                        SecurityContextHolder.clearContext();
                    }
                } catch (RuntimeException ignored) {
                    SecurityContextHolder.clearContext();
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private String recuperarToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authHeader.substring(7).trim();
        return token.isEmpty() ? null : token;
    }
}
