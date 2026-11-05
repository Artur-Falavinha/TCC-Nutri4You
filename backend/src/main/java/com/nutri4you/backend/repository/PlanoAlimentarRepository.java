package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.PlanoAlimentar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PlanoAlimentarRepository extends JpaRepository<PlanoAlimentar, Integer> {
    List<PlanoAlimentar> findByPaciente_IdOrderByIdDesc(Integer pacienteId);
    List<PlanoAlimentar> findByPaciente_IdAndNutricionista_IdOrderByIdDesc(Integer pacienteId, Integer nutricionistaId);
    List<PlanoAlimentar> findByPaciente_IdAndStatus(Integer pacienteId, String status);
    Optional<PlanoAlimentar> findByIdAndPaciente_IdAndNutricionista_Id(Integer id, Integer pacienteId, Integer nutricionistaId);
    boolean existsByConsulta_IdAndIdNot(Integer consultaId, Integer id);

    @Query("""
            select p from PlanoAlimentar p
            where p.paciente.id = :pacienteId and p.status = 'PUBLICADO'
              and (p.vigenciaInicio is null or p.vigenciaInicio <= :fim)
              and (p.vigenciaFim is null or p.vigenciaFim >= :inicio)
            order by p.id desc
            """)
    List<PlanoAlimentar> sobrepostos(Integer pacienteId, LocalDate inicio, LocalDate fim);
}
