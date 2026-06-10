-- ══════════════════════════════════════════════
-- ABDA SOAPS — Schema do banco de dados
-- Execute este arquivo no SQL Editor do Supabase
-- supabase.com > seu projeto > SQL Editor > New query
-- ══════════════════════════════════════════════


-- ── Produtos ────────────────────────────────
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category    TEXT,
  image_url   TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── Pedidos ──────────────────────────────────
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_address TEXT,
  payment_method   TEXT NOT NULL CHECK (payment_method IN ('pix', 'cash', 'card')),
  notes            TEXT,
  total            NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'started', 'finished', 'delivered')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── Itens do pedido ──────────────────────────
CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  unit_price   NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── Row Level Security ───────────────────────
ALTER TABLE products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode ver produtos ativos
CREATE POLICY "products_public_select"
  ON products FOR SELECT USING (active = TRUE);

-- Admin (anon com senha JS) pode gerenciar produtos
CREATE POLICY "products_anon_all"
  ON products FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Clientes podem criar pedidos e itens
CREATE POLICY "orders_public_insert"
  ON orders FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "order_items_public_insert"
  ON order_items FOR INSERT WITH CHECK (TRUE);

-- Clientes podem consultar seus pedidos pelo ID
CREATE POLICY "orders_public_select"
  ON orders FOR SELECT USING (TRUE);

CREATE POLICY "order_items_public_select"
  ON order_items FOR SELECT USING (TRUE);

-- Admin pode atualizar status dos pedidos
CREATE POLICY "orders_anon_update"
  ON orders FOR UPDATE USING (TRUE) WITH CHECK (TRUE);


-- ── Índices ───────────────────────────────────
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
