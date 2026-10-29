package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.PrescricaoDTO.CompraRequest;
import com.nutri4you.backend.dto.PrescricaoDTO.ListaComprasDTO;
import com.nutri4you.backend.dto.PrescricaoDTO.PaginaAlimentos;
import com.nutri4you.backend.dto.PrescricaoDTO.PlanoDTO;
import com.nutri4you.backend.dto.PrescricaoDTO.PlanoRequest;
import com.nutri4you.backend.dto.PrescricaoDTO.PublicacaoRequest;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.exception.UnauthorizedException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.service.CatalogoAlimentosService;
import com.nutri4you.backend.service.PrescricaoService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class PrescricaoController {
    private final PrescricaoService prescricoes;
    private final CatalogoAlimentosService catalogo;

    public PrescricaoController(PrescricaoService prescricoes, CatalogoAlimentosService catalogo) {
        this.prescricoes = prescricoes;
        this.catalogo = catalogo;
    }

    @GetMapping("/alimentos")
    public ApiResponse<?> alimentos(
            Authentication auth,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String categoria,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        nutricionista(auth);
        if (q != null) return ApiResponse.ok(catalogo.buscarLivre(q, pagina));
        return ApiResponse.ok(catalogo.buscar(nome, categoria, pagina, tamanho));
    }

    @GetMapping("/alimentos/categorias")
    public ApiResponse<List<String>> categorias(Authentication auth) {
        nutricionista(auth);
        return ApiResponse.ok(catalogo.categorias());
    }

    @GetMapping("/gestao-pacientes/{pacienteId}/planos-alimentares")
    public ApiResponse<List<PlanoDTO>> listar(
            Authentication auth, @PathVariable Integer pacienteId) {
        return ApiResponse.ok(prescricoes.listar(nutricionista(auth), pacienteId));
    }

    @PostMapping("/gestao-pacientes/{pacienteId}/planos-alimentares")
    public ResponseEntity<ApiResponse<PlanoDTO>> criar(
            Authentication auth,
            @PathVariable Integer pacienteId,
            @RequestBody PlanoRequest request) {
        PlanoDTO plano = prescricoes.criar(nutricionista(auth), pacienteId, request);
        return ResponseEntity.created(
                        URI.create(
                                "/api/v1/gestao-pacientes/"
                                        + pacienteId
                                        + "/planos-alimentares/"
                                        + plano.id()))
                .body(ApiResponse.ok(plano));
    }

    @GetMapping("/gestao-pacientes/{pacienteId}/planos-alimentares/{id}")
    public ApiResponse<PlanoDTO> buscar(
            Authentication auth, @PathVariable Integer pacienteId, @PathVariable Integer id) {
        return ApiResponse.ok(prescricoes.buscar(nutricionista(auth), pacienteId, id));
    }

    @GetMapping("/gestao-pacientes/{pacienteId}/planos-alimentares/{id}/lista-compras")
    public ApiResponse<ListaComprasDTO> previaCompras(
            Authentication auth,
            @PathVariable Integer pacienteId,
            @PathVariable Integer id,
            @RequestParam(defaultValue = "7") int dias) {
        return ApiResponse.ok(prescricoes.previaCompras(nutricionista(auth), pacienteId, id, dias));
    }

    @PutMapping("/gestao-pacientes/{pacienteId}/planos-alimentares/{id}")
    public ApiResponse<PlanoDTO> editar(
            Authentication auth,
            @PathVariable Integer pacienteId,
            @PathVariable Integer id,
            @RequestBody PlanoRequest request) {
        return ApiResponse.ok(prescricoes.editar(nutricionista(auth), pacienteId, id, request));
    }

    @DeleteMapping("/gestao-pacientes/{pacienteId}/planos-alimentares/{id}")
    public ResponseEntity<Void> excluir(
            Authentication auth,
            @PathVariable Integer pacienteId,
            @PathVariable Integer id,
            @RequestParam Long versao) {
        prescricoes.excluir(nutricionista(auth), pacienteId, id, versao);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/gestao-pacientes/{pacienteId}/planos-alimentares/{id}/publicacao")
    public ApiResponse<PlanoDTO> publicar(
            Authentication auth,
            @PathVariable Integer pacienteId,
            @PathVariable Integer id,
            @RequestBody PublicacaoRequest request) {
        return ApiResponse.ok(
                prescricoes.publicar(nutricionista(auth), pacienteId, id, request.versao()));
    }

    @GetMapping("/me/plano-alimentar")
    public ApiResponse<PlanoDTO> ativo(Authentication auth) {
        return ApiResponse.ok(prescricoes.ativo(paciente(auth)));
    }

    @GetMapping("/me/lista-compras")
    public ApiResponse<ListaComprasDTO> compras(
            Authentication auth, @RequestParam(defaultValue = "7") int dias) {
        return ApiResponse.ok(prescricoes.compras(paciente(auth), dias));
    }

    @PutMapping("/me/lista-compras/itens/{alimentoId}")
    public ApiResponse<ListaComprasDTO> marcar(
            Authentication auth,
            @PathVariable Integer alimentoId,
            @RequestBody CompraRequest request) {
        return ApiResponse.ok(prescricoes.marcar(paciente(auth), alimentoId, request));
    }

    private Nutricionista nutricionista(Authentication auth) {
        if (auth == null) throw new UnauthorizedException("Autenticação necessária.");
        if (!(auth.getPrincipal() instanceof Nutricionista nutricionista))
            throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        return nutricionista;
    }

    private Paciente paciente(Authentication auth) {
        if (auth == null) throw new UnauthorizedException("Autenticação necessária.");
        if (!(auth.getPrincipal() instanceof Paciente paciente))
            throw new AcessoNegadoException("Acesso restrito ao paciente titular.");
        return paciente;
    }
}
