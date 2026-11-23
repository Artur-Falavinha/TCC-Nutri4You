package com.nutri4you.backend.controller;

import com.nutri4you.backend.service.FotoPerfilService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1")
public class FotoPerfilController {
    private final FotoPerfilService fotos;

    public FotoPerfilController(FotoPerfilService fotos) {
        this.fotos = fotos;
    }

    @GetMapping("/usuarios/me/foto")
    public ResponseEntity<byte[]> buscar(@AuthenticationPrincipal Object principal) {
        return resposta(fotos.buscar(principal));
    }

    @GetMapping("/gestao-pacientes/{pacienteId}/foto")
    public ResponseEntity<byte[]> fotoPaciente(@AuthenticationPrincipal Object principal, @PathVariable Integer pacienteId) {
        return resposta(fotos.buscarFotoPaciente(principal, pacienteId));
    }

    @GetMapping("/usuarios/me/nutricionistas/{nutricionistaId}/foto")
    public ResponseEntity<byte[]> fotoNutricionista(
            @AuthenticationPrincipal Object principal, @PathVariable Integer nutricionistaId) {
        return resposta(fotos.buscarFotoNutricionista(principal, nutricionistaId));
    }

    @GetMapping("/agenda/nutricionistas/{nutricionistaId}/foto")
    public ResponseEntity<byte[]> fotoNutricionistaNaAgenda(
            @AuthenticationPrincipal Object principal, @PathVariable Integer nutricionistaId) {
        return resposta(fotos.buscarFotoNutricionistaNaAgenda(principal, nutricionistaId));
    }

    @PostMapping(value = "/usuarios/me/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> salvar(@AuthenticationPrincipal Object principal, @RequestParam MultipartFile arquivo) {
        return imagem(fotos.salvar(principal, arquivo));
    }

    @DeleteMapping("/usuarios/me/foto")
    public ResponseEntity<Void> remover(@AuthenticationPrincipal Object principal) {
        fotos.remover(principal);
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    private static ResponseEntity<byte[]> resposta(Optional<byte[]> foto) {
        return foto.map(FotoPerfilController::imagem)
                .orElseGet(() -> ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build());
    }

    private static ResponseEntity<byte[]> imagem(byte[] jpeg) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options", "nosniff")
                .body(jpeg);
    }
}
