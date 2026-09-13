package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.MensagemResponse;
import com.nutri4you.backend.dto.NutricionistaCadastroDTO;
import com.nutri4you.backend.service.NutricionistaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/nutricionistas")
public class NutricionistaController {

    private final NutricionistaService nutricionistaService;

    public NutricionistaController(NutricionistaService nutricionistaService) {
        this.nutricionistaService = nutricionistaService;
    }

    @PostMapping("/cadastro")
    public ResponseEntity<ApiResponse<MensagemResponse>> cadastrar(
            @RequestBody NutricionistaCadastroDTO dto) {
        nutricionistaService.cadastrarNutricionista(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                new MensagemResponse("Nutricionista cadastrado com sucesso!"),
                "Nutricionista cadastrado com sucesso!"));
    }
}