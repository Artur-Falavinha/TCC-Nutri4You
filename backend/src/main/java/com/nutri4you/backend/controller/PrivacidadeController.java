package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.service.PrivacidadeService;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/privacidade")
public class PrivacidadeController {
    private static final Set<String> VERSOES_PUBLICADAS = Set.of(PrivacidadeService.VERSAO, "2026-11-19", "2026-11-16.2");
    private final PrivacidadeService privacidade;

    public PrivacidadeController(PrivacidadeService privacidade) {
        this.privacidade = privacidade;
    }

    @GetMapping(value = "/termos", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<Resource> termos() {
        return termosPorVersao(PrivacidadeService.VERSAO);
    }

    @GetMapping(value = "/termos/{versao}", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<Resource> termosPorVersao(@PathVariable String versao) {
        if (!VERSOES_PUBLICADAS.contains(versao)) return ResponseEntity.notFound().build();
        Resource documento = new ClassPathResource("privacidade/termos-" + versao + ".pdf");
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=termos-nutri4you.pdf")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache").body(documento);
    }

    public record Aceite(String versao, boolean aceito, Instant aceitoEm) {}

    @GetMapping("/me/termos")
    public ApiResponse<Aceite> meuAceite(Authentication auth) {
        var registro = privacidade.consultarAceite(auth.getPrincipal());
        var aceite = registro == null
                ? new Aceite(PrivacidadeService.VERSAO, false, null)
                : new Aceite(registro.versao(), true, registro.aceitoEm());
        return ApiResponse.ok(aceite, "Consulta de aceite dos termos.");
    }
}
