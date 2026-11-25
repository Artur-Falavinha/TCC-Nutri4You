package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.AlteracaoEmailPendente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AlteracaoEmailPendenteRepository extends JpaRepository<AlteracaoEmailPendente, Long> {
    Optional<AlteracaoEmailPendente> findByPacienteId(Integer id);
    Optional<AlteracaoEmailPendente> findByNutricionistaId(Integer id);
}
