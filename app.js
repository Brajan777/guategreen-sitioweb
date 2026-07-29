/* =============== CONFIGURACIÓN Y DATOS DE PRODUCTOS =============== */
const WHATSAPP_NUMBER = '50252554758';

/* Cada producto tiene un arreglo "images": son placeholders ilustrados (SVG + color de fondo).
   Reemplaza "bg" por tu foto real usando <img> en renderMedia(), o agrega src:'https://tu-imagen.jpg' */
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

  const filtered = PRODUCTS.filter(p => activeCat === 'Todas' || p.cat === activeCat);
  const shown = filtered.slice(0, visibleCount);

  grid.innerHTML = shown.map((p) => {
    const rc = rarityColor(p.rarity);
    const thumbs = p.images.map((im, i) => `<button class="thumb-dot ${i === 0 ? 'active' : ''}" data-idx="${i}" aria-label="Ver foto ${i + 1}"></button>`).join('');
    const frames = p.images.map((im, i) => `<div class="frame" data-idx="${i}" style="background:${im.bg};opacity:${i === 0 ? 1 : 0};position:absolute;inset:0;">${leafSVG(im.accent)}</div>`).join('');
    
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
  const p = PRODUCTS.find(pp => pp.id === id);
  if (!p) return;

  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('productModal');
  const modalBody = document.getElementById('modalBody');

  if (!overlay || !modal || !modalBody) return;

  const rc = rarityColor(p.rarity);
  
  const thumbsHTML = p.images.map((im, i) => 
    `<div class="modal-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}" style="background:${im.bg}">${leafSVG(im.accent)}</div>`
  ).join('');

  const framesHTML = p.images.map((im, i) => 
    `<div class="modal-frame" data-idx="${i}" style="background:${im.bg};opacity:${i === 0 ? 1 : 0};position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">${leafSVG(im.accent)}</div>`
  ).join('');

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
    const p = PRODUCTS.find(pp => pp.id === i.id); 
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
        const p = PRODUCTS.find(pp => pp.id === i.id);
        const im = p.images[0];
        return `<div class="cart-item" data-id="${p.id}">
          <div class="swatch" style="background:${im.bg}"></div>
          <div class="cart-item-info">
            <span class="name">${p.name}</span>
            <span class="mono" style="font-size:.72rem;color:var(--ink-45)">${money(p.price)} c/u</span>
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
  if (waBtn) {
    if (cart.length) {
      const lines = cart.map(i => {
        const p = PRODUCTS.find(pp => pp.id === i.id);
        return `${i.qty}x ${p.name} (${money(p.price)})`;
      }).join('\n');
      const msg = `Hola, quiero apartar estos especímenes:\n${lines}\n\nTotal: ${money(cartTotal())}`;
      waBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    } else {
      waBtn.href = `https://wa.me/${WHATSAPP_NUMBER}`;
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

/* =============== INICIALIZACIÓN GENERAL =============== */
document.addEventListener('DOMContentLoaded', () => {
  renderChips();
  renderGrid();
  initMarquee();
  initHeaderShrink();
  initMobileNav();
  initCartEvents();
  initModalEvents();
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
