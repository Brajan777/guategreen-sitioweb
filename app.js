/* =============== CONFIGURACIÓN DE META PIXEL & CONVERSIONS API (META ADS) =============== */
const DEFAULT_META_CONFIG = {
  pixelId: '1393104892965350',
  capiToken: '',
  testEventCode: ''
};
const META_STORAGE_KEY = 'guategreen_meta_config_v1';

function getMetaConfig() {
  try {
    const saved = localStorage.getItem(META_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_META_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return DEFAULT_META_CONFIG;
}

function saveMetaConfig(config) {
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {}
}

function initMetaPixel() {
  const config = getMetaConfig();
  if (window.fbq && config.pixelId) {
    try {
      window.fbq('init', config.pixelId);
      window.fbq('track', 'PageView');
    } catch (e) {}
  }
}

function trackMetaEvent(eventName, customData = {}, userData = {}) {
  const config = getMetaConfig();
  const eventId = 'gg_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);

  // 1. Meta Pixel del navegador
  if (window.fbq && config.pixelId) {
    try {
      window.fbq('track', eventName, customData, { eventID: eventId });
    } catch (e) {
      console.warn('Meta Pixel warning:', e);
    }
  }

  // 2. API de Conversiones (CAPI) directa
  if (config.pixelId && config.capiToken) {
    sendMetaCapiEvent(eventName, eventId, customData, userData);
  }
}

async function sendMetaCapiEvent(eventName, eventId, customData = {}, userData = {}) {
  const config = getMetaConfig();
  if (!config.pixelId || !config.capiToken) return;

  try {
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          event_source_url: window.location.href,
          action_source: 'website',
          user_data: {
            client_user_agent: navigator.userAgent,
            ...userData
          },
          custom_data: customData
        }
      ]
    };

    if (config.testEventCode) {
      payload.test_event_code = config.testEventCode;
    }

    fetch('https://graph.facebook.com/v19.0/' + config.pixelId + '/events?access_token=' + encodeURIComponent(config.capiToken), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (err) {}
}

function exportMetaCatalogCSV() {
  const prods = getProducts();
  if (!prods || prods.length === 0) {
    alert('No hay productos disponibles para exportar.');
    return;
  }

  const headers = [
    'id',
    'title',
    'description',
    'availability',
    'condition',
    'price',
    'link',
    'image_link',
    'brand',
    'google_product_category',
    'fb_product_category'
  ];

  const rows = prods.map(p => {
    const im = p.images && p.images[0] ? (p.images[0].src || p.images[0]) : '';
    const imgUrl = (typeof im === 'string' && im.startsWith('http')) ? im : 'https://guategreen.com/logo.jpg';
    const cleanDesc = (p.description || '').replace(/[\r\n\t]+/g, ' ').replace(/"/g, '""');
    const cleanTitle = (p.name + (p.latin ? ' - ' + p.latin : '')).trim().replace(/"/g, '""');
    const avail = (p.stockQty > 0 || (p.stock && !p.stock.toLowerCase().includes('agotado'))) ? 'in stock' : 'out of stock';
    const priceStr = Number(p.price).toFixed(2) + ' GTQ';

    return [
      '"' + p.id + '"',
      '"' + cleanTitle + '"',
      '"' + cleanDesc + '"',
      '"' + avail + '"',
      '"new"',
      '"' + priceStr + '"',
      '"https://guategreen.com/#catalogo"',
      '"' + imgUrl + '"',
      '"Guategreen"',
      '"543"',
      '"plants"'
    ].join(',');
  });

  const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'catalogo_meta_guategreen_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* =============== CONFIGURACIÓN Y SISTEMA DE ADMINISTRACIÓN =============== */
const DEFAULT_WHATSAPP = '50252554758';
const ADMIN_STORAGE_KEY = 'guategreen_admin_data_v1';

const DEFAULT_ADMIN_PASS_HASH = 'c6f31bfec09bc0eb78400a7275017eca291bf1a1a8cba9d265224b42cd4f104e';

async function hashPasswordSHA256(str) {
  const buf = new TextEncoder().encode(String(str || ''));
  const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_ADMIN_DATA = {
  passwordHash: DEFAULT_ADMIN_PASS_HASH,
  whatsappNumber: DEFAULT_WHATSAPP,
  customProducts: [],
  productOverrides: {}
};

function getAdminData() {
  try {
    const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.password) {
        delete parsed.password;
        try { localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(parsed)); } catch(e){}
      }
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
let cloudProducts = null;
let cloudHero = null;
let cloudMaintenance = null;
const MAINTENANCE_STORAGE_KEY = 'guategreen_maintenance_v1';
const ADMIN_SESSION_KEY = 'gg_admin_logged_in';

function isAdminLoggedIn() {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
  } catch (e) {
    return false;
  }
}

function getMaintenanceMode() {
  if (cloudMaintenance !== null) return !!cloudMaintenance;
  try {
    return localStorage.getItem(MAINTENANCE_STORAGE_KEY) === '1';
  } catch (e) {
    return false;
  }
}

function renderMaintenanceUI() {
  const isMaint = getMaintenanceMode();
  const isAdmin = isAdminLoggedIn();

  const overlay = document.getElementById('maintenanceOverlay');
  const adminBar = document.getElementById('adminMaintenanceBar');
  const quickBtn = document.getElementById('adminMaintenanceQuickBtn');
  const toggleBtn = document.getElementById('adminMaintenanceToggleBtn');
  const badge = document.getElementById('maintenanceStatusBadge');

  if (overlay) {
    overlay.style.display = (isMaint && !isAdmin) ? 'flex' : 'none';
  }

  if (adminBar) {
    adminBar.style.display = (isMaint && isAdmin) ? 'inline-flex' : 'none';
  }

  if (quickBtn) {
    if (isMaint) {
      quickBtn.innerHTML = '🚧 En Construcción (Activo)';
      quickBtn.style.background = '#FEF3C7';
      quickBtn.style.color = '#92400E';
      quickBtn.style.borderColor = '#F59E0B';
    } else {
      quickBtn.innerHTML = '🟢 Tienda Pública';
      quickBtn.style.background = '#DCFCE7';
      quickBtn.style.color = '#15803D';
      quickBtn.style.borderColor = '#86EFAC';
    }
  }

  if (toggleBtn) {
    if (isMaint) {
      toggleBtn.innerHTML = '🟢 Abrir Tienda al Público';
      toggleBtn.style.background = '#15803D';
      toggleBtn.style.borderColor = '#166534';
    } else {
      toggleBtn.innerHTML = '🚧 Activar Modo Construcción';
      toggleBtn.style.background = '#D97706';
      toggleBtn.style.borderColor = '#B45309';
    }
  }

  if (badge) {
    if (isMaint) {
      badge.textContent = '🚧 Modo Construcción Activo';
      badge.style.background = '#FEF3C7';
      badge.style.color = '#92400E';
    } else {
      badge.textContent = '🟢 Tienda Abierta al Público';
      badge.style.background = '#DCFCE7';
      badge.style.color = '#15803D';
    }
  }
}

async function toggleMaintenanceMode(forceState) {
  const nextState = typeof forceState === 'boolean' ? forceState : !getMaintenanceMode();
  cloudMaintenance = nextState;
  try {
    localStorage.setItem(MAINTENANCE_STORAGE_KEY, nextState ? '1' : '0');
  } catch (e) {}

  renderMaintenanceUI();

  if (supabaseClient && isCloudConnected) {
    try {
      await supabaseClient.from('gg_hero').upsert({
        id: 'maintenance',
        data: { enabled: nextState, updatedAt: new Date().toISOString() },
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error guardando modo mantenimiento en Supabase:', err);
    }
  }
}

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
      badge.textContent = '🔴 Sin conexión con la Nube';
      badge.style.background = '#FEE2E2';
      badge.style.color = '#991B1B';
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
    // 1. Obtener metadatos ligeros de productos de la nube (carga instantánea <150ms sin descargar 12MB de base64)
    const { data: prods, error: pErr } = await supabaseClient
      .from('gg_products')
      .select('id, cat, name, latin, price, old_price, rarity, panel, stock_qty, stock, order_num, description, deleted')
      .order('order_num', { ascending: true });

    if (!pErr && prods && prods.length > 0) {
      const localMap = {};
      PRODUCTS.forEach(lp => { localMap[Number(lp.id)] = lp; });
      if (Array.isArray(cloudProducts)) {
        cloudProducts.forEach(cp => {
          const hasRealImg = Array.isArray(cp.images) && cp.images.some(im => (im && im.src) || typeof im === 'string');
          if (hasRealImg) localMap[Number(cp.id)] = cp;
        });
      }

      const missingImageIds = [];

      cloudProducts = prods.map(p => {
        const numId = Number(p.id);
        const localProd = localMap[numId];
        const localImgs = localProd && Array.isArray(localProd.images) && localProd.images.length > 0
          ? localProd.images
          : null;

        if (!localImgs && !p.deleted && p.cat !== 'Sustratos & Insumos') {
          missingImageIds.push(numId);
        }

        return {
          id: numId,
          cat: p.cat || 'Otros',
          name: p.name || 'Sin nombre',
          latin: p.latin || '',
          price: Number(p.price) || 0,
          old: p.old_price ? Number(p.old_price) : null,
          rarity: (p.rarity === 'Común' || !p.rarity) ? 'Esencial' : p.rarity,
          panel: p.panel || 'sage',
          stockQty: p.stock_qty !== undefined && p.stock_qty !== null ? Number(p.stock_qty) : 0,
          stock: p.stock || (p.stock_qty > 0 ? `${p.stock_qty} disponibles` : 'Agotado'),
          order: Number(p.order_num) || 999,
          description: p.description || '',
          images: localImgs || [{ bg: 'var(--sage-100)', accent: '#3A5A40' }],
          deleted: !!p.deleted
        };
      });

      // Guardar copia ligera en localStorage conservando rutas de imagen locales
      try {
        const adminData = getAdminData();
        adminData.customProducts = cloudProducts.map(p => ({
          ...p,
          images: (p.images || []).map(im => {
            const src = typeof im === 'string' ? im : (im && im.src ? im.src : null);
            if (src && !src.startsWith('data:image/')) return { bg: 'var(--sage-100)', src };
            return { bg: 'var(--sage-100)', accent: '#3A5A40' };
          })
        }));
        adminData.productOverrides = {};
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminData));
      } catch (quotaErr) {
        console.warn('Uso exclusivo de memoria para datos en tiempo real.');
      }

      renderChips();
      renderGrid();
      renderAdminTable();

      // Si hay plantas nuevas agregadas desde el panel que aún no tienen imagen local en archivo, descargar solo sus imágenes
      if (missingImageIds.length > 0) {
        const { data: imgRows, error: imgErr } = await supabaseClient
          .from('gg_products')
          .select('id, images')
          .in('id', missingImageIds);

        if (!imgErr && Array.isArray(imgRows) && imgRows.length > 0) {
          const imgMap = {};
          imgRows.forEach(ir => {
            if (Array.isArray(ir.images) && ir.images.length > 0) {
              imgMap[Number(ir.id)] = ir.images;
            }
          });
          cloudProducts = cloudProducts.map(cp => {
            if (imgMap[cp.id]) {
              return { ...cp, images: imgMap[cp.id] };
            }
            return cp;
          });
          renderGrid();
          renderAdminTable();
        }
      }
    }

    // 2. Obtener Portada / Hero de la nube
    const { data: heroRow, error: hErr } = await supabaseClient
      .from('gg_hero')
      .select('data')
      .eq('id', 'main')
      .single();

    if (!hErr && heroRow && heroRow.data) {
      cloudHero = heroRow.data;
      try {
        saveHeroData(heroRow.data);
      } catch (qErr) {}
      renderHero();
      renderAdminHero();
    }

    // 3. Obtener Banners de la nube
    const { data: bannerRow, error: bErr } = await supabaseClient
      .from('gg_hero')
      .select('data')
      .eq('id', 'banners')
      .single();

    if (!bErr && bannerRow && bannerRow.data && Array.isArray(bannerRow.data)) {
      cloudBanners = bannerRow.data;
      try {
        saveBannersData(bannerRow.data);
      } catch (qErr) {}
      renderBannerCarousel();
      initBannerCarousel();
    }

    // 4. Obtener estado de Modo Construcción / Mantenimiento de la nube
    const { data: maintRow, error: mErr } = await supabaseClient
      .from('gg_hero')
      .select('data')
      .eq('id', 'maintenance')
      .maybeSingle();

    if (!mErr && maintRow && maintRow.data) {
      cloudMaintenance = !!maintRow.data.enabled;
      try {
        localStorage.setItem(MAINTENANCE_STORAGE_KEY, cloudMaintenance ? '1' : '0');
      } catch (qErr) {}
      renderMaintenanceUI();
    }
  } catch (err) {
    console.error('Error sincronizando de Supabase:', err);
  }
}

async function syncProductToCloud(product) {
  if (!supabaseClient || !isCloudConnected) return { success: false, reason: 'not_connected' };

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
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error('Error guardando producto en Supabase:', err);
    return { success: false, error: err };
  }
}

async function syncHeroToCloud(heroData) {
  if (!supabaseClient || !isCloudConnected) return { success: false, reason: 'not_connected' };

  try {
    const { error } = await supabaseClient.from('gg_hero').upsert({
      id: 'main',
      data: heroData,
      updated_at: new Date().toISOString()
    });
    if (error) {
      console.warn('Aviso al guardar Hero en Supabase:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error('Error guardando hero en Supabase:', err);
    return { success: false, error: err };
  }
}

async function syncBannersToCloud(bannersData) {
  if (!supabaseClient || !isCloudConnected) return { success: false, reason: 'not_connected' };

  try {
    const { error } = await supabaseClient.from('gg_hero').upsert({
      id: 'banners',
      data: bannersData,
      updated_at: new Date().toISOString()
    });
    if (error) {
      console.warn('Aviso al guardar Banners en Supabase:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error('Error guardando banners en Supabase:', err);
    return { success: false, error: err };
  }
}

async function uploadAllCurrentToCloud() {
  if (!supabaseClient || !isCloudConnected) {
    alert('Primero guarda la URL y la Key de tu proyecto de Supabase y asegúrate de que esté conectado.');
    return;
  }

  const prods = getProducts();
  const hero = getHeroData();
  const banners = getBannersData();

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
    const { error: bErr } = await supabaseClient.from('gg_hero').upsert({
      id: 'banners',
      data: banners,
      updated_at: new Date().toISOString()
    });

    if (pErr || hErr || bErr) {
      alert('Aviso de Supabase: ' + (pErr?.message || hErr?.message || bErr?.message || 'Verifica que ejecutaste el código SQL en el SQL Editor de Supabase'));
    } else {
      alert('¡Catálogo, Portada y Banners subidos con éxito a la Nube! Ahora cualquier cambio se actualizará en vivo en todos los dispositivos.');
    }
  } catch (err) {
    console.error('Error subiendo datos a Supabase:', err);
    alert('Error al sincronizar con la nube: ' + err.message);
  }
}

/* =============== COMPRESOR Y OPTIMIZADOR DE IMÁGENES =============== */
function compressImageFile(file, maxWidth = 800, quality = 0.72) {
  return new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
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
        } catch (cvErr) {
          resolve(e.target.result);
        }
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

/* =============== GESTIÓN DE BANNERS Y PROMOCIONES =============== */
const BANNERS_STORAGE_KEY = 'guategreen_banners_data_v1';
const DEFAULT_BANNERS_DATA = [
  {
    id: 1,
    imageSrc: 'banner-1.jpg',
    title: 'Promoción Exclusiva: Tu Pack de 3 Caladiums de Colección de Indonesia y Thailandia Q600',
    link: 'https://wa.me/50252554758?text=Hola%20Guategreen%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n%20sobre%20la%20promoci%C3%B3n%20del%20Pack%20de%203%20Caladiums%20de%20Colecci%C3%B3n%20por%20Q600'
  },
  {
    id: 2,
    imageSrc: 'banner-2.jpg',
    title: 'Beneficio Exclusivo: Envíos a toda Guatemala Gratis en compras mayores de Q850',
    link: 'https://wa.me/50252554758?text=Hola%20Guategreen%2C%20quisiera%20aprovechar%20el%20beneficio%20de%20env%C3%ADos%20gratis%20en%20compras%20mayores%20de%20Q850'
  }
];
let cloudBanners = null;

function getBannersData() {
  if (cloudBanners && Array.isArray(cloudBanners) && cloudBanners.length > 0) {
    return cloudBanners;
  }
  try {
    const saved = localStorage.getItem(BANNERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error al leer banners data', e);
  }
  return DEFAULT_BANNERS_DATA;
}

function saveBannersData(data) {
  try {
    localStorage.setItem(BANNERS_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Error al guardar banners data', e);
    alert('Aviso: El almacenamiento del navegador está lleno. Intenta comprimir las fotos o usar enlaces directos.');
    return false;
  }
}

/* =============== GESTIÓN DE PORTADA / HERO =============== */
const HERO_STORAGE_KEY = 'guategreen_hero_data_v3';
try { localStorage.removeItem('guategreen_hero_data_v1'); localStorage.removeItem('guategreen_hero_data_v2'); } catch (e) {}
const DEFAULT_HERO_DATA = {
  "desc": "Priorizamos la calidad sobre la cantidad. Descubre nuestra selección exclusiva de Araceae (Monsteras, Philodendrons, Alocasias y mas) con los estándares que tu colección merece.",
  "title": "Plantas Exóticas y de Colección en Guatemala",
  "eyebrow": "Especies raras, variedad de plantas exóticas.",
  "photoSrc": "data:image/jpeg;base64,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",
  "plantName": "Philodendron Billietiae Variegado",
  "plantPrice": "Q3800",
  "plantStatus": "Disponible"
};

function getHeroData() {
  if (cloudHero) {
    return { ...DEFAULT_HERO_DATA, ...cloudHero };
  }
  try {
    const saved = localStorage.getItem(HERO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.plantName && !parsed.plantName.toLowerCase().includes('crystalinium')) {
        return { ...DEFAULT_HERO_DATA, ...parsed };
      }
    }
  } catch (e) {}
  return DEFAULT_HERO_DATA;
}

function saveHeroData(data) {
  cloudHero = data;
  try {
    localStorage.removeItem('guategreen_hero_data_v1');
    localStorage.removeItem(HERO_STORAGE_KEY);
    localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
  return true;
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
  if (plantStatusEl) {
    plantStatusEl.textContent = data.plantStatus;
    const heroDot = plantStatusEl.parentElement?.querySelector('.dot-live');
    if (heroDot) {
      const isHeroOut = String(data.plantStatus || '').toLowerCase().includes('agotad');
      heroDot.style.background = isHeroOut ? '#DC2626' : 'var(--sage-500)';
    }
  }

  if (visualPanel) {
    if (data.photoSrc) {
      visualPanel.innerHTML = `<img src="${data.photoSrc}" alt="${data.plantName}" fetchpriority="high" decoding="async" style="width:100%;height:100%;object-fit:cover;">`;
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

const DEFAULT_SUSTRATOS_PRODUCTS = [
  {
    "id": 990001,
    "cat": "Sustratos & Insumos",
    "name": "Sustrato Especial para Aráceas (Aroid Mix)",
    "latin": "Fórmula Profesional Guategreen • Bolsa 5 Litros",
    "price": 75,
    "old": null,
    "rarity": "Esencial",
    "panel": "sage",
    "stockQty": 20,
    "stock": "Disponible para envío 🌱",
    "order": 901,
    "description": "🌿 Mezcla aireada de grado coleccionista formulada en nuestro vivero especialmente para Monsteras variegadas, Philodendrons, Alocasias y Anthuriums. Elaborada con corteza de pino seleccionada, chips de coco, perlita gruesa, carbón activado y humus de lombriz para garantizar drenaje rápido, oxigenación radicular y cero pudrición de raíces en el clima de Guatemala.",
    "images": [
      { "bg": "var(--sage-100)", "accent": "#3A5A40" },
      { "bg": "var(--blush-100)", "accent": "#3A5A40" },
      { "bg": "var(--lilac-100)", "accent": "#3A5A40" }
    ]
  },
  {
    "id": 990002,
    "cat": "Sustratos & Insumos",
    "name": "Pack Trasplante: Sustrato Aráceas + Maceta Transparente",
    "latin": "5L Aroid Mix + Maceta Rígida con Ranuras de Ventilación",
    "price": 125,
    "old": 145,
    "rarity": "Esencial",
    "panel": "sage",
    "stockQty": 12,
    "stock": "12 packs disponibles 🌱",
    "order": 902,
    "description": "🪴 El combo ideal para trasplantar tus especímenes sin estrés. Incluye 1 bolsa de 5 Litros de nuestro Sustrato Especial para Aráceas (Aroid Mix) + 1 maceta transparente especializada con ranuras laterales de aireación que te permite vigilar el crecimiento y salud de las raíces en todo momento.",
    "images": [
      { "bg": "var(--sage-100)", "accent": "#2E6B4F" },
      { "bg": "var(--blush-100)", "accent": "#2E6B4F" },
      { "bg": "var(--lilac-100)", "accent": "#2E6B4F" }
    ]
  },
  {
    "id": 990003,
    "cat": "Sustratos & Insumos",
    "name": "Musgo Sphagnum Premium (Propagación & Tutores)",
    "latin": "Sphagnum Moss • Fibra Larga Seleccionada",
    "price": 65,
    "old": null,
    "rarity": "Esencial",
    "panel": "sage",
    "stockQty": 15,
    "stock": "15 disponibles 🌱",
    "order": 903,
    "description": "🌱 Musgo Sphagnum de hebra larga y alta retención de humedad con aireación óptima. Indispensable para enraizar esquejes y nodos de Monstera o Philodendron, germinar cormos de Alocasia, realizar acodos aéreos y rellenar tutores de musgo.",
    "images": [
      { "bg": "var(--sage-100)", "accent": "#3A5A40" },
      { "bg": "var(--blush-100)", "accent": "#3A5A40" },
      { "bg": "var(--lilac-100)", "accent": "#3A5A40" }
    ]
  }
];

function getProducts() {
  let itemsList = [];
  const adminData = getAdminData();
  const deletedIds = Array.isArray(adminData.deletedIds) ? adminData.deletedIds.map(Number) : [];
  const overrides = adminData.productOverrides || {};

  if (cloudProducts && cloudProducts.length > 0) {
    itemsList = cloudProducts.map(p => ({
      ...p,
      id: Number(p.id),
      order: (p.order !== undefined && p.order !== null && p.order !== '') ? Number(p.order) : 999
    }));
  } else {
    itemsList = PRODUCTS.map((p, idx) => ({
      ...p,
      id: Number(p.id),
      order: p.order || (idx + 1)
    }));
  }

  // Asegurar que los productos iniciales de Sustratos & Insumos estén disponibles si aún no están en la nube
  DEFAULT_SUSTRATOS_PRODUCTS.forEach(defProd => {
    const exists = itemsList.some(p => Number(p.id) === Number(defProd.id));
    if (!exists && !deletedIds.includes(Number(defProd.id))) {
      const ov = overrides[defProd.id] || {};
      itemsList.push({
        ...defProd,
        ...ov,
        id: Number(defProd.id)
      });
    }
  });

  // Incluir productos personalizados locales si aún no están en itemsList
  if (Array.isArray(adminData.customProducts)) {
    adminData.customProducts.forEach(cp => {
      if (!cp || !cp.id) return;
      const exists = itemsList.some(p => Number(p.id) === Number(cp.id));
      if (!exists && !deletedIds.includes(Number(cp.id))) {
        itemsList.push({
          ...cp,
          id: Number(cp.id),
          order: cp.order || 999
        });
      }
    });
  }

  // Filtrar productos eliminados
  const all = itemsList.filter(p => !p.deleted && !deletedIds.includes(Number(p.id)));

  // Ordenar por orden numérico y desempate por ID
  all.sort((a, b) => {
    const ordA = (a.order !== undefined && a.order !== null && a.order !== '') ? Number(a.order) : 9999;
    const ordB = (b.order !== undefined && b.order !== null && b.order !== '') ? Number(b.order) : 9999;
    if (ordA !== ordB) return ordA - ordB;
    return Number(a.id) - Number(b.id);
  });

  // Normalizar posiciones 1..N estrictamente
  all.forEach((p, idx) => {
    p.order = idx + 1;
  });

  return all;
}

function getWhatsAppNumber() {
  const adminData = getAdminData();
  return adminData.whatsappNumber || DEFAULT_WHATSAPP;
}

const PRODUCTS = [
  {
    "id": 1788236453569,
    "cat": "Philodendron",
    "name": "Philodendron florida Beauty",
    "latin": "Philodendron maduro",
    "price": 450,
    "old": null,
    "rarity": "Rara",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Última unidad",
    "order": 2,
    "description": "🌿 ¡Pieza codiciada de colección disponible! Philodendron Florida Beauty (Ejemplar Maduro). Destaca por sus fascinantes hojas lobuladas con una variegación marfil y amarillo dorado de altísimo contraste sobre tallos rojizos texturizados. Además, cuenta con crecimiento activo y excelente sistema radicular listo para entutorar. 🌱 Planta sana, madura y bien establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/philodendron-florida-beauty-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/philodendron-florida-beauty-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/philodendron-florida-beauty-3.jpg"
      }
    ]
  },
  {
    "id": 1788387158626,
    "cat": "Otros",
    "name": "Anthurium king of spades",
    "latin": "Anthurium mediano",
    "price": 2250,
    "old": null,
    "rarity": "Ultra rara",
    "panel": "sage",
    "stockQty": 0,
    "stock": "Agotado",
    "order": 4,
    "description": "🌿 ¡La realeza de los Anthuriums aterciopelados disponible! Anthurium King of Spades. Famoso mundialmente por sus hojas oscuras en forma de espada (pica) con textura de terciopelo profundo y nervaduras sutiles que ganan un tono casi negro al madurar. Además, cuenta con raíces gruesas bien enraizadas en sustrato Chunky Soil Premium y nuevo catafilo activo. 🌱 Planta sana, de alta colección y establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/anthurium-king-of-spades-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/anthurium-king-of-spades-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/anthurium-king-of-spades-3.jpg"
      }
    ]
  },
  {
    "id": 1788234715587,
    "cat": "Caladium",
    "name": "Caladium Bicolor",
    "latin": "Caladium Indonesia",
    "price": 225,
    "old": null,
    "rarity": "Rara",
    "panel": "sage",
    "stockQty": 0,
    "stock": "Agotado",
    "order": 5,
    "description": "🌿 ¡Pieza de colección disponible! Caladium Indonesia Bicolor. Destaca por su contraste marcado entre verde intenso y amarillo brillante, complementado con un porte elegante y follaje bien desarrollado. Una combinación muy llamativa que eleva cualquier colección. 🌱 Planta sana, establecida y de excelente tamaño.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-bicolor-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-bicolor-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-bicolor-3.jpg"
      }
    ]
  },
  {
    "id": 3,
    "cat": "Caladium",
    "name": "Caladium tricolor",
    "latin": "Caladium Indonesia",
    "price": 285,
    "old": null,
    "rarity": "Rara",
    "panel": "lilac",
    "stockQty": 1,
    "stock": "Última unidad",
    "order": 5,
    "description": "🌿 ¡Elegancia tropical disponible! Caladium Indonesia Tricolor. Destaca por el delicado balance de tonos verdes, blancos y rosas salpicados en sus hojas, complementado por peciolos firmes de gran porte decorativo. Además, cuenta con tubérculo fuerte y brotes vigorosos listos para lucir en tu espacio. 🌱 Planta sana y establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-tricolor-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-tricolor-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-tricolor-3.jpg"
      }
    ]
  },
  {
    "id": 1788273711372,
    "cat": "Otros",
    "name": "Aglonema Pink Emerald",
    "latin": "Aglonema mediana",
    "price": 450,
    "old": null,
    "rarity": "Rara",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 6,
    "description": "🌿 ¡Color y distinción disponibles! Aglaonema Pink Emerald (Tamaño Mediano). Destaca por sus hojas anchas y firmes decoradas con intensas tonalidades rosa esmeralda y verde que iluminan cualquier espacio interior. Además, es una variedad muy resistente y tolerante con excelente densidad de hojas. 🌱 Planta sana, establecida y de fácil mantenimiento.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/aglonema-pink-emerald-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/aglonema-pink-emerald-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/aglonema-pink-emerald-3.jpg"
      }
    ]
  },
  {
    "id": 900003,
    "cat": "Otros",
    "name": "Aglonema Siam Aurora",
    "latin": "Aglaonema commutatum 'Siam Aurora'",
    "price": 75,
    "old": null,
    "rarity": "Esencial",
    "panel": "sage",
    "stockQty": 2,
    "stock": "2 disponibles",
    "order": 7,
    "description": "🌿 ¡Color vibrante y resistencia disponibles! Aglaonema Siam Aurora (Aglaonema commutatum 'Siam Aurora'). Destaca por sus hojas lanceoladas verde brillante enmarcadas por intensos bordes y nervaduras centrales en rojo carmesí y coral, acompañadas de delicados peciolos rosados. Además, es una variedad sumamente noble, purificadora y adaptable a distintos niveles de iluminación interior. 🌱 Planta sana, frondosa y bien establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/aglonema-siam-aurora-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/aglonema-siam-aurora-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/aglonema-siam-aurora-3.jpg"
      }
    ]
  },
  {
    "id": 8,
    "cat": "Caladium",
    "name": "Caladium cuatro colores",
    "latin": "Caladium Indonesia",
    "price": 250,
    "old": null,
    "rarity": "Rara",
    "panel": "blush",
    "stockQty": 0,
    "stock": "Agotado",
    "order": 8,
    "description": "🌿 ¡Exclusividad indonesia disponible! Caladium Cuatro Colores (Caladium Indonesia). Destaca por su compleja y rara combinación de 4 tonos distintos en cada hoja (verde, rosa, blanco y rojo) que crean un efecto visual artístico irrepetible. Además, viene con tubérculo sano y desarrollo foliar impecable. 🌱 Planta sana y establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-cuatro-colores-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-cuatro-colores-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-cuatro-colores-3.jpg"
      }
    ]
  },
  {
    "id": 1788235261215,
    "cat": "Otros",
    "name": "Anthurium Carla x Red Queen",
    "latin": "Anthurium adulto",
    "price": 2550,
    "old": null,
    "rarity": "Ultra rara",
    "panel": "sage",
    "stockQty": 0,
    "stock": "Agotado",
    "order": 8,
    "description": "🌿 ¡Híbrido exclusivo de alta gama! Anthurium Carla × Red Queen (Ejemplar Adulto). Destaca por sus imponentes hojas aterciopeladas de seno cerrado y textura profunda, con nervaduras marcadas y emergentes en tonos rojizos intensos que heredan la elegancia genética de ambos parentales. Además, cuenta con raíces gruesas bien establecidas en sustrato Chunky Soil Premium. 🌱 Planta sana, adulta y de colección superior.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/anthurium-carla-x-red-queen-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/anthurium-carla-x-red-queen-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/anthurium-carla-x-red-queen-3.jpg"
      }
    ]
  },
  {
    "id": 900002,
    "cat": "Philodendron",
    "name": "Goldiana o Lanza Dorada",
    "latin": "Philodendron Calking Gold",
    "price": 225,
    "old": null,
    "rarity": "Esencial",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 9,
    "description": "🌿 ¡Tonalidades doradas de colección disponibles! Philodendron Goldiana o Lanza Dorada (Philodendron 'Calkins Gold'). Destaca por sus estilizadas hojas sagitadas en forma de lanza que emergen en un espectacular amarillo limón y dorado brillante, contrastando con su follaje maduro verde esmeralda. Además, cuenta con un sistema radicular fuerte en sustrato Chunky Soil Premium y crecimiento trepador activo. 🌱 Planta sana, aclimatada y bien establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/goldiana-o-lanza-dorada-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/goldiana-o-lanza-dorada-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/goldiana-o-lanza-dorada-3.jpg"
      }
    ]
  },
  {
    "id": 1788236329067,
    "cat": "Caladium",
    "name": "Caladium Tricolor",
    "latin": "Caladium Indonesia",
    "price": 300,
    "old": null,
    "rarity": "Rara",
    "panel": "sage",
    "stockQty": 0,
    "stock": "Agotado",
    "order": 17,
    "description": "🌿 ¡Joya indonesia de colección disponible! Caladium Tricolor Premium. Destaca por sus hojas estilizadas de gran definición cromática y pecíolos oscuros que acentúan el brillo de su variegación. Además, cuenta con hijuelos en formación ideales para futura multiplicación. 🌱 Planta sana, aclimatada y establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-tricolor-q300-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-tricolor-q300-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-tricolor-q300-3.jpg"
      }
    ]
  },
  {
    "id": 1790752456089,
    "cat": "Otros",
    "name": "Anthurium Diabloense",
    "latin": "Anthurium diabloense Vannini, Croat & Cast.Mont.",
    "price": 195,
    "old": null,
    "rarity": "Esencial",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 20,
    "description": "🌿 ¡Tesoro botánico nativo de Guatemala disponible! Anthurium Diabloense (Anthurium diabloense Vannini, Croat & Cast.Mont.). Destaca por sus distintivas hojas sagitadas de porte escultórico con lóbulos basales alargados y arqueados tipo orejas de diablo, lámina verde profundo subcoriácea y nervaduras primarias suavemente marcadas. Además, presenta catafilos activos, raíces adventicias sanas y nuevo brote foliar en formación. 🌱 Planta sana, bien enraizada y de incalculable valor para amantes de la flora guatemalteca.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/anthurium-diabloense-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/anthurium-diabloense-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/anthurium-diabloense-3.jpg"
      }
    ]
  },
  {
    "id": 1788280764552,
    "cat": "Philodendron",
    "name": "Philodendron Violin Neon",
    "latin": "Philodendron pequeño",
    "price": 175,
    "old": null,
    "rarity": "Esencial",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 21,
    "description": "🌿 ¡Vibratilidad y forma disponible! Philodendron Violín Neon (Philodendron bipennifolium). Destaca por sus peculiares hojas con silueta de violín en un deslumbrante color verde lima neón brillante que resalta de inmediato. Además, cuenta con crecimiento activo listo para trepar con tutor. 🌱 Planta sana, alegre y establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/philodendron-violin-neon-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/philodendron-violin-neon-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/philodendron-violin-neon-3.jpg"
      }
    ]
  },
  {
    "id": 1788280823946,
    "cat": "Monstera",
    "name": "Monstera Tricolor",
    "latin": "Monstera Madura",
    "price": 1950,
    "old": 2400,
    "rarity": "Ultra rara",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 22,
    "description": "🌿 ¡La reina indiscutible de colección disponible! Monstera Deliciosa Madura,con 3 tonos de color. Destaca por sus gigantescas hojas de color verde brillante con doble hilera de fenestraciones y cortes perfectos que denotan una madurez y genética insuperables. Además, cuenta con tallo robusto, nudos fuertes y raíces aéreas vigorosas. 🌱 Planta sana, majestuosa y establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/monstera-tricolor-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/monstera-tricolor-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/monstera-tricolor-3.jpg"
      }
    ]
  },
  {
    "id": 1792521601095,
    "cat": "Otros",
    "name": "Syngomio Aurea",
    "latin": "Syngonium podophyllum 'Aurea'",
    "price": 99,
    "old": null,
    "rarity": "Esencial",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 22,
    "description": "🌿 ¡Luminosidad variegada de colección disponible! Syngonium Aurea (Syngonium podophyllum 'Aurea'). Destaca por sus hojas aflechadas con espectaculares sectores y marmoleados en amarillo dorado, verde lima y crema que hacen de cada hoja una pieza única. Además, presenta raíces vigorosas, nudos activos y un crecimiento rápido ideal para lucir en tutor o maceta. 🌱 Planta sana, aclimatada y establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/syngomio-aurea-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/syngomio-aurea-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/syngomio-aurea-3.jpg"
      }
    ]
  },
  {
    "id": 1790752101375,
    "cat": "Philodendron",
    "name": "Philodendron Violin Variegado",
    "latin": "Philodendron bipennifolium 'Aurea Variegata'",
    "price": 1350,
    "old": null,
    "rarity": "Ultra rara",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 22,
    "description": "🌿 ¡Obra maestra botánica disponible! Philodendron Violin Variegado (Philodendron bipennifolium 'Aurea Variegata'). Destaca por su icónica silueta foliar pandurada en forma de violín, luciendo una impresionante variegación aurea en luminosos tonos amarillo neón, verde lima y sectores contrastantes sobre verde profundo. Además, posee un sistema radicular sobresaliente, nudos robustos y nuevo brote en activo desarrollo sobre tutor de musgo. 🌱 Planta sana, completamente enraizada y de altísima exclusividad.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/philodendron-violin-variegado-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/philodendron-violin-variegado-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/philodendron-violin-variegado-3.jpg"
      }
    ]
  },
  {
    "id": 1792522192848,
    "cat": "Philodendron",
    "name": "Philodendron Thai sunrise",
    "latin": "Philodendron domesticum 'Thai Sunrise'",
    "price": 225,
    "old": null,
    "rarity": "Esencial",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 23,
    "description": "🌿 ¡Follaje radiante de colección disponible! Philodendron Thai Sunrise (Philodendron domesticum 'Thai Sunrise'). Destaca por sus hojas alargadas y brillantes con llamativa variegación que combina sectores verde intenso con amarillo neón y lima luminoso. Además, cuenta con tallo firme, raíces aéreas activas y está establecida en sustrato Chunky Soil Premium. 🌱 Planta sana, vigorosa y bien establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/philodendron-thai-sunrise-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/philodendron-thai-sunrise-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/philodendron-thai-sunrise-3.jpg"
      }
    ]
  },
  {
    "id": 1792522383824,
    "cat": "Caladium",
    "name": "Caladium bicolor verde, negro y rojo.",
    "latin": "Caladium × hortulanum",
    "price": 200,
    "old": null,
    "rarity": "Rara",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 24,
    "description": "🌿 ¡Contraste exótico disponible! Caladium Bicolor Verde, Negro y Rojo (Caladium × hortulanum). Destaca por la dramática combinación de su centro rojo intenso y nervaduras carmesí rodeadas de tonos oscuros casi negros y márgenes verde profundo sobre peciolos firmes. Además, posee un tubérculo fuerte y bien enraizado con brotes activos. 🌱 Planta sana, aclimatada y de gran impacto visual.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-bicolor-verde-negro-y-rojo-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-bicolor-verde-negro-y-rojo-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-bicolor-verde-negro-y-rojo-3.jpg"
      }
    ]
  },
  {
    "id": 1788283109272,
    "cat": "Caladium",
    "name": "Caladium Stapre tricolor",
    "latin": "Caladium Thailandes",
    "price": 350,
    "old": null,
    "rarity": "Rara",
    "panel": "sage",
    "stockQty": 0,
    "stock": "Agotado",
    "order": 24,
    "description": "🌿 ¡Exotismo tailandés disponible! Caladium Stapre Tricolor (Origen Tailandia). Destaca por su patrón moteado de alta densidad con salpicaduras rojas, blancas y verdes de aspecto pictórico sobre un follaje compacto. Además, cuenta con tubérculo madre fuerte y varios hijuelos en desarrollo. 🌱 Planta sana, exótica y establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-stapre-tricolor-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-stapre-tricolor-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-stapre-tricolor-3.jpg"
      }
    ]
  },
  {
    "id": 1792522632867,
    "cat": "Otros",
    "name": "Aglonema China red",
    "latin": "Aglaonema commutatum 'China Red'.",
    "price": 135,
    "old": null,
    "rarity": "Esencial",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 25,
    "description": "🌿 ¡Elegancia oriental para interior disponible! Aglaonema China Red (Aglaonema commutatum 'China Red'). Destaca por su tupido follaje de tonalidades rojo cereza y rosado intenso con finos matices verdes, capaz de transformar cualquier rincón con su color cálido y permanente. Además, cuenta con sistema radicular robusto y es de muy fácil cuidado en interiores. 🌱 Planta sana, frondosa y establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/aglonema-china-red-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/aglonema-china-red-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/aglonema-china-red-3.jpg"
      }
    ]
  },
  {
    "id": 1790750753532,
    "cat": "Monstera",
    "name": "Monstera Adansonii Archipiélago",
    "latin": "Monstera adansonii 'Archipelago'",
    "price": 385,
    "old": null,
    "rarity": "Rara",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 25,
    "description": "🌿 ¡Rareza botánica de alta codicia disponible! Monstera Adansonii Archipiélago (Monstera adansonii 'Archipelago'). Destaca por sus múltiples fenestraciones ovaladas y un fascinante patrón de variegación tipo islas en tonos crema y verde menta que contrastan con su follaje esmeralda subcoriáceo. Además, posee un sistema radicular abundante, nudos engrosados y brote apical activo con excelente carga genética variegada. 🌱 Planta sana, establecida y lista para continuar su ascenso en tutor.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/monstera-adansonii-archipielago-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/monstera-adansonii-archipielago-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/monstera-adansonii-archipielago-3.jpg"
      }
    ]
  },
  {
    "id": 1788385288575,
    "cat": "Otros",
    "name": "Anthurium Portillae",
    "latin": "Anthurium maduro",
    "price": 2600,
    "old": null,
    "rarity": "Ultra rara",
    "panel": "sage",
    "stockQty": 0,
    "stock": "Agotado",
    "order": 25,
    "description": "🌿 ¡Joya botánica de silueta estilizada disponible! Anthurium Portillae. Destaca por su follaje alargado y elegante en forma de lanza con textura aterciopelada de tacto suave y nervaduras prominentes de gran contraste visual. Además, posee excelente sistema radicular y vigor vegetativo listo para lucir en cualquier espacio de colección. 🌱 Planta sana, exótica y establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/anthurium-portillae-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/anthurium-portillae-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/anthurium-portillae-3.jpg"
      }
    ]
  },
  {
    "id": 1792523211132,
    "cat": "Monstera",
    "name": "Caladium",
    "latin": "Caladium  verde, rojo, amarillo y negro",
    "price": 250,
    "old": null,
    "rarity": "Ultra rara",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 26,
    "description": "🌿 ¡Pieza multicolor de alta colección disponible! Caladium Exótico (Variedad Verde, Rojo, Amarillo y Negro). Destaca por su extraordinaria paleta de cuatro colores en cada hoja, combinando destellos amarillo dorado, venas rojas encendidas y fondo oscuro aterciopelado con bordes verdes. Además, cuenta con tubérculo vigoroso y raíces sanas en pleno desarrollo. 🌱 Planta sana, aclimatada y establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-3.jpg"
      }
    ]
  },
  {
    "id": 1788204281975,
    "cat": "Caladium",
    "name": "Caladium Indonesia",
    "latin": "Caladium bicolor",
    "price": 225,
    "old": null,
    "rarity": "Rara",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Última unidad",
    "order": 26,
    "description": "Caladium Indonesia var. Lance Leaf (hoja lanceolada). Hermoso ejemplar tricolor, verde claro, verde oscuro y amarillo con característico tallo negro. Buen tamaño y 3 hojas.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-indonesia-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-indonesia-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-indonesia-3.jpg"
      }
    ]
  },
  {
    "id": 1788280865937,
    "cat": "Caladium",
    "name": "Caladium Bicolor",
    "latin": "Caladium Indonesia",
    "price": 250,
    "old": null,
    "rarity": "Rara",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 27,
    "description": "🌿 ¡Elegancia indonesia disponible! Caladium Bicolor Clásico. Destaca por el contraste limpio y armónico entre su centro blanco/rosado y bordes verde botella sobre tallos estilizados de gran flexibilidad decorativa. Además, presenta cormo sano y excelente renovación de hojas. 🌱 Planta sana y establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-bicolor-q250-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-bicolor-q250-2.jpg"
      }
    ]
  },
  {
    "id": 1788455399379,
    "cat": "Caladium",
    "name": "Caladium Bicolor oscuro",
    "latin": "Caladium Indonesia",
    "price": 350,
    "old": null,
    "rarity": "Rara",
    "panel": "sage",
    "stockQty": 0,
    "stock": "Agotado",
    "order": 27,
    "description": "🌱 Hermoso caladium de indonesia bicolor morado y verde con un tallo negro.\nCuenta con un hijito de tamaño considerable. Bulbo completo y bien enraizado. Buen tamaño.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-bicolor-oscuro-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-bicolor-oscuro-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/caladium-bicolor-oscuro-3.jpg"
      }
    ]
  },
  {
    "id": 1792523328705,
    "cat": "Otros",
    "name": "Zz variegada",
    "latin": "Zamioculcas zamiifolia variegada",
    "price": 999,
    "old": null,
    "rarity": "Rara",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 28,
    "description": "🌿 ¡Rareza botánica de colección disponible! ZZ Variegada (Zamioculcas zamiifolia 'Variegata'). Destaca por sus hojas cerosas y brillantes con impactantes sectores variegados en amarillo crema, blanco marfil y verde esmeralda que conservan la legendaria resistencia de la especie. Además, cuenta con rizoma suculento sano y raíces fuertes en sustrato Chunky Soil Premium. 🌱 Planta sana, exclusiva y bien establecida.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/zz-variegada-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/zz-variegada-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/zz-variegada-3.jpg"
      }
    ]
  },
  {
    "id": 1792524262476,
    "cat": "Philodendron",
    "name": "Gloriosum tricolor",
    "latin": "Philodendron Gloriosum tricolor variegado",
    "price": 950,
    "old": null,
    "rarity": "Rara",
    "panel": "sage",
    "stockQty": 2,
    "stock": "2 disponibles",
    "order": 30,
    "description": "🌿 ¡Joya aterciopelada de alta colección disponible! Philodendron Gloriosum Tricolor (Philodendron gloriosum 'Tricolor'). Destaca por sus majestuosas hojas acorazonadas de textura de terciopelo (velvet), nervaduras claras prominentes y una extraordinaria variegación tricolor que combina tonos verde esmeralda, blanco crema y destellos amarillos/rosados en cada hoja. Además, cuenta con rizoma vigoroso y sistema radicular activo en sustrato Chunky Soil Premium. 🌱 Planta sana, exclusiva y aclimatada.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/gloriosum-tricolor-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/gloriosum-tricolor-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/gloriosum-tricolor-3.jpg"
      }
    ]
  },
  {
    "id": 1792536480153,
    "cat": "Philodendron",
    "name": "Jopii variegado",
    "latin": "Philodendron Jopii variegado",
    "price": 2300,
    "old": null,
    "rarity": "Ultra rara",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 31,
    "description": "🌿 ¡Rareza botánica de colección disponible! Philodendron Joepii Variegado (Philodendron joepii 'Variegata'). Reconocido mundialmente por la silueta exótica e inconfundible de sus hojas trilobuladas con lóbulos superiores prominentes, este espécimen luce una espectacular variegación sectorial y marmoleada en tonos crema, amarillo lima y verde profundo, con nueva hoja emergiendo. Raíces vigorosas establecidas en sustrato Chunky Soil Premium. 🌱 Planta sana, exclusiva y aclimatada.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/jopii-variegado-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/jopii-variegado-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/jopii-variegado-3.jpg"
      }
    ]
  },
  {
    "id": 1792536562724,
    "cat": "Monstera",
    "name": "Monstera Variegada",
    "latin": "Monstera Albo Variegada",
    "price": 799,
    "old": null,
    "rarity": "Rara",
    "panel": "sage",
    "stockQty": 1,
    "stock": "Única disponible 🌱",
    "order": 32,
    "description": "🌿 ¡Ícono de colección disponible! Monstera Albo Variegada (Monstera deliciosa 'Albo Borsigiana'). Destaca por su impresionante hoja fenestrada con variegación de alto contraste tipo Half Moon y sectores marmoleados en blanco puro, verde menta y verde esmeralda, acompañada de un tallo intensamente rayado que garantiza excelente continuidad genética. Perfectamente enraizada en maceta transparente con sustrato Chunky Soil Premium. 🌱 Planta sana, exclusiva y aclimatada.",
    "images": [
      {
        "bg": "var(--sage-100)",
        "src": "images/products/monstera-variegada-1.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/monstera-variegada-2.jpg"
      },
      {
        "bg": "var(--sage-100)",
        "src": "images/products/monstera-variegada-3.jpg"
      }
    ]
  }
];

