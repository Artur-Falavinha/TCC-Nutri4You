package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.ItemRefeicaoResponse;
import com.nutri4you.backend.dto.ListaComprasResponseDTO;
import com.nutri4you.backend.dto.PlanoAlimentarRequest;
import com.nutri4you.backend.dto.PlanoAlimentarResponse;
import com.nutri4you.backend.dto.RefeicaoResponse;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.service.PacienteNaoEncontradoException;
import com.nutri4you.backend.service.PlanoAlimentarService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class PlanoAlimentarController {

    private final PlanoAlimentarService planoService;

    public PlanoAlimentarController(PlanoAlimentarService planoService) {
        this.planoService = planoService;
    }

    @GetMapping({
            "/api/v1/gestao-pacientes/{pacienteId}/planos",
            "/api/v1/pacientes/{pacienteId}/planos",
            "/api/v1/pacientes/{pacienteId}/dietas"
    })
    public ResponseEntity<ApiResponse<List<PlanoAlimentarResponse>>> listarPlanos(
            Authentication authentication,
            @PathVariable Integer pacienteId) {
        try {
            if (authentication != null && authentication.getPrincipal() instanceof Paciente paciente) {
                if (!paciente.getId().equals(pacienteId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
                return ResponseEntity.ok(ApiResponse.ok(
                        planoService.listarPlanosPaciente(paciente),
                        "Planos alimentares carregados."));
            }
            return ResponseEntity.ok(ApiResponse.ok(
                    planoService.listarPlanos(exigirNutricionista(authentication), pacienteId),
                    "Planos alimentares carregados."));
        } catch (PacienteNaoEncontradoException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({
            "/api/v1/gestao-pacientes/{pacienteId}/planos/ativa",
            "/api/v1/pacientes/{pacienteId}/dietas/ativa"
    })
    public ResponseEntity<ApiResponse<PlanoAlimentarResponse>> buscarDietaAtiva(
            Authentication authentication,
            @PathVariable Integer pacienteId) {
        try {
            if (authentication != null && authentication.getPrincipal() instanceof Paciente paciente) {
                if (!paciente.getId().equals(pacienteId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
                return ResponseEntity.ok(ApiResponse.ok(
                        planoService.buscarDietaAtivaPaciente(paciente).orElse(null),
                        "Dieta ativa consultada."));
            }
            return ResponseEntity.ok(ApiResponse.ok(
                    planoService.buscarDietaAtiva(exigirNutricionista(authentication), pacienteId).orElse(null),
                    "Dieta ativa consultada."));
        } catch (PacienteNaoEncontradoException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/api/v1/usuarios/me/dieta-ativa")
    public ResponseEntity<ApiResponse<PlanoAlimentarResponse>> minhaDietaAtiva(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Paciente paciente)) {
            throw new AcessoNegadoException("Acesso restrito ao paciente autenticado.");
        }
        return ResponseEntity.ok(ApiResponse.ok(
                planoService.buscarDietaAtivaPaciente(paciente).orElse(null),
                "Dieta ativa carregada."));
    }

    @GetMapping({
            "/api/v1/gestao-pacientes/{pacienteId}/planos/{planoId}",
            "/api/v1/pacientes/{pacienteId}/planos/{planoId}"
    })
    public ResponseEntity<ApiResponse<PlanoAlimentarResponse>> buscarPlano(
            Authentication authentication,
            @PathVariable Integer pacienteId,
            @PathVariable Integer planoId) {
        try {
            if (authentication != null && authentication.getPrincipal() instanceof Paciente paciente) {
                if (!paciente.getId().equals(pacienteId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
                return ResponseEntity.ok(ApiResponse.ok(
                        planoService.buscarPlanoPaciente(paciente, planoId),
                        "Plano alimentar carregado."));
            }
            return ResponseEntity.ok(ApiResponse.ok(
                    planoService.buscarPlano(exigirNutricionista(authentication), pacienteId, planoId),
                    "Plano alimentar carregado."));
        } catch (PacienteNaoEncontradoException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/api/v1/dietas/{planoId}")
    public ResponseEntity<ApiResponse<PlanoAlimentarResponse>> buscarDietaPorId(
            Authentication authentication,
            @PathVariable Integer planoId) {
        if (authentication != null && authentication.getPrincipal() instanceof Paciente paciente) {
            return ResponseEntity.ok(ApiResponse.ok(
                    planoService.buscarPlanoPaciente(paciente, planoId),
                    "Plano alimentar carregado."));
        }
        return ResponseEntity.ok(ApiResponse.ok(
                planoService.buscarPlanoPorId(exigirNutricionista(authentication), planoId),
                "Plano alimentar carregado."));
    }

    @PostMapping({
            "/api/v1/gestao-pacientes/{pacienteId}/planos",
            "/api/v1/pacientes/{pacienteId}/planos",
            "/api/v1/pacientes/{pacienteId}/dietas"
    })
    public ResponseEntity<ApiResponse<PlanoAlimentarResponse>> criarPlano(
            Authentication authentication,
            @PathVariable Integer pacienteId,
            @RequestBody(required = false) PlanoAlimentarRequest request) {
        try {
            PlanoAlimentarResponse criado = planoService.criarPlano(
                    exigirNutricionista(authentication),
                    pacienteId,
                    request);
            String msg = "PUBLICADO".equalsIgnoreCase(criado.status())
                    ? "Dieta publicada com sucesso!"
                    : "Rascunho de dieta salvo com sucesso.";
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(criado, msg));
        } catch (PacienteNaoEncontradoException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping({
            "/api/v1/gestao-pacientes/{pacienteId}/planos/{planoId}",
            "/api/v1/pacientes/{pacienteId}/planos/{planoId}"
    })
    public ResponseEntity<ApiResponse<PlanoAlimentarResponse>> atualizarPlano(
            Authentication authentication,
            @PathVariable Integer pacienteId,
            @PathVariable Integer planoId,
            @RequestBody PlanoAlimentarRequest request) {
        try {
            PlanoAlimentarResponse atualizado = planoService.atualizarPlano(
                    exigirNutricionista(authentication),
                    pacienteId,
                    planoId,
                    request);
            String msg = "PUBLICADO".equalsIgnoreCase(atualizado.status())
                    ? "Dieta publicada com sucesso!"
                    : "Plano alimentar atualizado com sucesso.";
            return ResponseEntity.ok(ApiResponse.ok(atualizado, msg));
        } catch (PacienteNaoEncontradoException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping({
            "/api/v1/gestao-pacientes/{pacienteId}/planos/{planoId}/publicar",
            "/api/v1/pacientes/{pacienteId}/planos/{planoId}/publicar"
    })
    public ResponseEntity<ApiResponse<PlanoAlimentarResponse>> publicarPlano(
            Authentication authentication,
            @PathVariable Integer pacienteId,
            @PathVariable Integer planoId) {
        try {
            PlanoAlimentarResponse publicado = planoService.publicarPlano(
                    exigirNutricionista(authentication),
                    pacienteId,
                    planoId);
            return ResponseEntity.ok(ApiResponse.ok(publicado, "Dieta publicada com sucesso!"));
        } catch (PacienteNaoEncontradoException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/api/v1/dietas/{planoId}/refeicoes")
    public ResponseEntity<ApiResponse<RefeicaoResponse>> adicionarRefeicao(
            Authentication authentication,
            @PathVariable Integer planoId,
            @RequestBody PlanoAlimentarRequest.RefeicaoPrescricaoRequest request) {
        RefeicaoResponse criada = planoService.adicionarRefeicao(
                exigirNutricionista(authentication),
                planoId,
                request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(criada, "Refeição adicionada."));
    }

    @PutMapping("/api/v1/refeicoes/{refeicaoId}")
    public ResponseEntity<ApiResponse<RefeicaoResponse>> atualizarRefeicao(
            Authentication authentication,
            @PathVariable Integer refeicaoId,
            @RequestBody PlanoAlimentarRequest.RefeicaoPrescricaoRequest request) {
        RefeicaoResponse atualizada = planoService.atualizarRefeicao(
                exigirNutricionista(authentication),
                refeicaoId,
                request);
        return ResponseEntity.ok(ApiResponse.ok(atualizada, "Refeição atualizada."));
    }

    @DeleteMapping("/api/v1/refeicoes/{refeicaoId}")
    public ResponseEntity<ApiResponse<Void>> removerRefeicao(
            Authentication authentication,
            @PathVariable Integer refeicaoId) {
        planoService.removerRefeicao(exigirNutricionista(authentication), refeicaoId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Refeição removida."));
    }

    @PostMapping("/api/v1/refeicoes/{refeicaoId}/itens")
    public ResponseEntity<ApiResponse<ItemRefeicaoResponse>> adicionarItemRefeicao(
            Authentication authentication,
            @PathVariable Integer refeicaoId,
            @RequestBody PlanoAlimentarRequest.ItemPrescricaoRequest request) {
        ItemRefeicaoResponse criado = planoService.adicionarItemRefeicao(
                exigirNutricionista(authentication),
                refeicaoId,
                request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(criado, "Alimento adicionado à refeição."));
    }

    @PutMapping("/api/v1/itens-refeicao/{itemId}")
    public ResponseEntity<ApiResponse<ItemRefeicaoResponse>> atualizarItemRefeicao(
            Authentication authentication,
            @PathVariable Integer itemId,
            @RequestBody PlanoAlimentarRequest.ItemPrescricaoRequest request) {
        ItemRefeicaoResponse atualizado = planoService.atualizarItemRefeicao(
                exigirNutricionista(authentication),
                itemId,
                request);
        return ResponseEntity.ok(ApiResponse.ok(atualizado, "Alimento da refeição atualizado."));
    }

    @DeleteMapping("/api/v1/itens-refeicao/{itemId}")
    public ResponseEntity<ApiResponse<Void>> removerItemRefeicao(
            Authentication authentication,
            @PathVariable Integer itemId) {
        planoService.removerItemRefeicao(exigirNutricionista(authentication), itemId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Alimento removido da refeição."));
    }

    @PostMapping({
            "/api/v1/gestao-pacientes/{pacienteId}/listas-compras",
            "/api/v1/pacientes/{pacienteId}/listas-compras"
    })
    public ResponseEntity<ApiResponse<ListaComprasResponseDTO>> gerarListaCompras(
            Authentication authentication,
            @PathVariable Integer pacienteId,
            @RequestParam(required = false) Integer idPlano) {
        try {
            if (authentication != null && authentication.getPrincipal() instanceof Paciente paciente) {
                if (!paciente.getId().equals(pacienteId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
                return ResponseEntity.ok(ApiResponse.ok(
                        planoService.gerarOuBuscarListaComprasPaciente(paciente, idPlano),
                        "Lista de compras gerada."));
            }
            return ResponseEntity.ok(ApiResponse.ok(
                    planoService.gerarOuBuscarListaCompras(exigirNutricionista(authentication), pacienteId, idPlano),
                    "Lista de compras gerada."));
        } catch (PacienteNaoEncontradoException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({
            "/api/v1/gestao-pacientes/{pacienteId}/listas-compras/atual",
            "/api/v1/pacientes/{pacienteId}/listas-compras/atual"
    })
    public ResponseEntity<ApiResponse<ListaComprasResponseDTO>> buscarListaComprasAtual(
            Authentication authentication,
            @PathVariable Integer pacienteId,
            @RequestParam(required = false) Integer idPlano) {
        return gerarListaCompras(authentication, pacienteId, idPlano);
    }

    @PatchMapping("/api/v1/listas-compras/itens/{idItem}")
    public ResponseEntity<ApiResponse<ListaComprasResponseDTO.ItemListaComprasDTO>> atualizarItemListaCompras(
            Authentication authentication,
            @PathVariable Integer idItem,
            @RequestBody(required = false) Map<String, Object> body) {
        Boolean comprado = null;
        if (body != null && body.get("comprado") instanceof Boolean b) {
            comprado = b;
        }
        Object principal = authentication != null ? authentication.getPrincipal() : null;
        ListaComprasResponseDTO.ItemListaComprasDTO item = planoService.atualizarItemListaCompras(
                principal,
                idItem,
                comprado);
        return ResponseEntity.ok(ApiResponse.ok(item, "Item da lista de compras atualizado."));
    }

    private Nutricionista exigirNutricionista(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Nutricionista nutricionista)) {
            throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        }
        return nutricionista;
    }
}
