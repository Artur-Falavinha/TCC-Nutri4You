package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Alimento;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.repository.AlimentoRepository;
import org.springframework.security.core.Authentication;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/alimentos")
public class AlimentoController {
    private final AlimentoRepository alimentos;
    public AlimentoController(AlimentoRepository alimentos) { this.alimentos = alimentos; }
    @GetMapping
    public ApiResponse<List<Alimento>> buscar(Authentication auth, @RequestParam(defaultValue = "") String q,
                                             @RequestParam(defaultValue = "0") int pagina) {
        if (auth == null || !(auth.getPrincipal() instanceof Nutricionista)) throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        String termo = q.trim();
        if (termo.length() > 150) throw new IllegalArgumentException("Busca limitada a 150 caracteres.");
        if (pagina < 0 || pagina > 1000) throw new IllegalArgumentException("Página deve estar entre 0 e 1000.");
        String normalizado = Alimento.normalizarBusca(termo);
        if (normalizado.length() < 2) return ApiResponse.ok(List.of(), "Alimentos encontrados.");
        Specification<Alimento> filtro = (root, query, cb) -> cb.isTrue(root.get("disponivelParaPrescricao"));
        for (String palavra : normalizado.split(" +")) {
            filtro = filtro.and((root, query, cb) -> cb.like(root.get("nomeBusca"), "%" + palavra + "%"));
        }
        return ApiResponse.ok(alimentos.findAll(filtro, PageRequest.of(pagina, 30, Sort.by("nome", "id"))).getContent(), "Alimentos encontrados.");
    }
}
