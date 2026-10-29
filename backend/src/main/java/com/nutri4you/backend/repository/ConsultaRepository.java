package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ConsultaRepository extends JpaRepository<Consulta, Integer> {

    @Query("""
            select c from Consulta c where c.paciente.id = :pacienteId
            and c.status in ('AGUARDANDO_CONFIRMACAO', 'CONFIRMADA')
            and (c.dataHora >= :agora or (c.status = 'CONFIRMADA' and c.iniciadaEm is not null))
            order by c.dataHora, c.id
            """)
    List<Consulta> listarAgendaPaciente(Integer pacienteId, LocalDateTime agora);

    Optional<Consulta> findByIdAndPaciente_IdAndNutricionista_Id(
            Integer id, Integer pacienteId, Integer nutricionistaId);

    Page<Consulta> findByPaciente_IdAndNutricionista_Id(
            Integer pacienteId, Integer nutricionistaId, Pageable pageable);

    boolean existsByPaciente_IdAndNutricionista_Id(Integer pacienteId, Integer nutricionistaId);

    List<Consulta> findByPaciente_IdAndNutricionista_IdOrderByDataHoraDesc(
            Integer pacienteId, Integer nutricionistaId);

    List<Consulta> findByPaciente_IdOrderByDataHoraDesc(Integer pacienteId);

    List<Consulta> findByNutricionista_IdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraAsc(
            Integer nutricionistaId, LocalDateTime inicio, LocalDateTime fim);

    Optional<Consulta> findByIdAndPaciente_Id(Integer id, Integer pacienteId);

    List<Consulta> findByNutricionista_IdAndStatusNotAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraAsc(
            Integer nutricionistaId, String status, LocalDateTime inicio, LocalDateTime fim);
}
