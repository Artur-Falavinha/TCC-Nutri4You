package com.nutri4you.backend.repository;
import com.nutri4you.backend.model.Alimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface AlimentoRepository extends JpaRepository<Alimento, Integer>, JpaSpecificationExecutor<Alimento> {
    List<Alimento> findByNomeContainingIgnoreCaseOrderByNomeAsc(String termo, Pageable pagina);
}
