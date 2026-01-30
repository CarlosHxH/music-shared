package com.album.seplag.controller;

import com.album.seplag.dto.AlbumDTO;
import com.album.seplag.dto.PresignedUrlResponse;
import com.album.seplag.model.Album;
import com.album.seplag.model.CapaAlbum;
import com.album.seplag.service.AlbumService;
import com.album.seplag.service.MinIOService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/albuns")
@Tag(name = "Álbuns", description = "Endpoints para gerenciamento de álbuns")
public class AlbumController {

    private final AlbumService albumService;
    private final MinIOService minIOService;

    public AlbumController(AlbumService albumService, MinIOService minIOService) {
        this.albumService = albumService;
        this.minIOService = minIOService;
    }

    @GetMapping
    @Operation(summary = "Listar álbuns", description = "Lista álbuns com paginação")
    public ResponseEntity<Page<AlbumDTO>> findAll(@PageableDefault(size = 10) Pageable pageable) {
        Page<AlbumDTO> albuns = albumService.findAll(pageable);
        return ResponseEntity.ok(albuns);
    }

    @GetMapping("/artista/{artistaId}")
    @Operation(summary = "Listar álbuns por artista", description = "Lista álbuns de um artista específico")
    public ResponseEntity<Page<AlbumDTO>> findByArtistaId(
            @PathVariable Long artistaId,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<AlbumDTO> albuns = albumService.findByArtistaId(artistaId, pageable);
        return ResponseEntity.ok(albuns);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar álbum por ID", description = "Retorna detalhes de um álbum")
    public ResponseEntity<AlbumDTO> findById(@PathVariable Long id) {
        AlbumDTO album = albumService.findById(id);
        return ResponseEntity.ok(album);
    }

    @PostMapping
    @Operation(summary = "Criar álbum", description = "Cria um novo álbum")
    public ResponseEntity<AlbumDTO> create(@Valid @RequestBody Album album) {
        AlbumDTO created = albumService.create(album);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar álbum", description = "Atualiza um álbum existente")
    public ResponseEntity<AlbumDTO> update(@PathVariable Long id, @Valid @RequestBody Album album) {
        AlbumDTO updated = albumService.update(id, album);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/capa")
    @Operation(summary = "Upload de capa", description = "Faz upload de uma ou mais capas para o álbum")
    public ResponseEntity<List<CapaAlbum>> uploadCapa(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files) {
        List<CapaAlbum> capas = new java.util.ArrayList<>();
        for (MultipartFile file : files) {
            CapaAlbum capa = minIOService.uploadCapa(id, file);
            capas.add(capa);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(capas);
    }

    @GetMapping("/{albumId}/capa/{capaId}/presigned-url")
    @Operation(summary = "Obter URL pré-assinada", description = "Gera URL pré-assinada para acesso à capa (expira em 30 minutos)")
    public ResponseEntity<PresignedUrlResponse> getPresignedUrl(
            @PathVariable Long albumId,
            @PathVariable Long capaId) {
        PresignedUrlResponse response = minIOService.getPresignedUrl(albumId, capaId);
        return ResponseEntity.ok(response);
    }
}

