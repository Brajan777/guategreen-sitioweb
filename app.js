/* =============== CONFIGURACIÓN Y SISTEMA DE ADMINISTRACIÓN =============== */
const DEFAULT_WHATSAPP = '50252554758';
const ADMIN_STORAGE_KEY = 'guategreen_admin_data_v1';

const DEFAULT_ADMIN_DATA = {
  password: 'plantitas123',
  whatsappNumber: DEFAULT_WHATSAPP,
  customProducts: [],
  productOverrides: {}
};

function getAdminData() {
  try {
    const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_ADMIN_DATA, ...parsed };
    }
  } catch (e) {
    console.error('Error al leer admin data', e);
  }
  return DEFAULT_ADMIN_DATA;
}

function saveAdminData(data) {
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error al guardar admin data', e);
  }
}

function getProducts() {
  const adminData = getAdminData();
  const overrides = adminData.productOverrides || {};

  const mergedDefaults = PRODUCTS.map(p => {
    const ov = overrides[p.id];
    return ov ? { ...p, ...ov } : p;
  });

  const customProds = (adminData.customProducts || []).map(p => {
    const ov = overrides[p.id];
    return ov ? { ...p, ...ov } : p;
  });

  return [...mergedDefaults, ...customProds].filter(p => !p.deleted);
}

function getWhatsAppNumber() {
  const adminData = getAdminData();
  return adminData.whatsappNumber || DEFAULT_WHATSAPP;
}

const PRODUCTS = [
  { 
    id: 1, 
    cat: 'Monstera', 
    name: 'Monstera Thai Constellation', 
    latin: 'Monstera deliciosa var.', 
    price: 1450, 
    old: null, 
    rarity: 'Ultra rara', 
    panel: 'sage', 
    stock: 'Última unidad',
    description: 'Ejemplar exclusivo de colección con variegación crema bien definida y excelente patrón de constelación. Planta fuerte, perfectamente enraizada y aclimatada en nuestro vivero local.',
    images: [
      { bg: 'var(--sage-100)', accent: '#3A5A40' },
      { bg: 'var(--blush-100)', accent: '#35521F' },
      { bg: 'var(--lilac-100)', accent: '#4F772D' }
    ]
  },
  { 
    id: 2, 
    cat: 'Philodendron', 
    name: 'Philodendron Gloriosum Tricolor', 
    latin: 'Philodendron gloriosum', 
    price: 980, 
    old: null, 
    rarity: 'Rara', 
    panel: 'blush', 
    stock: '3 disponibles',
    description: 'Hermosa especie rastrera de hojas acorazonadas y aterciopeladas con marcados tonos variegados. Incluye sustrato especial para aráceas y maceta con excelente drenaje.',
    images: [
      { bg: 'var(--blush-100)', accent: '#35521F' },
      { bg: 'var(--sage-100)', accent: '#3A5A40' },
      { bg: 'var(--lilac-100)', accent: '#4F772D' }
    ]
  },
  { 
    id: 3, 
    cat: 'Alocasia', 
    name: 'Alocasia Jacklyn', 
    latin: 'Alocasia reginula hybrid', 
    price: 650, 
    old: null, 
    rarity: 'Rara', 
    panel: 'lilac', 
    stock: '5 disponibles',
    description: 'Reconocida por la textura profunda de sus hojas arrugadas y tonos verdes vivos. Espécimen aclimatado de rápido desarrollo bajo luz indirecta brillante.',
    images: [
      { bg: 'var(--lilac-100)', accent: '#4F772D' },
      { bg: 'var(--sage-100)', accent: '#3A5A40' },
      { bg: 'var(--blush-100)', accent: '#35521F' }
    ]
  },
  { 
    id: 4, 
    cat: 'Caladium', 
    name: 'Caladium Variegado Indonesio', 
    latin: 'Caladium bicolor', 
    price: 420, 
    old: null, 
    rarity: 'Común', 
    panel: 'sage', 
    stock: '12 disponibles',
    description: 'Follaje delgado vibrante con patrones rosados y crema únicos. Ideal para decorar interiores iluminados o terrazas protegidas.',
    images: [
      { bg: 'var(--sage-100)', accent: '#3A5A40' },
      { bg: 'var(--lilac-100)', accent: '#4F772D' },
      { bg: 'var(--blush-100)', accent: '#35521F' }
    ]
  },
  { 
    id: 5, 
    cat: 'Otros', 
    name: 'Syngonium Chiapense', 
    latin: 'Syngonium chiapense', 
    price: 390, 
    old: null, 
    rarity: 'Común', 
    panel: 'blush', 
    stock: '8 disponibles',
    description: 'Hojas coriáceas de color verde mate profundo y textura firme. Muy resistente y fácil de cuidar en clima guatemalteco.',
    images: [
      { bg: 'var(--blush-100)', accent: '#35521F' },
      { bg: 'var(--sage-100)', accent: '#3A5A40' },
      { bg: 'var(--lilac-100)', accent: '#4F772D' }
    ]
  },
  { 
    id: 6, 
    cat: 'Otros', 
    name: 'Jewel Orchid Macodes', 
    latin: 'Macodes petola', 
    price: 520, 
    old: null, 
    rarity: 'Rara', 
    panel: 'lilac', 
    stock: '4 disponibles',
    description: 'Orquídea joya terrestre famosa por las venas doradas brillantes en sus hojas aterciopeladas. Cultivada en terrario controlado.',
    images: [
      { bg: 'var(--lilac-100)', accent: '#4F772D' },
      { bg: 'var(--blush-100)', accent: '#35521F' },
      { bg: 'var(--sage-100)', accent: '#3A5A40' }
    ]
  },
  { 
    id: 7, 
    cat: 'Monstera', 
    name: 'Monstera Deliciosa Albo', 
    latin: 'Monstera deliciosa var. albo', 
    price: 1290, 
    old: null, 
    rarity: 'Ultra rara', 
    panel: 'sage', 
    stock: '2 disponibles',
    description: 'Espécimen de alto contraste blanco y verde con fenestraciones definidas. Enraizado y listo para prosperar.',
    images: [
      { bg: 'var(--sage-100)', accent: '#3A5A40' },
      { bg: 'var(--blush-100)', accent: '#35521F' },
      { bg: 'var(--lilac-100)', accent: '#4F772D' }
    ]
  },
  { 
    id: 8, 
    cat: 'Alocasia', 
    name: 'Alocasia Dragon Scale', 
    latin: 'Alocasia baginda', 
    price: 340, 
    old: null, 
    rarity: 'Común', 
    panel: 'blush', 
    stock: '9 disponibles',
    description: 'Estructura rígida de aspecto escamoso y envés rojizo deslumbrante. Una joya botánica para coleccionistas.',
    images: [
      { bg: 'var(--blush-100)', accent: '#35521F' },
      { bg: 'var(--lilac-100)', accent: '#4F772D' },
      { bg: 'var(--sage-100)', accent: '#3A5A40' }
    ]
  }
];