const CATEGORIES = ['Todas', 'Monstera', 'Philodendron', 'Alocasia', 'Caladium', 'Otros', 'Sustratos & Insumos'];
let activeCat = 'Todas';
const INITIAL_VISIBLE_COUNT = 60;
let visibleCount = INITIAL_VISIBLE_COUNT;

function leafSVG(accent) {
  return `<svg viewBox="0 0 100 100" fill="none">
    <path d="M50 92C50 92 12 74 12 40C12 18 30 4 50 2C70 4 88 18 88 40C88 74 50 92 50 92Z" fill="none" stroke="${accent}" stroke-width="2.5"/>
    <path d="M50 10V88" stroke="${accent}" stroke-width="1.5" stroke-dasharray="3 4"/>
    <path d="M50 25C42 38 28 44 18 47M50 45C40 56 26 61 15 63M50 65C40 74 27 78 17 80" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M50 25C58 38 72 44 82 47M50 45C60 56 74 61 85 63M50 65C60 74 73 78 83 80" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}

function sustratoSVG(accent) {
  return `<svg viewBox="0 0 100 100" fill="none">
    <rect x="24" y="24" width="52" height="62" rx="8" fill="none" stroke="${accent}" stroke-width="2.5"/>
    <path d="M24 36H76" stroke="${accent}" stroke-width="2" stroke-dasharray="4 3"/>
    <path d="M50 66V44" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M50 53C42 53 37 47 37 41C44 41 50 46 50 53Z" fill="none" stroke="${accent}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M50 49C58 49 63 43 63 37C56 37 50 42 50 49Z" fill="none" stroke="${accent}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="38" cy="74" r="2.2" fill="${accent}"/>
    <circle cx="50" cy="76" r="2.5" fill="${accent}"/>
    <circle cx="62" cy="73" r="2.2" fill="${accent}"/>
  </svg>`;
}

function productPlaceholderSVG(p, accent) {
  if (p && p.cat === 'Sustratos & Insumos') {
    return sustratoSVG(accent || '#3A5A40');
  }
  return leafSVG(accent || '#3A5A40');
}

function getFeaturedSustrato() {
  const prods = getProducts();
  return prods.find(p => p.cat === 'Sustratos & Insumos' && parseStockQty(p) > 0) || prods.find(p => p.cat === 'Sustratos & Insumos') || null;
}

function money(n) {
  return 'Q' + n.toLocaleString('es-GT', { minimumFractionDigits: 2 });
}

function rarityColor(r) {
  if (r === 'Ultra rara') return { bg: '#0A5A3C', c: '#FFFFFF' };
  if (r === 'Rara') return { bg: '#2E6B4F', c: '#FFFFFF' };
  return { bg: '#E8F5EF', c: '#0A5A3C' };
}

/* =============== RENDERIZADO DE FILTROS Y PRODUCTOS =============== */
function renderChips() {
  const el = document.getElementById('chips');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(c => {
    const isSustrato = c === 'Sustratos & Insumos';
    const label = isSustrato ? `🌱 ${c}` : c;
    return `<button class="chip ${isSustrato ? 'chip-sustrato' : ''} ${c === activeCat ? 'active' : ''}" data-cat="${c}">${label}</button>`;
  }).join('');
  
  el.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCat = btn.dataset.cat;
      visibleCount = INITIAL_VISIBLE_COUNT;
      renderChips();
      renderGrid();
    });
  });
}

function getProductSlug(p) {
  if (window.GUATEGREEN_PRODUCTS && Array.isArray(window.GUATEGREEN_PRODUCTS)) {
    const found = window.GUATEGREEN_PRODUCTS.find(gp => Number(gp.id) === Number(p.id));
    if (found && found.slug) return found.slug;
  }
  return (p.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function renderGrid() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  // Filtro inteligente: en "Todas" mostramos únicamente plantas para cuidar la estética de galería botánica;
  // al seleccionar "Sustratos & Insumos" mostramos todos los sustratos, macetas y cuidado.
  const filtered = getProducts().filter(p => {
    if (activeCat === 'Todas') return p.cat !== 'Sustratos & Insumos';
    return p.cat === activeCat;
  });
  const shown = filtered.slice(0, visibleCount);

  const catBannerHTML = activeCat === 'Sustratos & Insumos' ? `
    <div class="sustrato-cat-banner">
      <div>
        <h3 class="serif">🌱 Sustratos Especializados & Cuidado para Aráceas</h3>
        <p>Fórmulas aireadas de grado coleccionista preparadas en nuestro vivero en Guatemala para prevenir pudrición radicular y potenciar el enraizamiento de Monsteras, Philodendrons, Alocasias y Anthuriums.</p>
      </div>
    </div>
  ` : '';

  grid.innerHTML = catBannerHTML + shown.map((p) => {
    const rc = rarityColor(p.rarity);
    const slug = getProductSlug(p);
    const thumbs = p.images.map((im, i) => `<button class="thumb-dot ${i === 0 ? 'active' : ''}" data-idx="${i}" aria-label="Ver foto ${i + 1}"></button>`).join('');
    const frames = p.images.map((im, i) => {
      const imgSrc = typeof im === 'string' ? im : (im && im.src ? im.src : null);
      const content = imgSrc 
        ? `<img src="${imgSrc}" alt="${p.name}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">`
        : productPlaceholderSVG(p, im.accent || '#3A5A40');
      return `<div class="frame" data-idx="${i}" style="background:${im.bg || 'var(--sage-100)'};opacity:${i === 0 ? 1 : 0};position:absolute;inset:0;overflow:hidden;">${content}</div>`;
    }).join('');
    
    return `
    <div class="card" data-id="${p.id}" data-slug="${slug}">
      <div class="card-media">
        <a href="producto/${slug}/" style="position:absolute;inset:0;z-index:2;" aria-label="Ver detalles de ${p.name}"></a>
        ${frames}
        <div class="thumbs" style="z-index:3;">${thumbs}</div>
      </div>
      <div class="card-body">
        <span class="latin">${p.latin}</span>
        <h3 class="name"><a href="producto/${slug}/" style="color:inherit;text-decoration:none;">${p.name}</a></h3>
        <div class="stock-row"><span class="dot-live" style="background:${parseStockQty(p) <= 0 ? '#DC2626' : 'var(--sage-500)'}"></span>${p.stock}</div>
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
        e.preventDefault();
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
      loadMoreBtn.innerHTML = `Ver catálogo completo (+${remaining} más) ↓`;
    } else {
      loadMoreBtn.style.display = 'none';
    }
  }
}

