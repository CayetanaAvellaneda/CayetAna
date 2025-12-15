// ===== CONFIGURACIÓN =====
const CONFIG = {
  price: 50000,
  mercadoPagoLink: 'link.mercadopago.com.ar/tiendacayetana', // Reemplazar con tu link real
  whatsappNumber: '5491127419605', // Número sin 0 al inicio, con país (54)
  whatsappDefaultMessage: 'Hola CayetAna, quiero saber más sobre el mono negro.'
};

const STORAGE_KEYS = {
  cart: 'cayetana_cart',
  orders: 'cayetana_orders'
};

// ===== SELECTORES =====
const selectors = {
  // Carrito
  cartToggle: document.getElementById('cartToggle'),
  cartPanel: document.getElementById('cartPanel'),
  cartBadge: document.getElementById('cartBadge'),
  cartList: document.getElementById('cartList'),
  cartTotal: document.getElementById('cartTotal'),
  proceedCheckout: document.getElementById('proceedCheckout'),

  // Producto
  priceDisplay: document.getElementById('priceDisplay'),
  productForm: document.getElementById('productForm'),
  qty: document.getElementById('qty'),

  // Navs
  navLinks: document.querySelectorAll('[data-nav]'),

  // Checkout
  checkoutForm: document.getElementById('checkoutForm'),
  shippingOptions: document.getElementById('shippingOptions'),

  // Payment
  paymentSubmit: document.getElementById('paymentSubmit'),
  paymentOptions: document.getElementById('paymentOptions'),
  summarySubtotal: document.getElementById('summarySubtotal'),
  summaryShipping: document.getElementById('summaryShipping'),
  summaryTotal: document.getElementById('summaryTotal'),

  // Confirmación
  confirmationContent: document.getElementById('confirmationContent'),

  // WhatsApp
  whatsappFloat: document.getElementById('whatsappFloat')
};

// ===== UTILIDADES =====
function formatMoney(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(value);
}

function loadCart() {
  const stored = localStorage.getItem(STORAGE_KEYS.cart);
  return stored ? JSON.parse(stored) : null;
}

function saveCart(cart) {
  if (!cart) {
    localStorage.removeItem(STORAGE_KEYS.cart);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
}

function getOrders() {
  const stored = localStorage.getItem(STORAGE_KEYS.orders);
  return stored ? JSON.parse(stored) : [];
}

function saveOrders(list) {
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(list));
}

function showSection(id) {
  // Solo oculta/muestra secciones de checkout, payment y confirmation
  const hiddenSections = ['checkout', 'payment', 'confirmation'];
  hiddenSections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) section.classList.add('section--hidden');
  });
  
  if (hiddenSections.includes(id)) {
    const section = document.getElementById(id);
    if (section) section.classList.remove('section--hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    scrollToSection(id);
  }
}

function scrollToSection(id) {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function generateOrderId() {
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `CAY-${stamp}-${rand}`;
}


// ===== CARRITO FLOTANTE =====
function renderCart() {
  const cart = loadCart();
  if (!cart) {
    selectors.cartList.innerHTML = '<p class="muted" style="padding: 20px 0; text-align: center;">Carrito vacío</p>';
    selectors.cartBadge.textContent = '0';
    selectors.cartTotal.textContent = '$0';
    return;
  }

  const subtotal = cart.quantity * cart.price;
  const shipping = cart.shippingCost || 0;
  const total = subtotal + shipping;

  selectors.cartList.innerHTML = `
    <div class="cart-item">
      <div class="cart-item__info">
        <strong>Mono Negro</strong><br>
        Talle: ${cart.size}<br>
        Cantidad: ${cart.quantity}<br>
        ${formatMoney(subtotal)}
      </div>
      <button class="cart-item__remove" onclick="removeFromCart()">✕</button>
    </div>
  `;

  selectors.cartBadge.textContent = cart.quantity;
  selectors.cartTotal.textContent = formatMoney(total);
}

function removeFromCart() {
  saveCart(null);
  renderCart();
}

function toggleCart() {
  selectors.cartPanel.classList.toggle('active');
}

// ===== PRODUCTO =====
function handleProductSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const size = formData.get('size');
  const qty = Math.min(5, Math.max(1, Number(formData.get('qty')) || 1));

  const cart = {
    size,
    quantity: qty,
    price: CONFIG.price,
    shippingCost: 0
  };

  saveCart(cart);
  renderCart();

  // Auto-mostrar carrito
  if (!selectors.cartPanel.classList.contains('active')) {
    toggleCart();
  }
}

