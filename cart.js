/* ═══════════════════════════════════════════════════════════════════
   FUNGUYS — Sistema de Carrito
   Maneja: agregar/quitar productos, calcular totales, checkout con WhatsApp
   ═══════════════════════════════════════════════════════════════════ */

class ShoppingCart {
  constructor() {
    this.items = this.loadCart();
    this.listeners = [];
  }

  loadCart() {
    const saved = localStorage.getItem('funguys_cart');
    return saved ? JSON.parse(saved) : [];
  }

  saveCart() {
    localStorage.setItem('funguys_cart', JSON.stringify(this.items));
    this.notifyListeners();
  }

  // Agregar producto al carrito
  addItem(product, quantity = 1) {
    const existingItem = this.items.find(item => item.sku === product.sku);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        sku: product.sku,
        name: product.name,
        price: product.price,
        quantity: quantity,
        category: product.category
      });
    }
    
    this.saveCart();
    this.showNotification(`✓ ${product.name} agregado al carrito`);
  }

  // Remover producto del carrito
  removeItem(sku) {
    this.items = this.items.filter(item => item.sku !== sku);
    this.saveCart();
  }

  // Actualizar cantidad
  updateQuantity(sku, quantity) {
    const item = this.items.find(item => item.sku === sku);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(sku);
      } else {
        item.quantity = quantity;
        this.saveCart();
      }
    }
  }

  // Vaciar carrito
  clear() {
    this.items = [];
    this.saveCart();
  }

  // Calcular total
  getTotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Obtener cantidad de items
  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  // Suscribirse a cambios
  onChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.items));
  }

  // Generar mensaje para WhatsApp
  generateWhatsAppMessage(userData) {
    const orderNumber = Date.now().toString().slice(-6);
    let message = `Hola FunGuys! Quiero confirmar este pedido:\n\n`;
    message += `🛒 PEDIDO #${orderNumber}\n`;
    
    this.items.forEach(item => {
      message += `• ${item.name} (x${item.quantity}) — $${(item.price * item.quantity).toLocaleString('es-AR')}\n`;
    });
    
    message += `━━━━━━━━━━━━\n`;
    message += `TOTAL: $${this.getTotal().toLocaleString('es-AR')}\n\n`;
    message += `Datos:\n`;
    message += `Nombre: ${userData.name}\n`;
    message += `Email: ${userData.email}\n\n`;
    message += `¿Cómo realizo la transferencia?`;
    
    return encodeURIComponent(message);
  }

  // Abrir WhatsApp con pedido
  checkoutWhatsApp(userData, phoneNumber = '5491122798768') {
    const message = this.generateWhatsAppMessage(userData);
    const url = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(url, '_blank');
  }

  // Notificación visual
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 90px;
      right: 24px;
      background: var(--sage);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Instancia global del carrito
const cart = new ShoppingCart();

// Actualizar contador en el nav cuando cambia el carrito
cart.onChange(() => {
  updateCartBadge();
});

