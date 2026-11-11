package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.NutricionistaVinculoDTO;
import com.nutri4you.backend.dto.SolicitacaoVinculoDTO;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.service.SolicitacaoVinculoService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios/me/solicitacoes-vinculo")
public class SolicitacaoVinculoController {
    private final SolicitacaoVinculoService solicitacoes;

    public SolicitacaoVinculoController(SolicitacaoVinculoService solicitacoes) {
        this.solicitacoes = solicitacoes;
    }

    @GetMapping
    public ApiResponse<List<SolicitacaoVinculoDTO>> listar(Authentication auth) {
        return ApiResponse.ok(solicitacoes.listar(paciente(auth)), "Solicitações de vínculo carregadas.");
    }

    @PostMapping("/{id}/decisao")
    public ApiResponse<NutricionistaVinculoDTO> decidir(
            Authentication auth, @PathVariable Integer id, @RequestBody DecisaoVinculoRequest decisao) {
        var vinculo = solicitacoes.decidir(paciente(auth), id, decisao.versao(), decisao.aceitar());
        return ApiResponse.ok(vinculo, vinculo == null ? "Solicitação recusada." : "Vínculo aceito.");
    }

    private Paciente paciente(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Paciente paciente)) {
            throw new AcessoNegadoException("Acesso restrito a pacientes.");
        }
        return paciente;
    }

    public record DecisaoVinculoRequest(Long versao, Boolean aceitar) {}
}