const CATEGORIES = ['Todas', 'Monstera', 'Philodendron', 'Alocasia', 'Caladium', 'Otros'];
let activeCat = 'Todas';
let visibleCount = 4;

function leafSVG(accent) {
  return `<svg viewBox="0 0 100 100" fill="none">
    <path d="M50 92C50 92 12 74 12 40C12 18 30 4 50 2C70 4 88 18 88 40C88 74 50 92 50 92Z" fill="none" stroke="${accent}" stroke-width="2.5"/>
    <path d="M50 10V88" stroke="${accent}" stroke-width="1.5" stroke-dasharray="3 4"/>
    <path d="M50 25C42 38 28 44 18 47M50 45C40 56 26 61 15 63M50 65C40 74 27 78 17 80" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M50 25C58 38 72 44 82 47M50 45C60 56 74 61 85 63M50 65C60 74 73 78 83 80" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}

function money(n) {
  return 'Q' + n.toLocaleString('es-GT', { minimumFractionDigits: 2 });
}

function rarityColor(r) {
  if (r === 'Ultra rara') return { bg: 'var(--coral)', c: 'var(--ink)' };
  if (r === 'Rara') return { bg: 'var(--lilac-500)', c: 'var(--paper)' };
  return { bg: 'var(--sage-300)', c: 'var(--ink)' };
}

/* =============== RENDERIZADO DE FILTROS Y PRODUCTOS =============== */
function renderChips() {
  const el = document.getElementById('chips');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(c =>
    `<button class="chip ${c === activeCat ? 'active' : ''}" data-cat="${c}">${c}</button>`
  ).join('');
  
  el.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCat = btn.dataset.cat;
      visibleCount = 4;
      renderChips();
      renderGrid();
    });
  });
}

function renderGrid() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const filtered = getProducts().filter(p => activeCat === 'Todas' || p.cat === activeCat);
  const shown = filtered.slice(0, visibleCount);

  grid.innerHTML = shown.map((p) => {
    const rc = rarityColor(p.rarity);
    const thumbs = p.images.map((im, i) => `<button class="thumb-dot ${i === 0 ? 'active' : ''}" data-idx="${i}" aria-label="Ver foto ${i + 1}"></button>`).join('');
    const frames = p.images.map((im, i) => {
      const imgSrc = typeof im === 'string' ? im : (im && im.src ? im.src : null);
      const content = imgSrc 
        ? `<img src="${imgSrc}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">`
        : leafSVG(im.accent || '#3A5A40');
      return `<div class="frame" data-idx="${i}" style="background:${im.bg || 'var(--sage-100)'};opacity:${i === 0 ? 1 : 0};position:absolute;inset:0;overflow:hidden;">${content}</div>`;
    }).join('');
    
    return `
    <div class="card" data-id="${p.id}">
      <div class="card-media">
        ${frames}
        <span class="tag-num mono">ESP. ${String(p.id).padStart(3, '0')}</span>
        <span class="tag-rarity" style="background:${rc.bg};color:${rc.c}">${p.rarity}</span>
        <div class="thumbs">${thumbs}</div>
      </div>
      <div class="card-body">
        <span class="latin">${p.latin}</span>
        <h3 class="name">${p.name}</h3>
        <div class="stock-row"><span class="dot-live" style="background:var(--sage-500)"></span>${p.stock}</div>
        <div class="card-foot">
          <span class="price">${p.old ? `<span class="old">${money(p.old)}</span>` : ''}${money(p.price)}</span>
          <button class="add-btn" aria-label="Agregar al carrito">+</button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Animación de entrada
  requestAnimationFrame(() => {
    grid.querySelectorAll('.card').forEach((c, i) => {
      setTimeout(() => c.classList.add('in'), i * 70);
    });
  });

  // Interacción con miniaturas y botón agregar
  grid.querySelectorAll('.card').forEach(card => {
    const id = Number(card.dataset.id);
    const dots = card.querySelectorAll('.thumb-dot');
    const frames = card.querySelectorAll('.frame');

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = dot.dataset.idx;
        dots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        frames.forEach(f => { f.style.opacity = f.dataset.idx === idx ? 1 : 0; });
      });
    });

    const mediaEl = card.querySelector('.card-media');
    const nameEl = card.querySelector('.name');

    [mediaEl, nameEl].forEach(el => {
      if (!el) return;
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('thumb-dot')) return;
        openProductModal(id);
      });
    });

    const addBtn = card.querySelector('.add-btn');
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(id);
      openCart();
    });
  });

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = shown.length < filtered.length ? 'inline-flex' : 'none';
  }
}

