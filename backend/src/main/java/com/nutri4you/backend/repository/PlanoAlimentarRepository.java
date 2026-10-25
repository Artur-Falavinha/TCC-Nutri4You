package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.PlanoAlimentar;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlanoAlimentarRepository extends JpaRepository<PlanoAlimentar, Integer> {

    List<PlanoAlimentar> findByPaciente_IdOrderByIdDesc(Integer pacienteId);

    List<PlanoAlimentar> findByPaciente_IdAndStatusOrderByIdDesc(Integer pacienteId, String status);

    Optional<PlanoAlimentar> findByIdAndPaciente_Id(Integer id, Integer pacienteId);
}
