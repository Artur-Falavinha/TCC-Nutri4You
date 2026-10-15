package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.Nutricionista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.Optional;

public interface NutricionistaRepository extends JpaRepository<Nutricionista, Integer> {

    Optional<Nutricionista> findByEmail(String email);

    Optional<Nutricionista> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select n from Nutricionista n where n.id = :id")
    Optional<Nutricionista> findByIdForUpdate(@Param("id") Integer id);
}
