package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.Exame;
import com.nutri4you.backend.dto.ExameResponse;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import java.util.Optional;

public interface ExameRepository extends JpaRepository<Exame, Integer> {
    Optional<Exame> findByIdAndPaciente_Id(Integer id, Integer pacienteId);
    Optional<Exame> findByIdAndPaciente_IdAndNutricionista_Id(Integer id, Integer pacienteId, Integer nutricionistaId);
    // Projection deliberately excludes binary data from paginated reads.
    @Query("""
        select new com.nutri4you.backend.dto.ExameResponse(e.id, e.paciente.id, e.nutricionista.id, e.nome, e.descricao,
        e.dataSolicitacao, e.dataEnvio, e.status, e.arquivoNome, e.arquivoTipo, e.arquivoTamanho, e.parecer, e.analisadoEm, e.versao)
        from Exame e where e.paciente.id = :pacienteId and (:nutriId is null or e.nutricionista.id = :nutriId)
        """)
    Page<ExameResponse> listar(@Param("pacienteId") Integer pacienteId, @Param("nutriId") Integer nutriId, Pageable page);
}
