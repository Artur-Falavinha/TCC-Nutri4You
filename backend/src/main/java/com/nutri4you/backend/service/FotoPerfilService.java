package com.nutri4you.backend.service;

import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.repository.FotoPerfilRepository;
import com.nutri4you.backend.repository.FotoPerfilRepository.TipoTitular;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

@Service
public class FotoPerfilService {
    private final FotoPerfilRepository fotos;

    public FotoPerfilService(FotoPerfilRepository fotos) {
        this.fotos = fotos;
    }

    public Optional<byte[]> buscar(Object principal) {
        var titular = titular(principal);
        return fotos.buscar(titular.tipo(), titular.id());
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
