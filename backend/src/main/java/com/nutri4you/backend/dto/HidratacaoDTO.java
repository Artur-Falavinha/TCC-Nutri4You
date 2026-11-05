package com.nutri4you.backend.dto;

import java.time.LocalDate;

public record HidratacaoDTO(LocalDate data, Integer consumidoMl, Integer metaMl) {}
