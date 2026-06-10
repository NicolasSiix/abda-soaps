// ══════════════════════════════════════════════
// ABDA SOAPS — Configurações & Constantes
// ══════════════════════════════════════════════

// ⚠️  Troque a senha antes de publicar!
const ADMIN_PASSWORD = 'abda2024';

// Status dos pedidos (devem bater com o CHECK do banco em supabase/schema.sql)
const STATUS = {
  PENDING:   'pending',
  STARTED:   'started',
  FINISHED:  'finished',
  DELIVERED: 'delivered',
};

const STATUS_LABELS = {
  [STATUS.PENDING]:   '⏳ Aguardando',
  [STATUS.STARTED]:   '🔧 Em produção',
  [STATUS.FINISHED]:  '✅ Pronto',
  [STATUS.DELIVERED]: '📦 Entregue',
};

// Formas de pagamento (devem bater com o CHECK do banco em supabase/schema.sql)
const PAYMENT = {
  PIX:  'pix',
  CASH: 'cash',
  CARD: 'card',
};

const PAYMENT_LABELS = {
  [PAYMENT.PIX]:  '💸 Pix',
  [PAYMENT.CASH]: '💵 Dinheiro',
  [PAYMENT.CARD]: '💳 Cartão',
};
