package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.CadastroPendente;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Optional;

public interface CadastroPendenteRepository extends JpaRepository<CadastroPendente, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<CadastroPendente> findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<CadastroPendente> findByTokenHash(String tokenHash);

    @Modifying
    @Query("DELETE FROM CadastroPendente c WHERE c.expiraEm <= :agora")
    int removerExpirados(Instant agora);
}
