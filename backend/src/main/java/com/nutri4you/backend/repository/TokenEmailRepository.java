package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.TipoTokenEmail;
import com.nutri4you.backend.model.TokenEmail;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface TokenEmailRepository extends JpaRepository<TokenEmail, Integer> {

    Optional<TokenEmail> findByToken(UUID token);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM TokenEmail t WHERE t.token = :token")
    Optional<TokenEmail> findByTokenForUpdate(@Param("token") UUID token);

    @Modifying
    @Query("""
            UPDATE TokenEmail t SET t.usadoEm = :agora
            WHERE t.tipo = :tipo AND t.usadoEm IS NULL AND t.paciente.id = :pacienteId
            """)
    int invalidarTokensPendentesPaciente(
            @Param("pacienteId") Integer pacienteId,
            @Param("tipo") TipoTokenEmail tipo,
            @Param("agora") LocalDateTime agora);

    @Modifying
    @Query("""
            UPDATE TokenEmail t SET t.usadoEm = :agora
            WHERE t.tipo = :tipo AND t.usadoEm IS NULL AND t.nutricionista.id = :nutricionistaId
            """)
    int invalidarTokensPendentesNutricionista(
            @Param("nutricionistaId") Integer nutricionistaId,
            @Param("tipo") TipoTokenEmail tipo,
            @Param("agora") LocalDateTime agora);
}
