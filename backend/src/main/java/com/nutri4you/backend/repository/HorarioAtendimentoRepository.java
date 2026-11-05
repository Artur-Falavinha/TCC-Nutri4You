package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.HorarioAtendimento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HorarioAtendimentoRepository extends JpaRepository<HorarioAtendimento, Integer> {
    List<HorarioAtendimento> findByNutricionista_IdOrderByDiaSemanaAscHorarioAsc(Integer nutricionistaId);
    List<HorarioAtendimento> findByNutricionista_IdAndDiaSemanaOrderByHorarioAsc(Integer nutricionistaId, int diaSemana);
    void deleteByNutricionista_Id(Integer nutricionistaId);
}