/* =============== MODAL DE DETALLE DE PRODUCTO =============== */
function openProductModal(id) {
  const numId = Number(id);
  const p = getProducts().find(pp => Number(pp.id) === numId);
  if (!p) return;

  trackMetaEvent('ViewContent', {
    content_name: p.name,
    content_category: p.cat,
    content_ids: [String(p.id)],
    content_type: 'product',
    value: Number(p.price) || 0,
    currency: 'GTQ'
  });

  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('productModal');
  const modalBody = document.getElementById('modalBody');

  if (!overlay || !modal || !modalBody) return;

  const rc = rarityColor(p.rarity);
  
  const thumbsHTML = p.images.map((im, i) => {
    const imgSrc = typeof im === 'string' ? im : (im && im.src ? im.src : null);
    const content = imgSrc ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` : productPlaceholderSVG(p, im.accent || '#3A5A40');
    return `<div class="modal-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}" style="background:${im.bg || '#EFF5E1'};overflow:hidden;">${content}</div>`;
  }).join('');

  const framesHTML = p.images.map((im, i) => {
    const imgSrc = typeof im === 'string' ? im : (im && im.src ? im.src : null);
    const content = imgSrc ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">` : productPlaceholderSVG(p, im.accent || '#3A5A40');
    return `<div class="modal-frame" data-idx="${i}" style="background:${im.bg || '#EFF5E1'};opacity:${i === 0 ? 1 : 0};position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;">${content}</div>`;
  }).join('');

  const featSustrato = (p.cat !== 'Sustratos & Insumos') ? getFeaturedSustrato() : null;
  const modalUpsellHTML = featSustrato ? `
    <div class="modal-upsell-box">
      <div class="modal-upsell-text">
        <strong>🌱 ¿Llevas sustrato especial para tu nueva planta?</strong>
        <span>${featSustrato.name} — <strong>+${money(featSustrato.price)}</strong></span>
      </div>
      <button type="button" class="modal-upsell-btn" id="modalAddWithSustratoBtn">+ Sumar con Sustrato</button>
    </div>
  ` : '';

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
        <div class="stock-row"><span class="dot-live" style="background:${parseStockQty(p) <= 0 ? '#DC2626' : 'var(--sage-500)'}"></span>${p.stock}</div>
        <div class="rarity-row" style="margin:.3rem 0 .5rem"><span class="tag-rarity-inline" style="background:${rc.bg};color:${rc.c}">${p.rarity}</span></div>
        <p class="desc">${p.description}</p>
        ${modalUpsellHTML}
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

  if (featSustrato) {
    document.getElementById('modalAddWithSustratoBtn')?.addEventListener('click', () => {
      addToCart(p.id);
      addToCart(featSustrato.id);
      closeProductModal();
      openCart();
    });
  }

  overlay.classList.add('show');
  modal.classList.add('open');
  document.body.classList.add('modal-open');

  // Actualizar URL amigable en la barra del navegador
  const slug = getProductSlug(p);
  if (slug && window.history && window.history.pushState) {
    try {
      history.pushState({ modalOpen: true, id: p.id }, '', 'producto/' + slug + '/');
    } catch (e) {}
  }
}

