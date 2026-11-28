package com.nutri4you.backend.repository;

import com.nutri4you.backend.dto.NotificacaoConsultaDTO;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.NotificacaoConsultaPaciente.Tipo;
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
            select c.id from Consulta c
            where c.status = 'CONFIRMADA' and c.iniciadaEm is null
              and c.dataHora > :agora and c.dataHora <= :limite
              and c.paciente.lembretesConsultaAtivos = true
              and not exists (select 1 from NotificacaoConsultaPaciente n
                              where n.consultaId = c.id and n.tipo = :tipo and n.dataHora = c.dataHora)
            order by c.dataHora, c.id
            """)
    List<Integer> buscarIdsComLembretePendente(LocalDateTime agora, LocalDateTime limite, Tipo tipo, Pageable pagina);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Consulta c where c.id = :id")
    Optional<Consulta> bloquearParaLembrete(Integer id);

    @Query("""
            select count(c) > 0 from Consulta c
            where c.paciente.id = :pacienteId and c.nutricionista.id = :nutricionistaId and c.avulsa = true
              and (c.status = 'CONFIRMADA'
                   or (c.status = 'AGUARDANDO_CONFIRMACAO' and c.dataHora > :agora))
            """)
    boolean temConsultaInicialEmAberto(Integer pacienteId, Integer nutricionistaId, LocalDateTime agora);

    @Query("""
            select count(c) > 0 from Consulta c where c.paciente.id = :pacienteId
              and c.nutricionista.id = :nutricionistaId and c.avulsa = true and c.id <> :consultaId
              and (c.status = 'REALIZADA' or (c.status = 'CONFIRMADA' and c.iniciadaEm is not null))
            """)
    boolean temOutraConsultaInicialRealizadaOuIniciada(Integer pacienteId, Integer nutricionistaId, Integer consultaId);

    @Query("""
            select c from Consulta c where c.paciente.id = :pacienteId
            and c.status in ('AGUARDANDO_CONFIRMACAO', 'CONFIRMADA', 'RECUSADA')
            and (c.dataHora >= :agora or (c.status = 'CONFIRMADA' and c.iniciadaEm is not null))
            order by c.dataHora, c.id
            """)
    List<Consulta> listarAgendaPaciente(Integer pacienteId, LocalDateTime agora);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select c from Consulta c where c.paciente.id = :pacienteId
            and c.nutricionista.id = :nutricionistaId
            and (c.status = 'CONFIRMADA' or (c.status = 'AGUARDANDO_CONFIRMACAO' and c.dataHora > :agora))
            """)
    List<Consulta> bloquearConsultasEmAberto(
            Integer pacienteId, Integer nutricionistaId, LocalDateTime agora);

    @Query("select c.nutricionista.id from Consulta c where c.id = :id and c.paciente.id = :pacienteId")
    Optional<Integer> buscarNutricionistaDaConsulta(Integer id, Integer pacienteId);

    Optional<Consulta> findByIdAndPaciente_IdAndNutricionista_IdAndAvulsaFalse(
            Integer id, Integer pacienteId, Integer nutricionistaId);

    Page<Consulta> findByPaciente_IdAndNutricionista_IdAndAvulsaFalse(
            Integer pacienteId, Integer nutricionistaId, Pageable pageable);

    @Query("""
            select new com.nutri4you.backend.dto.NotificacaoConsultaDTO(
                c.id, p.id, p.nome, c.dataHora, c.versao, c.avulsa, c.reagendada)
            from Consulta c join c.paciente p
            where c.nutricionista.id = :nutricionistaId
            and c.status = 'AGUARDANDO_CONFIRMACAO' and c.dataHora > :agora
            order by c.dataHora, c.id
            """)
    List<NotificacaoConsultaDTO> listarNotificacoesPendentes(Integer nutricionistaId, LocalDateTime agora);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Consulta> findByIdAndNutricionista_Id(Integer id, Integer nutricionistaId);

    List<Consulta> findByPaciente_IdAndNutricionista_IdAndAvulsaFalseOrderByDataHoraDesc(
            Integer pacienteId, Integer nutricionistaId);

    List<Consulta> findByPaciente_IdOrderByDataHoraDesc(Integer pacienteId);

    @Query("""
            select c from Consulta c join fetch c.paciente where c.nutricionista.id = :nutricionistaId
              and c.dataHora >= :inicio and c.dataHora < :fim
              and (exists (select r.id from RelacaoClinica r where r.paciente.id = c.paciente.id
                      and r.nutricionista.id = c.nutricionista.id and r.status = :ativa)
                  or (c.avulsa = true and not exists (select r.id from RelacaoClinica r
                      where r.paciente.id = c.paciente.id and r.nutricionista.id = c.nutricionista.id
                          and r.encerradaEm is not null)))
            order by c.dataHora
            """)
    List<Consulta> listarVisiveisNoPainel(Integer nutricionistaId, LocalDateTime inicio, LocalDateTime fim,
            com.nutri4you.backend.model.StatusRelacaoClinica ativa);

    Optional<Consulta> findByIdAndPaciente_Id(Integer id, Integer pacienteId);

    @Query("""
            select c from Consulta c where c.nutricionista.id = :nutricionistaId
            and c.status not in ('CANCELADA', 'RECUSADA')
            and c.dataHora >= :inicio and c.dataHora < :fim
            order by c.dataHora
            """)
    List<Consulta> listarOcupadas(
            Integer nutricionistaId, LocalDateTime inicio, LocalDateTime fim);
}
