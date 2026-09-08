package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.Nutricionista;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NutricionistaRepository extends JpaRepository<Nutricionista, Integer> {

    Optional<Nutricionista> findByEmail(String email);

    boolean existsByEmail(String email);
}