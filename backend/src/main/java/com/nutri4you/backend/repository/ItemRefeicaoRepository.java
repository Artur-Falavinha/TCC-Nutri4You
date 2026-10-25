package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.ItemRefeicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRefeicaoRepository extends JpaRepository<ItemRefeicao, Integer> {

    List<ItemRefeicao> findByRefeicao_IdOrderByOrdemAscIdAsc(Integer refeicaoId);

    List<ItemRefeicao> findByRefeicao_IdAndItemPrincipalIsNullOrderByOrdemAscIdAsc(Integer refeicaoId);

    List<ItemRefeicao> findByRefeicao_Plano_IdOrderByOrdemAscIdAsc(Integer planoId);

    List<ItemRefeicao> findByItemPrincipal_IdOrderByOrdemAscIdAsc(Integer itemPrincipalId);

    void deleteByItemPrincipal_Id(Integer itemPrincipalId);

    void deleteByRefeicao_Id(Integer refeicaoId);

    void deleteByRefeicao_Plano_Id(Integer planoId);
}

