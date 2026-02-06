package com.album.seplag.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "regionais")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Regional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(nullable = false)
    private Boolean ativo = true;

    @Column(name = "data_sincronizacao")
    private LocalDateTime dataSincronizacao;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        dataSincronizacao = LocalDateTime.now();
    }
}