/* =============== MODAL DE DETALLE DE PRODUCTO =============== */
function openProductModal(id) {
  const p = getProducts().find(pp => pp.id === id);
  if (!p) return;

  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('productModal');
  const modalBody = document.getElementById('modalBody');

  if (!overlay || !modal || !modalBody) return;

  const rc = rarityColor(p.rarity);
  
  const thumbsHTML = p.images.map((im, i) => {
    const imgSrc = typeof im === 'string' ? im : (im && im.src ? im.src : null);
    const content = imgSrc ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` : leafSVG(im.accent || '#3A5A40');
    return `<div class="modal-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}" style="background:${im.bg || '#EFF5E1'};overflow:hidden;">${content}</div>`;
  }).join('');

  const framesHTML = p.images.map((im, i) => {
    const imgSrc = typeof im === 'string' ? im : (im && im.src ? im.src : null);
    const content = imgSrc ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">` : leafSVG(im.accent || '#3A5A40');
    return `<div class="modal-frame" data-idx="${i}" style="background:${im.bg || '#EFF5E1'};opacity:${i === 0 ? 1 : 0};position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;">${content}</div>`;
  }).join('');

  modalBody.innerHTML = `
    <div class="modal-grid">
      <div class="modal-gallery">
        <div class="modal-main-frame">
          ${framesHTML}
        </div>
        <div class="modal-thumbs">
          ${thumbsHTML}
        </div>
      </div>
      <div class="modal-info">
        <div style="display:flex;gap:.5rem;align-items:center;">
          <span class="tag-num mono" style="position:static">ESP. ${String(p.id).padStart(3, '0')}</span>
          <span class="tag-rarity" style="position:static;background:${rc.bg};color:${rc.c}">${p.rarity}</span>
        </div>
        <span class="latin">${p.latin}</span>
        <h2 class="name">${p.name}</h2>
        <div class="price" style="font-size:1.4rem;margin:.4rem 0">${money(p.price)}</div>
        <div class="stock-row"><span class="dot-live" style="background:var(--sage-500)"></span>${p.stock}</div>
        <p class="desc">${p.description}</p>
        <div style="margin-top:auto;display:flex;gap:.8rem;flex-wrap:wrap;">
          <button class="btn btn-block" id="modalAddToCartBtn">Agregar al carrito y apartar</button>
        </div>
      </div>
    </div>
  `;

  const thumbs = modalBody.querySelectorAll('.modal-thumb');
  const frames = modalBody.querySelectorAll('.modal-frame');
  thumbs.forEach(t => {
    t.addEventListener('click', () => {
      const idx = t.dataset.idx;
      thumbs.forEach(td => td.classList.remove('active'));
      t.classList.add('active');
      frames.forEach(f => { f.style.opacity = f.dataset.idx === idx ? '1' : '0'; });
    });
  });

  document.getElementById('modalAddToCartBtn')?.addEventListener('click', () => {
    addToCart(p.id);
    closeProductModal();
    openCart();
  });

  overlay.classList.add('show');
  modal.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeProductModal() {
  document.getElementById('modalOverlay')?.classList.remove('show');
  document.getElementById('productModal')?.classList.remove('open');
  document.body.classList.remove('modal-open');
}

function initModalEvents() {
  document.getElementById('modalClose')?.addEventListener('click', closeProductModal);
  document.getElementById('modalOverlay')?.addEventListener('click', closeProductModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductModal();
  });
}

