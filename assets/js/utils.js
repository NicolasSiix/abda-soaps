// ══════════════════════════════════════════════
// ABDA SOAPS — Utilitários globais
// ══════════════════════════════════════════════

const fmt = (n) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL'
}).format(n ?? 0);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  : '—';

// ── Toast ────────────────────────────────────
const Toast = (() => {
  const container = document.getElementById('toast-container');

  const show = (msg, type = 'info', duration = 3500) => {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => el.remove(), 300);
    }, duration);
  };

  return {
    success: (msg)           => show(msg, 'success'),
    error:   (msg)           => show(msg, 'error', 5000),
    info:    (msg, duration) => show(msg, 'info', duration),
  };
})();

// ── Nav ──────────────────────────────────────
const Nav = (() => {
  const views   = document.querySelectorAll('.view');
  const navBtns = document.querySelectorAll('.nav-btn');

  const go = (viewId) => {
    views.forEach(v   => v.classList.toggle('active',   v.id === `view-${viewId}`));
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  navBtns.forEach(btn => {
    if (btn.id !== 'admin-nav-btn') {
      btn.addEventListener('click', () => go(btn.dataset.view));
    }
  });

  return { go };
})();

// ── Header scroll shadow ─────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('site-header')
    .classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });
