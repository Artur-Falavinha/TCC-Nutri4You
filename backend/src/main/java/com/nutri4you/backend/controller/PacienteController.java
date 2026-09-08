package com.nutri4you.backend.controller;

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
    public ResponseEntity<MensagemResponse> autocadastro(@RequestBody PacienteCadastroDTO dto) {
        try {
            pacienteService.cadastrarPaciente(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new MensagemResponse("Paciente cadastrado com sucesso!"));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(new MensagemResponse(exception.getMessage()));
        }
    }
}