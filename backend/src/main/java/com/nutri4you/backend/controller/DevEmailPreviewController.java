package com.nutri4you.backend.controller;

import com.nutri4you.backend.config.EmailProperties;
import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.EmailPreviewDTO;
import com.nutri4you.backend.model.TokenEmail;
import com.nutri4you.backend.repository.TokenEmailRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@Profile("dev")
@RequestMapping("/api/v1/dev")
public class DevEmailPreviewController {

    private final TokenEmailRepository tokenEmailRepository;
    private final EmailProperties emailProperties;

    public DevEmailPreviewController(
            TokenEmailRepository tokenEmailRepository,
            EmailProperties emailProperties) {
        this.tokenEmailRepository = tokenEmailRepository;
        this.emailProperties = emailProperties;
    }

    @GetMapping("/email-preview/{token}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<EmailPreviewDTO>> preview(@PathVariable UUID token) {
        TokenEmail tokenEmail = tokenEmailRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token não encontrado."));

        String linkConfirmacao = emailProperties.getApiBaseUrl()
                + "/auth/confirmar-email?token=" + tokenEmail.getToken();
        String linkRecuperacao = emailProperties.getWebBaseUrl()
                + "/redefinir-senha?token=" + tokenEmail.getToken();

        EmailPreviewDTO preview = new EmailPreviewDTO(
                tokenEmail.getToken(),
                tokenEmail.getTipo(),
                tokenEmail.getEmailDestinatario(),
                tokenEmail.getExpiraEm(),
                tokenEmail.getUsadoEm(),
                linkConfirmacao,
                linkRecuperacao);

        return ResponseEntity.ok(ApiResponse.ok(preview, "Preview do e-mail (dev)."));
    }
}
