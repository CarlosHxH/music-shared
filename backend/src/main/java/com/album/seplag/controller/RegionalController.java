package com.album.seplag.controller;

import com.album.seplag.dto.RegionalDTO;
import com.album.seplag.service.RegionalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${app.api.base}/regionais")
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
    @Operation(summary = "Sincronizar regionais", description = "Força sincronização com API externa")
    public ResponseEntity<String> sincronizar() {
        regionalService.sincronizarRegionais();
        return ResponseEntity.ok("Sincronização iniciada");
    }
}

