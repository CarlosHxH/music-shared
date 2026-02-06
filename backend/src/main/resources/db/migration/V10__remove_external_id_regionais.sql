-- Remove external_id da tabela regionais
DROP INDEX IF EXISTS idx_regionais_external_id;
ALTER TABLE regionais DROP COLUMN IF EXISTS external_id;
