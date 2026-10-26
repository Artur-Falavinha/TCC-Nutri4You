package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.Alimento;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AlimentoRepository extends JpaRepository<Alimento, Integer> {
    @Query(
            """
            select a from Alimento a where a.catalogoAtivo = true
            and a.nomeBusca like :nome escape '!'
            and (:categoria = '' or a.categoria = :categoria)
            order by a.nomeBusca, a.id
            """)
    Page<Alimento> buscar(String nome, String categoria, Pageable pagina);

    @Query(
            "select distinct a.categoria from Alimento a where a.catalogoAtivo = true order by"
                + " a.categoria")
    List<String> categorias();
}
