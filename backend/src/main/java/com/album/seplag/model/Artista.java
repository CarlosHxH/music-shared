package com.album.seplag.model;

import com.album.seplag.enums.TipoArtista;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "artistas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Artista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(length = 50)
    private String genero;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_artista", length = 20)
    private TipoArtista tipoArtista = TipoArtista.CANTOR;

    @Column(columnDefinition = "TEXT")
    private String biografia;

    @Column(name = "foto_nome_arquivo", length = 500)
    private String fotoNomeArquivo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "artista", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Album> albuns = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

