-- Adiciona external_id para rastrear ID do endpoint externo (API Argus)
-- Permite detectar alteração de atributos: inativar anterior e criar novo
ALTER TABLE regionais ADD COLUMN IF NOT EXISTS external_id BIGINT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_regionais_external_id ON regionais(external_id) WHERE external_id IS NOT NULL;
COMMENT ON COLUMN regionais.external_id IS 'ID da regional no endpoint externo (API Argus) para sync com alteração de atributos';
