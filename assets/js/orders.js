// ══════════════════════════════════════════════
// ABDA SOAPS — Gerenciamento de Pedidos (Admin)
// ══════════════════════════════════════════════

const Orders = (() => {
  let allOrders = [];

  const tableWrap = document.getElementById('orders-table-wrap');
  const statsWrap = document.getElementById('stats-wrap');

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

  // ── Estatísticas ───────────────────────────
  const renderStats = () => {
    if (!statsWrap) return;
    const total    = allOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const byStatus = {};
    allOrders.forEach(o => byStatus[o.status] = (byStatus[o.status] || 0) + 1);

    const today = new Date().toDateString();
    const todayOrders   = allOrders.filter(o => new Date(o.created_at).toDateString() === today);
    const todayRevenue  = todayOrders.reduce((s, o) => s + Number(o.total || 0), 0);

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

  document.getElementById('export-csv-btn').addEventListener('click', exportCsv);

  return { init: load };
})();
