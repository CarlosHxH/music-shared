package com.album.seplag.controller;

import com.album.seplag.dto.ArtistaCreateDTO;
import com.album.seplag.dto.ArtistaDTO;
import com.album.seplag.dto.ArtistaUpdateDTO;
import com.album.seplag.dto.PageResponseDTO;
import com.album.seplag.dto.PresignedUrlResponse;
import com.album.seplag.enums.SortDirection;
import com.album.seplag.service.ArtistaService;
import com.album.seplag.service.MinIOService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping(value = "${app.api.base}/artistas", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Artistas", description = "Endpoints para gerenciamento de artistas")
public class ArtistaController {

    private final ArtistaService artistaService;
    private final MinIOService minIOService;

    public ArtistaController(ArtistaService artistaService, MinIOService minIOService) {
        this.artistaService = artistaService;
        this.minIOService = minIOService;
    }

    @GetMapping
    @Operation(summary = "Listar artistas", description = "Lista artistas com paginação e filtro por nome")
    public ResponseEntity<PageResponseDTO<ArtistaDTO>> findAll(
            @RequestParam(required = false) String nome,
            @Parameter(description = "Número da página (começa em 0)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamanho da página")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Campo para ordenação")
            @RequestParam(defaultValue = "nome") String sort,
            @Parameter(description = "Direção da ordenação")
            @RequestParam(defaultValue = "ASC") SortDirection direction) {
        
        Sort.Direction sortDirection = direction == SortDirection.DESC ? Sort.Direction.DESC : Sort.Direction.ASC;
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        return ResponseEntity.ok(PageResponseDTO.of(artistaService.findAll(nome, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar artista por ID", description = "Retorna detalhes de um artista")
    public ResponseEntity<ArtistaDTO> findById(@PathVariable Long id) {
        ArtistaDTO artista = artistaService.findById(id);
        return ResponseEntity.ok(artista);
    }

    @PostMapping
    @Operation(summary = "Criar artista", description = "Cria um novo artista")
    public ResponseEntity<ArtistaDTO> create(@Valid @RequestBody ArtistaCreateDTO dto) {
        ArtistaDTO created = artistaService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar artista", description = "Atualiza um artista existente")
    public ResponseEntity<ArtistaDTO> update(@PathVariable Long id, @Valid @RequestBody ArtistaUpdateDTO dto) {
        ArtistaDTO updated = artistaService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar artista", description = "Remove um artista")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        artistaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload de foto", description = "Faz upload da foto do artista (substitui anterior)")
    public ResponseEntity<ArtistaDTO> uploadFoto(
            @PathVariable Long id,
            @Parameter(description = "Arquivo de imagem para upload", required = true,
                    schema = @Schema(type = "string", format = "binary"))
            @RequestPart("file") MultipartFile file) {
        minIOService.uploadFotoArtista(id, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(artistaService.findById(id));
    }

    @GetMapping("/{id}/foto/presigned-url")
    @Operation(summary = "URL da foto", description = "Retorna URL pré-assinada para exibir a foto (404 se não houver)")
    public ResponseEntity<PresignedUrlResponse> getPresignedUrlFoto(@PathVariable Long id) {
        PresignedUrlResponse response = minIOService.getPresignedUrlFotoArtista(id);
        return ResponseEntity.ok(response);
    }
}

