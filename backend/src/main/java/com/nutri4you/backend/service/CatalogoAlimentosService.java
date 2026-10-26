package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PrescricaoDTO.PaginaAlimentos;
import com.nutri4you.backend.repository.AlimentoRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class CatalogoAlimentosService {
    private final AlimentoRepository alimentos;

    public CatalogoAlimentosService(AlimentoRepository alimentos) {
        this.alimentos = alimentos;
    }

    public PaginaAlimentos buscar(String nome, String categoria, int pagina, int tamanho) {
        if (pagina < 0 || tamanho < 1 || tamanho > 50) {
            throw new IllegalArgumentException(
                    "Página deve ser não negativa e tamanho deve ficar entre 1 e 50.");
        }
        if (nome != null && nome.length() > 150 || categoria != null && categoria.length() > 100) {
            throw new IllegalArgumentException("Filtro de alimento excede o tamanho permitido.");
        }
        String busca =
                normalizar(nome == null ? "" : nome.trim())
                        .replace("!", "!!")
                        .replace("%", "!%")
                        .replace("_", "!_");
        var resultado =
                alimentos.buscar(
                        "%" + busca + "%",
                        categoria == null ? "" : categoria.trim(),
                        PageRequest.of(pagina, tamanho));
        return new PaginaAlimentos(
                resultado.map(a -> a.paraResposta()).getContent(),
                pagina,
                tamanho,
                resultado.getTotalElements(),
                resultado.getTotalPages());
    }

    public List<String> categorias() {
        return alimentos.categorias();
    }

    public static String normalizar(String texto) {
        return Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }
}
