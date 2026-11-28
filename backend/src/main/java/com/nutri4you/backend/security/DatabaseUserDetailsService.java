package com.nutri4you.backend.security;

import com.nutri4you.backend.model.ContaAutenticavel;
import com.nutri4you.backend.model.TipoCadastro;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {

    private final NutricionistaRepository nutricionistaRepository;
    private final PacienteRepository pacienteRepository;

    public DatabaseUserDetailsService(
            NutricionistaRepository nutricionistaRepository,
            PacienteRepository pacienteRepository) {
        this.nutricionistaRepository = nutricionistaRepository;
        this.pacienteRepository = pacienteRepository;
    }

    @Override
    public ContaAutenticavel loadUserByUsername(String email) throws UsernameNotFoundException {
        return nutricionistaRepository.findByEmailIgnoreCase(email)
                .map(user -> (ContaAutenticavel) user)
                .orElseGet(() -> pacienteRepository.findByEmailIgnoreCase(email)
                        .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado")));
    }

    ContaAutenticavel buscarTitular(TipoCadastro tipo, Integer id) {
        if (tipo == TipoCadastro.PACIENTE) {
            return pacienteRepository.findById(id)
                    .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
        }
        return nutricionistaRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
    }
}
