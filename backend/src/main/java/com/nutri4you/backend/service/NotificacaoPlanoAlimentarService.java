package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.NotificacaoPlanoAlimentarDTO;
import com.nutri4you.backend.model.NotificacaoPlanoAlimentar;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.PlanoAlimentar;
import com.nutri4you.backend.repository.NotificacaoPlanoAlimentarRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificacaoPlanoAlimentarService {
    private final NotificacaoPlanoAlimentarRepository avisos;

    public NotificacaoPlanoAlimentarService(NotificacaoPlanoAlimentarRepository avisos) {
        this.avisos = avisos;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(PlanoAlimentar plano, boolean atualizacao) {
        avisos.save(new NotificacaoPlanoAlimentar(plano, atualizacao));
    }

    @Transactional(readOnly = true)
    public List<NotificacaoPlanoAlimentarDTO> listar(Paciente paciente) {
        return avisos.findTop50ByPacienteIdOrderByIdDesc(paciente.getId()).stream()
                .map(aviso -> new NotificacaoPlanoAlimentarDTO(aviso.getId(), aviso.getTitulo(), aviso.isAtualizacao(),
                        aviso.getVigenciaInicio(), aviso.getVigenciaFim(), aviso.getCriadaEm()))
                .toList();
    }
}