// ===== CHECKOUT (Datos + Envío) =====
function handleCheckoutSubmit(event) {
  event.preventDefault();
  const cart = loadCart();
  if (!cart) {
    alert('Agrega el producto al carrito');
    showSection('home');
    return;
  }

  const formData = new FormData(event.target);
  const fullName = formData.get('fullName')?.trim();
  const phone = formData.get('phone')?.trim();
  const address = formData.get('address')?.trim();
  const zone = formData.get('zone')?.trim();

  if (!fullName || !phone || !address || !zone) {
    alert('Completa los campos obligatorios');
    return;
  }

  // Obtener envío seleccionado
  const shippingRadio = selectors.shippingOptions.querySelector('input[name="shipping"]:checked');
  const shippingCost = shippingRadio ? Number(shippingRadio.dataset.cost) : 0;

  // Guardar datos en carrito
  cart.shippingCost = shippingCost;
  cart.shippingMethod = shippingRadio.value;
  cart.customer = {
    fullName,
    phone,
    email: formData.get('email')?.trim() || '',
    address,
    zone,
    notes: formData.get('notes')?.trim() || ''
  };

  saveCart(cart);
  updatePaymentSummary();
  showSection('payment');
}

function updatePaymentSummary() {
  const cart = loadCart();
  if (!cart) return;

  const subtotal = cart.quantity * cart.price;
  const shipping = cart.shippingCost || 0;
  const total = subtotal + shipping;

  selectors.summarySubtotal.textContent = formatMoney(subtotal);
  selectors.summaryShipping.textContent = formatMoney(shipping);
  selectors.summaryTotal.textContent = formatMoney(total);
}

// ===== PAGO =====
function handlePaymentSubmit() {
  const cart = loadCart();
  if (!cart || !cart.customer) {
    alert('Completa los datos de entrega');
    showSection('checkout');
    return;
  }

  const paymentRadio = selectors.paymentOptions.querySelector('input[name="payment"]:checked');
  const paymentMethod = paymentRadio.value;

  // Crear orden
  const orderId = generateOrderId();
  const subtotal = cart.quantity * cart.price;
  const shipping = cart.shippingCost || 0;
  const total = subtotal + shipping;

  const order = {
    id: orderId,
    createdAt: new Date().toISOString(),
    cart,
    paymentMethod,
    subtotal,
    shipping,
    total
  };

  // Guardar orden
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);

  // Mostrar confirmación
  showConfirmation(order, paymentMethod);
  saveCart(null);
  renderCart();
}