/* =============== MARQUEE =============== */
function initMarquee() {
  const marqueeItems = [
    'Envíos a todo el país',
    'Métodos de pago',
    'Variedad mensual',
    'Plantas de calidad'
  ];
  const track = document.getElementById('marqueeTrack');
  if (track) {
    track.innerHTML = marqueeItems.concat(marqueeItems, marqueeItems).map(t => `<span>${t}</span>`).join('');
  }
}

/* =============== HEADER SHRINK =============== */
function initHeaderShrink() {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('shrink', window.scrollY > 40);
  });
}

/* =============== MOBILE NAV =============== */
function initMobileNav() {
  const burger = document.getElementById('burgerBtn');
  const navLinks = document.getElementById('navLinks');
  const navClose = document.getElementById('navClose');
  if (!burger || !navLinks) return;

  burger.addEventListener('click', () => navLinks.classList.toggle('open'));
  if (navClose) {
    navClose.addEventListener('click', () => navLinks.classList.remove('open'));
  }
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
}

/* =============== CARRITO DE COMPRAS =============== */
let cart = [];

function cartCount() { 
  return cart.reduce((s, i) => s + i.qty, 0); 
}

function cartTotal() { 
  return cart.reduce((s, i) => { 
    const p = getProducts().find(pp => pp.id === i.id); 
    return s + (p ? p.price : 0) * i.qty; 
  }, 0); 
}

function addToCart(id) {
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }
  renderCart(true);
}

function changeQty(id, delta) {
  const it = cart.find(i => i.id === id);
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  renderCart(false);
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart(false);
}

function renderCart(bump) {
  const badge = document.getElementById('cartCount');
  const count = cartCount();

  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('show', count > 0);
    if (bump) { 
      badge.classList.remove('bump'); 
      void badge.offsetWidth; 
      badge.classList.add('bump'); 
    }
  }

  const itemsEl = document.getElementById('cartItems');
  if (itemsEl) {
    if (cart.length === 0) {
      itemsEl.innerHTML = '<p class="cart-empty">Tu carrito está vacío.<br>Elegí un espécimen del catálogo.</p>';
    } else {
      itemsEl.innerHTML = cart.map(i => {
        const p = getProducts().find(pp => pp.id === i.id);
        const im = p ? p.images[0] : { bg: 'var(--sage-100)' };
        return `<div class="cart-item" data-id="${p ? p.id : i.id}">
          <div class="swatch" style="background:${im.bg}"></div>
          <div class="cart-item-info">
            <span class="name">${p ? p.name : 'Espécimen'}</span>
            <span class="mono" style="font-size:.72rem;color:var(--ink-45)">${money(p ? p.price : 0)} c/u</span>
            <div class="cart-item-row">
              <div class="qty-stepper">
                <button data-act="minus" aria-label="Quitar uno">−</button>
                <span class="mono">${i.qty}</span>
                <button data-act="plus" aria-label="Agregar uno">+</button>
              </div>
              <button class="remove-btn" data-act="remove">Quitar</button>
            </div>
          </div>
        </div>`;
      }).join('');

      itemsEl.querySelectorAll('.cart-item').forEach(row => {
        const id = Number(row.dataset.id);
        row.querySelector('[data-act="plus"]').addEventListener('click', () => changeQty(id, 1));
        row.querySelector('[data-act="minus"]').addEventListener('click', () => changeQty(id, -1));
        row.querySelector('[data-act="remove"]').addEventListener('click', () => removeFromCart(id));
      });
    }
  }

  const subtotalEl = document.getElementById('cartSubtotal');
  if (subtotalEl) {
    subtotalEl.textContent = money(cartTotal());
  }

  const waBtn = document.getElementById('cartCheckout');
  const waNum = getWhatsAppNumber();
  if (waBtn) {
    if (cart.length) {
      const lines = cart.map(i => {
        const p = getProducts().find(pp => pp.id === i.id);
        return `${i.qty}x ${p ? p.name : 'Espécimen'} (${money(p ? p.price : 0)})`;
      }).join('\n');
      const msg = `Hola, quiero apartar estos especímenes:\n${lines}\n\nTotal: ${money(cartTotal())}`;
      waBtn.href = `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
    } else {
      waBtn.href = `https://wa.me/${waNum}`;
    }
  }
}

