package com.nutri4you.backend.dto;

import java.util.UUID;

public record ConfirmacaoEmailRequest(UUID token) {
}
