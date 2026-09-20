package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Integer> {

    Optional<Paciente> findByEmail(String email);

    Optional<Paciente> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    Optional<Paciente> findByCpf(String cpf);

    @Query("""
            SELECT p FROM Paciente p
            WHERE p.cpf IS NOT NULL
              AND REPLACE(REPLACE(REPLACE(p.cpf, '.', ''), '-', ''), ' ', '') = :cpfDigitos
            """)
    Optional<Paciente> findByCpfDigitos(@Param("cpfDigitos") String cpfDigitos);

    @Query("""
            SELECT DISTINCT p FROM Paciente p
            WHERE EXISTS (
                SELECT 1 FROM RelacaoClinica r
                WHERE r.paciente = p
                  AND r.nutricionista.id = :nutricionistaId
                  AND r.status = :statusAtiva
            )
            OR EXISTS (
                SELECT 1 FROM Consulta c
                WHERE c.paciente = p
                  AND c.nutricionista.id = :nutricionistaId
            )
            ORDER BY p.nome
            """)
    List<Paciente> findVisiveisParaNutricionista(
            @Param("nutricionistaId") Integer nutricionistaId,
            @Param("statusAtiva") StatusRelacaoClinica statusAtiva);
}
