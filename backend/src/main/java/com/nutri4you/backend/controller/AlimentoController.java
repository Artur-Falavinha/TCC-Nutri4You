package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Alimento;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.repository.AlimentoRepository;
import org.springframework.security.core.Authentication;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/alimentos")
public class AlimentoController {
    private final AlimentoRepository alimentos;
    public AlimentoController(AlimentoRepository alimentos) { this.alimentos = alimentos; }
    @GetMapping
    public ApiResponse<List<Alimento>> buscar(Authentication auth, @RequestParam(defaultValue = "") String q) {
        if (auth == null || !(auth.getPrincipal() instanceof Nutricionista)) throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        String termo = q.trim();
        if (termo.length() > 150) throw new IllegalArgumentException("Busca limitada a 150 caracteres.");
        return ApiResponse.ok(termo.length() < 2 ? List.of()
                : alimentos.findByNomeContainingIgnoreCaseOrderByNomeAsc(termo, PageRequest.of(0, 30)), "Alimentos encontrados.");
    }
}
