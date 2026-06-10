// ══════════════════════════════════════════════
// ABDA SOAPS — Rastreamento de Pedido
// ══════════════════════════════════════════════

const Tracking = (() => {
  const input  = document.getElementById('tracking-input');
  const btn    = document.getElementById('tracking-btn');
  const result = document.getElementById('tracking-result');

  const STEPS = [
    { key: STATUS.PENDING,   label: 'Pedido recebido' },
    { key: STATUS.STARTED,   label: 'Em produção' },
    { key: STATUS.FINISHED,  label: 'Pronto para entrega' },
    { key: STATUS.DELIVERED, label: 'Entregue com sucesso' },
  ];

  const stepIndex = (status) => STEPS.findIndex(s => s.key === status);

  // ── Buscar pedido ──────────────────────────
  const search = async () => {
    const id = input.value.trim();
    if (!id) { Toast.info('Digite o código do pedido.'); return; }

    result.innerHTML = `
      <div class="products-loading" style="padding:var(--sp-10)">
        <div class="loading-spinner"></div>
      </div>`;
    btn.disabled = true;

    try {
      const { data: order, error } = await db
        .from('orders')
        .select('id, customer_name, status, total, created_at, payment_method, customer_address')
        .eq('id', id)
        .maybeSingle();

      btn.disabled = false;

      if (error) throw error;

      if (!order) {
        result.innerHTML = `
          <div class="tracking-card" style="text-align:center;color:var(--text-muted)">
            <div style="font-size:2rem;margin-bottom:var(--sp-3)">🔍</div>
            <p>Pedido não encontrado.</p>
            <p style="font-size:var(--text-sm);margin-top:var(--sp-2)">Verifique se o código foi digitado corretamente.</p>
          </div>`;
        return;
      }

      renderResult(order);
    } catch (err) {
      console.error('Erro no rastreamento:', err);
      btn.disabled = false;
      result.innerHTML = `<p style="color:var(--danger);text-align:center;padding:var(--sp-6)">Erro ao buscar pedido. Tente novamente.</p>`;
    }
  };

  // ── Renderizar resultado ───────────────────
  const renderResult = (order) => {
    const currentIdx = stepIndex(order.status);

    result.innerHTML = `
      <div class="tracking-card">
        <h4>Pedido de ${esc(order.customer_name)}</h4>
        <div class="tracking-meta">
          <span class="status-badge status-${order.status}">${STATUS_LABELS[order.status]}</span>
          <span style="font-size:var(--text-sm);color:var(--text-muted)">${fmtDate(order.created_at)}</span>
          <span style="font-size:var(--text-sm);color:var(--gold);font-weight:600">${fmt(order.total)}</span>
          ${PAYMENT_LABELS[order.payment_method]
            ? `<span style="font-size:var(--text-sm);color:var(--text-muted)">${PAYMENT_LABELS[order.payment_method]}</span>`
            : ''}
        </div>

        <div class="tracking-timeline">
          ${STEPS.map((step, i) => `
            <div class="timeline-step ${i <= currentIdx ? 'done' : ''}">
              <div class="timeline-dot"></div>
              <div class="timeline-label">${step.label}</div>
              ${i === currentIdx ? `<div style="font-size:var(--text-xs);color:var(--gold);margin-top:2px;font-weight:500">← Situação atual</div>` : ''}
            </div>
          `).join('')}
        </div>

        ${order.customer_address ? `
          <div style="margin-top:var(--sp-6);padding-top:var(--sp-6);border-top:1px solid var(--cream-border);font-size:var(--text-sm);color:var(--text-muted)">
            📍 ${esc(order.customer_address)}
          </div>` : ''}
      </div>
    `;
  };

  // ── Eventos ────────────────────────────────
  btn.addEventListener('click', search);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') search(); });

  return {};
})();
