package com.album.seplag.dto;

import com.album.seplag.enums.TipoArtista;

import java.time.LocalDateTime;

public record ArtistaDTO(
    Long id,
    String nome,
    String genero,
    TipoArtista tipoArtista,
    String biografia,
    LocalDateTime createdAt,
    Long quantidadeAlbuns,
    String fotoUrl
) {}
