package com.nutri4you.backend.repository;

import com.nutri4you.backend.dto.SolicitacaoAvulsaDTO;
import com.nutri4you.backend.dto.NotificacaoConsultaDTO;
import com.nutri4you.backend.model.Consulta;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ConsultaRepository extends JpaRepository<Consulta, Integer> {

    @Query("""
            select c from Consulta c where c.paciente.id = :pacienteId
            and (c.status in ('AGUARDANDO_CONFIRMACAO', 'CONFIRMADA')
                or (c.avulsa = true and c.status = 'CANCELADA'))
            and (c.dataHora >= :agora or (c.status = 'CONFIRMADA' and c.iniciadaEm is not null))
            order by c.dataHora, c.id
            """)
    List<Consulta> listarAgendaPaciente(Integer pacienteId, LocalDateTime agora);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select c from Consulta c where c.paciente.id = :pacienteId
            and c.nutricionista.id = :nutricionistaId and c.avulsa = false
            and c.iniciadaEm is null and c.dataHora > :agora
            and c.status in ('AGUARDANDO_CONFIRMACAO', 'CONFIRMADA')
            """)
    List<Consulta> bloquearRecorrentesFuturasNaoIniciadas(
            Integer pacienteId, Integer nutricionistaId, LocalDateTime agora);

    @Query("select c.nutricionista.id from Consulta c where c.id = :id and c.paciente.id = :pacienteId")
    Optional<Integer> buscarNutricionistaDaConsulta(Integer id, Integer pacienteId);

    Optional<Consulta> findByIdAndPaciente_IdAndNutricionista_IdAndAvulsaFalse(
            Integer id, Integer pacienteId, Integer nutricionistaId);

    Page<Consulta> findByPaciente_IdAndNutricionista_IdAndAvulsaFalse(
            Integer pacienteId, Integer nutricionistaId, Pageable pageable);

    boolean existsByPaciente_IdAndNutricionista_IdAndAvulsaFalse(Integer pacienteId, Integer nutricionistaId);

    @Query("""
            select new com.nutri4you.backend.dto.SolicitacaoAvulsaDTO(c.id, p.nome, c.dataHora, c.versao)
            from Consulta c join c.paciente p
            where c.nutricionista.id = :nutricionistaId and c.avulsa = true
            and c.status = 'AGUARDANDO_CONFIRMACAO' and c.dataHora > :agora
            order by c.dataHora, c.id
            """)
    List<SolicitacaoAvulsaDTO> listarAvulsasPendentes(Integer nutricionistaId, LocalDateTime agora);

    @Query("""
            select new com.nutri4you.backend.dto.NotificacaoConsultaDTO(
                c.id, p.id, p.nome, c.dataHora, c.versao, c.avulsa)
            from Consulta c join c.paciente p
            where c.nutricionista.id = :nutricionistaId
            and c.status = 'AGUARDANDO_CONFIRMACAO' and c.dataHora > :agora
            order by c.dataHora, c.id
            """)
    List<NotificacaoConsultaDTO> listarNotificacoesPendentes(Integer nutricionistaId, LocalDateTime agora);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Consulta> findByIdAndNutricionista_Id(Integer id, Integer nutricionistaId);

    Optional<Consulta> findByIdAndNutricionista_IdAndAvulsaTrue(Integer id, Integer nutricionistaId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select c from Consulta c
            where c.id = :id and c.nutricionista.id = :nutricionistaId and c.avulsa = true
            """)
    Optional<Consulta> buscarAvulsaParaAtualizar(Integer id, Integer nutricionistaId);

    @Query("""
            select c from Consulta c join fetch c.paciente
            where c.nutricionista.id = :nutricionistaId and c.avulsa = true
              and ((c.status = 'CONFIRMADA' and (c.iniciadaEm is not null or c.dataHora >= :horarioMinimo))
                   or (c.status = 'REALIZADA' and c.iniciadaEm is not null))
            order by case when c.status = 'REALIZADA' then 1 else 0 end,
                case when c.status = 'CONFIRMADA' then c.dataHora end asc,
                c.dataHora desc, c.id desc
            """)
    List<Consulta> listarAtendimentosAvulsos(Integer nutricionistaId, LocalDateTime horarioMinimo);

    List<Consulta> findByPaciente_IdAndNutricionista_IdAndAvulsaFalseOrderByDataHoraDesc(
            Integer pacienteId, Integer nutricionistaId);

    List<Consulta> findByPaciente_IdOrderByDataHoraDesc(Integer pacienteId);

    List<Consulta> findByNutricionista_IdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraAsc(
            Integer nutricionistaId, LocalDateTime inicio, LocalDateTime fim);

    Optional<Consulta> findByIdAndPaciente_Id(Integer id, Integer pacienteId);

    List<Consulta> findByNutricionista_IdAndStatusNotAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHoraAsc(
            Integer nutricionistaId, String status, LocalDateTime inicio, LocalDateTime fim);
}
