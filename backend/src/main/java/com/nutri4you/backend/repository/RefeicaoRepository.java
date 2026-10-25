package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.Refeicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RefeicaoRepository extends JpaRepository<Refeicao, Integer> {

    List<Refeicao> findByPlano_IdOrderByOrdemAscHorarioAscIdAsc(Integer planoId);

    void deleteByPlano_Id(Integer planoId);
}

