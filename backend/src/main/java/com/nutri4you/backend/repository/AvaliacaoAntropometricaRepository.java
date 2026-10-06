package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.AvaliacaoAntropometrica;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AvaliacaoAntropometricaRepository extends JpaRepository<AvaliacaoAntropometrica, Integer> {

    Optional<AvaliacaoAntropometrica> findByConsulta_Id(Integer consultaId);

    List<AvaliacaoAntropometrica> findByConsulta_IdIn(List<Integer> consultaIds);

    List<AvaliacaoAntropometrica> findByPaciente_IdOrderByDataAvaliacaoDesc(Integer pacienteId);
}
