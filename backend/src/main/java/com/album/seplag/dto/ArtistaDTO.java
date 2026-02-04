package com.album.seplag.dto;

import java.time.LocalDateTime;

public record ArtistaDTO(
    Long id,
    String nome,
    String genero,
    String biografia,
    LocalDateTime createdAt,
    Long quantidadeAlbuns,
    String fotoUrl
) {}