function openCart() {
  document.getElementById('cartPanel')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('show');
  document.body.classList.add('cart-open');
}

function closeCart() {
  document.getElementById('cartPanel')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('show');
  document.body.classList.remove('cart-open');
}

function initCartEvents() {
  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
}

/* =============== SCROLLSPY Y NAVEGACIÓN =============== */
function initScrollSpy() {
  const spySections = ['catalogo', 'coleccion', 'comunidad', 'faq', 'contacto'];
  const navLinks = document.getElementById('navLinks');
  if (!navLinks) return;

  const navLinkEls = Array.from(navLinks.querySelectorAll('a'));
  const navIndicator = document.getElementById('navIndicator');

  function setActiveLink(id) {
    navLinkEls.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    moveIndicator();
  }

  function moveIndicator() {
    const activeLink = navLinks.querySelector('a.active');
    if (!activeLink || !navIndicator || window.innerWidth <= 720) {
      if (navIndicator) navIndicator.style.opacity = '0';
      return;
    }
    const linkRect = activeLink.getBoundingClientRect();
    const navRect = navLinks.getBoundingClientRect();
    navIndicator.style.left = (linkRect.left - navRect.left) + 'px';
    navIndicator.style.width = linkRect.width + 'px';
    navIndicator.style.opacity = '1';
  }

  navLinkEls.forEach(a => {
    a.addEventListener('click', () => setActiveLink(a.getAttribute('href').slice(1)));
  });

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActiveLink(entry.target.id);
    });
  }, { rootMargin: '-42% 0px -50% 0px', threshold: 0 });

  spySections.forEach(id => {
    const el = document.getElementById(id);
    if (el) spyObserver.observe(el);
  });

  window.addEventListener('resize', moveIndicator);
  window.addEventListener('load', moveIndicator);
  setActiveLink('catalogo');
}

/* =============== SCROLL REVEAL =============== */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('in');
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* =============== ADMINISTRACIÓN DEL PANEL (REDISEÑADO) =============== */

function parseStockQty(p) {
  if (p.stockQty !== undefined && p.stockQty !== null) return Number(p.stockQty);
  const match = String(p.stock).match(/\d+/);
  if (match) return parseInt(match[0], 10);
  if (String(p.stock).toLowerCase().includes('última') || String(p.stock).toLowerCase().includes('ultima')) return 1;
  if (String(p.stock).toLowerCase().includes('agotado')) return 0;
  return 5;
}

function updateAdminKPIs() {
  const prods = getProducts();
  const totalProds = prods.length;
  
  let totalStock = 0;
  let alertCount = 0;
  let totalValue = 0;

  prods.forEach(p => {
    const qty = parseStockQty(p);
    totalStock += qty;
    if (qty <= 2) alertCount++;
    totalValue += (p.price * qty);
  });

  const kpiTotalEl = document.getElementById('kpiTotalProds');
  const kpiStockEl = document.getElementById('kpiTotalStock');
  const kpiAlertsEl = document.getElementById('kpiStockAlerts');
  const kpiAlertsSub = document.getElementById('kpiStockAlertsSub');
  const kpiValueEl = document.getElementById('kpiTotalValue');

  if (kpiTotalEl) kpiTotalEl.textContent = totalProds;
  if (kpiStockEl) kpiStockEl.textContent = totalStock;
  if (kpiAlertsEl) kpiAlertsEl.textContent = totalStock;
  if (kpiAlertsSub) kpiAlertsSub.textContent = `${prods.filter(p => parseStockQty(p) === 0).length} agotados / ${prods.filter(p => parseStockQty(p) > 0 && parseStockQty(p) <= 2).length} bajos`;
  if (kpiValueEl) kpiValueEl.textContent = money(totalValue);
}

