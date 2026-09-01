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

/* =============== CONEXIÓN EN LA NUBE SUPABASE (CLOUD DATABASE) =============== */
const DEFAULT_SUPABASE_CONFIG = {
  url: 'https://jdtahguwisfekeifrond.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdGFoZ3V3aXNmZWtlaWZyb25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MzkyNzUsImV4cCI6MjEwMzUxNTI3NX0.Ev48abAqnjkVVH8ZG4uUvhIDyefEoOF3gBQYgP8VwG4'
};
const SUPABASE_STORAGE_KEY = 'guategreen_supabase_config_v1';
let supabaseClient = null;
let isCloudConnected = false;

function getSupabaseConfig() {
  try {
    const saved = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SUPABASE_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Error al leer configuración supabase', e);
  }
  return DEFAULT_SUPABASE_CONFIG;
}

function saveSupabaseConfig(url, key) {
  try {
    localStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify({ url, key }));
  } catch (e) {
    console.error('Error al guardar configuración supabase', e);
  }
}

async function initSupabase(isManualTest = false) {
  const config = getSupabaseConfig();
  const badge = document.getElementById('supabaseStatusBadge');
  const urlInput = document.getElementById('supabaseUrlInput');
  const keyInput = document.getElementById('supabaseKeyInput');

  let cleanUrl = (config.url || '').trim().replace(/\/+$/, '');
  const cleanKey = (config.key || '').trim();

  // Auto-completar .supabase.co si el usuario solo puso el ID del proyecto o https://[id]
  if (cleanUrl) {
    if (cleanUrl.startsWith('https://')) {
      const withoutHttps = cleanUrl.slice(8);
      if (!withoutHttps.includes('.')) {
        cleanUrl = `https://${withoutHttps}.supabase.co`;
      }
    } else if (cleanUrl.startsWith('http://')) {
      const withoutHttp = cleanUrl.slice(7);
      if (!withoutHttp.includes('.')) {
        cleanUrl = `https://${withoutHttp}.supabase.co`;
      }
    } else if (!cleanUrl.includes('.')) {
      cleanUrl = `https://${cleanUrl}.supabase.co`;
    } else {
      cleanUrl = `https://${cleanUrl}`;
    }
  }

  if (urlInput) urlInput.value = cleanUrl;
  if (keyInput) keyInput.value = cleanKey;

  if (!cleanUrl || !cleanKey || !window.supabase) {
    if (badge) {
      badge.textContent = '⚪ Sin configurar (Modo local)';
      badge.style.background = '#E2E8F0';
      badge.style.color = '#475569';
    }
    isCloudConnected = false;
    if (isManualTest) {
      alert('Por favor ingresa tu Project URL y tu Anon Key de Supabase.');
    }
    return false;
  }

  if (cleanUrl.startsWith('https://sb_') || cleanUrl.startsWith('https://eyJ')) {
    if (badge) {
      badge.textContent = '🔴 URL Incorrecta (Pegaste una clave)';
      badge.style.background = '#FEE2E2';
      badge.style.color = '#991B1B';
    }
    isCloudConnected = false;
    if (isManualTest) {
      alert('⚠️ Atención: En el campo "Project URL" pegaste una Clave API en lugar del enlace del proyecto.\n\nLa Project URL debe ser un enlace web como: https://xyz.supabase.co\n\nLa encuentras en Supabase en: Project Settings ➔ API ➔ Project URL.');
    }
    return false;
  }

  try {
    supabaseClient = window.supabase.createClient(cleanUrl, cleanKey);
    
    // Probar consulta rápida a la tabla de productos
    const { data, error } = await supabaseClient.from('gg_products').select('id').limit(1);
    
    if (error) {
      console.warn('Supabase test error:', error);
      const isMissingTable = (error.message || '').toLowerCase().includes('relation') || 
                             (error.message || '').toLowerCase().includes('does not exist') || 
                             error.code === '42P01' || error.code === 'PGRST204' || error.code === 'PGRST205';
      
      if (isMissingTable) {
        if (badge) {
          badge.textContent = '⚠️ Falta crear tablas (Ejecuta el SQL)';
          badge.style.background = '#FEF3C7';
          badge.style.color = '#92400E';
        }
        if (isManualTest) {
          alert('Conexión con Supabase establecida, pero aún no se han creado las tablas gg_products y gg_hero.\n\nPor favor ve al SQL Editor de Supabase, pega el código SQL y presiona el botón RUN.');
        }
      } else {
        if (badge) {
          badge.textContent = '🔴 ' + (error.message || 'Error de conexión');
          badge.style.background = '#FEE2E2';
          badge.style.color = '#991B1B';
        }
        if (isManualTest) {
          alert('Aviso de Supabase: ' + (error.message || JSON.stringify(error)) + '\n\nVerifica que la URL (' + cleanUrl + ') y la clave sean las de tu proyecto activo.');
        }
      }
      isCloudConnected = false;
      return false;
    }

    if (badge) {
      badge.textContent = '🟢 Conectado en la Nube (En vivo)';
      badge.style.background = '#DCFCE7';
      badge.style.color = '#15803D';
    }
    isCloudConnected = true;

    // Descargar datos de la nube si existen
    await syncFromCloud();

    // Suscribirse a cambios en tiempo real
    supabaseClient
      .channel('guategreen_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gg_products' }, () => syncFromCloud())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gg_hero' }, () => syncFromCloud())
      .subscribe();

    if (isManualTest) {
      alert('¡Conexión exitosa con Supabase! Tu tienda ahora está conectada en la nube en tiempo real.');
    }
    return true;

  } catch (err) {
    console.error('Error al inicializar Supabase:', err);
    if (badge) {
      badge.textContent = '🔴 Error de conexión (Verifica URL/Key)';
      badge.style.background = '#FEE2E2';
      badge.style.color = '#991B1B';
    }
    isCloudConnected = false;
    if (isManualTest) {
      alert('Error de conexión con Supabase: ' + err.message + '\nVerifica que la URL y la Anon Key sean correctas.');
    }
    return false;
  }
}