function showConfirmation(order, paymentMethod) {
  const whatsappMessage = `Hola CayetAna! Soy ${order.cart.customer.fullName}. 
Mi pedido es ${order.id}.
Total: ${formatMoney(order.total)}
Envío: ${order.cart.shippingMethod}`;

  const whatsappLink = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  let paymentInfo = '';
  if (paymentMethod === 'mercado-pago') {
    paymentInfo = `<p><strong>Link Mercado Pago:</strong> <a href="${CONFIG.mercadoPagoLink}" target="_blank" rel="noopener" class="btn btn--primary">Ir a Mercado Pago</a></p>`;
  } else if (paymentMethod === 'efectivo') {
    paymentInfo = '<p><strong>Punto de encuentro:</strong> Te contactaremos por WhatsApp para confirmar la ubicación y hora.</p>';
  } else if (paymentMethod === 'transferencia') {
    paymentInfo = '<p><strong>Transferencia:</strong> Te pasaremos los datos bancarios por WhatsApp.</p>';
  }

  selectors.confirmationContent.innerHTML = `
    <div style="padding: 12px; background: #e7fff6; border-radius: 10px; margin-bottom: 16px;">
      <p style="margin: 0; color: #137a5b; font-weight: 700;">✓ Pedido registrado correctamente</p>
    </div>
    <p><strong>Número de pedido:</strong> ${order.id}</p>
    <p><strong>Cliente:</strong> ${order.cart.customer.fullName}</p>
    <p><strong>Teléfono:</strong> ${order.cart.customer.phone}</p>
    <p><strong>Dirección:</strong> ${order.cart.customer.address}</p>
    <p><strong>Zona:</strong> ${order.cart.customer.zone}</p>
    <p><strong>Producto:</strong> Mono Negro</p>
    <p><strong>Talle:</strong> ${order.cart.size}</p>
    <p><strong>Cantidad:</strong> ${order.cart.quantity}</p>
    <p><strong>Subtotal:</strong> ${formatMoney(order.subtotal)}</p>
    <p><strong>Envío:</strong> ${formatMoney(order.shipping)}</p>
    <p class="totals"><strong>Total:</strong> ${formatMoney(order.total)}</p>
    ${paymentInfo}
    <p style="background: #ffe3ec; padding: 12px; border-radius: 10px; margin: 16px 0; font-size: 13px;">
      Completa el pago y <strong>envía el comprobante por WhatsApp</strong> para que continuemos con tu pedido.
    </p>
    <div class="actions full-row">
      <a href="${whatsappLink}" target="_blank" rel="noopener" class="btn btn--primary" style="width: 100%; text-align: center;">
        Enviar comprobante por WhatsApp
      </a>
    </div>
  `;

  showSection('confirmation');
  updateWhatsappFloat(whatsappMessage);
}

// ===== NAVEGACIÓN =====
function attachNavigation() {
  selectors.navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const section = link.dataset.nav;
      scrollToSection(section);
    });
  });
}

function updateWhatsappFloat(message = CONFIG.whatsappDefaultMessage) {
  const encoded = encodeURIComponent(message);
  selectors.whatsappFloat.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encoded}`;
}

function getSelectedShipping() {
  const checked = selectors.shippingOptions.querySelector('input[name="shipping"]:checked');
  const cost = checked ? Number(checked.dataset.cost) : 0;
  return { method: checked ? checked.value : 'Envío gratis', cost };
}

function updateWhatsappFloat(message = CONFIG.whatsappDefaultMessage) {
  const encoded = encodeURIComponent(message);
  selectors.whatsappFloat.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encoded}`;
}

// ===== INICIALIZACIÓN =====
function init() {
  // Precio
  selectors.priceDisplay.textContent = formatMoney(CONFIG.price);

  // Carrito flotante
  selectors.cartToggle.addEventListener('click', toggleCart);
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.cart-floating')) {
      selectors.cartPanel.classList.remove('active');
    }
  });

  // Formularios
  selectors.productForm.addEventListener('submit', handleProductSubmit);
  selectors.checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  selectors.proceedCheckout.addEventListener('click', () => {
    if (!loadCart()) {
      alert('Agrega el producto al carrito');
      return;
    }
    selectors.cartPanel.classList.remove('active');
    showSection('checkout');
  });
  selectors.paymentSubmit.addEventListener('click', handlePaymentSubmit);

  // Navegación
  attachNavigation();

  // Renderizar carrito inicial
  renderCart();
  updateWhatsappFloat();
}

// ===== EJECUTAR =====
document.addEventListener('DOMContentLoaded', init);
