package com.nutri4you.backend.repository;



import com.nutri4you.backend.model.Paciente;

import com.nutri4you.backend.model.StatusRelacaoClinica;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;



import java.util.List;

import java.util.Optional;



public interface PacienteRepository extends JpaRepository<Paciente, Integer> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Paciente p where p.id = :id")
    Optional<Paciente> findByIdForUpdate(@Param("id") Integer id);

    @Modifying
    @Query("update Paciente p set p.lembretesConsultaAtivos = :ativa where p.id = :id")
    int definirLembretesConsulta(@Param("id") Integer id, @Param("ativa") boolean ativa);




    Optional<Paciente> findByEmail(String email);



    Optional<Paciente> findByEmailIgnoreCase(String email);



    boolean existsByEmail(String email);

    boolean existsByCpf(String cpf);



    Optional<Paciente> findByCpfAndCpfOriginalConflitanteIsNull(String cpf);



    @Query("""

            SELECT DISTINCT p FROM Paciente p

            WHERE EXISTS (

                SELECT 1 FROM RelacaoClinica r

                WHERE r.paciente = p

                  AND r.nutricionista.id = :nutricionistaId

                  AND r.status = :statusAtiva

            )

            ORDER BY p.nome

            """)

    List<Paciente> findVisiveisParaNutricionista(

            @Param("nutricionistaId") Integer nutricionistaId,

            @Param("statusAtiva") StatusRelacaoClinica statusAtiva);

}

