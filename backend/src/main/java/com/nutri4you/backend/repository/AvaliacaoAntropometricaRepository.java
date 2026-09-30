package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.AvaliacaoAntropometrica;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AvaliacaoAntropometricaRepository extends JpaRepository<AvaliacaoAntropometrica, Integer> {

    List<AvaliacaoAntropometrica> findByPaciente_IdOrderByDataAvaliacaoDesc(Integer pacienteId);
}
