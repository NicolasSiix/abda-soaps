// ══════════════════════════════════════════════
// ABDA SOAPS — Loja (Store)
// ══════════════════════════════════════════════

const Store = (() => {
  // ── Estado do carrinho ─────────────────────
  let cart = (() => {
    try { return JSON.parse(localStorage.getItem('abda_cart') || '[]'); }
    catch { return []; }
  })();

  const saveCart = () => localStorage.setItem('abda_cart', JSON.stringify(cart));

  // ── Badge do carrinho ──────────────────────
  const updateBadge = () => {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    const badge = document.getElementById('cart-count');
    badge.textContent = total;
    badge.hidden = total === 0;
  };

  // ── Renderizar carrinho ────────────────────
  const renderCart = () => {
    const listEl   = document.getElementById('cart-items');
    const emptyEl  = document.getElementById('cart-empty');
    const footerEl = document.getElementById('cart-footer');
    const totalEl  = document.getElementById('cart-total-display');

    if (!cart.length) {
      listEl.innerHTML = '';
      listEl.style.display = 'none';
      emptyEl.style.display = 'flex';
      footerEl.hidden = true;
      return;
    }

    listEl.style.display = 'block';
    emptyEl.style.display = 'none';
    footerEl.hidden = false;
    totalEl.textContent = fmt(cart.reduce((s, i) => s + i.price * i.qty, 0));

    listEl.innerHTML = cart.map((item, idx) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${esc(item.name)}</div>
          <div class="cart-item-price">${fmt(item.price)} / un.</div>
          <div class="cart-item-qty">
            <button class="qty-btn" data-action="dec" data-idx="${idx}" aria-label="Diminuir">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-idx="${idx}" aria-label="Aumentar">+</button>
            <button class="qty-btn qty-remove" data-action="remove" data-idx="${idx}" aria-label="Remover">✕</button>
          </div>
        </div>
        <div style="font-weight:600;font-size:var(--text-sm);color:var(--gold);white-space:nowrap;align-self:center">
          ${fmt(item.price * item.qty)}
        </div>
      </div>
    `).join('');
  };

  // ── Sidebar do carrinho ────────────────────
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartOverlay = document.getElementById('cart-overlay');

  const openCart  = () => { cartSidebar.classList.add('open'); cartOverlay.classList.add('open'); };
  const closeCart = () => { cartSidebar.classList.remove('open'); cartOverlay.classList.remove('open'); };

  document.getElementById('cart-toggle').addEventListener('click', openCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  // Delegação de cliques nos botões do carrinho
  document.getElementById('cart-items').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const idx    = parseInt(btn.dataset.idx, 10);
    const action = btn.dataset.action;

    if (action === 'inc') {
      cart[idx].qty++;
    } else if (action === 'dec') {
      cart[idx].qty--;
      if (cart[idx].qty <= 0) cart.splice(idx, 1);
    } else if (action === 'remove') {
      cart.splice(idx, 1);
    }

    saveCart();
    updateBadge();
    renderCart();
  });

  // ── Adicionar ao carrinho ──────────────────
  const addToCart = (product) => {
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }
    saveCart();
    updateBadge();
    renderCart();
    openCart();
    Toast.success(`"${product.name}" adicionado ao carrinho!`);
  };

  // ── Renderizar grade de produtos ───────────
  const renderProducts = (products) => {
    const grid    = document.getElementById('products-grid');
    const loading = document.getElementById('products-loading');
    const empty   = document.getElementById('products-empty');

    loading.style.display = 'none';

    if (!products?.length) {
      empty.hidden = false;
      return;
    }

    grid.innerHTML = products.map(p => `
      <article class="product-card" data-id="${p.id}">
        <div class="product-image-wrap">
          ${p.image_url
            ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">`
            : `<div class="product-image-placeholder">🧼</div>`
          }
        </div>
        <div class="product-body">
          ${p.color || p.aroma || p.base ? `
            <div class="product-category">
              ${[p.color, p.aroma, p.base].filter(Boolean).map(esc).join(' · ')}
            </div>` : ''}
          <h3 class="product-name">${esc(p.name)}</h3>
          ${p.description ? `<p class="product-desc">${esc(p.description)}</p>` : ''}
          <div class="product-footer">
            <div>
              <div class="product-price">${fmt(p.price)}</div>
              ${p.stock != null
                ? `<div class="product-stock ${p.stock === 0 ? 'out' : ''}">
                    ${p.stock > 0 ? `${p.stock} em estoque` : 'Sem estoque'}
                  </div>`
                : ''}
            </div>
            <button
              class="btn-add-cart"
              data-product='${JSON.stringify({ id: p.id, name: p.name, price: p.price })}'
              ${p.stock === 0 ? 'disabled' : ''}
              aria-label="Adicionar ${p.name} ao carrinho">
              + Carrinho
            </button>
          </div>
        </div>
      </article>
    `).join('');

    // Delegação de cliques na grade
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-add-cart');
      if (!btn || btn.disabled) return;
      try {
        const product = JSON.parse(btn.dataset.product);
        addToCart(product);
      } catch { /* noop */ }
    });
  };

  // ── Buscar produtos do Supabase ────────────
  const loadProducts = async () => {
    try {
      const { data, error } = await db
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      renderProducts(data || []);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      document.getElementById('products-loading').style.display = 'none';
      document.getElementById('products-empty').hidden = false;
      Toast.error('Não foi possível carregar os produtos. Verifique a conexão.');
    }
  };

  // ── API pública ────────────────────────────
  const getCart   = () => [...cart];
  const clearCart = () => {
    cart = [];
    saveCart();
    updateBadge();
    renderCart();
  };

  // ── Init ───────────────────────────────────
  updateBadge();
  renderCart();
  loadProducts();

  return { getCart, clearCart, addToCart, openCart, closeCart };
})();
