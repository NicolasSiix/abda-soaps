// ══════════════════════════════════════════════
// ABDA SOAPS — Gerenciamento de Pedidos (Admin)
// ══════════════════════════════════════════════

const Orders = (() => {
  let allOrders = [];
  let realtimeChannel = null;

  const tableWrap = document.getElementById('orders-table-wrap');
  const statsWrap = document.getElementById('stats-wrap');

  // ── Tempo real ─────────────────────────────
  const subscribeRealtime = () => {
    if (realtimeChannel) return;

    realtimeChannel = db.channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        Toast.info('🔔 Novo pedido recebido!', 6000);
        load();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        load();
      })
      .subscribe();
  };

  // ── Carregar pedidos ───────────────────────
  const load = async () => {
    tableWrap.innerHTML = `
      <div class="products-loading" style="padding:var(--sp-12)">
        <div class="loading-spinner"></div>
        <p>Carregando pedidos...</p>
      </div>`;

    try {
      const { data, error } = await db
        .from('orders')
        .select('*, order_items(product_name, quantity, unit_price)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      allOrders = data || [];
      renderTable();
      renderStats();
      subscribeRealtime();
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      tableWrap.innerHTML = `<p style="padding:var(--sp-8);color:var(--danger)">
        Erro ao carregar pedidos. Verifique a conexão com o Supabase.
      </p>`;
    }
  };

  // ── Renderizar tabela ──────────────────────
  const renderTable = () => {
    if (!allOrders.length) {
      tableWrap.innerHTML = `
        <div style="padding:var(--sp-12);text-align:center;color:var(--text-muted)">
          Nenhum pedido ainda. A loja está pronta! 🧼
        </div>`;
      return;
    }

    tableWrap.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Pagamento</th>
              <th>Status</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${allOrders.map(order => buildRow(order)).join('')}
          </tbody>
        </table>
      </div>
    `;

    tableWrap.querySelectorAll('[data-update-id]').forEach(btn => {
      btn.addEventListener('click', () =>
        updateStatus(btn.dataset.updateId, btn.dataset.newStatus)
      );
    });
  };

  const buildRow = (order) => {
    const items = (order.order_items || [])
      .map(i => `${esc(i.product_name)} ×${i.quantity}`)
      .join('<br>');

    const actions = [];
    if (order.status !== STATUS.STARTED)
      actions.push(`<button class="btn btn--sm btn--outline" data-update-id="${order.id}" data-new-status="${STATUS.STARTED}">Em produção</button>`);
    if (order.status !== STATUS.FINISHED)
      actions.push(`<button class="btn btn--sm btn--outline" data-update-id="${order.id}" data-new-status="${STATUS.FINISHED}">Pronto</button>`);
    if (order.status !== STATUS.DELIVERED)
      actions.push(`<button class="btn btn--sm btn--gold" data-update-id="${order.id}" data-new-status="${STATUS.DELIVERED}">Entregue</button>`);

    return `
      <tr>
        <td>
          <code style="font-size:11px;color:var(--text-muted)">${order.id.slice(0,8)}…</code>
        </td>
        <td>
          <div style="font-weight:500;color:var(--dark)">${esc(order.customer_name)}</div>
          ${order.customer_phone ? `<div style="font-size:12px;color:var(--text-muted)">${esc(order.customer_phone)}</div>` : ''}
          ${order.customer_address ? `<div style="font-size:12px;color:var(--text-muted)">${esc(order.customer_address)}</div>` : ''}
        </td>
        <td style="font-size:12px;color:var(--text-muted)">${items || '—'}</td>
        <td style="font-weight:600;color:var(--gold);white-space:nowrap">${fmt(order.total)}</td>
        <td style="white-space:nowrap">${PAYMENT_LABELS[order.payment_method] || '—'}</td>
        <td><span class="status-badge status-${order.status}">${STATUS_LABELS[order.status]}</span></td>
        <td style="font-size:12px;white-space:nowrap;color:var(--text-muted)">${fmtDate(order.created_at)}</td>
        <td>
          <div class="action-btns">${actions.join('')}</div>
          ${order.notes ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px">📝 ${esc(order.notes)}</div>` : ''}
        </td>
      </tr>
    `;
  };

  // ── Atualizar status ───────────────────────
  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await db
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      Toast.success(`Status atualizado para: ${STATUS_LABELS[newStatus]}`);
      await load();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      Toast.error('Erro ao atualizar. Tente novamente.');
    }
  };

  // ══════════════════════════════════════════
  // NOVO PEDIDO MANUAL
  // ══════════════════════════════════════════

  const openManualOrderForm = () => {
    // Cria modal dinamicamente
    const existing = document.getElementById('manual-order-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'manual-order-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:600px" role="dialog" aria-modal="true">
        <button class="icon-btn modal-close" id="manual-order-close" aria-label="Fechar">✕</button>
        <div class="modal-header">
          <h3 class="modal-title">Novo Pedido Manual</h3>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin-top:var(--sp-2)">
            Para pedidos via WhatsApp, telefone ou presencial
          </p>
        </div>
        <div class="modal-body">
          <form id="manual-order-form" novalidate>

            <div style="font-size:var(--text-xs);font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:var(--sp-4)">
              Dados do cliente
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
              <div class="form-group">
                <label class="form-label" for="mo-name">Nome *</label>
                <input class="form-input" id="mo-name" type="text" required placeholder="Nome do cliente">
              </div>
              <div class="form-group">
                <label class="form-label" for="mo-phone">WhatsApp / Telefone</label>
                <input class="form-input" id="mo-phone" type="tel" placeholder="(00) 90000-0000">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="mo-address">Endereço</label>
              <input class="form-input" id="mo-address" type="text" placeholder="Rua, número, bairro...">
            </div>

            <div style="font-size:var(--text-xs);font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);margin:var(--sp-6) 0 var(--sp-4)">
              Itens do pedido
            </div>

            <div id="mo-items-list"></div>
            <button type="button" class="btn btn--ghost btn--sm" id="mo-add-item" style="margin-bottom:var(--sp-6)">
              + Adicionar item
            </button>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
              <div class="form-group">
                <label class="form-label">Forma de pagamento *</label>
                <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
                  ${Object.entries(PAYMENT_LABELS).map(([val, label], i) => `
                    <label class="payment-label">
                      <input type="radio" name="mo-payment" value="${val}" ${i === 0 ? 'checked' : ''}>
                      ${label}
                    </label>
                  `).join('')}
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Status inicial</label>
                <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
                  ${Object.entries(STATUS_LABELS).map(([val, label], i) => `
                    <label class="payment-label">
                      <input type="radio" name="mo-status" value="${val}" ${i === 0 ? 'checked' : ''}>
                      ${label}
                    </label>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="mo-notes">Observações</label>
              <textarea class="form-input" id="mo-notes" rows="2" placeholder="Ex: pedido pelo WhatsApp, retirada pessoal..."></textarea>
            </div>

            <div style="background:var(--cream);border:1px solid var(--cream-border);border-radius:var(--radius);padding:var(--sp-4);margin-bottom:var(--sp-6);display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:var(--text-sm);color:var(--text-muted)">Total</span>
              <strong id="mo-total-display" style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--gold)">R$ 0,00</strong>
            </div>

            <button type="submit" class="btn btn--gold btn--full" id="mo-save-btn">
              Salvar Pedido
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Adiciona primeiro item vazio
    addItemRow();

    // Eventos
    overlay.querySelector('#mo-add-item').addEventListener('click', addItemRow);
    overlay.querySelector('#manual-order-form').addEventListener('submit', handleManualSave);
    overlay.querySelector('#manual-order-close').addEventListener('click', closeManualForm);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeManualForm(); });
  };

  const closeManualForm = () => {
    const overlay = document.getElementById('manual-order-overlay');
    if (overlay) overlay.remove();
  };

  // ── Linha de item ──────────────────────────
  let itemCount = 0;

  const addItemRow = () => {
    const idx  = itemCount++;
    const list = document.getElementById('mo-items-list');
    const row  = document.createElement('div');
    row.id = `mo-item-${idx}`;
    row.style.cssText = 'display:grid;grid-template-columns:1fr 60px 90px 32px;gap:var(--sp-2);margin-bottom:var(--sp-2);align-items:center';
    row.innerHTML = `
      <input class="form-input mo-item-name" type="text" placeholder="Nome do item" style="font-size:var(--text-sm)">
      <input class="form-input mo-item-qty"  type="number" min="1" value="1" placeholder="Qtd" style="font-size:var(--text-sm);text-align:center">
      <input class="form-input mo-item-price" type="number" min="0" step="0.01" placeholder="Preço" style="font-size:var(--text-sm)">
      <button type="button" class="icon-btn" style="color:var(--danger)" data-remove="${idx}">✕</button>
    `;
    list.appendChild(row);

    // Recalcula total ao digitar
    row.querySelectorAll('.mo-item-qty, .mo-item-price').forEach(input =>
      input.addEventListener('input', recalcTotal)
    );
    row.querySelector('[data-remove]').addEventListener('click', () => {
      row.remove();
      recalcTotal();
    });
  };

  const recalcTotal = () => {
    const rows = document.querySelectorAll('#mo-items-list > div');
    let total = 0;
    rows.forEach(row => {
      const qty   = parseFloat(row.querySelector('.mo-item-qty')?.value)   || 0;
      const price = parseFloat(row.querySelector('.mo-item-price')?.value) || 0;
      total += qty * price;
    });
    const el = document.getElementById('mo-total-display');
    if (el) el.textContent = fmt(total);
  };

  // ── Salvar pedido manual ───────────────────
  const handleManualSave = async (e) => {
    e.preventDefault();

    const name    = document.getElementById('mo-name').value.trim();
    const phone   = document.getElementById('mo-phone').value.trim();
    const address = document.getElementById('mo-address').value.trim();
    const payment = document.querySelector('[name="mo-payment"]:checked')?.value;
    const status  = document.querySelector('[name="mo-status"]:checked')?.value;
    const notes   = document.getElementById('mo-notes').value.trim();

    if (!name) { Toast.error('Informe o nome do cliente.'); return; }

    // Coleta itens
    const itemRows = document.querySelectorAll('#mo-items-list > div');
    const items = [];
    let total = 0;

    itemRows.forEach(row => {
      const itemName = row.querySelector('.mo-item-name')?.value.trim();
      const qty      = parseInt(row.querySelector('.mo-item-qty')?.value)    || 0;
      const price    = parseFloat(row.querySelector('.mo-item-price')?.value) || 0;
      if (itemName && qty > 0) {
        items.push({ product_name: itemName, quantity: qty, unit_price: price });
        total += qty * price;
      }
    });

    if (!items.length) { Toast.error('Adicione pelo menos um item.'); return; }

    const saveBtn = document.getElementById('mo-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';

    try {
      // 1. Inserir pedido
      const { data: order, error: orderErr } = await db
        .from('orders')
        .insert({
          customer_name:    name,
          customer_phone:   phone   || null,
          customer_address: address || null,
          payment_method:   payment,
          notes:            notes   || null,
          total,
          status,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Inserir itens
      const orderItems = items.map(i => ({ ...i, order_id: order.id }));
      const { error: itemsErr } = await db.from('order_items').insert(orderItems);
      if (itemsErr) throw itemsErr;

      Toast.success('Pedido registrado com sucesso!');
      closeManualForm();
      await load();

    } catch (err) {
      console.error('Erro ao salvar pedido manual:', err);
      Toast.error('Erro ao salvar. Tente novamente.');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Salvar Pedido';
    }
  };

  // ── Estatísticas ───────────────────────────
  const renderStats = () => {
    if (!statsWrap) return;
    const total    = allOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const byStatus = {};
    allOrders.forEach(o => byStatus[o.status] = (byStatus[o.status] || 0) + 1);

    const today = new Date().toDateString();
    const todayOrders  = allOrders.filter(o => new Date(o.created_at).toDateString() === today);
    const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total || 0), 0);

    statsWrap.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${allOrders.length}</div>
          <div class="stat-label">Total de Pedidos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="font-size:var(--text-3xl)">${fmt(total)}</div>
          <div class="stat-label">Receita Total</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${todayOrders.length}</div>
          <div class="stat-label">Pedidos Hoje</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="font-size:var(--text-3xl)">${fmt(todayRevenue)}</div>
          <div class="stat-label">Receita Hoje</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${byStatus[STATUS.PENDING] || 0}</div>
          <div class="stat-label">Aguardando</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${byStatus[STATUS.STARTED] || 0}</div>
          <div class="stat-label">Em Produção</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${byStatus[STATUS.FINISHED] || 0}</div>
          <div class="stat-label">Prontos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${byStatus[STATUS.DELIVERED] || 0}</div>
          <div class="stat-label">Entregues</div>
        </div>
      </div>
    `;
  };

  // ── Exportar CSV ───────────────────────────
  const exportCsv = () => {
    if (!allOrders.length) { Toast.info('Sem pedidos para exportar.'); return; }

    const headers = ['ID', 'Cliente', 'Telefone', 'Endereço', 'Total', 'Pagamento', 'Status', 'Data', 'Obs'];
    const rows    = allOrders.map(o => [
      o.id,
      o.customer_name,
      o.customer_phone   || '',
      o.customer_address || '',
      o.total,
      PAYMENT_LABELS[o.payment_method]?.replace(/[^\w\s]/g, '') || '',
      STATUS_LABELS[o.status]?.replace(/[^\w\s]/g, '')          || '',
      fmtDate(o.created_at),
      o.notes || '',
    ]);

    const csv  = [headers, ...rows]
      .map(row => row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url, download: `pedidos-abda-soaps-${new Date().toISOString().slice(0,10)}.csv`
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    Toast.success('CSV exportado com sucesso!');
  };

  // ── Eventos ────────────────────────────────
  document.getElementById('export-csv-btn').addEventListener('click', exportCsv);
  document.getElementById('new-order-btn').addEventListener('click', openManualOrderForm);

  return { init: load };
})();