async function syncFromCloud() {
  if (!supabaseClient || !isCloudConnected) return;

  try {
    // 1. Obtener productos de la nube
    const { data: prods, error: pErr } = await supabaseClient
      .from('gg_products')
      .select('*')
      .order('order_num', { ascending: true });

    if (!pErr && prods && prods.length > 0) {
      const adminData = getAdminData();
      adminData.customProducts = prods.map(p => ({
        id: Number(p.id),
        cat: p.cat || 'Otros',
        name: p.name || 'Sin nombre',
        latin: p.latin || '',
        price: Number(p.price) || 0,
        old: p.old_price ? Number(p.old_price) : null,
        rarity: p.rarity || 'Común',
        panel: p.panel || 'sage',
        stockQty: p.stock_qty || 0,
        stock: p.stock || (p.stock_qty > 0 ? `${p.stock_qty} disponibles` : 'Agotado'),
        order: p.order_num || 999,
        description: p.description || '',
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [{ bg: 'var(--sage-100)', accent: '#3A5A40' }],
        deleted: !!p.deleted
      }));
      adminData.productOverrides = {};
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminData));
      renderChips();
      renderGrid();
      renderAdminTable();
    }

    // 2. Obtener Portada / Hero de la nube
    const { data: heroRow, error: hErr } = await supabaseClient
      .from('gg_hero')
      .select('data')
      .eq('id', 'main')
      .single();

    if (!hErr && heroRow && heroRow.data) {
      saveHeroData(heroRow.data);
      renderHero();
      renderAdminHero();
    }
  } catch (err) {
    console.error('Error sincronizando de Supabase:', err);
  }
}

