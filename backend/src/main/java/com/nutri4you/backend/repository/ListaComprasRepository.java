package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.ListaCompras;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ListaComprasRepository extends JpaRepository<ListaCompras, Integer> {
    Optional<ListaCompras> findByPlano_IdAndDias(Integer planoId, int dias);
}
