/* ═══════════════════════════════════════════════════════════════════
   FUNGUYS — Sistema de Inventario
   Conecta con Google Sheets para leer productos y stock en tiempo real
   ═══════════════════════════════════════════════════════════════════ */

// URL del Apps Script para inventario (configurar en el HTML)
window.INVENTORY_SCRIPT_URL = window.INVENTORY_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbx6yKA2KUgtFq3BVn8FwPkt2_vZ3F8ARr-TmaVpAktZYe8Eqbj2o3hIsTXg5uf6RxI/exec';

class Inventory {
  constructor() {
    this.products = [];
    this.loading = false;
    this.lastFetch = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutos
  }

  // Cargar productos desde Google Sheets
  async fetchProducts(forceRefresh = false) {
    // Si tenemos caché reciente y no es refresh forzado, usar caché
    if (!forceRefresh && this.lastFetch && (Date.now() - this.lastFetch) < this.cacheDuration) {
      return this.products;
    }

    // Si la URL no está configurada, usar datos mock
    if (!window.INVENTORY_SCRIPT_URL || window.INVENTORY_SCRIPT_URL === 'https://script.google.com/macros/s/AKfycbx6yKA2KUgtFq3BVn8FwPkt2_vZ3F8ARr-TmaVpAktZYe8Eqbj2o3hIsTXg5uf6RxI/exec') {
      console.warn('⚠️ URL de inventario no configurada. Usando datos de ejemplo.');
      this.products = this.getMockProducts();
      return this.products;
    }

    this.loading = true;

    try {
      const response = await fetch(window.INVENTORY_SCRIPT_URL);
      const data = await response.json();
      
      if (data.status === 'ok') {
        this.products = data.products.filter(p => p.active);
        this.lastFetch = Date.now();
        this.saveToCache();
      } else {
        throw new Error(data.message || 'Error al cargar productos');
      }
    } catch (err) {
      console.error('Error al cargar inventario:', err);
      // Intentar usar caché local
      const cached = this.loadFromCache();
      if (cached) {
        this.products = cached;
        console.log('Usando inventario en caché');
      } else {
        this.products = this.getMockProducts();
        console.log('Usando inventario mock');
      }
    } finally {
      this.loading = false;
    }

    return this.products;
  }

  // Obtener productos por categoría
  getByCategory(category) {
    return this.products.filter(p => p.category === category);
  }

  // Obtener producto por SKU
  getBySKU(sku) {
    return this.products.find(p => p.sku === sku);
  }

  // Verificar stock disponible
  checkStock(sku, quantity = 1) {
    const product = this.getBySKU(sku);
    return product && product.stock >= quantity;
  }

