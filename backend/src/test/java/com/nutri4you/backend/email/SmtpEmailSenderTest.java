package com.nutri4you.backend.email;

import com.nutri4you.backend.model.TipoCadastro;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
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
        var modelo = new CadastroEmailTemplate(
                new ClassPathResource("email/confirmacao-cadastro.html"),
                new ClassPathResource("email/codigo-cadastro.html"));
        UUID token = UUID.randomUUID();
        String link = "http://localhost:4200/confirmar-email?origem=teste&canal=email#cadastro=" + token;
        var conteudo = modelo.criar(tipo, token, link, 24);
        var mensagem = new MimeMessage(Session.getInstance(new Properties()));
        JavaMailSender mailSender = mock(JavaMailSender.class);
        when(mailSender.createMimeMessage()).thenReturn(mensagem);
        var remetente = new SmtpEmailSender(mailSender, "Nutri4You <contas@example.test>");

        remetente.enviarFormatado("pessoa@example.test", "Confirme seu e-mail — Nutri4You",
                conteudo.texto(), conteudo.html());

        verify(mailSender).send(mensagem);
        mensagem.saveChanges();
        assertThat(mensagem.getSubject()).isEqualTo("Confirme seu e-mail — Nutri4You");
        assertThat(mensagem.isMimeType("multipart/related")).isTrue();
        var partes = (Multipart) mensagem.getContent();
        assertThat(partes.getBodyPart(0).isMimeType("multipart/alternative")).isTrue();
        var alternativas = (Multipart) partes.getBodyPart(0).getContent();
        assertThat(alternativas.getBodyPart(0).isMimeType("text/plain")).isTrue();
        assertThat(alternativas.getBodyPart(1).isMimeType("text/html")).isTrue();
        String texto = (String) alternativas.getBodyPart(0).getContent();
        String html = (String) alternativas.getBodyPart(1).getContent();
        assertThat(texto).contains(link, "24 h", "30 minutos");
        assertThat(html).contains(link.replace("&", "&amp;"), "cid:logo-nutri4you").doesNotContain("{{");
        assertThat(partes.getBodyPart(1).isMimeType("image/png")).isTrue();
        assertThat(partes.getBodyPart(1).getHeader("Content-ID")).containsExactly("<logo-nutri4you>");

        if (tipo == TipoCadastro.PACIENTE) {
            assertThat(texto).contains("\n" + token + "\n");
            assertThat(html).contains("Código de confirmação", token + "</code>");
        } else {
            assertThat(texto).doesNotContain("\n" + token + "\n");
            assertThat(html).contains("Confirmar e-mail").doesNotContain("<code");
        }
    }
}
