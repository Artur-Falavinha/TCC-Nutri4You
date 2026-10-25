package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.ItemListaCompras;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemListaComprasRepository extends JpaRepository<ItemListaCompras, Integer> {

    List<ItemListaCompras> findByLista_IdOrderByCategoriaAscNomeItemAscIdAsc(Integer listaId);

    void deleteByLista_Id(Integer listaId);
}

