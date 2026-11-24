package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.NotificacaoConsultaPaciente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacaoConsultaPacienteRepository extends JpaRepository<NotificacaoConsultaPaciente, Long> {
    List<NotificacaoConsultaPaciente> findTop50ByPacienteIdOrderByIdDesc(Integer pacienteId);
}
