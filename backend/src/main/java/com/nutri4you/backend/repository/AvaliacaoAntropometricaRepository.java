package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.AvaliacaoAntropometrica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AvaliacaoAntropometricaRepository extends JpaRepository<AvaliacaoAntropometrica, Integer> {

    Optional<AvaliacaoAntropometrica> findByConsulta_Id(Integer consultaId);

    List<AvaliacaoAntropometrica> findByConsulta_IdIn(List<Integer> consultaIds);

    List<AvaliacaoAntropometrica> findByPaciente_IdOrderByDataAvaliacaoDesc(Integer pacienteId);

    @Query("""
            select a from AvaliacaoAntropometrica a left join a.consulta c
            where a.paciente.id = :pacienteId and (c.id is null or c.avulsa = false)
            order by a.dataAvaliacao desc
            """)
    List<AvaliacaoAntropometrica> listarAvaliacoesLongitudinais(Integer pacienteId);
}
