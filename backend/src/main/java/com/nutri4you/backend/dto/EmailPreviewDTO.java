package com.nutri4you.backend.dto;

import com.nutri4you.backend.model.TipoTokenEmail;

import java.time.LocalDateTime;
import java.util.UUID;

public record EmailPreviewDTO(
        UUID token,
        TipoTokenEmail tipo,
        String emailDestinatario,
        LocalDateTime expiraEm,
        LocalDateTime usadoEm,
        String linkConfirmacao,
        String linkRecuperacao) {
}
