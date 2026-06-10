// ══════════════════════════════════════════════
// ABDA SOAPS — Gerenciamento de Produtos (Admin)
// ══════════════════════════════════════════════

const ProductsAdmin = (() => {
  const wrap    = document.getElementById('products-admin-wrap');
  const overlay = document.getElementById('product-form-overlay');
  const formTitle = document.getElementById('product-form-title');
  const formBody  = document.getElementById('product-form-body');

  let editingId = null;

  // ── Carregar lista ─────────────────────────
  const load = async () => {
    wrap.innerHTML = `
      <div class="products-loading" style="padding:var(--sp-12)">
        <div class="loading-spinner"></div>
        <p>Carregando produtos...</p>
      </div>`;

    try {
      const { data, error } = await db
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      renderTable(data || []);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      wrap.innerHTML = `<p style="padding:var(--sp-8);color:var(--danger)">
        Erro ao carregar produtos. Verifique a conexão com o Supabase.
      </p>`;
    }
  };

  // ── Renderizar tabela ──────────────────────
  const renderTable = (products) => {
    if (!products.length) {
      wrap.innerHTML = `
        <div style="padding:var(--sp-12);text-align:center;color:var(--text-muted)">
          Nenhum produto cadastrado. Clique em "+ Novo Produto" para começar.
        </div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => buildRow(p)).join('')}
          </tbody>
        </table>
      </div>`;

    wrap.querySelectorAll('[data-edit-id]').forEach(btn =>
      btn.addEventListener('click', () => openForm(btn.dataset.editId))
    );
    wrap.querySelectorAll('[data-toggle-id]').forEach(btn =>
      btn.addEventListener('click', () => toggleActive(btn.dataset.toggleId, btn.dataset.active === 'true'))
    );
    wrap.querySelectorAll('[data-delete-id]').forEach(btn =>
      btn.addEventListener('click', () => deleteProduct(btn.dataset.deleteId, btn.dataset.deleteName))
    );
  };

  const buildRow = (p) => `
    <tr>
      <td>
        <div style="font-weight:500;color:var(--dark)">${esc(p.name)}</div>
        ${p.description ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px">${esc(p.description.slice(0, 60))}${p.description.length > 60 ? '…' : ''}</div>` : ''}
      </td>
      <td style="color:var(--text-muted)">${p.category ? esc(p.category) : '—'}</td>
      <td style="font-weight:600;color:var(--gold);white-space:nowrap">${fmt(p.price)}</td>
      <td>
        <span style="color:${p.stock === 0 ? 'var(--danger)' : 'var(--text)'}">
          ${p.stock} un.
        </span>
      </td>
      <td>
        <span class="status-badge ${p.active ? 'status-delivered' : 'status-pending'}">
          ${p.active ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn btn--sm btn--outline" data-edit-id="${p.id}">Editar</button>
          <button class="btn btn--sm btn--ghost" data-toggle-id="${p.id}" data-active="${p.active}">
            ${p.active ? 'Desativar' : 'Ativar'}
          </button>
          <button class="btn btn--sm btn--danger" data-delete-id="${p.id}" data-delete-name="${esc(p.name)}">✕</button>
        </div>
      </td>
    </tr>
  `;

  // ── Abrir formulário ───────────────────────
  const openForm = async (id = null) => {
    editingId = id;
    formTitle.textContent = id ? 'Editar Produto' : 'Novo Produto';

    let product = { name: '', description: '', price: '', stock: 0, category: '', image_url: '', active: true };

    if (id) {
      try {
        const { data, error } = await db.from('products').select('*').eq('id', id).single();
        if (error) throw error;
        product = data;
      } catch (err) {
        Toast.error('Erro ao carregar produto.');
        return;
      }
    }

    formBody.innerHTML = `
      <form id="product-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="pf-name">Nome *</label>
          <input class="form-input" id="pf-name" type="text" required
            value="${esc(product.name)}" placeholder="Nome do produto">
        </div>
        <div class="form-group">
          <label class="form-label" for="pf-desc">Descrição</label>
          <textarea class="form-input" id="pf-desc" rows="3"
            placeholder="Descreva o produto...">${esc(product.description || '')}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
          <div class="form-group">
            <label class="form-label" for="pf-price">Preço (R$) *</label>
            <input class="form-input" id="pf-price" type="number" min="0" step="0.01" required
              value="${product.price}" placeholder="0,00">
          </div>
          <div class="form-group">
            <label class="form-label" for="pf-stock">Estoque</label>
            <input class="form-input" id="pf-stock" type="number" min="0" step="1"
              value="${product.stock ?? 0}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="pf-category">Categoria</label>
          <input class="form-input" id="pf-category" type="text"
            value="${esc(product.category || '')}" placeholder="ex: Lavanda, Mel, Cítrico...">
        </div>
        <div class="form-group">
          <label class="form-label">Imagem do produto</label>
          <div style="display:flex;gap:var(--sp-3);align-items:flex-start;flex-wrap:wrap">
            <div style="flex:1;min-width:200px">
              <input class="form-input" id="pf-image" type="url"
                value="${esc(product.image_url || '')}" placeholder="URL da imagem">
              <p class="form-hint">Cole uma URL ou use o botão ao lado para fazer upload</p>
            </div>
            <div>
              <label class="btn btn--outline btn--sm" style="cursor:pointer;margin-top:0">
                📁 Escolher arquivo
                <input type="file" id="pf-image-upload" accept="image/*" style="display:none">
              </label>
            </div>
          </div>
          <div id="pf-image-preview" style="margin-top:var(--sp-3)">
            ${product.image_url ? `<img src="${esc(product.image_url)}" style="width:120px;height:90px;object-fit:cover;border-radius:var(--radius);border:1px solid var(--cream-border)">` : ''}
          </div>
          <p id="pf-upload-status" style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--sp-1)"></p>
        </div>
        <div class="form-group">
          <label class="payment-label" style="width:fit-content">
            <input type="checkbox" id="pf-active" ${product.active ? 'checked' : ''}
              style="accent-color:var(--gold)">
            Produto ativo (visível na loja)
          </label>
        </div>
        <div style="display:flex;gap:var(--sp-3);margin-top:var(--sp-6)">
          <button type="submit" class="btn btn--gold btn--full" id="product-save-btn">
            ${id ? 'Salvar alterações' : 'Criar produto'}
          </button>
          <button type="button" class="btn btn--ghost" id="product-cancel-btn">Cancelar</button>
        </div>
      </form>
    `;

    overlay.hidden = false;
    document.getElementById('product-form').addEventListener('submit', handleSave);
    document.getElementById('product-cancel-btn').addEventListener('click', closeForm);
    document.getElementById('pf-image-upload').addEventListener('change', handleImageUpload);
  };

  const closeForm = () => { overlay.hidden = true; editingId = null; };

  // ── Upload de imagem ───────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const statusEl  = document.getElementById('pf-upload-status');
    const previewEl = document.getElementById('pf-image-preview');
    const urlInput  = document.getElementById('pf-image');

    statusEl.textContent = 'Enviando imagem...';
    statusEl.style.color = 'var(--text-muted)';

    const ext      = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;

    try {
      const { error } = await db.storage
        .from('produtos')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data } = db.storage.from('produtos').getPublicUrl(fileName);
      urlInput.value = data.publicUrl;

      previewEl.innerHTML = `<img src="${data.publicUrl}" style="width:120px;height:90px;object-fit:cover;border-radius:var(--radius);border:1px solid var(--cream-border)">`;
      statusEl.textContent = 'Imagem enviada com sucesso!';
      statusEl.style.color = 'var(--success)';
    } catch (err) {
      console.error('Erro no upload:', err);
      statusEl.textContent = 'Erro ao enviar imagem. Tente novamente.';
      statusEl.style.color = 'var(--danger)';
    }
  };

  // ── Salvar produto ─────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();

    const name      = document.getElementById('pf-name').value.trim();
    const description = document.getElementById('pf-desc').value.trim();
    const price     = parseFloat(document.getElementById('pf-price').value);
    const stock     = parseInt(document.getElementById('pf-stock').value, 10) || 0;
    const category  = document.getElementById('pf-category').value.trim();
    const image_url = document.getElementById('pf-image').value.trim();
    const active    = document.getElementById('pf-active').checked;

    if (!name || isNaN(price) || price < 0) {
      Toast.error('Preencha nome e preço válido.');
      return;
    }

    const saveBtn = document.getElementById('product-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';

    const payload = {
      name,
      description: description || null,
      price,
      stock,
      category: category || null,
      image_url: image_url || null,
      active,
    };

    try {
      const query = editingId
        ? db.from('products').update(payload).eq('id', editingId)
        : db.from('products').insert(payload);

      const { error } = await query;
      if (error) throw error;

      Toast.success(editingId ? 'Produto atualizado!' : 'Produto criado!');
      closeForm();
      await load();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      Toast.error('Erro ao salvar. Tente novamente.');
      saveBtn.disabled = false;
      saveBtn.textContent = editingId ? 'Salvar alterações' : 'Criar produto';
    }
  };

  // ── Ativar / desativar ─────────────────────
  const toggleActive = async (id, currentlyActive) => {
    try {
      const { error } = await db
        .from('products')
        .update({ active: !currentlyActive })
        .eq('id', id);

      if (error) throw error;
      Toast.success(currentlyActive ? 'Produto desativado.' : 'Produto ativado!');
      await load();
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      Toast.error('Erro ao atualizar. Tente novamente.');
    }
  };

  // ── Excluir produto ────────────────────────
  const deleteProduct = async (id, name) => {
    if (!confirm(`Excluir "${name}" permanentemente?`)) return;

    try {
      const { error } = await db.from('products').delete().eq('id', id);
      if (error) throw error;
      Toast.success('Produto excluído.');
      await load();
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      Toast.error('Erro ao excluir. Tente novamente.');
    }
  };

  // ── Eventos ────────────────────────────────
  document.getElementById('new-product-btn').addEventListener('click', () => openForm());
  document.getElementById('product-form-close').addEventListener('click', closeForm);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeForm(); });

  return { init: load };
})();