function updateCartBadge() {
  const badge = document.getElementById('cartCount');
  if (badge) {
    const count = cart.getItemCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// Renderizar carrito en modal/página
function renderCart(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (cart.items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 24px; color: var(--cream-muted);">
        <div style="font-size: 64px; margin-bottom: 16px;">🛒</div>
        <p style="font-size: 18px;">Tu carrito está vacío</p>
        <a href="insumos.html" class="btn btn-primary" style="margin-top: 24px;">Ver productos</a>
      </div>
    `;
    return;
  }

  let html = '<div class="cart-items">';
  
  cart.items.forEach(item => {
    html += `
      <div class="cart-item" data-sku="${item.sku}">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p class="text-muted" style="font-size: 13px;">${item.category}</p>
        </div>
        <div class="cart-item-controls">
          <div class="quantity-controls">
            <button onclick="cart.updateQuantity('${item.sku}', ${item.quantity - 1})" class="qty-btn">−</button>
            <input type="number" value="${item.quantity}" min="1" 
                   onchange="cart.updateQuantity('${item.sku}', parseInt(this.value))"
                   style="width: 60px; text-align: center; background: var(--surface2); border: 1px solid var(--border); 
                          color: var(--cream); padding: 8px; border-radius: 6px;">
            <button onclick="cart.updateQuantity('${item.sku}', ${item.quantity + 1})" class="qty-btn">+</button>
          </div>
          <div class="cart-item-price">
            <span style="font-weight: 600; color: var(--amber);">$${(item.price * item.quantity).toLocaleString('es-AR')}</span>
            <button onclick="cart.removeItem('${item.sku}')" class="btn-remove" title="Eliminar">🗑️</button>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  html += `
    <div class="cart-summary">
      <div class="cart-total">
        <span style="font-size: 18px; font-weight: 600;">TOTAL</span>
        <span style="font-size: 28px; font-weight: 700; color: var(--amber);">$${cart.getTotal().toLocaleString('es-AR')}</span>
      </div>
      <button onclick="openCheckoutModal()" class="btn btn-primary btn-large" style="width: 100%;">
        Finalizar compra →
      </button>
      <button onclick="cart.clear()" class="btn btn-ghost" style="width: 100%; margin-top: 12px;">
        Vaciar carrito
      </button>
    </div>
  `;
  
  container.innerHTML = html;
}

// Modal de checkout
function openCheckoutModal() {
  if (cart.items.length === 0) {
    alert('El carrito está vacío');
    return;
  }

  const modal = document.getElementById('checkoutModal');
  if (!modal) {
    createCheckoutModal();
    return;
  }
  
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function createCheckoutModal() {
  const modal = document.createElement('div');
  modal.id = 'checkoutModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-backdrop" onclick="closeCheckoutModal()"></div>
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h3>Finalizar pedido</h3>
        <button onclick="closeCheckoutModal()" class="modal-close">✕</button>
      </div>
      <div class="modal-body">
        <p class="text-muted mb-lg">Ingresá tus datos para confirmar el pedido. Te vamos a enviar a WhatsApp con el resumen y los datos para la transferencia.</p>
        
        <div class="form-group">
          <label>Nombre completo *</label>
          <input type="text" id="checkoutName" placeholder="Juan Pérez" required>
        </div>
        
        <div class="form-group">
          <label>Email *</label>
          <input type="email" id="checkoutEmail" placeholder="juan@ejemplo.com" required>
        </div>
        
        <div class="form-group">
          <label>WhatsApp (opcional)</label>
          <input type="tel" id="checkoutPhone" placeholder="+54 9 11 1234-5678">
        </div>
        
        <div class="cart-summary" style="margin-top: 32px; padding: 20px; background: var(--surface2); border-radius: 12px;">
          <h4 style="margin-bottom: 16px;">Resumen del pedido</h4>
          <div id="checkoutSummary"></div>
          <div style="border-top: 1px solid var(--border); margin: 16px 0; padding-top: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600;">TOTAL</span>
              <span style="font-size: 24px; font-weight: 700; color: var(--amber);">$${cart.getTotal().toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>
        
        <div id="checkoutError" style="display: none; color: #fca5a5; background: rgba(220,38,38,0.12); 
             padding: 12px; border-radius: 8px; margin-top: 16px; font-size: 14px;"></div>
      </div>
      <div class="modal-footer">
        <button onclick="closeCheckoutModal()" class="btn btn-secondary">Cancelar</button>
        <button onclick="submitCheckout()" class="btn btn-primary">Confirmar pedido →</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Renderizar resumen
  let summary = '';
  cart.items.forEach(item => {
    summary += `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
        <span>${item.name} (x${item.quantity})</span>
        <span style="color: var(--amber);">$${(item.price * item.quantity).toLocaleString('es-AR')}</span>
      </div>
    `;
  });
  document.getElementById('checkoutSummary').innerHTML = summary;
  
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

async function submitCheckout() {
  const name = document.getElementById('checkoutName').value.trim();
  const email = document.getElementById('checkoutEmail').value.trim();
  const phone = document.getElementById('checkoutPhone').value.trim();
  const errorEl = document.getElementById('checkoutError');
  
  // Validación
  if (!name) {
    showCheckoutError('Por favor ingresá tu nombre');
    return;
  }
  
  if (!email || !email.includes('@')) {
    showCheckoutError('Por favor ingresá un email válido');
    return;
  }
  
  errorEl.style.display = 'none';
  
  // Guardar pedido en Google Sheets (si está configurado)
  const orderData = {
    timestamp: new Date().toISOString(),
    orderNumber: Date.now().toString().slice(-6),
    name,
    email,
    phone,
    items: cart.items,
    total: cart.getTotal(),
    status: 'PENDIENTE'
  };
  
  // Intentar guardar en Google Sheets
  try {
    if (window.ORDERS_SCRIPT_URL && window.ORDERS_SCRIPT_URL !== 'REEMPLAZAR_CON_URL') {
      await fetch(window.ORDERS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
    }
  } catch (err) {
    console.warn('No se pudo guardar en Google Sheets:', err);
  }
  
  // Abrir WhatsApp
  cart.checkoutWhatsApp({ name, email });
  
  // Cerrar modal
  closeCheckoutModal();
  
  // Mostrar confirmación
  showOrderConfirmation(orderData.orderNumber);
  
  // Limpiar carrito (opcional - comentá esta línea si querés que no se limpie hasta que confirmen pago)
  // cart.clear();
}

function showCheckoutError(message) {
  const errorEl = document.getElementById('checkoutError');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

function showOrderConfirmation(orderNumber) {
  const confirmation = document.createElement('div');
  confirmation.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100000;
  `;
  
  confirmation.innerHTML = `
    <div style="background: var(--surface); padding: 40px; border-radius: 20px; max-width: 500px; text-align: center;">
      <div style="font-size: 72px; margin-bottom: 16px;">✅</div>
      <h3 style="margin-bottom: 16px;">¡Pedido confirmado!</h3>
      <p style="color: var(--cream-muted); margin-bottom: 24px; line-height: 1.7;">
        Tu pedido #${orderNumber} ha sido enviado.<br>
        Revisá tu WhatsApp para los datos de transferencia.
      </p>
      <button onclick="this.closest('div').parentElement.remove()" class="btn btn-primary">
        Entendido
      </button>
    </div>
  `;
  
  document.body.appendChild(confirmation);
  
  setTimeout(() => {
    confirmation.remove();
  }, 8000);
}

// CSS para estilos del carrito
const cartStyles = document.createElement('style');
cartStyles.textContent = `
  .cart-items {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .cart-item {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  
  .cart-item h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
  }
  
  .cart-item-controls {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .quantity-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .qty-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--cream);
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .qty-btn:hover {
    background: var(--amber);
    color: var(--bg);
    border-color: var(--amber);
  }
  
  .cart-item-price {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .btn-remove {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 20px;
    opacity: 0.5;
    transition: opacity 0.2s;
  }
  
  .btn-remove:hover {
    opacity: 1;
  }
  
  .cart-summary {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
  }
  
  .cart-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
    border-bottom: 2px solid var(--border);
    margin-bottom: 24px;
  }
  
  .modal {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  
  .modal.open {
    display: flex;
  }
  
  .modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(4px);
  }
  
  .modal-content {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: 20px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    animation: modalIn 0.3s ease;
  }
  
  @keyframes modalIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  .modal-header {
    padding: 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 24px;
  }
  
  .modal-close {
    background: none;
    border: none;
    font-size: 28px;
    color: var(--cream-muted);
    cursor: pointer;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s;
  }
  
  .modal-close:hover {
    background: var(--surface2);
    color: var(--cream);
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .modal-footer {
    padding: 24px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: var(--cream);
  }
  
  .form-group input {
    width: 100%;
    padding: 12px 16px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--cream);
    font-size: 15px;
    transition: border-color 0.2s;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: var(--amber);
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }
  
  @media (max-width: 768px) {
    .cart-item {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .cart-item-controls {
      width: 100%;
      justify-content: space-between;
    }
  }
`;

document.head.appendChild(cartStyles);

// Inicializar badge al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
});
