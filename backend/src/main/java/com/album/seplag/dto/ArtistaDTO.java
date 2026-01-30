package com.album.seplag.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArtistaDTO {
    private Long id;
    private String nome;
    private String genero;
    private String biografia;
    private LocalDateTime createdAt;
    private Long quantidadeAlbuns;
}

