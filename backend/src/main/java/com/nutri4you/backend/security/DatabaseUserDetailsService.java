package com.nutri4you.backend.security;

import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import org.springframework.security.core.userdetails.UserDetails;
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
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return nutricionistaRepository.findByEmail(email)
                .map(user -> (UserDetails) user)
                .orElseGet(() -> pacienteRepository.findByEmail(email)
                        .map(user -> (UserDetails) user)
                        .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado")));
    }
}