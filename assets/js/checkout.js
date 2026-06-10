// ══════════════════════════════════════════════
// ABDA SOAPS — Checkout
// ══════════════════════════════════════════════

const Checkout = (() => {
  const overlay = document.getElementById('checkout-overlay');
  const bodyEl  = document.getElementById('checkout-body');

  // ── Abrir ──────────────────────────────────
  const open = () => {
    const cart = Store.getCart();
    if (!cart.length) {
      Toast.info('Adicione produtos antes de finalizar.');
      return;
    }
    render(cart);
    overlay.hidden = false;
    Store.closeCart();
  };

  // ── Fechar ─────────────────────────────────
  const close = () => { overlay.hidden = true; };

  // ── Renderizar formulário ──────────────────
  const render = (cart) => {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

    bodyEl.innerHTML = `
      <div class="order-summary">
        ${cart.map(i => `
          <div class="order-summary-row">
            <span>${esc(i.name)} <span style="color:var(--text-muted)">× ${i.qty}</span></span>
            <span>${fmt(i.price * i.qty)}</span>
          </div>
        `).join('')}
        <div class="order-summary-row">
          <span>Total</span>
          <span style="color:var(--gold)">${fmt(total)}</span>
        </div>
      </div>

      <form id="checkout-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="cf-name">Nome completo *</label>
          <input class="form-input" id="cf-name" type="text" required
            placeholder="Seu nome completo" autocomplete="name">
        </div>
        <div class="form-group">
          <label class="form-label" for="cf-phone">WhatsApp / Telefone *</label>
          <input class="form-input" id="cf-phone" type="tel" required
            placeholder="(00) 90000-0000" autocomplete="tel">
        </div>
        <div class="form-group">
          <label class="form-label" for="cf-address">Endereço de entrega</label>
          <input class="form-input" id="cf-address" type="text"
            placeholder="Rua, número, bairro, cidade" autocomplete="street-address">
        </div>
        <div class="form-group">
          <label class="form-label">Forma de pagamento *</label>
          <div class="payment-options">
            ${Object.entries(PAYMENT_LABELS).map(([val, label], i) => `
              <label class="payment-label">
                <input type="radio" name="payment" value="${val}" ${i === 0 ? 'checked' : ''}>
                ${label}
              </label>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="cf-notes">Observações</label>
          <textarea class="form-input" id="cf-notes" rows="3"
            placeholder="Alguma observação sobre o pedido?"></textarea>
        </div>
        <button type="submit" class="btn btn--gold btn--full" id="submit-order-btn">
          Confirmar Pedido →
        </button>
      </form>
    `;

    document.getElementById('checkout-form').addEventListener('submit', handleSubmit);
  };

  // ── Enviar pedido ──────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cart = Store.getCart();

    const name    = document.getElementById('cf-name').value.trim();
    const phone   = document.getElementById('cf-phone').value.trim();
    const address = document.getElementById('cf-address').value.trim();
    const payment = document.querySelector('[name="payment"]:checked')?.value;
    const notes   = document.getElementById('cf-notes').value.trim();
    const total   = cart.reduce((s, i) => s + i.price * i.qty, 0);

    if (!name || !phone) {
      Toast.error('Preencha nome e telefone para continuar.');
      return;
    }

    const submitBtn = document.getElementById('submit-order-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processando...';

    try {
      // 1. Inserir pedido
      const { data: order, error: orderErr } = await db
        .from('orders')
        .insert({
          customer_name:    name,
          customer_phone:   phone,
          customer_address: address || null,
          payment_method:   payment,
          notes:            notes || null,
          total,
          status:           STATUS.PENDING,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Inserir itens
      const items = cart.map(i => ({
        order_id:     order.id,
        product_id:   i.id,
        product_name: i.name,
        quantity:     i.qty,
        unit_price:   i.price,
      }));

      const { error: itemsErr } = await db.from('order_items').insert(items);
      if (itemsErr) throw itemsErr;

      // 3. Limpar carrinho e confirmar
      Store.clearCart();
      showConfirmation(order.id, name);

    } catch (err) {
      console.error('Erro ao finalizar pedido:', err);
      Toast.error('Erro ao processar o pedido. Tente novamente.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmar Pedido →';
    }
  };

  // ── Tela de confirmação ────────────────────
  const showConfirmation = (orderId, name) => {
    bodyEl.innerHTML = `
      <div class="confirmation-wrap">
        <div class="confirmation-icon">🎉</div>
        <h4>Pedido realizado, ${esc(name.split(' ')[0])}!</h4>
        <p>Seu pedido foi recebido com sucesso.</p>
        <p>Guarde o código abaixo para rastrear:</p>
        <div class="order-id-code">${esc(orderId)}</div>
        <p style="margin-top:8px">
          Você pode usar o código na aba
          <strong style="color:var(--gold)">Rastrear</strong>
          para acompanhar o status.
        </p>
        <button class="btn btn--gold" style="margin-top:var(--sp-8)"
          onclick="document.getElementById('checkout-overlay').hidden=true">
          Fechar
        </button>
      </div>
    `;
  };

  // ── Eventos ────────────────────────────────
  document.getElementById('checkout-btn').addEventListener('click', open);
  document.getElementById('checkout-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  return { open, close };
})();
