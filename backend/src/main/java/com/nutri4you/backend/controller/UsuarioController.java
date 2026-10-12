package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.AvaliacaoResponse;
import com.nutri4you.backend.dto.ConsumoProgressoDTO;
import com.nutri4you.backend.dto.HistoricoResponse;
import com.nutri4you.backend.dto.MensagemResponse;
import com.nutri4you.backend.dto.NutricionistaVinculoDTO;
import com.nutri4you.backend.dto.PacientePerfilDTO;
import com.nutri4you.backend.dto.PacienteUpdateDTO;
import com.nutri4you.backend.dto.UsuarioInfoDTO;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.service.ClinicoService;
import com.nutri4you.backend.service.GestaoPacienteService;
import com.nutri4you.backend.service.PerfilPacienteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    private final GestaoPacienteService gestaoPacienteService;
    private final PerfilPacienteService perfilPacienteService;
    private final ClinicoService clinicoService;

    public UsuarioController(
            GestaoPacienteService gestaoPacienteService,
            PerfilPacienteService perfilPacienteService,
            ClinicoService clinicoService) {
        this.gestaoPacienteService = gestaoPacienteService;
        this.perfilPacienteService = perfilPacienteService;
        this.clinicoService = clinicoService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UsuarioInfoDTO>> obterDadosDoUsuarioLogado(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof Paciente paciente) {
            return ResponseEntity.ok(ApiResponse.ok(
                    new UsuarioInfoDTO(
                            paciente.getId(),
                            paciente.getNome(),
                            paciente.getEmail(),
                            "PACIENTE"),
                    "Usuário autenticado."));
        }

        if (principal instanceof Nutricionista nutricionista) {
            return ResponseEntity.ok(ApiResponse.ok(
                    new UsuarioInfoDTO(
                            nutricionista.getId(),
                            nutricionista.getNome(),
                            nutricionista.getEmail(),
                            "NUTRICIONISTA"),
                    "Usuário autenticado."));
        }

        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/me/perfil")
    public ResponseEntity<ApiResponse<PacientePerfilDTO>> perfil(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(
                perfilPacienteService.perfil(paciente(authentication)),
                "Perfil carregado."));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<PacientePerfilDTO>> atualizarPerfil(
            Authentication authentication,
            @RequestBody PacienteUpdateDTO dto) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                    perfilPacienteService.atualizar(paciente(authentication), dto),
                    "Dados pessoais atualizados."));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/me/nutricionistas")
    public ResponseEntity<ApiResponse<List<NutricionistaVinculoDTO>>> nutricionistas(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(
                perfilPacienteService.nutricionistasAtivos(paciente(authentication)),
                "Nutricionistas vinculados."));
    }

    @DeleteMapping("/me/nutricionistas/{idNutricionista}/relacao")
    public ResponseEntity<ApiResponse<MensagemResponse>> desvincularNutricionista(
            Authentication authentication,
            @PathVariable Integer idNutricionista) {
        if (!(authentication.getPrincipal() instanceof Paciente paciente)) {
            throw new AcessoNegadoException("Acesso restrito a pacientes.");
        }

        try {
            gestaoPacienteService.desvincularPaciente(paciente, idNutricionista);
            return ResponseEntity.ok(ApiResponse.ok(
                    new MensagemResponse("Relação recorrente encerrada com sucesso."),
                    "Relação recorrente encerrada com sucesso."));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/me/historico")
    public ResponseEntity<ApiResponse<HistoricoResponse>> historicoMe(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(
                clinicoService.historico(paciente(authentication)),
                "Histórico carregado."));
    }

    @GetMapping("/me/medidas")
    public ResponseEntity<ApiResponse<List<AvaliacaoResponse>>> medidasMe(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(
                clinicoService.listarAvaliacoes(paciente(authentication).getId()),
                "Avaliações carregadas."));
    }

    @GetMapping("/me/consumo-diario/progresso")
    public ResponseEntity<ApiResponse<ConsumoProgressoDTO>> consumoDiarioProgresso(Authentication authentication) {
        paciente(authentication);
        return ResponseEntity.ok(ApiResponse.ok(
                new ConsumoProgressoDTO(
                        "Hoje",
                        1850.0,
                        2000.0,
                        140.0,
                        160.0,
                        210.0,
                        250.0,
                        55.0,
                        65.0
                ),
                "Consumo diário carregado."));
    }

    private Paciente paciente(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Paciente paciente)) {
            throw new AcessoNegadoException("Acesso restrito a pacientes.");
        }
        return paciente;
    }
}
