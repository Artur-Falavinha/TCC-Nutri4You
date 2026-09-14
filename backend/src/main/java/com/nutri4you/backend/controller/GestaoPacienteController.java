package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.PacienteResponseDTO;
import com.nutri4you.backend.dto.MensagemResponse;
import com.nutri4you.backend.dto.PacienteUpdateDTO;
import com.nutri4you.backend.service.PacienteService;
import com.nutri4you.backend.service.PacienteNaoEncontradoException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/gestao-pacientes")
public class GestaoPacienteController {

    private final PacienteService pacienteService;

    public GestaoPacienteController(PacienteService pacienteService) {
        this.pacienteService = pacienteService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PacienteResponseDTO>>> listarTodos() {
        return ResponseEntity.ok(ApiResponse.ok(
                pacienteService.listarTodos(),
                "Pacientes listados com sucesso."));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PacienteResponseDTO>> buscarPorId(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                    pacienteService.buscarPorId(id),
                    "Paciente encontrado com sucesso."));
        } catch (PacienteNaoEncontradoException exception) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PacienteResponseDTO>> atualizar(
            @PathVariable Integer id,
            @RequestBody PacienteUpdateDTO dto) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                    pacienteService.atualizar(id, dto),
                    "Paciente atualizado com sucesso."));
        } catch (PacienteNaoEncontradoException exception) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<MensagemResponse>> excluir(@PathVariable Integer id) {
        try {
            pacienteService.excluir(id);
            return ResponseEntity.ok(ApiResponse.ok(
                    new MensagemResponse("Paciente excluído com sucesso"),
                    "Paciente excluído com sucesso"));
        } catch (PacienteNaoEncontradoException exception) {
            return ResponseEntity.notFound().build();
        }
    }
}