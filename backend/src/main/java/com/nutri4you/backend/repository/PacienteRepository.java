package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Integer> {

    Optional<Paciente> findByEmail(String email);

    boolean existsByEmail(String email);
}