-- Adiciona tipo_artista para diferenciar cantor de banda
ALTER TABLE artistas ADD COLUMN IF NOT EXISTS tipo_artista VARCHAR(20) DEFAULT 'CANTOR';
COMMENT ON COLUMN artistas.tipo_artista IS 'Tipo do artista: CANTOR ou BANDA';
