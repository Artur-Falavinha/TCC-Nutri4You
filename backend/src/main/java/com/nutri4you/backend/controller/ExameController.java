package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.*;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.*;
import com.nutri4you.backend.service.ExameService;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.net.URI;

@RestController
public class ExameController {
    private final ExameService service;
    public ExameController(ExameService service) { this.service = service; }
    @GetMapping("/api/v1/gestao-pacientes/{pacienteId}/exames")
    public ApiResponse<ExameService.Pagina> listar(Authentication a, @PathVariable Integer pacienteId, @RequestParam(defaultValue = "0") int pagina) {
        return ApiResponse.ok(service.listar(nutri(a), pacienteId, pagina), "Exames carregados.");
    }
    @PostMapping("/api/v1/gestao-pacientes/{pacienteId}/exames")
    public ResponseEntity<ApiResponse<ExameResponse>> solicitar(Authentication a, @PathVariable Integer pacienteId, @RequestBody ExameService.Solicitacao r) {
        var e = service.solicitar(nutri(a), pacienteId, r);
        return ResponseEntity.created(URI.create("/api/v1/gestao-pacientes/" + pacienteId + "/exames/" + e.id()))
                .body(ApiResponse.ok(e, "Exame solicitado."));
    }
    @PostMapping("/api/v1/gestao-pacientes/{pacienteId}/exames/{id}/analise")
    public ApiResponse<ExameResponse> analisar(Authentication a, @PathVariable Integer pacienteId, @PathVariable Integer id, @RequestBody ExameService.Analise r) {
        return ApiResponse.ok(service.analisar(nutri(a), pacienteId, id, r), "Análise registrada.");
    }
    @GetMapping("/api/v1/gestao-pacientes/{pacienteId}/exames/{id}/arquivo")
    public ResponseEntity<byte[]> baixarNutri(Authentication a, @PathVariable Integer pacienteId, @PathVariable Integer id) {
        return download(service.arquivo(nutri(a), pacienteId, id));
    }
    @GetMapping("/api/v1/usuarios/me/exames")
    public ApiResponse<ExameService.Pagina> meus(Authentication a, @RequestParam(defaultValue = "0") int pagina) {
        return ApiResponse.ok(service.listar(paciente(a), pagina), "Exames carregados.");
    }
    @PostMapping(value = "/api/v1/usuarios/me/exames/{id}/arquivo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ExameResponse> enviar(Authentication a, @PathVariable Integer id,
            @RequestParam Long versao, @RequestParam MultipartFile arquivo) {
        return ApiResponse.ok(service.enviar(paciente(a), id, versao, arquivo), "Arquivo enviado.");
    }
    @GetMapping("/api/v1/usuarios/me/exames/{id}/arquivo")
    public ResponseEntity<byte[]> baixarPaciente(Authentication a, @PathVariable Integer id) {
        return download(service.arquivo(paciente(a), id));
    }
    private ResponseEntity<byte[]> download(ExameService.Arquivo f) {
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(f.tipo()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(f.nome()).build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store, private")
                .header("X-Content-Type-Options", "nosniff").body(f.dados());
    }
    private Nutricionista nutri(Authentication a) {
        if (a == null || !(a.getPrincipal() instanceof Nutricionista n)) throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        return n;
    }
    private Paciente paciente(Authentication a) {
        if (a == null || !(a.getPrincipal() instanceof Paciente p)) throw new AcessoNegadoException("Acesso restrito a pacientes.");
        return p;
    }
}
