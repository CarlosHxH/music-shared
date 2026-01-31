package com.album.seplag.service;

import com.album.seplag.model.Regional;
import com.album.seplag.repository.RegionalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegionalServiceTest {

    @Mock
    private RegionalRepository regionalRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private RegionalService regionalService;

    private Regional regional1;
    private Regional regional2;

    @BeforeEach
    void setUp() {
        regional1 = new Regional();
        regional1.setId(1L);
        regional1.setNome("Regional 1");
        regional1.setAtivo(true);

        regional2 = new Regional();
        regional2.setId(2L);
        regional2.setNome("Regional 2");
        regional2.setAtivo(true);
    }

    @Test
    void findAll_ShouldReturnListOfRegionals() {
        List<Regional> expectedRegionals = Arrays.asList(regional1, regional2);
        when(regionalRepository.findAll()).thenReturn(expectedRegionals);

        List<Regional> result = regionalService.findAll();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Regional 1", result.get(0).getNome());
        assertEquals("Regional 2", result.get(1).getNome());
        verify(regionalRepository).findAll();
    }

    @Test
    void findAll_ShouldReturnEmptyList_WhenNoRegionalsExist() {
        when(regionalRepository.findAll()).thenReturn(List.of());

        List<Regional> result = regionalService.findAll();

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(regionalRepository).findAll();
    }
}