function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;

  const searchTerm = (document.getElementById('adminSearchInput')?.value || '').toLowerCase().trim();
  const selectedCat = document.getElementById('adminCatSelect')?.value || 'Todas';

  let prods = getProducts();

  if (selectedCat !== 'Todas') {
    prods = prods.filter(p => p.cat === selectedCat);
  }

  if (searchTerm) {
    prods = prods.filter(p => 
      p.name.toLowerCase().includes(searchTerm) || 
      p.latin.toLowerCase().includes(searchTerm)
    );
  }

  updateAdminKPIs();

  if (prods.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#64748B">No se encontraron productos en el inventario.</td></tr>`;
    return;
  }

  tbody.innerHTML = prods.map(p => {
    const qty = parseStockQty(p);
    const im = p.images ? p.images[0] : null;
    const imgSrc = typeof im === 'string' ? im : (im && im.src ? im.src : null);
    const thumbContent = imgSrc 
      ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">` 
      : leafSVG(im ? im.accent : '#3A5A40');
    
    return `
      <tr data-id="${p.id}">
        <td>
          <div class="tbl-prod-info">
            <div class="tbl-prod-thumb" style="background:${(im && im.bg) || '#EFF5E1'}">${thumbContent}</div>
            <div>
              <div class="tbl-prod-title">${p.name}</div>
              <div class="tbl-prod-sub">${p.latin}</div>
            </div>
          </div>
        </td>
        <td><span class="admin-cat-pill">${p.cat}</span></td>
        <td>
          <span class="tbl-price-main">${money(p.price)}</span>
          ${p.old ? `<span class="tbl-price-old">${money(p.old)}</span>` : ''}
        </td>
        <td style="text-align:center">
          <div class="tbl-qty-stepper">
            <button type="button" class="btn-qty-step" data-act="minus" aria-label="Disminuir stock">−</button>
            <span style="font-weight:700;width:1.5rem;display:inline-block">${qty}</span>
            <button type="button" class="btn-qty-step" data-act="plus" aria-label="Aumentar stock">+</button>
          </div>
        </td>
        <td>
          <span class="admin-status-pill ${qty > 0 ? 'status-in-stock' : 'status-out-stock'}">
            ${qty > 0 ? `En Stock (${qty})` : 'Agotado (0)'}
          </span>
        </td>
        <td style="text-align:right">
          <button type="button" class="tbl-action-btn btn-edit-item" title="Editar producto">✏️</button>
          <button type="button" class="tbl-action-btn btn-delete-item" title="Eliminar producto">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');

  // Row Action Listeners
  tbody.querySelectorAll('tr').forEach(row => {
    const id = Number(row.dataset.id);

    // Stepper buttons
    row.querySelector('[data-act="minus"]')?.addEventListener('click', () => changeProductStock(id, -1));
    row.querySelector('[data-act="plus"]')?.addEventListener('click', () => changeProductStock(id, 1));

    // Edit button
    row.querySelector('.btn-edit-item')?.addEventListener('click', () => openProdEditModal(id));

    // Delete button
    row.querySelector('.btn-delete-item')?.addEventListener('click', () => {
      if (confirm('¿Estás seguro de eliminar esta planta del catálogo?')) {
        deleteProduct(id);
        renderAdminTable();
        renderGrid();
        renderChips();
      }
    });
  });
}

function changeProductStock(id, delta) {
  const p = getProducts().find(pp => pp.id === id);
  if (!p) return;
  const currentQty = parseStockQty(p);
  const newQty = Math.max(0, currentQty + delta);
  const newStockText = newQty === 0 ? 'Agotado' : (newQty === 1 ? 'Última unidad' : `${newQty} disponibles`);

  updateProductOverride(id, { stockQty: newQty, stock: newStockText });
  renderAdminTable();
  renderGrid();
}

function updateProductOverride(id, fields) {
  const adminData = getAdminData();
  adminData.productOverrides = adminData.productOverrides || {};
  adminData.productOverrides[id] = { ...(adminData.productOverrides[id] || {}), ...fields };
  saveAdminData(adminData);
}

function deleteProduct(id) {
  const adminData = getAdminData();
  if (adminData.customProducts) {
    adminData.customProducts = adminData.customProducts.filter(p => p.id !== id);
  }
  adminData.productOverrides = adminData.productOverrides || {};
  adminData.productOverrides[id] = { deleted: true };
  saveAdminData(adminData);
}

function renderAdminSettings() {
  const waInput = document.getElementById('adminWAInput');
  if (waInput) waInput.value = getWhatsAppNumber();
}

// Submodal Formulario y Carga de Fotos
let currentPhotoSources = [null, null, null];

function setupPhotoInputListeners() {
  [1, 2, 3].forEach(num => {
    const fileEl = document.getElementById(`fileInput${num}`);
    const urlEl = document.getElementById(`urlInput${num}`);
    const prevEl = document.getElementById(`prevBox${num}`);

    if (fileEl) {
      fileEl.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            currentPhotoSources[num - 1] = evt.target.result;
            if (urlEl) urlEl.value = '';
            if (prevEl) prevEl.innerHTML = `<img src="${evt.target.result}">`;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (urlEl) {
      urlEl.addEventListener('input', () => {
        const val = urlEl.value.trim();
        if (val) {
          currentPhotoSources[num - 1] = val;
          if (prevEl) prevEl.innerHTML = `<img src="${val}">`;
        } else {
          currentPhotoSources[num - 1] = null;
          if (prevEl) prevEl.innerHTML = `<span class="photo-placeholder-icon">📷</span>`;
        }
      });
    }
  });
}

function openProdEditModal(id = null) {
  const modalOverlay = document.getElementById('adminProdModalOverlay');
  const modal = document.getElementById('adminProdModal');
  const title = document.getElementById('adminProdModalTitle');
  const form = document.getElementById('adminProdForm');

  if (!modalOverlay || !modal) return;

  currentPhotoSources = [null, null, null];

  if (id) {
    const p = getProducts().find(pp => pp.id === id);
    if (!p) return;
    title.textContent = 'Editar Producto';
    document.getElementById('editProdId').value = p.id;
    document.getElementById('editProdName').value = p.name;
    document.getElementById('editProdLatin').value = p.latin;
    document.getElementById('editProdCat').value = p.cat;
    document.getElementById('editProdRarity').value = p.rarity;
    document.getElementById('editProdPrice').value = p.price;
    document.getElementById('editProdOld').value = p.old || '';
    const qty = parseStockQty(p);
    document.getElementById('editProdStockQty').value = qty;
    document.getElementById('editProdStockText').value = p.stock;
    document.getElementById('editProdDesc').value = p.description || '';

    // Cargar fotos existentes
    [1, 2, 3].forEach((num, i) => {
      const im = p.images ? p.images[i] : null;
      const imgSrc = typeof im === 'string' ? im : (im && im.src ? im.src : null);
      const urlEl = document.getElementById(`urlInput${num}`);
      const prevEl = document.getElementById(`prevBox${num}`);

      if (imgSrc) {
        currentPhotoSources[i] = imgSrc;
        if (urlEl) urlEl.value = imgSrc.startsWith('data:') ? '' : imgSrc;
        if (prevEl) prevEl.innerHTML = `<img src="${imgSrc}">`;
      } else {
        if (urlEl) urlEl.value = '';
        if (prevEl) prevEl.innerHTML = `<span class="photo-placeholder-icon">📷</span>`;
      }
    });
  } else {
    title.textContent = 'Añadir Nuevo Producto';
    form.reset();
    document.getElementById('editProdId').value = '';
    [1, 2, 3].forEach((num) => {
      const urlEl = document.getElementById(`urlInput${num}`);
      const prevEl = document.getElementById(`prevBox${num}`);
      if (urlEl) urlEl.value = '';
      if (prevEl) prevEl.innerHTML = `<span class="photo-placeholder-icon">📷</span>`;
    });
  }

  modalOverlay.classList.add('show');
  modal.classList.add('open');
}

function closeProdEditModal() {
  document.getElementById('adminProdModalOverlay')?.classList.remove('show');
  document.getElementById('adminProdModal')?.classList.remove('open');
}

function initAdminEvents() {
  setupPhotoInputListeners();

  const loginOverlay = document.getElementById('adminLoginOverlay');
  const loginModal = document.getElementById('adminLoginModal');
  const loginClose = document.getElementById('adminLoginClose');
  const loginForm = document.getElementById('adminLoginForm');
  const passwordInput = document.getElementById('adminPasswordInput');
  const errorMsg = document.getElementById('adminLoginError');

  const panelOverlay = document.getElementById('adminPanelOverlay');
  const panelModal = document.getElementById('adminPanelModal');
  const panelClose = document.getElementById('adminPanelClose');
  const triggerBtn = document.getElementById('adminTriggerBtn');

  function openLogin() {
    if (passwordInput) passwordInput.value = '';
    if (errorMsg) errorMsg.style.display = 'none';
    loginOverlay?.classList.add('show');
    loginModal?.classList.add('open');
    document.body.classList.add('modal-open');
    setTimeout(() => passwordInput?.focus(), 200);
  }

  function closeLogin() {
    loginOverlay?.classList.remove('show');
    loginModal?.classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  function openAdminPanel() {
    closeLogin();
    renderAdminTable();
    renderAdminSettings();
    panelOverlay?.classList.add('show');
    panelModal?.classList.add('open');
    document.body.classList.add('modal-open');
  }

  function closeAdminPanel() {
    panelOverlay?.classList.remove('show');
    panelModal?.classList.remove('open');
    document.body.classList.remove('modal-open');
    if (passwordInput) passwordInput.value = '';
  }

  triggerBtn?.addEventListener('click', openLogin);
  loginClose?.addEventListener('click', closeLogin);
  loginOverlay?.addEventListener('click', closeLogin);

  panelClose?.addEventListener('click', closeAdminPanel);
  panelOverlay?.addEventListener('click', closeAdminPanel);

  // Acceso directo por URL guategreen.com/#admin
  function checkAdminHash() {
    if (window.location.hash === '#admin') {
      openLogin();
    }
  }
  window.addEventListener('hashchange', checkAdminHash);
  setTimeout(checkAdminHash, 300);

  // Acceso secreto por Triple-Tap en el logo de Guategreen
  let logoTapCount = 0;
  let logoTapTimer = null;
  document.querySelectorAll('.logo-brand').forEach(logoEl => {
    logoEl.addEventListener('click', (e) => {
      logoTapCount++;
      clearTimeout(logoTapTimer);
      logoTapTimer = setTimeout(() => { logoTapCount = 0; }, 800);
      if (logoTapCount >= 3) {
        e.preventDefault();
        logoTapCount = 0;
        openLogin();
      }
    });
  });

  // Atajo de teclado Ctrl+Shift+A o Cmd+Shift+A
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      openLogin();
    }
  });

  // Envío del formulario de Login
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = getAdminData();
    if (passwordInput?.value === data.password) {
      openAdminPanel();
    } else {
      if (errorMsg) errorMsg.style.display = 'block';
    }
  });

  // Switcher de Pestañas
  const pillBtns = document.querySelectorAll('.admin-pill-btn');
  pillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pillBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab-page').forEach(tp => tp.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab)?.classList.add('active');
    });
  });

  // Eventos de Filtro y Búsqueda
  document.getElementById('adminSearchInput')?.addEventListener('input', renderAdminTable);
  document.getElementById('adminCatSelect')?.addEventListener('change', renderAdminTable);

  // Apertura y Cierre de Sub-modal
  document.getElementById('adminOpenAddModalBtn')?.addEventListener('click', () => openProdEditModal());
  document.getElementById('adminProdModalClose')?.addEventListener('click', closeProdEditModal);
  document.getElementById('adminProdModalOverlay')?.addEventListener('click', closeProdEditModal);

  // Guardado de Producto (Crear / Editar)
  document.getElementById('adminProdForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('editProdId').value;
    const name = document.getElementById('editProdName').value.trim();
    const latin = document.getElementById('editProdLatin').value.trim();
    const cat = document.getElementById('editProdCat').value;
    const rarity = document.getElementById('editProdRarity').value;
    const price = Number(document.getElementById('editProdPrice').value);
    const oldVal = document.getElementById('editProdOld').value;
    const oldPrice = oldVal ? Number(oldVal) : null;
    const stockQty = Number(document.getElementById('editProdStockQty').value);
    const stockText = document.getElementById('editProdStockText').value.trim();
    const description = document.getElementById('editProdDesc').value.trim();

    const finalImages = [1, 2, 3].map((num, i) => {
      const src = currentPhotoSources[i] || document.getElementById(`urlInput${num}`)?.value.trim();
      return src 
        ? { src, bg: 'var(--sage-100)', accent: '#3A5A40' } 
        : { bg: i === 0 ? 'var(--sage-100)' : (i === 1 ? 'var(--blush-100)' : 'var(--lilac-100)'), accent: '#3A5A40' };
    });

    if (editId) {
      updateProductOverride(Number(editId), {
        name, latin, cat, rarity, price, old: oldPrice, stockQty, stock: stockText, description, images: finalImages
      });
      alert('¡Producto actualizado exitosamente con sus fotografías!');
    } else {
      const adminData = getAdminData();
      const newProduct = {
        id: Date.now(),
        cat,
        name,
        latin,
        price,
        old: oldPrice,
        rarity,
        panel: 'sage',
        stockQty,
        stock: stockText,
        description,
        images: finalImages
      };
      adminData.customProducts = adminData.customProducts || [];
      adminData.customProducts.push(newProduct);
      saveAdminData(adminData);
      alert('¡Planta añadida exitosamente al catálogo con sus fotografías!');
    }

    closeProdEditModal();
    renderAdminTable();
    renderGrid();
    renderChips();
  });

  // Ajustes: WhatsApp
  document.getElementById('adminWASaveBtn')?.addEventListener('click', () => {
    const val = document.getElementById('adminWAInput').value.trim();
    if (!val) return;
    const adminData = getAdminData();
    adminData.whatsappNumber = val;
    saveAdminData(adminData);
    alert('Número de WhatsApp actualizado correctamente.');
    renderCart(false);
  });

  document.getElementById('adminWATestBtn')?.addEventListener('click', () => {
    const val = document.getElementById('adminWAInput').value.trim() || getWhatsAppNumber();
    window.open(`https://wa.me/${val}?text=${encodeURIComponent('Prueba de conexión con Guategreen')}`, '_blank');
  });

  // Ajustes: Cambiar clave
  document.getElementById('adminPassSaveBtn')?.addEventListener('click', () => {
    const val = document.getElementById('adminNewPassInput').value.trim();
    if (!val || val.length < 4) {
      alert('La nueva clave debe tener al menos 4 caracteres.');
      return;
    }
    const adminData = getAdminData();
    adminData.password = val;
    saveAdminData(adminData);
    document.getElementById('adminNewPassInput').value = '';
    alert('¡Contraseña del panel actualizada correctamente!');
  });
}

/* =============== INICIALIZACIÓN GENERAL =============== */
document.addEventListener('DOMContentLoaded', () => {
  renderChips();
  renderGrid();
  initMarquee();
  initHeaderShrink();
  initMobileNav();
  initCartEvents();
  initModalEvents();
  initAdminEvents();
  renderCart(false);
  initScrollSpy();
  initScrollReveal();

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      visibleCount += 4;
      renderGrid();
    });
  }
});
