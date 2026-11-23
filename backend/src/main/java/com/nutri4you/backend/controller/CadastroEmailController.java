package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiErrorResponse;
import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.MensagemResponse;
import com.nutri4you.backend.model.TipoCadastro;
import com.nutri4you.backend.service.CadastroEmailService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cadastros")
public class CadastroEmailController {

    private static final String MENSAGEM_ENVIO =
            "Se o endereço estiver disponível, enviaremos as instruções para confirmar seu e-mail.";
    private final CadastroEmailService cadastros;

    public CadastroEmailController(CadastroEmailService cadastros) {
        this.cadastros = cadastros;
    }

    @PostMapping("/iniciar")
    public ResponseEntity<?> iniciar(@RequestBody InicioCadastro request, HttpServletRequest requisicao) {
        try {
            var resultado = cadastros.iniciar(request.email(), request.tipoUsuario());
            if (resultado == CadastroEmailService.ResultadoInicio.EMAIL_EM_USO && request.tipoUsuario() == TipoCadastro.PACIENTE) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiErrorResponse.of(
                        HttpStatus.CONFLICT.value(), "EMAIL_EM_USO", "Já existe uma conta com esse e-mail.",
                        requisicao.getRequestURI()));
            }
        } catch (DataIntegrityViolationException exception) {
            if (!(exception.getMostSpecificCause() instanceof SQLException sql)
                    || !"23505".equals(sql.getSQLState())) {
                throw exception;
            }
        }
        return ResponseEntity.accepted().body(ApiResponse.ok(new MensagemResponse(MENSAGEM_ENVIO), MENSAGEM_ENVIO));
    }

    @PostMapping("/confirmar")
    public ResponseEntity<ApiResponse<CadastroEmailService.Confirmacao>> confirmar(@RequestBody ConfirmarCadastro request) {
        return ResponseEntity.ok(ApiResponse.ok(cadastros.confirmar(request.token(), request.tipoUsuario()),
                "E-mail confirmado. Continue seu cadastro."));
    }

    public record InicioCadastro(String email, TipoCadastro tipoUsuario) {
    }

    public record ConfirmarCadastro(UUID token, TipoCadastro tipoUsuario) {
    }
}
