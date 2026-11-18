package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.service.PrivacidadeService;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;

@RestController
@RequestMapping("/api/v1/privacidade")
public class PrivacidadeController {
    private final PrivacidadeService privacidade;
    public PrivacidadeController(PrivacidadeService privacidade) {
        this.privacidade = privacidade;
    }

    @GetMapping(value = "/termos", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<Resource> termos() {
        Resource documento = new ClassPathResource("privacidade/termos-" + PrivacidadeService.VERSAO + ".pdf");
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=termos-nutri4you.pdf")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache").body(documento);
    }

    public record Aceite(String versao, boolean aceito, Instant aceitoEm) {}
    public record PedidoAceite(String versao, boolean aceito) {}

    private Aceite respostaAceite(Object principal) {
        Instant aceitoEm = privacidade.dataAceite(principal);
        return new Aceite(PrivacidadeService.VERSAO, aceitoEm != null, aceitoEm);
    }

    @GetMapping("/me/termos")
    public ApiResponse<Aceite> meuAceite(Authentication auth) {
        return ApiResponse.ok(respostaAceite(auth.getPrincipal()), "Termos atuais.");
    }

    @PostMapping("/me/termos")
    public ApiResponse<Aceite> aceitar(Authentication auth, @RequestBody PedidoAceite request) {
        if (!request.aceito()) throw new IllegalArgumentException("Confirme o aceite dos termos de uso.");
        privacidade.aceitar(auth.getPrincipal(), request.versao());
        return ApiResponse.ok(respostaAceite(auth.getPrincipal()), "Aceite registrado.");
    }

}
