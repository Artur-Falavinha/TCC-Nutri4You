package com.nutri4you.backend.service;

import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import com.nutri4you.backend.repository.FotoPerfilRepository;
import com.nutri4you.backend.repository.FotoPerfilRepository.TipoTitular;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

@Service
public class FotoPerfilService {
    private final FotoPerfilRepository fotos;
    private final GestaoPacienteService gestaoPacientes;
    private final RelacaoClinicaRepository relacoes;

    public FotoPerfilService(FotoPerfilRepository fotos, GestaoPacienteService gestaoPacientes,
                             RelacaoClinicaRepository relacoes) {
        this.fotos = fotos;
        this.gestaoPacientes = gestaoPacientes;
        this.relacoes = relacoes;
    }

    public Optional<byte[]> buscar(Object principal) {
        var titular = titular(principal);
        return fotos.buscar(titular.tipo(), titular.id());
    }

    public Optional<byte[]> buscarFotoPaciente(Object principal, Integer pacienteId) {
        if (!(principal instanceof Nutricionista nutricionista)) {
            throw new AcessoNegadoException("Acesso restrito ao nutricionista vinculado.");
        }
        gestaoPacientes.exigirAcesso(nutricionista, pacienteId);
        return fotos.buscar(TipoTitular.PACIENTE, pacienteId);
    }

    public Optional<byte[]> buscarFotoNutricionista(Object principal, Integer nutricionistaId) {
        if (!(principal instanceof Paciente paciente)
                || relacoes.findByPaciente_IdAndNutricionista_IdAndStatus(
                        paciente.getId(), nutricionistaId, StatusRelacaoClinica.ATIVA).isEmpty()) {
            throw new AcessoNegadoException("Acesso restrito ao paciente vinculado.");
        }
        return fotos.buscar(TipoTitular.NUTRICIONISTA, nutricionistaId);
    }

    public byte[] salvar(Object principal, MultipartFile arquivo) {
        var titular = titular(principal);
        byte[] jpeg = ImagemPerfil.normalizar(arquivo);
        fotos.salvar(titular.tipo(), titular.id(), jpeg);
        return jpeg;
    }

    public void remover(Object principal) {
        var titular = titular(principal);
        fotos.remover(titular.tipo(), titular.id());
    }

    private static Titular titular(Object principal) {
        return switch (principal) {
            case Paciente paciente -> new Titular(TipoTitular.PACIENTE, paciente.getId());
            case Nutricionista nutricionista -> new Titular(TipoTitular.NUTRICIONISTA, nutricionista.getId());
            case null, default -> throw new AcessoNegadoException("Acesso restrito ao titular da conta.");
        };
    }

    private record Titular(TipoTitular tipo, int id) {}
}
