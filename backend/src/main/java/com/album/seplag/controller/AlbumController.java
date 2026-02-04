package com.album.seplag.controller;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.album.seplag.dto.AlbumCreateDTO;
import com.album.seplag.dto.AlbumDTO;
import com.album.seplag.dto.AlbumUpdateDTO;
import com.album.seplag.dto.CapaAlbumDTO;
import com.album.seplag.dto.PageResponseDTO;
import com.album.seplag.dto.PresignedUrlResponse;
import com.album.seplag.enums.SortDirection;
import com.album.seplag.service.AlbumService;
import com.album.seplag.service.MinIOService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping(value = "${app.api.base}/albuns", produces = MediaType.APPLICATION_JSON_VALUE)
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
    public ResponseEntity<PageResponseDTO<AlbumDTO>> findAll(
            @Parameter(description = "Número da página (começa em 0)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamanho da página")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Campo para ordenação")
            @RequestParam(defaultValue = "id") String sort,
            @Parameter(description = "Direção da ordenação")
            @RequestParam(defaultValue = "ASC") SortDirection direction) {
        
        Sort.Direction sortDirection = direction == SortDirection.DESC ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        return ResponseEntity.ok(PageResponseDTO.of(albumService.findAll(pageable)));
    }

    @GetMapping("/artista/{artistaId}")
    @Operation(summary = "Listar álbuns por artista", description = "Lista álbuns de um artista específico")
    public ResponseEntity<PageResponseDTO<AlbumDTO>> findByArtistaId(
            @PathVariable Long artistaId,
            @Parameter(description = "Número da página (começa em 0)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamanho da página")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Campo para ordenação")
            @RequestParam(defaultValue = "id") String sort,
            @Parameter(description = "Direção da ordenação")
            @RequestParam(defaultValue = "ASC") SortDirection direction) {
        
        Sort.Direction sortDirection = direction == SortDirection.DESC ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        return ResponseEntity.ok(PageResponseDTO.of(albumService.findByArtistaId(artistaId, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar álbum por ID", description = "Retorna detalhes de um álbum")
    public ResponseEntity<AlbumDTO> findById(@PathVariable Long id) {
        AlbumDTO album = albumService.findById(id);
        return ResponseEntity.ok(album);
    }

    @PostMapping
    @Operation(summary = "Criar álbum", description = "Cria um novo álbum")
    public ResponseEntity<AlbumDTO> create(@Valid @RequestBody AlbumCreateDTO dto) {
        AlbumDTO created = albumService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar álbum", description = "Atualiza um álbum existente")
    public ResponseEntity<AlbumDTO> update(@PathVariable Long id, @Valid @RequestBody AlbumUpdateDTO dto) {
        AlbumDTO updated = albumService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar álbum", description = "Remove um álbum")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        albumService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/capa", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload de capa", description = "Faz upload de uma ou mais capas para o álbum")
    public ResponseEntity<List<CapaAlbumDTO>> uploadCapa(
            @PathVariable Long id,
            @Parameter(description = "Arquivos de imagem para upload (multipart/form-data)", required = true,
                    schema = @Schema(type = "string", format = "binary"))
            @RequestPart("files") MultipartFile[] files) {
        List<CapaAlbumDTO> capas = albumService.uploadCapas(id, files);
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

