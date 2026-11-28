package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.NutricionistaCadastroDTO;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.TipoCadastro;
import com.nutri4you.backend.repository.NutricionistaRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class NutricionistaService {

    private final NutricionistaRepository nutricionistas;
    private final PasswordEncoder passwordEncoder;
    private final PrivacidadeService privacidade;
    private final CadastroEmailService cadastroEmail;

    public NutricionistaService(NutricionistaRepository nutricionistas, PasswordEncoder passwordEncoder,
            PrivacidadeService privacidade, CadastroEmailService cadastroEmail) {
        this.nutricionistas = nutricionistas;
        this.passwordEncoder = passwordEncoder;
        this.privacidade = privacidade;
        this.cadastroEmail = cadastroEmail;
    }

    @Transactional
    public Nutricionista autocadastrar(NutricionistaCadastroDTO dto) {
        if (dto.nome() == null || dto.nome().isBlank() || dto.crn() == null || dto.crn().isBlank()) {
            throw new IllegalArgumentException("Nome e CRN são obrigatórios.");
        }
        if (!dto.crnDeclarado()) {
            throw new IllegalArgumentException("Declare a validade do seu CRN junto com o aceite dos termos.");
        }
        PrivacidadeService.exigirVersao(dto.versaoTermos());
        AuthEmailService.validarSenha(dto.senha());

        String email = cadastroEmail.consumir(dto.tokenCadastro(), TipoCadastro.NUTRICIONISTA, dto.email());
        String crn = normalizarCrn(dto.crn());
        if (nutricionistas.existsByCrnIgnoreCase(crn)) {
            throw new IllegalArgumentException("CRN já está em uso no sistema.");
        }

        Nutricionista nutricionista = new Nutricionista(dto.nome().trim(), email, passwordEncoder.encode(dto.senha()), crn);
        nutricionista.confirmarEmail();
        Nutricionista cadastrado = nutricionistas.save(nutricionista);
        privacidade.aceitar(cadastrado, dto.versaoTermos());
        return cadastrado;
    }

    @Transactional
    public Perfil atualizarPerfil(Nutricionista principal, String nome, String novoCrn, String versaoTermos,
            boolean crnDeclarado) {
        if (nome == null || nome.isBlank() || nome.trim().length() > 150) {
            throw new IllegalArgumentException("Informe um nome com até 150 caracteres.");
        }
        Nutricionista conta = nutricionistas.findByIdForUpdate(principal.getId())
                .filter(atual -> atual.getVersaoCredencial() == principal.getVersaoCredencial())
                .orElseThrow(() -> new AcessoNegadoException("Entre novamente para continuar."));
        String crn = novoCrn == null ? conta.getCrn() : normalizarCrn(novoCrn);
        if (!conta.getCrn().equalsIgnoreCase(crn)) {
            PrivacidadeService.exigirVersao(versaoTermos);
            if (!crnDeclarado) {
                throw new IllegalArgumentException("Declare a validade do seu CRN junto com o aceite dos termos.");
            }
            if (nutricionistas.existsByCrnIgnoreCase(crn)) {
                throw new IllegalArgumentException("CRN já está em uso no sistema.");
            }
            privacidade.reaceitar(conta, versaoTermos);
        } else {
            crn = conta.getCrn();
        }
        conta.atualizarPerfil(nome.trim(), crn);
        try {
            nutricionistas.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalArgumentException("CRN já está em uso no sistema.", exception);
        }
        return Perfil.de(conta);
    }

    private static String normalizarCrn(String valor) {
        String crn = valor.trim().toUpperCase(Locale.ROOT);
        if (crn.isEmpty() || crn.length() > 20) {
            throw new IllegalArgumentException("Informe um CRN com até 20 caracteres.");
        }
        return crn;
    }

    public record Perfil(String nome, String crn) {
        public static Perfil de(Nutricionista nutricionista) {
            return new Perfil(nutricionista.getNome(), nutricionista.getCrn());
        }
    }
}