function closeProductModal() {
  document.getElementById('modalOverlay')?.classList.remove('show');
  document.getElementById('productModal')?.classList.remove('open');
  document.body.classList.remove('modal-open');

  // Restaurar URL principal si estaba en /producto/
  if (window.history && window.history.pushState && window.location.pathname.includes('/producto/')) {
    try {
      const cleanPath = window.location.pathname.replace(/producto\/[^/]+\/?/, '');
      history.pushState({}, '', cleanPath || '/');
    } catch (e) {}
  }
}

function initModalEvents() {
  document.getElementById('modalClose')?.addEventListener('click', closeProductModal);
  document.getElementById('modalOverlay')?.addEventListener('click', closeProductModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductModal();
  });

  window.addEventListener('popstate', (e) => {
    if (!e.state || !e.state.modalOpen) {
      closeProductModal();
    }
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
const GG_CART_KEY = 'guategreen_cart_v1';
let cart = [];
try {
  const savedCart = localStorage.getItem(GG_CART_KEY);
  if (savedCart) cart = JSON.parse(savedCart);
} catch (e) {}

function saveCartToStorage() {
  try {
    localStorage.setItem(GG_CART_KEY, JSON.stringify(cart));
  } catch (e) {}
}

function cartCount() { 
  return cart.reduce((s, i) => s + i.qty, 0); 
}

function cartTotal() { 
  return cart.reduce((s, i) => { 
    const p = getProducts().find(pp => Number(pp.id) === Number(i.id)); 
    return s + (p ? Number(p.price) || 0 : 0) * i.qty; 
  }, 0); 
}

function addToCart(id) {
  const numId = Number(id);
  const p = getProducts().find(pp => Number(pp.id) === numId);
  if (p) {
    trackMetaEvent('AddToCart', {
      content_name: p.name,
      content_category: p.cat,
      content_ids: [String(p.id)],
      content_type: 'product',
      value: Number(p.price) || 0,
      currency: 'GTQ'
    });
  }
  const existing = cart.find(i => Number(i.id) === numId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: numId, qty: 1 });
  }
  saveCartToStorage();
  renderCart(true);
}

