package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.NotificacaoExameDTO;
import com.nutri4you.backend.model.Exame;
import com.nutri4you.backend.model.NotificacaoExame;
import com.nutri4you.backend.model.NotificacaoExame.Tipo;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import com.nutri4you.backend.repository.NotificacaoExameRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;

@Service
public class NotificacaoExameService {
    private static final PageRequest RECENTES = PageRequest.of(0, 50);
    private final NotificacaoExameRepository avisos;
    private final Clock clock;

    public NotificacaoExameService(NotificacaoExameRepository avisos, Clock clock) {
        this.avisos = avisos;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(Exame exame, Tipo tipo) {
        avisos.save(new NotificacaoExame(exame, tipo, clock.instant()));
    }

    @Transactional(readOnly = true)
    public List<NotificacaoExameDTO> listarPaciente(Paciente paciente) {
        return avisos.listarParaPaciente(paciente.getId(), Tipo.RESULTADO_ENVIADO, RECENTES);
    }

    @Transactional(readOnly = true)
    public List<NotificacaoExameDTO.Resultado> listarResultados(Nutricionista nutricionista) {
        return avisos.listarResultados(nutricionista.getId(), Tipo.RESULTADO_ENVIADO, StatusRelacaoClinica.ATIVA, RECENTES);
    }
}
