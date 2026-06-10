// ══════════════════════════════════════════════
// ABDA SOAPS — Admin Auth & Painel
// ══════════════════════════════════════════════

const Admin = (() => {
  let authenticated = sessionStorage.getItem('abda_admin') === '1';

  const panel       = document.getElementById('admin-panel');
  const overlay     = document.getElementById('admin-overlay');
  const adminBody   = document.getElementById('admin-body');
  const adminNavBtn = document.getElementById('admin-nav-btn');

  // ── Modal de login ─────────────────────────
  const showLoginModal = () => {
    overlay.hidden = false;
    adminBody.innerHTML = `
      <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--sp-5)">
        Esta área é restrita. Digite a senha para continuar.
      </p>
      <div class="form-group">
        <label class="form-label" for="admin-pass">Senha</label>
        <input class="form-input" id="admin-pass" type="password"
          placeholder="••••••••" autocomplete="current-password">
      </div>
      <p id="admin-login-error" style="color:var(--danger);font-size:var(--text-sm);margin-bottom:var(--sp-4);display:none">
        Senha incorreta. Tente novamente.
      </p>
      <button class="btn btn--gold btn--full" id="admin-login-btn">Entrar</button>
    `;

    const passInput = document.getElementById('admin-pass');
    const loginBtn  = document.getElementById('admin-login-btn');

    passInput.focus();
    loginBtn.addEventListener('click', tryLogin);
    passInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });
  };

  // ── Tentativa de login ─────────────────────
  const tryLogin = () => {
    const pass    = document.getElementById('admin-pass').value;
    const errorEl = document.getElementById('admin-login-error');

    if (pass === ADMIN_PASSWORD) {
      sessionStorage.setItem('abda_admin', '1');
      authenticated = true;
      overlay.hidden = true;
      Nav.go('admin');
      showPanel();
      Toast.success('Bem-vindo ao painel admin!');
    } else {
      errorEl.style.display = 'block';
      document.getElementById('admin-pass').value = '';
      document.getElementById('admin-pass').focus();
    }
  };

  // ── Mostrar painel ─────────────────────────
  const showPanel = () => {
    panel.hidden = false;
    Orders.init();
    setupTabs();
  };

  // ── Abas do painel ─────────────────────────
  const setupTabs = () => {
    const tabs     = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        if (tab.classList.contains('active')) return;
        tabs.forEach(t     => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');

        // Carrega o conteúdo da aba ao clicar
        if (tab.dataset.tab === 'products') ProductsAdmin.init();
        if (tab.dataset.tab === 'orders')   Orders.init();
      });
    });
  };

  // ── Clique no botão "Admin" do nav ─────────
  adminNavBtn.addEventListener('click', () => {
    if (authenticated) {
      Nav.go('admin');
      showPanel();
    } else {
      Nav.go('admin');
      showLoginModal();
    }
  });

  // ── Fechar modal de login ──────────────────
  document.getElementById('admin-modal-close').addEventListener('click', () => {
    overlay.hidden = true;
    Nav.go('store');
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.hidden = true;
      Nav.go('store');
    }
  });

  return { isAuthenticated: () => authenticated };
})();