async function syncProductToCloud(product) {
  if (!supabaseClient || !isCloudConnected) return;

  try {
    const row = {
      id: product.id,
      cat: product.cat,
      name: product.name,
      latin: product.latin,
      price: product.price,
      old_price: product.old || null,
      rarity: product.rarity,
      panel: product.panel || 'sage',
      stock_qty: parseStockQty(product),
      stock: product.stock,
      order_num: product.order || 999,
      description: product.description,
      images: Array.isArray(product.images) ? product.images : [{ bg: 'var(--sage-100)', accent: '#3A5A40' }],
      deleted: !!product.deleted,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient.from('gg_products').upsert(row);
    if (error) {
      console.warn('Aviso al guardar en Supabase:', error);
    }
  } catch (err) {
    console.error('Error guardando producto en Supabase:', err);
  }
}

async function syncHeroToCloud(heroData) {
  if (!supabaseClient || !isCloudConnected) return;

  try {
    const { error } = await supabaseClient.from('gg_hero').upsert({
      id: 'main',
      data: heroData,
      updated_at: new Date().toISOString()
    });
    if (error) {
      console.warn('Aviso al guardar Hero en Supabase:', error);
    }
  } catch (err) {
    console.error('Error guardando hero en Supabase:', err);
  }
}

async function uploadAllCurrentToCloud() {
  if (!supabaseClient || !isCloudConnected) {
    alert('Primero guarda la URL y la Key de tu proyecto de Supabase y asegúrate de que esté conectado.');
    return;
  }

  const prods = getProducts();
  const hero = getHeroData();

  try {
    const rows = prods.map(p => ({
      id: p.id,
      cat: p.cat,
      name: p.name,
      latin: p.latin,
      price: p.price,
      old_price: p.old || null,
      rarity: p.rarity,
      panel: p.panel || 'sage',
      stock_qty: parseStockQty(p),
      stock: p.stock,
      order_num: p.order || 999,
      description: p.description,
      images: Array.isArray(p.images) ? p.images : [{ bg: 'var(--sage-100)', accent: '#3A5A40' }],
      deleted: !!p.deleted,
      updated_at: new Date().toISOString()
    }));

    const { error: pErr } = await supabaseClient.from('gg_products').upsert(rows);
    const { error: hErr } = await supabaseClient.from('gg_hero').upsert({
      id: 'main',
      data: hero,
      updated_at: new Date().toISOString()
    });

    if (pErr || hErr) {
      alert('Aviso de Supabase: ' + (pErr?.message || hErr?.message || 'Verifica que ejecutaste el código SQL en el SQL Editor de Supabase'));
    } else {
      alert('¡Catálogo y Portada subidos con éxito a la Nube! Ahora cualquier cambio se actualizará en vivo en todos los celulares y computadoras del mundo.');
    }
  } catch (err) {
    console.error('Error subiendo datos a Supabase:', err);
    alert('Error al sincronizar con la nube: ' + err.message);
  }
}

/* =============== COMPRESOR Y OPTIMIZADOR DE IMÁGENES =============== */
function compressImageFile(file, maxWidth = 800, quality = 0.72) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function saveAdminData(data) {
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Error al guardar admin data', e);
    alert('Aviso: El almacenamiento del navegador está lleno. Intenta usar imágenes con menor peso o rutas URL directas.');
    return false;
  }
}

/* =============== GESTIÓN DE PORTADA / HERO =============== */
const HERO_STORAGE_KEY = 'guategreen_hero_data_v1';
const DEFAULT_HERO_DATA = {
  eyebrow: "Especies raras, variedad de plantas exóticas.",
  title: "Plantas Exóticas y de Colección en Guatemala",
  desc: "Priorizamos la calidad sobre la cantidad. Descubre nuestra selección exclusiva de Araceae (Monsteras, Philodendrons, Alocasias) con origen certificado para verdaderos coleccionistas.",
  plantName: "Monstera Thai Constellation",
  plantPrice: "Q1,450.00",
  plantStatus: "DISPONIBLE HOY",
  photoSrc: null
};

function getHeroData() {
  try {
    const saved = localStorage.getItem(HERO_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_HERO_DATA, ...JSON.parse(saved) };
    }
  } catch(e) {
    console.error('Error al leer hero data', e);
  }
  return DEFAULT_HERO_DATA;
}

function saveHeroData(data) {
  try {
    localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Error al guardar hero data', e);
    alert('Aviso: El almacenamiento del navegador está lleno. Intenta usar una imagen con menor resolución o una URL directa.');
    return false;
  }
}

function renderHero() {
  const data = getHeroData();
  
  const eyebrowEl = document.getElementById('heroEyebrow');
  const titleEl = document.getElementById('heroTitle');
  const descEl = document.getElementById('heroDesc');
  const visualPanel = document.getElementById('heroVisualPanel');
  const plantNameEl = document.getElementById('heroPlantName');
  const plantPriceEl = document.getElementById('heroPlantPrice');
  const plantStatusEl = document.getElementById('heroTagStatus');

  if (eyebrowEl) eyebrowEl.textContent = data.eyebrow;
  if (titleEl) titleEl.textContent = data.title;
  if (descEl) descEl.textContent = data.desc;
  if (plantNameEl) plantNameEl.textContent = data.plantName;
  if (plantPriceEl) plantPriceEl.textContent = data.plantPrice;
  if (plantStatusEl) plantStatusEl.textContent = data.plantStatus;

  if (visualPanel) {
    if (data.photoSrc) {
      visualPanel.innerHTML = `<img src="${data.photoSrc}" alt="${data.plantName}">`;
    } else {
      visualPanel.innerHTML = `
        <svg viewBox="0 0 200 200" fill="none">
          <path d="M100 190C100 190 40 160 40 100C40 55 70 20 100 15C130 20 160 55 160 100C160 160 100 190 100 190Z" fill="#90A955" stroke="#241D16" stroke-width="3"/>
          <path d="M100 15V190" stroke="#241D16" stroke-width="2" stroke-dasharray="4 5"/>
          <path d="M100 40C90 60 70 70 55 75M100 70C88 85 68 92 52 95M100 100C86 112 66 118 50 120M100 130C88 140 70 146 56 148" stroke="#3A5A40" stroke-width="2" stroke-linecap="round"/>
          <path d="M100 40C110 60 130 70 145 75M100 70C112 85 132 92 148 95M100 100C114 112 134 118 150 120M100 130C112 140 130 146 144 148" stroke="#3A5A40" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
    }
  }
}

function getProducts() {
  const adminData = getAdminData();
  const overrides = adminData.productOverrides || {};
  const customProds = adminData.customProducts || [];

  const itemsMap = new Map();

  // 1. Cargar productos base oficiales por ID
  PRODUCTS.forEach((p, idx) => {
    itemsMap.set(Number(p.id), { ...p, order: p.order || (idx + 1) });
  });

  // 2. Cargar productos personalizados / sincronizados de Supabase por ID
  customProds.forEach((p, idx) => {
    const pId = Number(p.id);
    const existing = itemsMap.get(pId) || {};
    itemsMap.set(pId, {
      ...existing,
      ...p,
      id: pId,
      order: (p.order !== undefined && p.order !== null) ? Number(p.order) : (existing.order || (PRODUCTS.length + idx + 1))
    });
  });

  // 3. Aplicar overrides locales específicos por ID
  Object.keys(overrides).forEach(idStr => {
    const pId = Number(idStr);
    if (itemsMap.has(pId)) {
      itemsMap.set(pId, { ...itemsMap.get(pId), ...overrides[idStr] });
    }
  });

  const all = Array.from(itemsMap.values()).filter(p => !p.deleted);

  all.sort((a, b) => {
    const ordA = (a.order !== undefined && a.order !== null && a.order !== '') ? Number(a.order) : 9999;
    const ordB = (b.order !== undefined && b.order !== null && b.order !== '') ? Number(b.order) : 9999;
    if (ordA !== ordB) return ordA - ordB;
    return Number(a.id) - Number(b.id);
  });

  all.forEach((p, idx) => {
    p.order = idx + 1;
  });

  return all;
}

function cleanDuplicateProducts() {
  const adminData = getAdminData();
  const seen = new Set();
  if (adminData.customProducts && adminData.customProducts.length > 0) {
    adminData.customProducts = adminData.customProducts.filter(p => {
      const key = (p.name || '').toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    saveAdminData(adminData);
  }
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
const INITIAL_VISIBLE_COUNT = 16;
let visibleCount = INITIAL_VISIBLE_COUNT;

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
      visibleCount = INITIAL_VISIBLE_COUNT;
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
        <div class="thumbs">${thumbs}</div>
      </div>
      <div class="card-body">
        <span class="latin">${p.latin}</span>
        <h3 class="name">${p.name}</h3>
        <div class="stock-row"><span class="dot-live" style="background:var(--sage-500)"></span>${p.stock}</div>
        <div class="rarity-row"><span class="tag-rarity-inline" style="background:${rc.bg};color:${rc.c}">${p.rarity}</span></div>
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
    const remaining = filtered.length - shown.length;
    if (remaining > 0) {
      loadMoreBtn.style.display = 'inline-flex';
      loadMoreBtn.innerHTML = `Ver catálogo completo (+${remaining} plantas más) ↓`;
    } else {
      loadMoreBtn.style.display = 'none';
    }
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
        <span class="latin">${p.latin}</span>
        <h2 class="name">${p.name}</h2>
        <div class="price" style="font-size:1.4rem;margin:.4rem 0">${money(p.price)}</div>
        <div class="stock-row"><span class="dot-live" style="background:var(--sage-500)"></span>${p.stock}</div>
        <div class="rarity-row" style="margin:.3rem 0 .5rem"><span class="tag-rarity-inline" style="background:${rc.bg};color:${rc.c}">${p.rarity}</span></div>
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
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#64748B">No se encontraron productos en el inventario.</td></tr>`;
    return;
  }

  const totalProds = prods.length;

  tbody.innerHTML = prods.map((p, i) => {
    const qty = parseStockQty(p);
    const im = p.images ? p.images[0] : null;
    const imgSrc = typeof im === 'string' ? im : (im && im.src ? im.src : null);
    const thumbContent = imgSrc 
      ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">` 
      : leafSVG(im ? im.accent : '#3A5A40');
    
    const pos = i + 1;

    const orderOptions = Array.from({ length: totalProds }, (_, idx) => {
      const num = idx + 1;
      return `<option value="${num}" ${num === pos ? 'selected' : ''}>#${num}</option>`;
    }).join('');

    return `
      <tr data-id="${p.id}">
        <td style="text-align:center">
          <div class="tbl-order-box">
            <span style="font-size:.72rem;color:#64748B;font-weight:700">Posición</span>
            <button type="button" class="btn-order-move" data-act="move-up" title="Subir posición" ${pos === 1 ? 'disabled style="opacity:0.25;cursor:not-allowed"' : ''}>▲</button>
            <select class="sel-prod-order" data-id="${p.id}" title="Cambiar posición directa en el catálogo">
              ${orderOptions}
            </select>
            <button type="button" class="btn-order-move" data-act="move-down" title="Bajar posición" ${pos === totalProds ? 'disabled style="opacity:0.25;cursor:not-allowed"' : ''}>▼</button>
          </div>
        </td>
        <td>
          <div class="tbl-prod-info">
            <div class="tbl-prod-thumb" style="background:${(im && im.bg) || '#EFF5E1'};position:relative;">
              ${thumbContent}
              <span class="thumb-order-badge">#${pos}</span>
            </div>
            <div>
              <div class="tbl-prod-title">
                <span class="mobile-order-badge">Posición #${pos}</span>
                ${p.name}
              </div>
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

    // Order buttons
    row.querySelector('[data-act="move-up"]')?.addEventListener('click', () => moveProductOrder(id, -1));
    row.querySelector('[data-act="move-down"]')?.addEventListener('click', () => moveProductOrder(id, 1));

    // Direct order dropdown
    row.querySelector('.sel-prod-order')?.addEventListener('change', (e) => {
      setProductPosition(id, Number(e.target.value));
    });

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

function setProductPosition(id, newPosition) {
  const numId = Number(id);
  const prods = getProducts();
  const index = prods.findIndex(pp => Number(pp.id) === numId);
  if (index === -1) return;

  const targetPos = Math.max(1, Math.min(prods.length, Number(newPosition)));
  const targetIndex = targetPos - 1;

  if (index === targetIndex) return;

  // Mover producto a la nueva posición deseada
  const [item] = prods.splice(index, 1);
  prods.splice(targetIndex, 0, item);

  // Reasignar posiciones estrictas 1..N sin duplicados
  const adminData = getAdminData();
  adminData.productOverrides = adminData.productOverrides || {};
  adminData.customProducts = adminData.customProducts || [];

  prods.forEach((p, idx) => {
    const strictOrder = idx + 1;
    p.order = strictOrder;
    adminData.productOverrides[p.id] = { ...(adminData.productOverrides[p.id] || {}), order: strictOrder };
    const customIdx = adminData.customProducts.findIndex(cp => Number(cp.id) === Number(p.id));
    if (customIdx !== -1) {
      adminData.customProducts[customIdx].order = strictOrder;
    }
    syncProductToCloud(p);
  });

  saveAdminData(adminData);
  renderAdminTable();
  renderGrid();
}

function moveProductOrder(id, direction) {
  const numId = Number(id);
  const prods = getProducts();
  const index = prods.findIndex(pp => Number(pp.id) === numId);
  if (index === -1) return;

  const newPosition = (index + 1) + direction;
  setProductPosition(numId, newPosition);
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
  const pId = Number(id);
  const adminData = getAdminData();
  adminData.productOverrides = adminData.productOverrides || {};
  adminData.productOverrides[pId] = { ...(adminData.productOverrides[pId] || {}), ...fields };

  adminData.customProducts = adminData.customProducts || [];
  const idx = adminData.customProducts.findIndex(p => Number(p.id) === pId);
  if (idx !== -1) {
    adminData.customProducts[idx] = { ...adminData.customProducts[idx], ...fields };
  } else {
    const existingFull = getProducts().find(pp => Number(pp.id) === pId);
    if (existingFull) {
      adminData.customProducts.push({ ...existingFull, ...fields });
    }
  }

  saveAdminData(adminData);

  const updatedP = getProducts().find(pp => Number(pp.id) === pId);
  if (updatedP) {
    syncProductToCloud(updatedP);
  }
}

function deleteProduct(id) {
  const adminData = getAdminData();
  if (adminData.customProducts) {
    adminData.customProducts = adminData.customProducts.filter(p => p.id !== id);
  }
  adminData.productOverrides = adminData.productOverrides || {};
  adminData.productOverrides[id] = { deleted: true };
  saveAdminData(adminData);

  syncProductToCloud({ id, deleted: true });
}

function renderAdminSettings() {
  const waInput = document.getElementById('adminWAInput');
  if (waInput) waInput.value = getWhatsAppNumber();
  const config = getSupabaseConfig();
  const urlEl = document.getElementById('supabaseUrlInput');
  const keyEl = document.getElementById('supabaseKeyInput');
  if (urlEl) urlEl.value = config.url || '';
  if (keyEl) keyEl.value = config.key || '';
}

let currentHeroPhoto = null;

function renderAdminHero() {
  const data = getHeroData();
  const eyebrowEl = document.getElementById('adminHeroEyebrow');
  const titleEl = document.getElementById('adminHeroTitle');
  const descEl = document.getElementById('adminHeroDesc');
  const plantNameEl = document.getElementById('adminHeroPlantName');
  const plantPriceEl = document.getElementById('adminHeroPlantPrice');
  const plantStatusEl = document.getElementById('adminHeroPlantStatus');
  const urlEl = document.getElementById('heroPhotoUrlInput');
  const prevEl = document.getElementById('heroPhotoPreviewBox');

  if (eyebrowEl) eyebrowEl.value = data.eyebrow;
  if (titleEl) titleEl.value = data.title;
  if (descEl) descEl.value = data.desc;
  if (plantNameEl) plantNameEl.value = data.plantName;
  if (plantPriceEl) plantPriceEl.value = data.plantPrice;
  if (plantStatusEl) plantStatusEl.value = data.plantStatus;

  currentHeroPhoto = data.photoSrc || null;
  if (urlEl) urlEl.value = (data.photoSrc && !data.photoSrc.startsWith('data:')) ? data.photoSrc : '';
  if (prevEl) {
    if (data.photoSrc) {
      prevEl.innerHTML = `<img src="${data.photoSrc}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      prevEl.innerHTML = `<span class="photo-placeholder-icon">📷</span>`;
    }
  }
}

// Submodal Formulario y Carga de Fotos
let currentPhotoSources = [null, null, null];

function setupPhotoInputListeners() {
  // Hero photo inputs
  const heroFileEl = document.getElementById('heroPhotoFileInput');
  const heroUrlEl = document.getElementById('heroPhotoUrlInput');
  const heroPrevEl = document.getElementById('heroPhotoPreviewBox');

  if (heroFileEl) {
    heroFileEl.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (heroPrevEl) heroPrevEl.innerHTML = `<span style="font-size:.75rem;color:#64748B;font-weight:600">Optimizando...</span>`;
        const optimized = await compressImageFile(file, 900, 0.75);
        if (optimized) {
          currentHeroPhoto = optimized;
          if (heroUrlEl) heroUrlEl.value = '';
          if (heroPrevEl) heroPrevEl.innerHTML = `<img src="${optimized}" style="width:100%;height:100%;object-fit:cover;">`;
        }
      }
    });
  }

  if (heroUrlEl) {
    heroUrlEl.addEventListener('input', () => {
      const val = heroUrlEl.value.trim();
      if (val) {
        currentHeroPhoto = val;
        if (heroPrevEl) heroPrevEl.innerHTML = `<img src="${val}" style="width:100%;height:100%;object-fit:cover;">`;
      } else {
        currentHeroPhoto = null;
        if (heroPrevEl) heroPrevEl.innerHTML = `<span class="photo-placeholder-icon">📷</span>`;
      }
    });
  }

  // Product photo inputs
  [1, 2, 3].forEach(num => {
    const fileEl = document.getElementById(`fileInput${num}`);
    const urlEl = document.getElementById(`urlInput${num}`);
    const prevEl = document.getElementById(`prevBox${num}`);

    if (fileEl) {
      fileEl.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          if (prevEl) prevEl.innerHTML = `<span style="font-size:.75rem;color:#64748B;font-weight:600">Optimizando...</span>`;
          const optimized = await compressImageFile(file, 800, 0.72);
          if (optimized) {
            currentPhotoSources[num - 1] = optimized;
            if (urlEl) urlEl.value = '';
            if (prevEl) prevEl.innerHTML = `<img src="${optimized}">`;
          }
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
    document.getElementById('editProdOrder').value = p.order || 1;
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
    document.getElementById('editProdOrder').value = getProducts().length + 1;
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
    renderAdminHero();
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
    const orderVal = document.getElementById('editProdOrder').value;
    const order = orderVal ? Number(orderVal) : 999;
    const description = document.getElementById('editProdDesc').value.trim();
    const finalStockText = stockText || (stockQty === 0 ? 'Agotado' : (stockQty === 1 ? 'Última unidad' : `${stockQty} disponibles`));

    let existingImages = [];
    if (editId) {
      const existingP = getProducts().find(pp => Number(pp.id) === Number(editId));
      if (existingP && existingP.images) existingImages = existingP.images;
    }

    const finalImages = [1, 2, 3].map((num, i) => {
      const manualUrl = document.getElementById(`urlInput${num}`)?.value.trim();
      const existingSrc = existingImages[i] ? (existingImages[i].src || (typeof existingImages[i] === 'string' ? existingImages[i] : null)) : null;
      const src = currentPhotoSources[i] || manualUrl || existingSrc;
      return src 
        ? { src, bg: 'var(--sage-100)', accent: '#3A5A40' } 
        : { bg: i === 0 ? 'var(--sage-100)' : (i === 1 ? 'var(--blush-100)' : 'var(--lilac-100)'), accent: '#3A5A40' };
    });

    let savedProductObj = null;

    if (editId) {
      const numId = Number(editId);
      savedProductObj = {
        id: numId,
        name,
        latin,
        cat,
        rarity,
        price,
        old: oldPrice,
        stockQty,
        stock: finalStockText,
        order,
        description,
        images: finalImages
      };
      updateProductOverride(numId, savedProductObj);
      alert('¡Planta y todos sus datos actualizados exitosamente!');
    } else {
      const newId = Date.now();
      const adminData = getAdminData();
      savedProductObj = {
        id: newId,
        cat,
        name,
        latin,
        price,
        old: oldPrice,
        rarity,
        panel: 'sage',
        stockQty,
        stock: finalStockText,
        order,
        description,
        images: finalImages
      };
      adminData.customProducts = adminData.customProducts || [];
      adminData.customProducts.push(savedProductObj);
      saveAdminData(adminData);
      syncProductToCloud(savedProductObj);
      alert('¡Nueva planta añadida exitosamente al catálogo con todos sus datos!');
    }

    if (savedProductObj && order) {
      setProductPosition(savedProductObj.id, order);
    }

    closeProdEditModal();
    renderAdminTable();
    renderGrid();
    renderChips();
  });

  // Guardado de la Portada (Hero)
  document.getElementById('adminHeroForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const eyebrow = document.getElementById('adminHeroEyebrow').value.trim();
    const title = document.getElementById('adminHeroTitle').value.trim();
    const desc = document.getElementById('adminHeroDesc').value.trim();
    const plantName = document.getElementById('adminHeroPlantName').value.trim();
    const plantPrice = document.getElementById('adminHeroPlantPrice').value.trim();
    const plantStatus = document.getElementById('adminHeroPlantStatus').value.trim();
    const manualHeroUrl = document.getElementById('heroPhotoUrlInput')?.value.trim();
    const existingHero = getHeroData();
    const photoSrc = currentHeroPhoto || manualHeroUrl || existingHero.photoSrc || null;

    const heroPayload = {
      eyebrow,
      title,
      desc,
      plantName,
      plantPrice,
      plantStatus,
      photoSrc
    };

    saveHeroData(heroPayload);
    syncHeroToCloud(heroPayload);

    renderHero();
    alert('¡Portada principal (Hero) actualizada correctamente!');
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

  // Ajustes: Supabase Cloud Connect & Sync
  document.getElementById('supabaseSaveBtn')?.addEventListener('click', async () => {
    const url = document.getElementById('supabaseUrlInput')?.value.trim();
    const key = document.getElementById('supabaseKeyInput')?.value.trim();
    if (!url || !key) {
      alert('Por favor ingresa tanto la URL como la Anon Key de Supabase.');
      return;
    }
    saveSupabaseConfig(url, key);
    await initSupabase(true);
  });

  document.getElementById('supabaseSyncUploadBtn')?.addEventListener('click', async () => {
    await uploadAllCurrentToCloud();
  });

  document.getElementById('supabaseSyncDownloadBtn')?.addEventListener('click', async () => {
    if (!isCloudConnected) {
      alert('Primero guarda una conexión válida de Supabase.');
      return;
    }
    await syncFromCloud();
    alert('¡Datos descargados y actualizados exitosamente desde la nube!');
  });
}

/* =============== INICIALIZACIÓN GENERAL =============== */
document.addEventListener('DOMContentLoaded', async () => {
  cleanDuplicateProducts();
  renderHero();
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

  // Inicializar sincronización en la nube Supabase
  await initSupabase();

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      visibleCount = 9999;
      renderGrid();
    });
  }
});
