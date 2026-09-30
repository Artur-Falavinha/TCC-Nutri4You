package com.nutri4you.backend.repository;
import com.nutri4you.backend.model.RespostaAnamnese;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;
public interface RespostaAnamneseRepository extends JpaRepository<RespostaAnamnese, Integer> {
    @EntityGraph(attributePaths = "pergunta")
    List<RespostaAnamnese> findByPacienteId(Integer pacienteId);
}
