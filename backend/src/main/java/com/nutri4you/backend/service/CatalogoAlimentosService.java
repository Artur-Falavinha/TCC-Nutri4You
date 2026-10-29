package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PrescricaoDTO.PaginaAlimentos;
import com.nutri4you.backend.dto.PrescricaoDTO.AlimentoDTO;
import com.nutri4you.backend.model.Alimento;
import com.nutri4you.backend.repository.AlimentoRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
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

    public List<AlimentoDTO> buscarLivre(String termo, int pagina) {
        if (pagina < 0 || pagina > 1000) {
            throw new IllegalArgumentException("Página deve estar entre 0 e 1000.");
        }
        if (termo != null && termo.length() > 150) {
            throw new IllegalArgumentException("Busca limitada a 150 caracteres.");
        }
        String busca = Alimento.normalizarBusca(termo);
        if (busca.length() < 2) return List.of();
        Specification<Alimento> filtro = (root, query, cb) ->
                cb.and(cb.isTrue(root.get("catalogoAtivo")), cb.isTrue(root.get("disponivelPrescricao")));
        for (String palavra : busca.split(" +")) {
            filtro = filtro.and((root, query, cb) ->
                    cb.like(root.get("nomeBusca"), "%" + palavra + "%"));
        }
        return alimentos.findAll(filtro, PageRequest.of(pagina, 30, Sort.by("nome", "id")))
                .map(Alimento::paraResposta).getContent();
    }

    public static String normalizar(String texto) {
        return Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }
}
