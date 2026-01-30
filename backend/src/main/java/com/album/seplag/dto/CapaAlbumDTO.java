package com.album.seplag.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CapaAlbumDTO {
    private Long id;
    private String nomeArquivo;
    private String contentType;
    private Long tamanho;
    private LocalDateTime dataUpload;
    private String presignedUrl;
}

