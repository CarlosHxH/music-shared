package com.album.seplag.repository;

import com.album.seplag.enums.TipoArtista;
import com.album.seplag.model.Artista;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ArtistaRepository extends JpaRepository<Artista, Long> {

    @Query("SELECT a FROM Artista a WHERE LOWER(a.nome) LIKE LOWER(CONCAT('%', :nome, '%'))")
    Page<Artista> findByNomeContainingIgnoreCase(@Param("nome") String nome, Pageable pageable);

    Page<Artista> findByTipoArtista(TipoArtista tipoArtista, Pageable pageable);

    @Query("SELECT a FROM Artista a WHERE LOWER(a.nome) LIKE LOWER(CONCAT('%', :nome, '%')) AND a.tipoArtista = :tipo")
    Page<Artista> findByNomeContainingIgnoreCaseAndTipoArtista(
            @Param("nome") String nome,
            @Param("tipo") TipoArtista tipoArtista,
            Pageable pageable);

    Page<Artista> findAll(Pageable pageable);
}

