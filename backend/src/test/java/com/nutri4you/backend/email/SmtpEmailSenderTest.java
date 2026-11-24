package com.nutri4you.backend.email;

import com.nutri4you.backend.model.TipoCadastro;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Properties;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SmtpEmailSenderTest {

    @ParameterizedTest
    @EnumSource(TipoCadastro.class)
    void enviaConfirmacaoComTextoHtmlELogoEmbutida(TipoCadastro tipo) throws Exception {
        UUID token = UUID.randomUUID();
        String link = "http://localhost:4200/confirmar-email?origem=teste&canal=email#cadastro=" + token;
        var conteudo = modelo().confirmacaoCadastro(tipo, token, link, 24);
        var recebido = enviar("Confirme seu e-mail — Nutri4You", conteudo);
        String texto = recebido.texto();
        String html = recebido.html();
        assertThat(texto).contains(link, "24 h", "30 minutos");
        assertThat(html).contains(link.replace("&", "&amp;"), "cid:logo-nutri4you").doesNotContain("{{");

        if (tipo == TipoCadastro.PACIENTE) {
            assertThat(texto).contains("\n" + token + "\n");
            assertThat(html).contains("Código de confirmação", token + "</code>");
        } else {
            assertThat(texto).doesNotContain("\n" + token + "\n");
            assertThat(html).contains("Confirmar e-mail").doesNotContain("<code");
        }
    }

    @Test
    void enviaRecuperacaoComCodigoCopiavelEAcaoWeb() throws Exception {
        UUID token = UUID.randomUUID();
        String link = "http://localhost:4200/redefinir-senha?token=" + token;
        String nome = "<Nome> & {{LINK}}";
        var conteudo = modelo().recuperacaoSenha(nome, token, link, 1);
        var recebido = enviar("Recuperação de senha — Nutri4You", conteudo);

        assertThat(recebido.texto()).contains(nome, "\n" + token + "\n", link, "1 h");
        assertThat(recebido.html())
                .contains("&lt;Nome&gt; &amp; {{LINK}}", "href=\"" + link + "\"", "Redefinir senha",
                        "Código de verificação", token + "</code>", "1 h", "cid:logo-nutri4you")
                .doesNotContain("<Nome>", "{{TOKEN}}", "{{CODIGO}}", "{{VALIDADE}}");
    }

    private ContaEmailTemplate modelo() throws Exception {
        return new ContaEmailTemplate(
                new ClassPathResource("email/conta.html"),
                new ClassPathResource("email/codigo.html"));
    }

    private ContaEmailTemplate.Conteudo enviar(String assunto, ContaEmailTemplate.Conteudo conteudo) throws Exception {
        var mensagem = new MimeMessage(Session.getInstance(new Properties()));
        JavaMailSender mailSender = mock(JavaMailSender.class);
        when(mailSender.createMimeMessage()).thenReturn(mensagem);
        var remetente = new SmtpEmailSender(mailSender, "Nutri4You <contas@example.test>");

        remetente.enviarFormatado("pessoa@example.test", assunto, conteudo.texto(), conteudo.html());

        verify(mailSender).send(mensagem);
        mensagem.saveChanges();
        assertThat(mensagem.getSubject()).isEqualTo(assunto);
        assertThat(mensagem.isMimeType("multipart/related")).isTrue();
        var partes = (Multipart) mensagem.getContent();
        assertThat(partes.getBodyPart(0).isMimeType("multipart/alternative")).isTrue();
        var alternativas = (Multipart) partes.getBodyPart(0).getContent();
        assertThat(alternativas.getBodyPart(0).isMimeType("text/plain")).isTrue();
        assertThat(alternativas.getBodyPart(1).isMimeType("text/html")).isTrue();
        assertThat(partes.getBodyPart(1).isMimeType("image/png")).isTrue();
        assertThat(partes.getBodyPart(1).getHeader("Content-ID")).containsExactly("<logo-nutri4you>");
        return new ContaEmailTemplate.Conteudo(
                (String) alternativas.getBodyPart(0).getContent(),
                (String) alternativas.getBodyPart(1).getContent());
    }
}
