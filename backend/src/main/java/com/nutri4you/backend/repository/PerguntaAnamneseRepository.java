package com.nutri4you.backend.repository;
import com.nutri4you.backend.model.PerguntaAnamnese;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PerguntaAnamneseRepository extends JpaRepository<PerguntaAnamnese, Integer> {
    List<PerguntaAnamnese> findByCodigoIsNotNull();
}
