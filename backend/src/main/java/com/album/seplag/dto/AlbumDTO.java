package com.album.seplag.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlbumDTO {
    private Long id;
    private String titulo;
    private Long artistaId;
    private String artistaNome;
    private LocalDate dataLancamento;
    private LocalDateTime createdAt;
    private List<CapaAlbumDTO> capas;
}

