package com.nutri4you.backend.service;

import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.AlteracaoEmailPendente;
import com.nutri4you.backend.model.ContaAutenticavel;
import com.nutri4you.backend.model.TipoCadastro;
import com.nutri4you.backend.repository.AlteracaoEmailPendenteRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class AlteracaoEmailService {
    private static final Duration VALIDADE = Duration.ofMinutes(30);
    private static final Duration INTERVALO_ENVIO = Duration.ofMinutes(1);
    private static final String CODIGO_INVALIDO = "Código inválido, expirado ou já utilizado. Confira o código ou solicite outro.";
    private static final String EMAIL_EM_USO = "Este e-mail já está em uso.";

    private final AlteracaoEmailPendenteRepository solicitacoes;
    private final PacienteRepository pacientes;
    private final NutricionistaRepository nutricionistas;
    private final ContasEmail contasEmail;
    private final PasswordEncoder senhas;
    private final EmailNotificationService emails;
    private final Clock relogio;

    AlteracaoEmailService(AlteracaoEmailPendenteRepository solicitacoes, PacienteRepository pacientes,
            NutricionistaRepository nutricionistas, ContasEmail contasEmail, PasswordEncoder senhas,
            EmailNotificationService emails, Clock relogio) {
        this.solicitacoes = solicitacoes;
        this.pacientes = pacientes;
        this.nutricionistas = nutricionistas;
        this.contasEmail = contasEmail;
        this.senhas = senhas;
        this.emails = emails;
        this.relogio = relogio;
    }

    @Transactional
    public Solicitacao iniciar(ContaAutenticavel principal, String novoEmail, String senhaAtual) {
        String email = ContasEmail.normalizar(novoEmail);
        ContaAutenticavel conta = bloquearConta(principal);
        if (senhaAtual == null || senhaAtual.isBlank() || senhaAtual.length() > 256
                || !senhas.matches(senhaAtual, conta.getPassword())) {
            throw new IllegalArgumentException("A senha atual está incorreta.");
        }
        if (email.equalsIgnoreCase(conta.getEmail())) {
            throw new IllegalArgumentException("Informe um e-mail diferente do atual.");
        }
        if (contasEmail.emUso(email)) {
            throw new IllegalArgumentException(EMAIL_EM_USO);
        }

        Instant agora = relogio.instant();
        AlteracaoEmailPendente pendente = buscar(conta).orElse(null);
        if (pendente != null && agora.isBefore(pendente.getEnviadoEm().plus(INTERVALO_ENVIO))) {
            throw new IllegalArgumentException("Aguarde um minuto antes de solicitar outro código.");
        }

        if (pendente == null) {
            pendente = new AlteracaoEmailPendente(conta);
        }
        UUID codigo = UUID.randomUUID();
        pendente.emitir(email, CadastroEmailService.hash(codigo), conta.getVersaoCredencial(), agora, agora.plus(VALIDADE));
        solicitacoes.save(pendente);
        emails.agendarConfirmacaoAlteracaoEmail(email, codigo, VALIDADE.toMinutes());
        return new Solicitacao(email, pendente.getExpiraEm());
    }

    @Transactional
    public ContaAutenticavel confirmar(ContaAutenticavel principal, UUID codigo) {
        if (codigo == null) {
            throw new IllegalArgumentException(CODIGO_INVALIDO);
        }

        contasEmail.bloquearEscritas();
        ContaAutenticavel conta = bloquearConta(principal);
        AlteracaoEmailPendente pendente = buscar(conta)
                .filter(pedido -> pedido.valida(CadastroEmailService.hash(codigo), conta.getVersaoCredencial(), relogio.instant()))
                .orElseThrow(() -> new IllegalArgumentException(CODIGO_INVALIDO));
        String email = pendente.getNovoEmail();
        if (contasEmail.emUso(email)) {
            throw new IllegalArgumentException(EMAIL_EM_USO);
        }

        String anterior = conta.getEmail();
        conta.alterarEmail(email);
        solicitacoes.delete(pendente);
        emails.agendarAvisoAlteracaoEmail(anterior);
        return conta;
    }

    private ContaAutenticavel bloquearConta(ContaAutenticavel principal) {
        Optional<? extends ContaAutenticavel> atual = principal.getTipoCadastro() == TipoCadastro.PACIENTE
                ? pacientes.findByIdForUpdate(principal.getId()) : nutricionistas.findByIdForUpdate(principal.getId());
        return atual.filter(conta -> conta.getVersaoCredencial() == principal.getVersaoCredencial())
                .orElseThrow(() -> new AcessoNegadoException("Entre novamente para continuar."));
    }

    private Optional<AlteracaoEmailPendente> buscar(ContaAutenticavel conta) {
        return conta.getTipoCadastro() == TipoCadastro.PACIENTE
                ? solicitacoes.findByPacienteId(conta.getId()) : solicitacoes.findByNutricionistaId(conta.getId());
    }

    public record Solicitacao(String email, Instant expiraEm) {}
}
