package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.NutricionistaCadastroDTO;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NutricionistaService {

    private final NutricionistaRepository nutricionistaRepository;
    private final PacienteRepository pacienteRepository;
    private final PasswordEncoder passwordEncoder;

    public NutricionistaService(
            NutricionistaRepository nutricionistaRepository,
            PacienteRepository pacienteRepository,
            PasswordEncoder passwordEncoder) {
        this.nutricionistaRepository = nutricionistaRepository;
        this.pacienteRepository = pacienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Nutricionista autocadastrar(NutricionistaCadastroDTO dto) {
        return cadastrarNutricionista(dto);
    }

    @Transactional
    public Nutricionista cadastrarNutricionista(NutricionistaCadastroDTO dto) {
        if (dto == null || vazio(dto.nome()) || vazio(dto.email())
                || vazio(dto.senha()) || vazio(dto.crn())) {
            throw new IllegalArgumentException("Nome, e-mail, senha e CRN são obrigatórios.");
        }

        AuthEmailService.validarSenha(dto.senha());

        String email = dto.email().trim().toLowerCase();
        if (nutricionistaRepository.existsByEmail(email) || pacienteRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("E-mail já está em uso no sistema.");
        }

        Nutricionista novoNutricionista = new Nutricionista(
                dto.nome().trim(),
                email,
                passwordEncoder.encode(dto.senha()),
                dto.crn().trim());

        return nutricionistaRepository.save(novoNutricionista);
    }

    private boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }
}
