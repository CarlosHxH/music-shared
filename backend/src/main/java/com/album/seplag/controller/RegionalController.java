package com.album.seplag.controller;

import com.album.seplag.dto.RegionalDTO;
import com.album.seplag.service.RegionalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "${app.api.base}/regionais", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Regionais", description = "Endpoints para gerenciamento de regionais")
public class RegionalController {

    private final RegionalService regionalService;

    public RegionalController(RegionalService regionalService) {
        this.regionalService = regionalService;
    }

    @GetMapping
    @Operation(summary = "Listar regionais", description = "Lista todas as regionais sincronizadas")
    public ResponseEntity<List<RegionalDTO>> findAll() {
        List<RegionalDTO> regionais = regionalService.findAll();
        return ResponseEntity.ok(regionais);
    }

    @PostMapping("/sincronizar")
    @Operation(summary = "Sincronizar regionais", description = "Força sincronização com API externa e retorna lista atualizada")
    public ResponseEntity<List<RegionalDTO>> sincronizar() {
        List<RegionalDTO> regionais = regionalService.sincronizarERetornar();
        return ResponseEntity.ok(regionais);
    }
}

