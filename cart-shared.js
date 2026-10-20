/* ==========================================================================
   GUATEGREEN — CARRITO Y SINCRONIZACIÓN COMPARTIDA (Páginas de Producto & Colección)
   ========================================================================== */

const GG_CART_KEY = 'guategreen_cart_v1';
const GG_WHATSAPP = '50252554758';

function getStoredCart() {
  try {
    const raw = localStorage.getItem(GG_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveStoredCart(cart) {
  try {
    localStorage.setItem(GG_CART_KEY, JSON.stringify(cart));
  } catch (e) {}
}

function getCatalogProduct(id) {
  const prods = window.GUATEGREEN_PRODUCTS || [];
  return prods.find(p => Number(p.id) === Number(id));
}

function formatQ(val) {
  return 'Q ' + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderCartDrawer() {
  const cart = getStoredCart();
  const count = cart.reduce((acc, item) => acc + item.qty, 0);

  // Badge en el header
  const badge = document.getElementById('cartCount');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('show', count > 0);
  }

  // Lista de items
  const itemsContainer = document.getElementById('cartItems');
  if (itemsContainer) {
    if (cart.length === 0) {
      itemsContainer.innerHTML = '<p class="cart-empty">Tu carrito está vacío.<br>Elegí un espécimen del catálogo.</p>';
    } else {
      itemsContainer.innerHTML = cart.map(item => {
        const p = getCatalogProduct(item.id);
        const name = p ? p.name : 'Espécimen';
        const price = p ? p.price : 0;
        const img = p && p.image ? '../../' + p.image : '../../logo.jpg';

        return `
          <div class="cart-item" data-id="${item.id}">
            <div class="swatch" style="background:#EFF5E1;overflow:hidden;">
              <img src="${img}" alt="${name}" style="width:100%;height:100%;object-fit:cover;">
            </div>
            <div class="cart-item-info">
              <span class="name">${name}</span>
              <span class="mono" style="font-size:.72rem;color:var(--ink-45)">${formatQ(price)} c/u</span>
              <div class="cart-item-row">
                <div class="qty-stepper">
                  <button data-act="minus" aria-label="Quitar uno">−</button>
                  <span class="mono">${item.qty}</span>
                  <button data-act="plus" aria-label="Agregar uno">+</button>
                </div>
                <button class="remove-btn" data-act="remove">Quitar</button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      itemsContainer.querySelectorAll('.cart-item').forEach(row => {
        const id = Number(row.dataset.id);
        row.querySelector('[data-act="plus"]')?.addEventListener('click', () => updateCartQty(id, 1));
        row.querySelector('[data-act="minus"]')?.addEventListener('click', () => updateCartQty(id, -1));
        row.querySelector('[data-act="remove"]')?.addEventListener('click', () => removeCartItem(id));
      });
    }
  }

  // Subtotal
  const subtotal = cart.reduce((acc, item) => {
    const p = getCatalogProduct(item.id);
    return acc + (p ? p.price : 0) * item.qty;
  }, 0);

  const subtotalEl = document.getElementById('cartSubtotal');
  if (subtotalEl) {
    subtotalEl.textContent = formatQ(subtotal);
  }

  // Botón WhatsApp Checkout
  const waBtn = document.getElementById('cartCheckout');
  if (waBtn) {
    if (cart.length) {
      const lines = cart.map(item => {
        const p = getCatalogProduct(item.id);
        return `${item.qty}x ${p ? p.name : 'Espécimen'} (${formatQ(p ? p.price : 0)})`;
      }).join('\n');
      const msg = `Hola Guategreen, quiero apartar estos especímenes:\n${lines}\n\nTotal: ${formatQ(subtotal)}`;
      waBtn.href = `https://wa.me/${GG_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    } else {
      waBtn.href = `https://wa.me/${GG_WHATSAPP}`;
    }
  }
}

function addProductToCart(id) {
  const cart = getStoredCart();
  const numId = Number(id);
  const existing = cart.find(i => Number(i.id) === numId);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: numId, qty: 1 });
  }

  saveStoredCart(cart);
  renderCartDrawer();
  openCartDrawer();

  // Meta Pixel Event
  const p = getCatalogProduct(numId);
  if (window.fbq && p) {
    try {
      window.fbq('track', 'AddToCart', {
        content_name: p.name,
        content_category: p.cat,
        content_ids: [String(p.id)],
        content_type: 'product',
        value: Number(p.price) || 0,
        currency: 'GTQ'
      });
    } catch (e) {}
  }
}

function updateCartQty(id, delta) {
  let cart = getStoredCart();
  const numId = Number(id);
  const item = cart.find(i => Number(i.id) === numId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => Number(i.id) !== numId);
  }

  saveStoredCart(cart);
  renderCartDrawer();
}

function removeCartItem(id) {
  let cart = getStoredCart();
  const numId = Number(id);
  cart = cart.filter(i => Number(i.id) !== numId);
  saveStoredCart(cart);
  renderCartDrawer();
}

function openCartDrawer() {
  document.getElementById('cartPanel')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('show');
  document.body.classList.add('cart-open');
}

function closeCartDrawer() {
  document.getElementById('cartPanel')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('show');
  document.body.classList.remove('cart-open');
}

// Inicialización de Eventos de Carrito y Menú Móvil
document.addEventListener('DOMContentLoaded', () => {
  renderCartDrawer();

  document.getElementById('cartBtn')?.addEventListener('click', openCartDrawer);
  document.getElementById('cartClose')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCartDrawer);

  // Menú móvil hamburguesa
  const burgerBtn = document.getElementById('burgerBtn');
  const navLinks = document.getElementById('navLinks');
  const navClose = document.getElementById('navClose');

  burgerBtn?.addEventListener('click', () => {
    navLinks?.classList.add('open');
  });

  navClose?.addEventListener('click', () => {
    navLinks?.classList.remove('open');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCartDrawer();
      navLinks?.classList.remove('open');
    }
  });

  // Actualizar punto de estado (verde o rojo si está agotado)
  try {
    const rawAdmin = localStorage.getItem('guategreen_admin_data_v1');
    const overrides = rawAdmin ? (JSON.parse(rawAdmin).productOverrides || {}) : {};

    document.querySelectorAll('.card[data-id]').forEach(card => {
      const id = card.getAttribute('data-id');
      const ov = overrides[id];
      const stockRow = card.querySelector('.stock-row');
      if (stockRow && ov && ov.stock) {
        const dot = stockRow.querySelector('.dot-live');
        stockRow.innerHTML = '';
        if (dot) stockRow.appendChild(dot);
        stockRow.appendChild(document.createTextNode(ov.stock));
      }
      if (stockRow) {
        const dot = stockRow.querySelector('.dot-live');
        const txt = stockRow.textContent || '';
        const isOut = txt.toLowerCase().includes('agotad') || (ov && ov.stockQty !== undefined && Number(ov.stockQty) <= 0);
        if (dot) dot.style.background = isOut ? '#DC2626' : 'var(--sage-500)';
      }
    });

    const pdpTags = document.querySelector('.pdp-tags-row');
    if (pdpTags) {
      const dot = pdpTags.querySelector('.dot-live');
      const txt = pdpTags.textContent || '';
      const isOut = txt.toLowerCase().includes('agotad');
      if (dot && isOut) dot.style.background = '#DC2626';
    }
  } catch (e) {}
});
