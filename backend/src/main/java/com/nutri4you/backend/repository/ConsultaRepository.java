package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ConsultaRepository extends JpaRepository<Consulta, Integer> {

    Optional<Consulta> findByIdAndPaciente_IdAndNutricionista_Id(
            Integer id, Integer pacienteId, Integer nutricionistaId);

    Page<Consulta> findByPaciente_IdAndNutricionista_Id(
            Integer pacienteId, Integer nutricionistaId, Pageable pageable);

    boolean existsByPaciente_IdAndNutricionista_Id(Integer pacienteId, Integer nutricionistaId);

    List<Consulta> findByPaciente_IdAndNutricionista_IdOrderByDataHoraDesc(
            Integer pacienteId, Integer nutricionistaId);

    List<Consulta> findByNutricionista_IdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraAsc(
            Integer nutricionistaId, LocalDateTime inicio, LocalDateTime fim);
}
