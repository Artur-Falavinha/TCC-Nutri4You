package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.PrescricaoDTO.*;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.service.PrescricaoService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping({"/api/v1/gestao-pacientes/{pacienteId}/planos-alimentares/{planoId}/refeicoes",
        "/api/v1/gestao-pacientes/{pacienteId}/planos/{planoId}/refeicoes"})
public class RefeicaoController {
    private final PrescricaoService service;
    public RefeicaoController(PrescricaoService service) { this.service = service; }
    public record Edicao(String nome, java.time.LocalTime horario, Integer diaSemana, List<ItemRequest> itens, Long versaoPlano) {
        RefeicaoRequest refeicao() { return new RefeicaoRequest(nome, horario, diaSemana, itens); }
    }
    public record Replicacao(List<Integer> dias, Long versaoPlano) {}
    @PostMapping
    public ApiResponse<PlanoDTO> criar(Authentication auth, @PathVariable Integer pacienteId, @PathVariable Integer planoId,
            @RequestParam(required = false) Integer atendimentoId, @RequestBody Edicao r) {
        return ApiResponse.ok(service.salvarRefeicao(nutri(auth), pacienteId, atendimentoId, planoId, null, r.refeicao(), r.versaoPlano()));
    }
    @PutMapping("/{id}")
    public ApiResponse<PlanoDTO> editar(Authentication auth, @PathVariable Integer pacienteId, @PathVariable Integer planoId,
            @PathVariable Integer id, @RequestParam(required = false) Integer atendimentoId, @RequestBody Edicao r) {
        return ApiResponse.ok(service.salvarRefeicao(nutri(auth), pacienteId, atendimentoId, planoId, id, r.refeicao(), r.versaoPlano()));
    }
    @DeleteMapping("/{id}")
    public ApiResponse<PlanoDTO> excluir(Authentication auth, @PathVariable Integer pacienteId, @PathVariable Integer planoId,
            @PathVariable Integer id, @RequestParam(required = false) Integer atendimentoId, @RequestParam Long versaoPlano) {
        return ApiResponse.ok(service.excluirRefeicao(nutri(auth), pacienteId, atendimentoId, planoId, id, versaoPlano));
    }
    @PostMapping("/{id}/replicacao")
    public ApiResponse<PlanoDTO> replicar(Authentication auth, @PathVariable Integer pacienteId, @PathVariable Integer planoId,
            @PathVariable Integer id, @RequestParam(required = false) Integer atendimentoId, @RequestBody Replicacao r) {
        return ApiResponse.ok(service.replicarRefeicao(nutri(auth), pacienteId, atendimentoId, planoId, id, r.dias(), r.versaoPlano()));
    }
    private Nutricionista nutri(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Nutricionista n)) throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        return n;
    }
}