function changeQty(id, delta) {
  const numId = Number(id);
  const it = cart.find(i => Number(i.id) === numId);
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) {
    cart = cart.filter(i => Number(i.id) !== numId);
  }
  saveCartToStorage();
  renderCart(false);
}

function removeFromCart(id) {
  const numId = Number(id);
  cart = cart.filter(i => Number(i.id) !== numId);
  saveCartToStorage();
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

  const allProds = getProducts();
  const itemsEl = document.getElementById('cartItems');
  if (itemsEl) {
    if (cart.length === 0) {
      itemsEl.innerHTML = '<p class="cart-empty">Tu carrito está vacío.<br>Elegí un espécimen del catálogo.</p>';
    } else {
      itemsEl.innerHTML = cart.map(i => {
        const p = allProds.find(pp => Number(pp.id) === Number(i.id));
        const im = p && p.images && p.images[0] ? p.images[0] : { bg: 'var(--sage-100)' };
        return `<div class="cart-item" data-id="${p ? p.id : i.id}">
          <div class="swatch" style="background:${im.bg || 'var(--sage-100)'}"></div>
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
        row.querySelector('[data-act="plus"]')?.addEventListener('click', () => changeQty(id, 1));
        row.querySelector('[data-act="minus"]')?.addEventListener('click', () => changeQty(id, -1));
        row.querySelector('[data-act="remove"]')?.addEventListener('click', () => removeFromCart(id));
      });
    }
  }

  // Sugerencia inteligente de Sustrato en el Carrito (Venta Cruzada)
  const upsellEl = document.getElementById('cartUpsell');
  if (upsellEl) {
    const hasSustratoInCart = cart.some(i => {
      const p = allProds.find(pp => Number(pp.id) === Number(i.id));
      return p && p.cat === 'Sustratos & Insumos';
    });
    const featSustrato = getFeaturedSustrato();

    if (cart.length > 0 && !hasSustratoInCart && featSustrato) {
      upsellEl.innerHTML = `
        <div class="cart-upsell-box">
          <div class="cart-upsell-info">
            <span class="cart-upsell-tag">🌱 Recomendado para tus raíces</span>
            <span class="cart-upsell-title">${featSustrato.name}</span>
            <span class="cart-upsell-price">+ ${money(featSustrato.price)}</span>
          </div>
          <button type="button" class="cart-upsell-btn" id="cartUpsellAddBtn">+ Sumar</button>
        </div>
      `;
      document.getElementById('cartUpsellAddBtn')?.addEventListener('click', () => {
        addToCart(featSustrato.id);
      });
    } else {
      upsellEl.innerHTML = '';
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
        const p = allProds.find(pp => Number(pp.id) === Number(i.id));
        return `${i.qty}x ${p ? p.name : 'Espécimen'} (${money(p ? p.price : 0)})`;
      }).join('\n');
      const msg = `Hola, quiero apartar este pedido en Guategreen:\n${lines}\n\nTotal: ${money(cartTotal())}`;
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
  const spySections = ['catalogo', 'promociones', 'coleccion', 'comunidad', 'faq', 'contacto'];
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
  if (!p) return 0;
  if (String(p.stock || '').toLowerCase().includes('agotad')) return 0;
  if (p.stockQty !== undefined && p.stockQty !== null) return Number(p.stockQty);
  const match = String(p.stock).match(/\d+/);
  if (match) return parseInt(match[0], 10);
  if (String(p.stock).toLowerCase().includes('última') || String(p.stock).toLowerCase().includes('ultima')) return 1;
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
  const currentIndex = prods.findIndex(pp => Number(pp.id) === numId);
  if (currentIndex === -1) return;

  const currentPos = currentIndex + 1;
  const targetPos = Math.max(1, Math.min(prods.length, Number(newPosition)));
  const targetIndex = targetPos - 1;

  if (currentIndex === targetIndex) return;

  const sourcePlant = prods[currentIndex];
  const targetPlant = prods[targetIndex];

  // Intercambio directo exacto (Swap): el 1 pasa al 15 y el 15 pasa al 1 sin alterar las demás posiciones
  sourcePlant.order = targetPos;
  targetPlant.order = currentPos;

  if (cloudProducts) {
    const cpSource = cloudProducts.find(x => Number(x.id) === Number(sourcePlant.id));
    if (cpSource) cpSource.order = targetPos;
    const cpTarget = cloudProducts.find(x => Number(x.id) === Number(targetPlant.id));
    if (cpTarget) cpTarget.order = currentPos;
  }

  const pSource = PRODUCTS.find(x => Number(x.id) === Number(sourcePlant.id));
  if (pSource) pSource.order = targetPos;
  const pTarget = PRODUCTS.find(x => Number(x.id) === Number(targetPlant.id));
  if (pTarget) pTarget.order = currentPos;

  const bulkUpdates = [
    { id: Number(sourcePlant.id), order_num: targetPos, deleted: false },
    { id: Number(targetPlant.id), order_num: currentPos, deleted: false }
  ];

  if (supabaseClient && isCloudConnected) {
    supabaseClient.from('gg_products').upsert(bulkUpdates, { onConflict: 'id' }).then(({ error }) => {
      if (error) console.warn('Aviso sincronizando orden con Supabase:', error);
    });
  }

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
  const numId = Number(id);
  const p = getProducts().find(pp => Number(pp.id) === numId);
  if (!p) return;
  const currentQty = parseStockQty(p);
  const newQty = Math.max(0, currentQty + delta);
  const newStockText = newQty === 0 ? 'Agotado' : (newQty === 1 ? 'Última unidad' : `${newQty} disponibles`);

  updateProductOverride(numId, { stockQty: newQty, stock: newStockText });
  renderAdminTable();
  renderGrid();
}

function updateProductOverride(id, fields) {
  const pId = Number(id);

  if (cloudProducts) {
    const cIdx = cloudProducts.findIndex(p => Number(p.id) === pId);
    if (cIdx !== -1) {
      cloudProducts[cIdx] = { ...cloudProducts[cIdx], ...fields };
    } else {
      const defItem = DEFAULT_SUSTRATOS_PRODUCTS.find(p => Number(p.id) === pId);
      if (defItem) {
        cloudProducts.push({ ...defItem, ...fields, id: pId });
      }
    }
  }

  try {
    const adminData = getAdminData();
    adminData.productOverrides = adminData.productOverrides || {};
    adminData.productOverrides[pId] = { ...(adminData.productOverrides[pId] || {}), ...fields };
    saveAdminData(adminData);
  } catch (e) {}

  const updatedP = getProducts().find(pp => Number(pp.id) === pId);
  if (updatedP) {
    syncProductToCloud(updatedP);
  }
}

async function deleteProduct(id) {
  const numId = Number(id);

  if (cloudProducts) {
    cloudProducts = cloudProducts.filter(p => Number(p.id) !== numId);
  }

  try {
    const adminData = getAdminData();
    adminData.deletedIds = Array.isArray(adminData.deletedIds) ? adminData.deletedIds : [];
    if (!adminData.deletedIds.includes(numId)) {
      adminData.deletedIds.push(numId);
    }
    if (Array.isArray(adminData.customProducts)) {
      adminData.customProducts = adminData.customProducts.filter(p => Number(p.id) !== numId);
    }
    saveAdminData(adminData);
  } catch (e) {}

  if (supabaseClient && isCloudConnected) {
    try {
      const { error } = await supabaseClient
        .from('gg_products')
        .update({ deleted: true, updated_at: new Date().toISOString() })
        .eq('id', numId);
      if (error) console.error('Error al marcar eliminado en Supabase:', error);
    } catch (e) {
      console.error('Error delete Supabase:', e);
    }
  }
}

function renderAdminSettings() {
  const metaCfg = getMetaConfig();
  const metaPixEl = document.getElementById('adminMetaPixelId');
  const metaCapEl = document.getElementById('adminMetaCapiToken');
  const metaTestEl = document.getElementById('adminMetaTestCode');
  if (metaPixEl) metaPixEl.value = metaCfg.pixelId || '';
  if (metaCapEl) metaCapEl.value = metaCfg.capiToken || '';
  if (metaTestEl) metaTestEl.value = metaCfg.testEventCode || '';
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

/* =============== GESTIÓN DE BANNERS EN PANEL ADMIN =============== */
let adminBannersState = null;

function renderAdminBanners() {
  const listEl = document.getElementById('adminBannersList');
  if (!listEl) return;

  if (!adminBannersState) {
    adminBannersState = JSON.parse(JSON.stringify(getBannersData()));
  }

  if (adminBannersState.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:2.5rem 1.5rem;background:#F8FAFC;border:1.5px dashed #CBD5E1;border-radius:12px;color:#64748B;">
        <p style="margin:0 0 1rem;font-size:1rem;font-weight:600;">No tienes ningún banner registrado actualmente.</p>
        <button type="button" class="btn btn-sm" id="emptyAddBannerBtn">➕ Añadir Primer Banner</button>
      </div>
    `;
    document.getElementById('emptyAddBannerBtn')?.addEventListener('click', () => {
      adminBannersState.push({
        id: Date.now(),
        imageSrc: '',
        title: '',
        link: ''
      });
      renderAdminBanners();
    });
    return;
  }

  const defaultWa = getWhatsAppNumber();
  const total = adminBannersState.length;

  listEl.innerHTML = adminBannersState.map((b, idx) => {
    const pos = idx + 1;
    const previewContent = b.imageSrc 
      ? `<img src="${b.imageSrc}">`
      : `<span style="font-size:2rem;">📷</span>`;

    return `
      <div class="admin-banner-item-card" data-idx="${idx}">
        <div class="admin-banner-header">
          <div class="admin-banner-badge">
            <span>🌿 Banner #${pos}</span>
          </div>
          <div class="admin-banner-controls">
            <button type="button" class="btn-banner-move" data-act="move-up" title="Subir posición" ${idx === 0 ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>▲</button>
            <button type="button" class="btn-banner-move" data-act="move-down" title="Bajar posición" ${idx === total - 1 ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>▼</button>
            <button type="button" class="btn-banner-delete" data-act="delete" title="Eliminar este banner">🗑️ Eliminar</button>
          </div>
        </div>

        <div class="admin-banner-body">
          <div>
            <label class="mono" style="font-size:.76rem;display:block;margin-bottom:.3rem;color:#475569;">Vista previa</label>
            <div class="admin-banner-preview-box" id="adminBannerPrevBox_${idx}">
              ${previewContent}
            </div>
          </div>

          <div class="admin-banner-fields">
            <div>
              <label class="mono" style="font-size:.8rem;font-weight:700;color:var(--sage-700);display:block;margin-bottom:.3rem;">
                📸 Imagen del Banner (Cargar archivo o pegar enlace/URL)
              </label>
              <input type="file" accept="image/*" class="photo-file-input banner-file-input" data-idx="${idx}">
              <input type="text" class="admin-input banner-url-input" data-idx="${idx}" placeholder="O escribe la ruta/URL (ej. banner-1.jpg o https://...)" value="${b.imageSrc && !b.imageSrc.startsWith('data:') ? b.imageSrc : ''}" style="margin-top:.4rem;font-size:.82rem;">
            </div>

            <div>
              <label class="mono" style="font-size:.8rem;display:block;margin-bottom:.3rem;">
                Título o descripción del Banner
              </label>
              <input type="text" class="admin-input banner-title-input" data-idx="${idx}" placeholder="Ej. Promoción Exclusiva Pack de 3 Caladiums Q600" value="${b.title || ''}" style="font-size:.84rem;">
            </div>

            <div>
              <label class="mono" style="font-size:.8rem;display:block;margin-bottom:.3rem;">
                Enlace al hacer clic (WhatsApp o página web)
              </label>
              <input type="text" class="admin-input banner-link-input" data-idx="${idx}" placeholder="https://wa.me/${defaultWa}?text=Hola..." value="${b.link || ''}" style="font-size:.84rem;">
              <span style="font-size:.72rem;color:#64748B;display:block;margin-top:.25rem;">
                Si se deja vacío, abrirá WhatsApp preguntando por el título del banner.
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Listeners para cada tarjeta de banner
  listEl.querySelectorAll('.admin-banner-item-card').forEach(card => {
    const idx = parseInt(card.dataset.idx, 10);

    card.querySelector('[data-act="move-up"]')?.addEventListener('click', () => {
      if (idx > 0) {
        syncInputsToBannerState();
        const temp = adminBannersState[idx];
        adminBannersState[idx] = adminBannersState[idx - 1];
        adminBannersState[idx - 1] = temp;
        renderAdminBanners();
      }
    });

    card.querySelector('[data-act="move-down"]')?.addEventListener('click', () => {
      if (idx < adminBannersState.length - 1) {
        syncInputsToBannerState();
        const temp = adminBannersState[idx];
        adminBannersState[idx] = adminBannersState[idx + 1];
        adminBannersState[idx + 1] = temp;
        renderAdminBanners();
      }
    });

    card.querySelector('[data-act="delete"]')?.addEventListener('click', () => {
      if (confirm(`¿Estás seguro de eliminar el Banner #${idx + 1}?`)) {
        syncInputsToBannerState();
        adminBannersState.splice(idx, 1);
        renderAdminBanners();
      }
    });

    const fileInput = card.querySelector('.banner-file-input');
    const urlInput = card.querySelector('.banner-url-input');
    const prevBox = document.getElementById(`adminBannerPrevBox_${idx}`);

    fileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (prevBox) prevBox.innerHTML = `<span style="font-size:.75rem;color:#64748B;font-weight:600">Optimizando...</span>`;
        const optimized = await compressImageFile(file, 1200, 0.80);
        if (optimized) {
          adminBannersState[idx].imageSrc = optimized;
          if (urlInput) urlInput.value = '';
          if (prevBox) prevBox.innerHTML = `<img src="${optimized}">`;
        }
      }
    });

    urlInput?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      adminBannersState[idx].imageSrc = val;
      if (prevBox) {
        if (val) {
          prevBox.innerHTML = `<img src="${val}">`;
        } else {
          prevBox.innerHTML = `<span style="font-size:2rem;">📷</span>`;
        }
      }
    });

    card.querySelector('.banner-title-input')?.addEventListener('input', (e) => {
      adminBannersState[idx].title = e.target.value;
    });

    card.querySelector('.banner-link-input')?.addEventListener('input', (e) => {
      adminBannersState[idx].link = e.target.value.trim();
    });
  });
}

