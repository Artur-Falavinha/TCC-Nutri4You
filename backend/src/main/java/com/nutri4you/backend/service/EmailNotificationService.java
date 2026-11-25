package com.nutri4you.backend.service;

import com.nutri4you.backend.config.EmailProperties;
import com.nutri4you.backend.email.AsyncEmailDispatcher;
import com.nutri4you.backend.email.ContaEmailTemplate;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.TipoCadastro;
import com.nutri4you.backend.model.TokenEmail;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

@Service
public class EmailNotificationService {

    private final EmailProperties emailProperties;
    private final TokenEmailService tokenEmailService;
    private final AsyncEmailDispatcher asyncEmailDispatcher;
    private final ContaEmailTemplate contaEmailTemplate;

    public EmailNotificationService(
            EmailProperties emailProperties,
            TokenEmailService tokenEmailService,
            AsyncEmailDispatcher asyncEmailDispatcher,
            ContaEmailTemplate contaEmailTemplate) {
        this.emailProperties = emailProperties;
        this.tokenEmailService = tokenEmailService;
        this.asyncEmailDispatcher = asyncEmailDispatcher;
        this.contaEmailTemplate = contaEmailTemplate;
    }

    public void agendarInicioCadastro(String email, TipoCadastro tipoUsuario, UUID token) {
        var conteudo = contaEmailTemplate.confirmacaoCadastro(
                tipoUsuario, token, emailProperties.linkCadastro(token), emailProperties.getConfirmacaoTtlHoras());
        enviarAposCommit(email, "Confirme seu e-mail — Nutri4You", conteudo);
    }

    public void agendarConfirmacaoAlteracaoEmail(String email, UUID codigo, long minutos) {
        enviarAposCommit(email, "Código para alterar seu e-mail — Nutri4You",
                contaEmailTemplate.confirmacaoAlteracaoEmail(codigo, minutos));
    }

    public void agendarAvisoAlteracaoEmail(String emailAnterior) {
        enviarAposCommit(emailAnterior, "Seu e-mail foi alterado — Nutri4You", contaEmailTemplate.avisoAlteracaoEmail());
    }

    @Transactional
    public void agendarRecuperacaoSenha(Paciente paciente) {
        TokenEmail token = tokenEmailService.criarTokenRecuperacao(paciente);
        enviarRecuperacaoAssincrona(paciente.getEmail(), paciente.getNome(), token);
    }

    @Transactional
    public void agendarRecuperacaoSenha(Nutricionista nutricionista) {
        TokenEmail token = tokenEmailService.criarTokenRecuperacao(nutricionista);
        enviarRecuperacaoAssincrona(nutricionista.getEmail(), nutricionista.getNome(), token);
    }

    private void enviarAposCommit(String destinatario, String assunto, ContaEmailTemplate.Conteudo conteudo) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                asyncEmailDispatcher.enviarFormatado(
                        destinatario, assunto, conteudo.texto(), conteudo.html());
            }
        });
    }

    private void enviarRecuperacaoAssincrona(String email, String nome, TokenEmail token) {
        String link = emailProperties.getWebBaseUrl() + "/redefinir-senha?token=" + token.getToken();
        var conteudo = contaEmailTemplate.recuperacaoSenha(
                nome, token.getToken(), link, emailProperties.getRecuperacaoTtlHoras());
        asyncEmailDispatcher.enviarFormatado(email, "Recuperação de senha — Nutri4You",
                conteudo.texto(), conteudo.html());
    }
}
