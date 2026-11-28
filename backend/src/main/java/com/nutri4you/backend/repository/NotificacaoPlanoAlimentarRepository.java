package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.NotificacaoPlanoAlimentar;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacaoPlanoAlimentarRepository extends JpaRepository<NotificacaoPlanoAlimentar, Long> {
    List<NotificacaoPlanoAlimentar> findTop50ByPacienteIdOrderByIdDesc(Integer pacienteId);
}
