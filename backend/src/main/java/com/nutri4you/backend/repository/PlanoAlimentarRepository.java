package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.PlanoAlimentar;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanoAlimentarRepository extends JpaRepository<PlanoAlimentar, Integer> {

    List<PlanoAlimentar> findByPaciente_IdOrderByIdDesc(Integer pacienteId);
}
