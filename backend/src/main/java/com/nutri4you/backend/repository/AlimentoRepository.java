package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.Alimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AlimentoRepository extends JpaRepository<Alimento, Integer> {

    Optional<Alimento> findByNumeroTaco(Integer numeroTaco);

    List<Alimento> findAllByOrderByNomeAsc();

    List<Alimento> findByCategoriaIgnoreCaseOrderByNomeAsc(String categoria);

    @Query("SELECT DISTINCT a.categoria FROM Alimento a WHERE a.categoria IS NOT NULL AND a.categoria <> '' ORDER BY a.categoria ASC")
    List<String> listarCategorias();
}

