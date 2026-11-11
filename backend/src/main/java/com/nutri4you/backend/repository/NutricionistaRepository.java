package com.nutri4you.backend.repository;

import com.nutri4you.backend.dto.NutricionistaAgendaDTO;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface NutricionistaRepository extends JpaRepository<Nutricionista, Integer> {

    Optional<Nutricionista> findByEmail(String email);

    Optional<Nutricionista> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    @Query("""
            select new com.nutri4you.backend.dto.NutricionistaAgendaDTO(
                n.id, n.nome, case when r.id is null then false else true end)
            from Nutricionista n
            left join RelacaoClinica r on r.nutricionista = n
                and r.paciente.id = :pacienteId and r.status = :statusAtiva
            where r.id is not null or (n.aceitaConsultasAvulsas = true and exists (
                select 1 from HorarioAtendimento h where h.nutricionista = n))
            order by n.nome, n.id
            """)
    List<NutricionistaAgendaDTO> listarParaAgenda(Integer pacienteId, StatusRelacaoClinica statusAtiva);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select n from Nutricionista n where n.id = :id")
    Optional<Nutricionista> findByIdForUpdate(@Param("id") Integer id);
}
