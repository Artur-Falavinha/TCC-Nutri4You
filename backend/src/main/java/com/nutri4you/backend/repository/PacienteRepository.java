package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface PacienteRepository extends JpaRepository<Paciente, Integer> {

    Optional<Paciente> findByEmail(String email);

    Optional<Paciente> findByEmailAndAtivoTrue(String email);

    Optional<Paciente> findByIdAndAtivoTrue(Integer id);

    List<Paciente> findAllByAtivoTrue();

    boolean existsByEmail(String email);
}