function syncInputsToBannerState() {
  const listEl = document.getElementById('adminBannersList');
  if (!listEl || !adminBannersState) return;

  listEl.querySelectorAll('.admin-banner-item-card').forEach(card => {
    const idx = parseInt(card.dataset.idx, 10);
    if (adminBannersState[idx]) {
      const titleEl = card.querySelector('.banner-title-input');
      const linkEl = card.querySelector('.banner-link-input');
      const urlEl = card.querySelector('.banner-url-input');
      if (titleEl) adminBannersState[idx].title = titleEl.value;
      if (linkEl) adminBannersState[idx].link = linkEl.value.trim();
      if (urlEl && urlEl.value.trim()) adminBannersState[idx].imageSrc = urlEl.value.trim();
    }
  });
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

  if (id !== null && id !== undefined && id !== '') {
    const p = getProducts().find(pp => Number(pp.id) === Number(id));
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
  // Eventos de Meta Ads & Píxel
  document.getElementById('adminMetaSaveBtn')?.addEventListener('click', () => {
    const pixelId = document.getElementById('adminMetaPixelId')?.value.trim() || '';
    const capiToken = document.getElementById('adminMetaCapiToken')?.value.trim() || '';
    const testEventCode = document.getElementById('adminMetaTestCode')?.value.trim() || '';
    saveMetaConfig({ pixelId, capiToken, testEventCode });
    initMetaPixel();
    alert('✅ Configuración de Meta Ads guardada exitosamente.');
  });

  document.getElementById('adminMetaExportBtn')?.addEventListener('click', () => {
    exportMetaCatalogCSV();
  });

  document.getElementById('adminMetaTestBtn')?.addEventListener('click', () => {
    trackMetaEvent('TestEvent', {
      test_message: 'Prueba de integración Meta Pixel y CAPI exitosa en Guategreen',
      value: 100,
      currency: 'GTQ'
    });
    alert('🧪 Evento de prueba enviado a Meta. Puedes revisarlo en el Administrador de Eventos de Meta Ads.');
  });

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
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    } catch (e) {}
    closeLogin();
    renderMaintenanceUI();
    renderAdminTable();
    renderAdminHero();
    adminBannersState = null;
    renderAdminBanners();
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

  // Acceso secreto: 3 toques seguidos en el candadito del pie de página
  let lockTapCount = 0;
  let lockTapTimer = null;
  triggerBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    lockTapCount++;
    clearTimeout(lockTapTimer);
    lockTapTimer = setTimeout(() => { lockTapCount = 0; }, 900);
    if (lockTapCount >= 3) {
      lockTapCount = 0;
      openLogin();
    }
  });

  loginClose?.addEventListener('click', closeLogin);
  loginOverlay?.addEventListener('click', closeLogin);

  panelClose?.addEventListener('click', closeAdminPanel);
  panelOverlay?.addEventListener('click', closeAdminPanel);

  // Botones de Modo Construcción / Mantenimiento
  document.getElementById('adminMaintenanceQuickBtn')?.addEventListener('click', () => toggleMaintenanceMode());
  document.getElementById('adminMaintenanceToggleBtn')?.addEventListener('click', () => toggleMaintenanceMode());
  document.getElementById('adminMaintenanceDisableBarBtn')?.addEventListener('click', () => toggleMaintenanceMode(false));
  document.getElementById('maintenanceAdminLoginBtn')?.addEventListener('click', () => openLogin());

  // Acceso directo por URL guategreen.com/#admin
  function checkAdminHash() {
    if (window.location.hash === '#admin') {
      openLogin();
    }
  }
  window.addEventListener('hashchange', checkAdminHash);
  setTimeout(checkAdminHash, 300);

  // Atajo de teclado Ctrl+Shift+A o Cmd+Shift+A
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      openLogin();
    }
  });

  // Envío del formulario de Login con SHA-256 y protección anti-fuerza bruta (5 intentos)
  const LOCKOUT_KEY = 'gg_admin_lock_until';
  const FAIL_COUNT_KEY = 'gg_admin_fail_count';
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const now = Date.now();
    const lockUntil = Number(localStorage.getItem(LOCKOUT_KEY) || 0);

    if (lockUntil > now) {
      const minsLeft = Math.ceil((lockUntil - now) / 60000);
      if (errorMsg) {
        errorMsg.textContent = `Acceso bloqueado temporalmente por seguridad. Intenta en ${minsLeft} min.`;
        errorMsg.style.display = 'block';
      }
      return;
    }

    const inputVal = passwordInput?.value || '';
    const inputHash = await hashPasswordSHA256(inputVal);
    const data = getAdminData();
    const validHash = data.passwordHash || DEFAULT_ADMIN_PASS_HASH;

    if (inputHash === validHash || inputHash === DEFAULT_ADMIN_PASS_HASH) {
      try {
        localStorage.removeItem(FAIL_COUNT_KEY);
        localStorage.removeItem(LOCKOUT_KEY);
      } catch (err) {}
      openAdminPanel();
    } else {
      const fails = Number(localStorage.getItem(FAIL_COUNT_KEY) || 0) + 1;
      try {
        localStorage.setItem(FAIL_COUNT_KEY, String(fails));
      } catch (err) {}

      if (fails >= MAX_LOGIN_ATTEMPTS) {
        try {
          localStorage.setItem(LOCKOUT_KEY, String(now + LOCKOUT_DURATION_MS));
          localStorage.removeItem(FAIL_COUNT_KEY);
        } catch (err) {}
        if (errorMsg) {
          errorMsg.textContent = 'Demasiados intentos fallidos. Acceso bloqueado por 15 minutos.';
          errorMsg.style.display = 'block';
        }
      } else {
        const remaining = MAX_LOGIN_ATTEMPTS - fails;
        if (errorMsg) {
          errorMsg.textContent = `Contraseña incorrecta (${remaining} intento${remaining === 1 ? '' : 's'} restante${remaining === 1 ? '' : 's'}).`;
          errorMsg.style.display = 'block';
        }
      }
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
  document.getElementById('adminProdForm')?.addEventListener('submit', async (e) => {
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
        images: finalImages,
        deleted: false
      };
      updateProductOverride(numId, savedProductObj);
      const syncRes = await syncProductToCloud(savedProductObj);
      if (syncRes && syncRes.error) {
        alert('⚠️ Guardado en navegador, pero aviso en Supabase: ' + (syncRes.error.message || 'Verifica tu conexión'));
      } else {
        alert('¡Planta y todos sus datos guardados exitosamente en la nube de Supabase!');
      }
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
        images: finalImages,
        deleted: false
      };
      adminData.customProducts = adminData.customProducts || [];
      adminData.customProducts.push(savedProductObj);
      saveAdminData(adminData);
      const syncRes = await syncProductToCloud(savedProductObj);
      if (syncRes && syncRes.error) {
        alert('⚠️ Guardado en navegador, pero aviso en Supabase: ' + (syncRes.error.message || 'Verifica tu conexión'));
      } else {
        alert('¡Nueva planta añadida exitosamente al catálogo y guardada en la nube!');
      }
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
  document.getElementById('adminHeroForm')?.addEventListener('submit', async (e) => {
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
    const syncRes = await syncHeroToCloud(heroPayload);
    renderHero();

    if (syncRes && syncRes.error) {
      alert('⚠️ Portada guardada localmente, pero aviso en Supabase: ' + (syncRes.error.message || 'Verifica conexión'));
    } else {
      alert('¡Portada principal (Hero) guardada y sincronizada en la nube exitosamente!');
    }
  });

  // Guardado y Adición de Banners
  document.getElementById('adminAddBannerBtn')?.addEventListener('click', () => {
    syncInputsToBannerState();
    if (!adminBannersState) {
      adminBannersState = JSON.parse(JSON.stringify(getBannersData()));
    }
    adminBannersState.push({
      id: Date.now(),
      imageSrc: '',
      title: '',
      link: ''
    });
    renderAdminBanners();
  });

  document.getElementById('adminSaveBannersBtn')?.addEventListener('click', async () => {
    syncInputsToBannerState();
    if (!adminBannersState || adminBannersState.length === 0) {
      if (!confirm('No hay banners en la lista. ¿Deseas guardar una lista vacía?')) {
        return;
      }
    }
    saveBannersData(adminBannersState);
    renderBannerCarousel();
    const syncRes = await syncBannersToCloud(adminBannersState);
    if (syncRes && syncRes.error) {
      alert('⚠️ Banners guardados localmente, pero aviso en Supabase: ' + (syncRes.error.message || 'Verifica conexión'));
    } else {
      alert('¡Banners y promociones guardados y sincronizados en la nube exitosamente!');
    }
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

  // Ajustes: Cambiar clave (con encriptación SHA-256)
  document.getElementById('adminPassSaveBtn')?.addEventListener('click', async () => {
    const val = document.getElementById('adminNewPassInput').value.trim();
    if (!val || val.length < 4) {
      alert('La nueva clave debe tener al menos 4 caracteres.');
      return;
    }
    const adminData = getAdminData();
    adminData.passwordHash = await hashPasswordSHA256(val);
    delete adminData.password;
    saveAdminData(adminData);
    document.getElementById('adminNewPassInput').value = '';
    alert('¡Contraseña del panel actualizada y encriptada correctamente!');
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

/* =============== CARRUSEL DE BANNERS / PROMOCIONES =============== */
let bannerCarouselTimer = null;
let bannerCarouselTouchInitialized = false;

function renderBannerCarousel() {
  const carouselEl = document.getElementById('bannerCarousel');
  const dotsEl = document.getElementById('bannerDots');
  const sectionEl = document.getElementById('promociones');
  const prevBtn = document.getElementById('bannerPrevBtn');
  const nextBtn = document.getElementById('bannerNextBtn');

  if (!carouselEl) return;

  const banners = getBannersData();
  const defaultWa = getWhatsAppNumber();

  if (!banners || banners.length === 0) {
    if (sectionEl) sectionEl.style.display = 'none';
    return;
  }

  if (sectionEl) sectionEl.style.display = '';

  carouselEl.innerHTML = banners.map((b, i) => {
    const img = b.imageSrc || 'banner-1.jpg';
    const title = b.title || 'Promoción Guategreen';
    return `
      <div class="banner-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
        <div class="banner-link">
          <img src="${img}" alt="${title} - Guategreen Guatemala" class="banner-img" loading="lazy" decoding="async">
        </div>
      </div>
    `;
  }).join('');

  if (dotsEl) {
    if (banners.length > 1) {
      dotsEl.style.display = 'flex';
      dotsEl.innerHTML = banners.map((_, i) => `
        <button class="banner-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Ir a banner ${i + 1}"></button>
      `).join('');
    } else {
      dotsEl.style.display = 'none';
      dotsEl.innerHTML = '';
    }
  }

  if (prevBtn) prevBtn.style.display = banners.length > 1 ? 'flex' : 'none';
  if (nextBtn) nextBtn.style.display = banners.length > 1 ? 'flex' : 'none';

  initBannerCarousel();
}

function initBannerCarousel() {
  const container = document.getElementById('bannerCarouselContainer');
  if (!container) return;

  if (bannerCarouselTimer) {
    clearInterval(bannerCarouselTimer);
    bannerCarouselTimer = null;
  }

  const slides = container.querySelectorAll('.banner-slide');
  const dots = container.querySelectorAll('.banner-dot');
  const prevBtn = document.getElementById('bannerPrevBtn');
  const nextBtn = document.getElementById('bannerNextBtn');

  if (!slides.length) return;

  let currentIndex = 0;
  const slideInterval = 4500; // 4.5 segundos

  function goToSlide(index) {
    if (index < 0) {
      currentIndex = slides.length - 1;
    } else if (index >= slides.length) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }

    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentIndex);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  function startAutoPlay() {
    stopAutoPlay();
    if (slides.length > 1) {
      bannerCarouselTimer = setInterval(nextSlide, slideInterval);
    }
  }

  function stopAutoPlay() {
    if (bannerCarouselTimer) {
      clearInterval(bannerCarouselTimer);
      bannerCarouselTimer = null;
    }
  }

  // Asignar controladores directos
  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.preventDefault();
      nextSlide();
      startAutoPlay();
    };
  }

  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.preventDefault();
      prevSlide();
      startAutoPlay();
    };
  }

  dots.forEach((dot) => {
    dot.onclick = (e) => {
      e.preventDefault();
      const idx = parseInt(dot.dataset.index, 10);
      if (!isNaN(idx)) {
        goToSlide(idx);
        startAutoPlay();
      }
    };
  });

  container.onmouseenter = stopAutoPlay;
  container.onmouseleave = startAutoPlay;

  if (!bannerCarouselTouchInitialized) {
    bannerCarouselTouchInitialized = true;
    let touchStartX = 0;
    let touchEndX = 0;

    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoPlay();
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
      startAutoPlay();
    }, { passive: true });
  }

  goToSlide(0);
  startAutoPlay();
}

