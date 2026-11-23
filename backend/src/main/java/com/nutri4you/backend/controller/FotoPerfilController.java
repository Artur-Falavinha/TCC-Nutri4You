package com.nutri4you.backend.controller;

import com.nutri4you.backend.service.FotoPerfilService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/usuarios/me/foto")
public class FotoPerfilController {
    private final FotoPerfilService fotos;

    public FotoPerfilController(FotoPerfilService fotos) {
        this.fotos = fotos;
    }

    @GetMapping
    public ResponseEntity<byte[]> buscar(@AuthenticationPrincipal Object principal) {
        return fotos.buscar(principal)
                .map(FotoPerfilController::imagem)
                .orElseGet(() -> ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> salvar(@AuthenticationPrincipal Object principal, @RequestParam MultipartFile arquivo) {
        return imagem(fotos.salvar(principal, arquivo));
    }

    @DeleteMapping
    public ResponseEntity<Void> remover(@AuthenticationPrincipal Object principal) {
        fotos.remover(principal);
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    private static ResponseEntity<byte[]> imagem(byte[] jpeg) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options", "nosniff")
                .body(jpeg);
    }
}
