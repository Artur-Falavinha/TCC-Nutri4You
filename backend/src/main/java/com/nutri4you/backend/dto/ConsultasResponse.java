package com.nutri4you.backend.dto;

import java.util.List;

public record ConsultasResponse(List<ConsultaResponse> itens, int pagina, int totalPaginas, long total) {}
