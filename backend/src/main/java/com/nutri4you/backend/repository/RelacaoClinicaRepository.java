package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.RelacaoClinica;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RelacaoClinicaRepository extends JpaRepository<RelacaoClinica, Integer> {

    Optional<RelacaoClinica> findByPaciente_IdAndNutricionista_Id(Integer pacienteId, Integer nutricionistaId);

    Optional<RelacaoClinica> findByPaciente_IdAndNutricionista_IdAndStatus(
            Integer pacienteId,
            Integer nutricionistaId,
            StatusRelacaoClinica status);
}