  // Guardar en caché local
  saveToCache() {
    try {
      localStorage.setItem('funguys_inventory_cache', JSON.stringify({
        products: this.products,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('No se pudo guardar caché:', err);
    }
  }

  // Cargar desde caché local
  loadFromCache() {
    try {
      const cached = localStorage.getItem('funguys_inventory_cache');
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      // Verificar que el caché no sea muy viejo (1 hora)
      if (Date.now() - data.timestamp > 60 * 60 * 1000) {
        return null;
      }
      
      return data.products;
    } catch (err) {
      return null;
    }
  }

  // Datos mock para desarrollo/fallback
  getMockProducts() {
    return [
      // SUSTRATOS
      { sku: 'SUS-001', name: 'Viruta de álamo', category: 'sustratos', price: 2500, stock: 150, unit: 'kg', image: '', active: true },
      { sku: 'SUS-002', name: 'Chipeado de pecán', category: 'sustratos', price: 3200, stock: 80, unit: 'kg', image: '', active: true },
      { sku: 'SUS-003', name: 'Chip de fresno', category: 'sustratos', price: 2800, stock: 100, unit: 'kg', image: '', active: true },
      { sku: 'SUS-004', name: 'Aserrín/viruta de eucalipto', category: 'sustratos', price: 2200, stock: 200, unit: 'kg', image: '', active: true },
      
      // ADITIVOS
      { sku: 'ADI-001', name: 'Afrechillo de trigo', category: 'aditivos', price: 1800, stock: 120, unit: 'kg', image: '', active: true },
      { sku: 'ADI-002', name: 'Avena (grano)', category: 'aditivos', price: 2100, stock: 90, unit: 'kg', image: '', active: true },
      { sku: 'ADI-003', name: 'Cal agrícola', category: 'aditivos', price: 800, stock: 250, unit: 'kg', image: '', active: true },
      { sku: 'ADI-004', name: 'Yeso agrícola', category: 'aditivos', price: 600, stock: 300, unit: 'kg', image: '', active: true },
      
      // MATERIALES
      { sku: 'MAT-001', name: 'Bolsa polipropileno 40×60', category: 'materiales', price: 350, stock: 500, unit: 'unidad', image: '', active: true },
      { sku: 'MAT-002', name: 'Bolsa polipropileno 40×50', category: 'materiales', price: 320, stock: 450, unit: 'unidad', image: '', active: true },
      { sku: 'MAT-003', name: 'Bolsa polipropileno 20×30', category: 'materiales', price: 180, stock: 600, unit: 'unidad', image: '', active: true },
      
      // SPAWN/SEMILLA
      { sku: 'SPA-001', name: 'Spawn Gírgola Gris 1kg', category: 'spawn', price: 8500, stock: 50, unit: 'kg', image: '', active: true },
      { sku: 'SPA-002', name: 'Spawn Gírgola Reina 1kg', category: 'spawn', price: 9500, stock: 35, unit: 'kg', image: '', active: true },
      { sku: 'SPA-003', name: 'Spawn Shiitake 1kg', category: 'spawn', price: 11000, stock: 25, unit: 'kg', image: '', active: true },
      
      // CONSUMIBLES
      { sku: 'CON-001', name: 'Guantes descartables (caja x100)', category: 'consumibles', price: 4500, stock: 80, unit: 'caja', image: '', active: true },
      { sku: 'CON-002', name: 'Mechero/gas para esterilización', category: 'consumibles', price: 2800, stock: 60, unit: 'unidad', image: '', active: true }
    ];
  }

  // Renderizar catálogo de productos
  renderCatalog(containerId, categoryFilter = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.loading) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 24px;">
          <div class="spinner"></div>
          <p style="color: var(--cream-muted); margin-top: 16px;">Cargando productos...</p>
        </div>
      `;
      return;
    }

    let products = this.products;
    if (categoryFilter) {
      products = products.filter(p => p.category === categoryFilter);
    }

    if (products.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 24px; color: var(--cream-muted);">
          <p style="font-size: 18px;">No hay productos disponibles en esta categoría</p>
        </div>
      `;
      return;
    }

    // Agrupar por categoría
    const grouped = {};
    products.forEach(p => {
      if (!grouped[p.category]) {
        grouped[p.category] = [];
      }
      grouped[p.category].push(p);
    });

    let html = '';
    const categoryNames = {
      'sustratos': '🌾 Sustratos',
      'aditivos': '🧪 Aditivos',
      'materiales': '📦 Materiales',
      'spawn': '🍄 Spawn / Semilla',
      'consumibles': '🧤 Consumibles'
    };

    Object.keys(grouped).forEach(cat => {
      html += `
        <div class="product-category">
          <h3 class="category-title">${categoryNames[cat] || cat}</h3>
          <div class="product-grid grid grid-3">
      `;

      grouped[cat].forEach(product => {
        const stockBadge = product.stock > 50 
          ? '<span class="badge badge-success">En stock</span>'
          : product.stock > 10
          ? '<span class="badge badge-warning">Stock limitado</span>'
          : '<span class="badge badge-error">Últimas unidades</span>';

        html += `
          <div class="product-card card">
            ${product.image ? `<img src="${product.image}" alt="${product.name}" class="product-image">` : ''}
            <div class="product-info">
              <h4 class="product-name">${product.name}</h4>
              <p class="product-meta text-muted">${product.unit}</p>
              ${stockBadge}
              <div class="product-price">
                <span class="price-amount">$${product.price.toLocaleString('es-AR')}</span>
                <span class="price-unit">/ ${product.unit}</span>
              </div>
              <div class="product-actions">
                <div class="quantity-selector">
                  <button class="qty-btn" onclick="decrementQty('${product.sku}')">−</button>
                  <input type="number" id="qty_${product.sku}" value="1" min="1" max="${product.stock}" 
                         style="width: 60px; text-align: center; background: var(--surface2); 
                                border: 1px solid var(--border); color: var(--cream); padding: 8px; border-radius: 6px;">
                  <button class="qty-btn" onclick="incrementQty('${product.sku}')">+</button>
                </div>
                <button onclick="addToCart('${product.sku}')" class="btn btn-primary btn-small" 
                        ${product.stock === 0 ? 'disabled' : ''}>
                  ${product.stock === 0 ? 'Sin stock' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }
}

// Instancia global del inventario
const inventory = new Inventory();

// Funciones globales para el catálogo
function incrementQty(sku) {
  const input = document.getElementById(`qty_${sku}`);
  if (input) {
    const max = parseInt(input.getAttribute('max'));
    const current = parseInt(input.value);
    if (current < max) {
      input.value = current + 1;
    }
  }
}

function decrementQty(sku) {
  const input = document.getElementById(`qty_${sku}`);
  if (input) {
    const current = parseInt(input.value);
    if (current > 1) {
      input.value = current - 1;
    }
  }
}

function addToCart(sku) {
  const product = inventory.getBySKU(sku);
  if (!product) {
    alert('Producto no encontrado');
    return;
  }

  const qtyInput = document.getElementById(`qty_${sku}`);
  const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

  if (!inventory.checkStock(sku, quantity)) {
    alert('Stock insuficiente');
    return;
  }

  cart.addItem(product, quantity);
  
  // Reset quantity
  if (qtyInput) {
    qtyInput.value = 1;
  }
}

// CSS para productos
const inventoryStyles = document.createElement('style');
inventoryStyles.textContent = `
  .product-category {
    margin-bottom: var(--space-3xl);
  }
  
  .category-title {
    font-size: 28px;
    margin-bottom: var(--space-lg);
    padding-bottom: var(--space-md);
    border-bottom: 2px solid var(--border);
  }
  
  .product-grid {
    gap: var(--space-lg);
  }
  
  .product-card {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .product-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: var(--radius);
    margin-bottom: var(--space-md);
    background: var(--surface2);
  }
  
  .product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .product-name {
    font-size: 18px;
    margin-bottom: 4px;
  }
  
  .product-meta {
    font-size: 13px;
    margin-bottom: var(--space-sm);
  }
  
  .product-price {
    margin: var(--space-md) 0;
    padding: var(--space-md) 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  
  .price-amount {
    font-size: 28px;
    font-weight: 700;
    color: var(--amber);
    font-family: 'Fraunces', serif;
  }
  
  .price-unit {
    font-size: 14px;
    color: var(--cream-muted);
    margin-left: 4px;
  }
  
  .product-actions {
    margin-top: auto;
    display: flex;
    gap: var(--space-sm);
    align-items: center;
  }
  
  .quantity-selector {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--border);
    border-top-color: var(--amber);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

document.head.appendChild(inventoryStyles);

// Inicializar inventario al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('catalogContainer')) {
    await inventory.fetchProducts();
    inventory.renderCatalog('catalogContainer');
  }
});
