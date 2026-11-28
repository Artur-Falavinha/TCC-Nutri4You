package com.nutri4you.backend.repository;

import com.nutri4you.backend.dto.NotificacaoExameDTO;
import com.nutri4you.backend.model.NotificacaoExame;
import com.nutri4you.backend.model.NotificacaoExame.Tipo;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface NotificacaoExameRepository extends JpaRepository<NotificacaoExame, Long> {
    @Query("""
            select new com.nutri4you.backend.dto.NotificacaoExameDTO(n.id, n.tipo, e.nome, n.criadaEm)
            from NotificacaoExame n join n.exame e
            where e.paciente.id = :pacienteId and n.tipo <> :resultado
            order by n.id desc
            """)
    List<NotificacaoExameDTO> listarParaPaciente(Integer pacienteId, Tipo resultado, Pageable pagina);

    @Query("""
            select new com.nutri4you.backend.dto.NotificacaoExameDTO$Resultado(
                n.id, p.id, p.nome, c.id, e.nome, n.criadaEm)
            from NotificacaoExame n join n.exame e join e.paciente p left join e.consulta c
            where e.nutricionista.id = :nutricionistaId and n.tipo = :resultado
              and e.status = 'ENVIADO' and n.versaoExame = e.versao
              and (
                (c.id is null and exists (
                    select 1 from RelacaoClinica r
                    where r.paciente.id = p.id and r.nutricionista.id = :nutricionistaId and r.status = :vinculoAtivo
                )) or
                (c.avulsa = true and c.iniciadaEm is not null and c.status in ('CONFIRMADA', 'REALIZADA')
                 and not exists (
                    select 1 from RelacaoClinica r
                    where r.paciente.id = p.id and r.nutricionista.id = :nutricionistaId and r.encerradaEm is not null
                ))
              )
            order by n.id desc
            """)
    List<NotificacaoExameDTO.Resultado> listarResultados(Integer nutricionistaId, Tipo resultado,
                                                         StatusRelacaoClinica vinculoAtivo, Pageable pagina);
}
