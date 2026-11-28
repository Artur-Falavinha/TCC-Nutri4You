package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.MensagemResponse;
import com.nutri4you.backend.dto.NutricionistaCadastroDTO;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.service.NutricionistaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/nutricionistas")
public class NutricionistaController {

    private static final String MENSAGEM_CADASTRO =
            "Conta criada com sucesso! Você já pode entrar.";

    private final NutricionistaService nutricionistaService;

    public NutricionistaController(NutricionistaService nutricionistaService) {
        this.nutricionistaService = nutricionistaService;
    }

    @GetMapping("/me/perfil")
    public ApiResponse<NutricionistaService.Perfil> perfil(@AuthenticationPrincipal Object principal) {
        return ApiResponse.ok(NutricionistaService.Perfil.de(nutricionista(principal)), "Perfil carregado.");
    }

    @PutMapping("/me/perfil")
    public ApiResponse<NutricionistaService.Perfil> atualizarPerfil(@AuthenticationPrincipal Object principal,
            @RequestBody Perfil dados) {
        return ApiResponse.ok(nutricionistaService.atualizarPerfil(nutricionista(principal),
                dados.nome(), dados.crn(), dados.versaoTermos(), Boolean.TRUE.equals(dados.crnDeclarado())),
                "Perfil atualizado.");
    }

    private static Nutricionista nutricionista(Object principal) {
        if (principal instanceof Nutricionista nutricionista) {
            return nutricionista;
        }
        throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
    }

    public record Perfil(String nome, String crn, String versaoTermos, Boolean crnDeclarado) {}

    @PostMapping({"/autocadastro", "/cadastro"})
    public ResponseEntity<ApiResponse<MensagemResponse>> autocadastro(@RequestBody NutricionistaCadastroDTO dto) {
        nutricionistaService.autocadastrar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                new MensagemResponse(MENSAGEM_CADASTRO), MENSAGEM_CADASTRO));
    }
}
