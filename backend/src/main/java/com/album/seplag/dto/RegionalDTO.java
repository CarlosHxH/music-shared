package com.album.seplag.dto;

import java.time.LocalDateTime;

public record RegionalDTO(
    Long id,
    String nome,
    Boolean ativo,
    LocalDateTime dataSincronizacao
) {}
