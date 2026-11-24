package com.nutri4you.backend.repository;

import com.nutri4you.backend.model.NotificacaoConsultaPaciente;
import com.nutri4you.backend.model.NotificacaoConsultaPaciente.Tipo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDateTime;

public interface NotificacaoConsultaPacienteRepository extends JpaRepository<NotificacaoConsultaPaciente, Long> {
    List<NotificacaoConsultaPaciente> findTop50ByPacienteIdOrderByIdDesc(Integer pacienteId);

    boolean existsByConsultaIdAndTipoAndDataHora(Integer consultaId, Tipo tipo, LocalDateTime dataHora);
}
