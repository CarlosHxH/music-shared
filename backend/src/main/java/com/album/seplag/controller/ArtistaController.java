package com.album.seplag.controller;

import com.album.seplag.dto.ArtistaCreateDTO;
import com.album.seplag.dto.ArtistaDTO;
import com.album.seplag.dto.ArtistaUpdateDTO;
import com.album.seplag.service.ArtistaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${app.api.base}/artistas")
@Tag(name = "Artistas", description = "Endpoints para gerenciamento de artistas")
public class ArtistaController {

    private final ArtistaService artistaService;

    public ArtistaController(ArtistaService artistaService) {
        this.artistaService = artistaService;
    }

    @GetMapping
    @Operation(summary = "Listar artistas", description = "Lista artistas com paginação e filtro por nome")
    public ResponseEntity<Page<ArtistaDTO>> findAll(
            @RequestParam(required = false) String nome,
            @Parameter(description = "Número da página (começa em 0)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamanho da página")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Campo para ordenação")
            @RequestParam(defaultValue = "nome") String sort,
            @Parameter(description = "Direção da ordenação (asc ou desc)")
            @RequestParam(defaultValue = "asc") String direction) {
        
        Sort.Direction sortDirection = direction.equalsIgnoreCase("desc")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        Page<ArtistaDTO> artistas = artistaService.findAll(nome, pageable);
        return ResponseEntity.ok(artistas);
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
}

