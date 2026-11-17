package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.RelacaoClinica;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RelacaoClinicaRepository extends JpaRepository<RelacaoClinica, Integer> {

    Optional<RelacaoClinica> findByPaciente_IdAndNutricionista_Id(Integer pacienteId, Integer nutricionistaId);

    List<RelacaoClinica> findByPaciente_IdAndStatus(Integer pacienteId, StatusRelacaoClinica status);
    List<RelacaoClinica> findByNutricionista_IdAndStatusAndSolicitadaPeloPacienteTrue(Integer nutricionistaId, StatusRelacaoClinica status);
    Optional<RelacaoClinica> findByIdAndNutricionista_Id(Integer id, Integer nutricionistaId);
    boolean existsByPaciente_IdAndStatus(Integer pacienteId, StatusRelacaoClinica status);
    boolean existsByPaciente_IdAndNutricionista_IdAndEncerradaEmIsNotNull(Integer pacienteId, Integer nutricionistaId);
    Optional<RelacaoClinica> findByIdAndPaciente_Id(Integer id, Integer pacienteId);

    Optional<RelacaoClinica> findByPaciente_IdAndNutricionista_IdAndStatus(
            Integer pacienteId,
            Integer nutricionistaId,
            StatusRelacaoClinica status);
}
