package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.ConsumoDiario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface ConsumoDiarioRepository extends JpaRepository<ConsumoDiario, Integer> {

    Optional<ConsumoDiario> findByPaciente_IdAndDataRegistro(Integer pacienteId, LocalDate dataRegistro);

    Optional<ConsumoDiario> findFirstByPaciente_IdOrderByDataRegistroDesc(Integer pacienteId);
}

