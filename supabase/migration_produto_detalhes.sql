-- Adiciona campos de detalhes ao produto
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS aroma TEXT,
  ADD COLUMN IF NOT EXISTS base  TEXT;
