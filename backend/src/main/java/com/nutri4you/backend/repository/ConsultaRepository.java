package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ConsultaRepository extends JpaRepository<Consulta, Integer> {

    boolean existsByPaciente_IdAndNutricionista_Id(Integer pacienteId, Integer nutricionistaId);

    List<Consulta> findByPaciente_IdAndNutricionista_IdOrderByDataHoraDesc(
            Integer pacienteId, Integer nutricionistaId);

    List<Consulta> findByNutricionista_IdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraAsc(
            Integer nutricionistaId, LocalDateTime inicio, LocalDateTime fim);
}
