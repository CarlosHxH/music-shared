package com.album.seplag.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record AlbumDTO(
    Long id,
    String titulo,
    Long artistaId,
    String artistaNome,
    LocalDate dataLancamento,
    LocalDateTime createdAt,
    List<CapaAlbumDTO> capas,
    String artistaFotoUrl
) {}
