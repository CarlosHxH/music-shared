package com.album.seplag.dto;

import com.album.seplag.enums.TipoArtista;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para atualização de artista.
 */
public record ArtistaUpdateDTO(
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    String nome,

    @Size(max = 50, message = "Gênero deve ter no máximo 50 caracteres")
    String genero,

    TipoArtista tipoArtista,

    String biografia
) {}
