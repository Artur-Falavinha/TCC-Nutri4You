package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.AlimentoResponseDTO;
import com.nutri4you.backend.dto.AlimentosPaginadosResponseDTO;
import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.service.AlimentoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alimentos")
public class AlimentoController {

    private final AlimentoService alimentoService;

    public AlimentoController(AlimentoService alimentoService) {
        this.alimentoService = alimentoService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<AlimentosPaginadosResponseDTO>> listarAlimentos(
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String categoria,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "30") int tamanho,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Integer limit) {

        String termoBusca = primeiroNaoVazio(busca, search, nome);
        int paginaFinal = page != null ? page : pagina;
        int tamanhoFinal = limit != null ? limit : (size != null ? size : tamanho);

        AlimentosPaginadosResponseDTO resultado = alimentoService.listarAlimentos(
                termoBusca,
                categoria,
                paginaFinal,
                tamanhoFinal);

        return ResponseEntity.ok(ApiResponse.ok(resultado, "Alimentos da Tabela TACO carregados."));
    }

    @GetMapping("/categorias")
    public ResponseEntity<ApiResponse<List<String>>> listarCategorias() {
        return ResponseEntity.ok(ApiResponse.ok(
                alimentoService.listarCategorias(),
                "Categorias da Tabela TACO carregadas."));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AlimentoResponseDTO>> buscarPorId(@PathVariable Integer id) {
        return alimentoService.buscarPorId(id)
                .map(dto -> ResponseEntity.ok(ApiResponse.ok(dto, "Alimento carregado.")))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private String primeiroNaoVazio(String... valores) {
        if (valores == null) {
            return null;
        }
        for (String v : valores) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return null;
    }
}

