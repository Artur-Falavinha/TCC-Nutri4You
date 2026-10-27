package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.*;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.service.RefeicaoService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/gestao-pacientes/{pacienteId}/planos/{planoId}/refeicoes")
public class RefeicaoController {
    private final RefeicaoService service;
    public RefeicaoController(RefeicaoService service) { this.service = service; }
    @PostMapping
    public ApiResponse<PlanoAlimentarResponse> criar(Authentication auth, @PathVariable Integer pacienteId,
            @PathVariable Integer planoId, @RequestBody RefeicaoRequest r) {
        return ApiResponse.ok(service.salvar(nutri(auth), pacienteId, planoId, null, r), "Refeição adicionada.");
    }
    @PutMapping("/{id}")
    public ApiResponse<PlanoAlimentarResponse> editar(Authentication auth, @PathVariable Integer pacienteId,
            @PathVariable Integer planoId, @PathVariable Integer id, @RequestBody RefeicaoRequest r) {
        return ApiResponse.ok(service.salvar(nutri(auth), pacienteId, planoId, id, r), "Refeição atualizada.");
    }
    @DeleteMapping("/{id}")
    public ApiResponse<PlanoAlimentarResponse> excluir(Authentication auth, @PathVariable Integer pacienteId,
            @PathVariable Integer planoId, @PathVariable Integer id, @RequestParam Long versaoPlano) {
        return ApiResponse.ok(service.excluir(nutri(auth), pacienteId, planoId, id, versaoPlano), "Refeição excluída.");
    }
    @PostMapping("/{id}/replicacao")
    public ApiResponse<PlanoAlimentarResponse> replicar(Authentication auth, @PathVariable Integer pacienteId,
            @PathVariable Integer planoId, @PathVariable Integer id, @RequestBody Replicacao r) {
        return ApiResponse.ok(service.replicar(nutri(auth), pacienteId, planoId, id, r.dias(), r.versaoPlano()), "Refeição replicada.");
    }
    private Nutricionista nutri(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Nutricionista n)) throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        return n;
    }
    public record Replicacao(List<Integer> dias, Long versaoPlano) {}
}
