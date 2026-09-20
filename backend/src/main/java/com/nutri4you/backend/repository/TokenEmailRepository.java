package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.TokenEmail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TokenEmailRepository extends JpaRepository<TokenEmail, Integer> {

    Optional<TokenEmail> findByToken(UUID token);
}
