package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.MensagemResponse;
import com.nutri4you.backend.dto.PacienteCadastroDTO;
import com.nutri4you.backend.service.PacienteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pacientes")
public class PacienteController {

    private final PacienteService pacienteService;

    public PacienteController(PacienteService pacienteService) {
        this.pacienteService = pacienteService;
    }

    @PostMapping("/autocadastro")
    public ResponseEntity<ApiResponse<MensagemResponse>> autocadastro(@RequestBody PacienteCadastroDTO dto) {
        pacienteService.cadastrarPaciente(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                new MensagemResponse("Paciente cadastrado com sucesso!"),
                "Paciente cadastrado com sucesso!"));
    }
}
