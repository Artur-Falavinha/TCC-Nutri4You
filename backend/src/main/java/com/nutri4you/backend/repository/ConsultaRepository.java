package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsultaRepository extends JpaRepository<Consulta, Integer> {

    boolean existsByPaciente_IdAndNutricionista_Id(Integer pacienteId, Integer nutricionistaId);
}