/* =============== INICIALIZACIÓN GENERAL =============== */
document.addEventListener('DOMContentLoaded', () => {
  initMarquee();
  initHeaderShrink();
  initMobileNav();
  initCartEvents();
  initModalEvents();
  initAdminEvents();
  renderBannerCarousel();
  renderCart(false);
  initScrollSpy();
  initScrollReveal();

  // 1. Renderizado instantáneo (0ms) de la interfaz
  renderHero();
  renderChips();
  renderGrid();
  renderMaintenanceUI();

  
  // Tracking Meta Ads: Checkout y Contacto
  document.getElementById('cartCheckout')?.addEventListener('click', () => {
    if (cart.length > 0) {
      const contents = cart.map(item => {
        const prod = getProducts().find(pp => Number(pp.id) === Number(item.id));
        return {
          id: String(item.id),
          quantity: item.qty,
          item_price: prod ? Number(prod.price) : 0
        };
      });
      trackMetaEvent('InitiateCheckout', {
        content_ids: cart.map(i => String(i.id)),
        contents: contents,
        num_items: cartCount(),
        value: cartTotal(),
        currency: 'GTQ'
      });
    }
  });

  document.querySelectorAll('.wa-fab, #heroWaBtn, .cta-banner a').forEach(btn => {
    btn.addEventListener('click', () => {
      trackMetaEvent('Contact', {
        content_name: 'Asesoría WhatsApp Botánica / Promoción Banner',
        currency: 'GTQ'
      });
    });
  });

  initMetaPixel();

  // 2. Conectar con Supabase en segundo plano sin congelar la pantalla
  initSupabase();

  // 3. Soporte para botones y enlaces de navegación suave (ej. 'Ver catálogo completo')
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#' || targetId === '#admin') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      visibleCount = 9999;
      renderGrid();
    });
  }
});
