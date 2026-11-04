package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.ConsumoRefeicao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface ConsumoRefeicaoRepository extends JpaRepository<ConsumoRefeicao, Integer> {
    List<ConsumoRefeicao> findByPaciente_IdAndData(Integer pacienteId, LocalDate data);
}
