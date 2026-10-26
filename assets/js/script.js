'use strict';

(() => {
  const STORAGE = { cart: 'priyanshi_cart_v1', orders: 'priyanshi_orders_v1', user: 'priyanshi_user_v1' };
  const USD_TO_INR = 1;
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(value));
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let cart = read(STORAGE.cart, []);
  let discountCode = '';

  // Preserve original dollar values as product data, then display converted INR prices.
  const products = new Map();
  document.querySelectorAll('.showcase').forEach((card, index) => {
    const title = card.querySelector('.showcase-title')?.textContent.trim();
    const priceEl = card.querySelector('.price');
    const img = card.querySelector('img');
    if (!title || !priceEl) return;
    const usd = Number((priceEl.textContent.match(/[\d,.]+/) || ['0'])[0].replace(/,/g, ''));
    if (!usd) return;
    const id = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`;
    const product = { id, title, price: Math.round(usd * USD_TO_INR), image: img?.getAttribute('src') || '', category: card.querySelector('.showcase-category')?.textContent.trim() || 'General' };
    products.set(id, product);
    card.dataset.productId = id;
    card.querySelectorAll('.price, del').forEach(el => {
      const amount = Number((el.textContent.match(/[\d,.]+/) || ['0'])[0].replace(/,/g, ''));
      if (amount) el.textContent = money(amount * USD_TO_INR);
    });
    if (!card.querySelector('.add-to-cart')) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'add-to-cart'; btn.dataset.addProduct = id;
      btn.textContent = 'Add to Cart';
      card.querySelector('.showcase-content')?.append(btn);
    }
  });

  // Convert other visible USD amounts and make the storefront India-focused.
  document.querySelectorAll('body *').forEach(el => {
    if (el.children.length || el.closest('.showcase') || el.dataset.inrDone) return;
    if (!el.textContent.includes('$')) return;
    el.textContent = el.textContent.replace(/\$\s*([\d,]+(?:\.\d{1,2})?)/g, (_, amount) => money(Number(amount.replace(/,/g, '')) * USD_TO_INR));
    el.dataset.inrDone = 'true';
  });
  const currencySelect = document.querySelector('select[name="currency"]');
  if (currencySelect) {
    currencySelect.innerHTML = '<option value="inr" selected>INR ₹</option>';
    currencySelect.disabled = true;
  }
  document.querySelectorAll('.header-alert-news p').forEach(el => el.innerHTML = '<b>Free Shipping</b> on orders over ₹999');

  const style = document.createElement('style');
  style.textContent = `
    .shop-panel{position:fixed;inset:0;z-index:10000;background:#0008;display:none;align-items:flex-start;justify-content:center;padding:4vh 14px;overflow:auto}
    .shop-panel.open{display:flex}.shop-modal{background:#fff;color:#222;width:min(720px,100%);max-height:92vh;overflow:auto;border-radius:14px;padding:24px;box-shadow:0 20px 70px #0004}
    .shop-head{display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid #eee;padding-bottom:14px;margin-bottom:18px}
    .shop-head h2{font-size:23px;margin:0}.shop-close{border:0;background:#f3f3f3;border-radius:50%;width:36px;height:36px;font-size:22px;cursor:pointer}
    .cart-row{display:grid;grid-template-columns:64px 1fr auto;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid #eee}
    .cart-row img{width:64px;height:64px;object-fit:contain;border-radius:8px;background:#fafafa}.cart-row h4{margin:0 0 6px;font-size:14px}.cart-row p{margin:0;color:#666;font-size:13px}
    .qty-tools{display:flex;align-items:center;gap:8px;margin-top:8px}.qty-tools button,.remove-item{border:1px solid #ddd;background:#fff;border-radius:6px;padding:4px 9px;cursor:pointer}.remove-item{color:#b42318}
    .shop-summary{margin:18px 0 6px;display:grid;gap:9px}.summary-line{display:flex;justify-content:space-between;gap:12px}.summary-line.total{font-weight:700;font-size:19px;border-top:1px solid #eee;padding-top:12px}
    .shop-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.shop-form label{font-size:13px;display:grid;gap:6px}.shop-form input,.coupon-row input{border:1px solid #ddd;border-radius:7px;padding:11px;width:100%;min-width:0}
    .shop-form .full{grid-column:1/-1}.shop-primary,.shop-secondary{border:0;border-radius:8px;padding:12px 16px;cursor:pointer;font-weight:600}.shop-primary{background:#222;color:#fff}.shop-secondary{background:#f0f0f0;color:#222}
    .coupon-row{display:flex;gap:8px;margin:16px 0}.coupon-row button{white-space:nowrap}.shop-empty{padding:28px 8px;text-align:center;color:#666}.shop-note{font-size:12px;color:#666;line-height:1.5}
    .add-to-cart{display:block;width:100%;margin-top:10px;padding:10px;border:0;border-radius:6px;background:#222;color:white;font-weight:600;cursor:pointer}.add-to-cart:hover,.shop-primary:hover{background:#444}
    .shop-tabs{display:flex;gap:8px;margin-bottom:16px}.shop-tabs button{flex:1}.order-card{border:1px solid #eee;border-radius:9px;padding:14px;margin:10px 0}.order-card p{margin:6px 0;color:#555}
    .header-user-actions .action-btn,.mobile-bottom-navigation .action-btn{cursor:pointer}
    @media(max-width:520px){.shop-modal{padding:16px}.shop-form{grid-template-columns:1fr}.shop-form .full{grid-column:auto}.cart-row{grid-template-columns:52px 1fr}.cart-row img{width:52px;height:52px}.cart-row>.cart-side{grid-column:2}.shop-head h2{font-size:19px}}
  `;
  document.head.append(style);

  const panel = document.createElement('div');
  panel.className = 'shop-panel';
  panel.innerHTML = '<section class="shop-modal" role="dialog" aria-modal="true" aria-label="Store panel"><div class="shop-head"><h2 id="shop-title">Your Cart</h2><button class="shop-close" type="button" aria-label="Close">×</button></div><div id="shop-body"></div></section>';
  document.body.append(panel);
  const body = panel.querySelector('#shop-body');
  const title = panel.querySelector('#shop-title');
  const open = (heading, renderer) => { title.textContent = heading; renderer(); panel.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { panel.classList.remove('open'); document.body.style.overflow = ''; };
  panel.querySelector('.shop-close').addEventListener('click', close);
  panel.addEventListener('click', e => { if (e.target === panel) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  function cartCount() { return cart.reduce((sum, item) => sum + item.qty, 0); }
  function updateBadges() {
    document.querySelectorAll('.header-user-actions .action-btn, .mobile-bottom-navigation .action-btn').forEach(btn => {
      if (btn.querySelector('ion-icon[name="bag-handle-outline"]')) {
        let badge = btn.querySelector('.count');
        if (!badge) { badge = document.createElement('span'); badge.className = 'count'; btn.append(badge); }
        badge.textContent = cartCount();
      }
    });
  }
  function subtotal() { return cart.reduce((sum, item) => sum + item.price * item.qty, 0); }
  function totals() {
    const sub = subtotal(), discount = discountCode === 'SAVE10' ? Math.round(sub * .1) : 0;
    const shipping = sub > 0 && sub - discount < 999 ? 79 : 0;
    return { sub, discount, shipping, total: Math.max(0, sub - discount + shipping) };
  }
  function renderCart() {
    if (!cart.length) {
      body.innerHTML = '<div class="shop-empty"><h3>Your cart is empty</h3><p>Add a few things you love and they will appear here.</p><button class="shop-primary" data-close-panel>Continue Shopping</button></div>';
      return;
    }
    const t = totals();
    body.innerHTML = cart.map(item => `<div class="cart-row"><img src="${escapeHtml(item.image)}" alt=""><div><h4>${escapeHtml(item.title)}</h4><p>${money(item.price)} each</p><div class="qty-tools"><button data-qty="${item.id}" data-change="-1" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button data-qty="${item.id}" data-change="1" aria-label="Increase quantity">+</button><button class="remove-item" data-remove="${item.id}">Remove</button></div></div><strong class="cart-side">${money(item.price * item.qty)}</strong></div>`).join('') +
      `<div class="coupon-row"><input id="coupon-code" placeholder="Coupon code (try SAVE10)" value="${escapeHtml(discountCode)}"><button class="shop-secondary" id="apply-coupon">Apply</button></div><p class="shop-note" id="coupon-note">${discountCode === 'SAVE10' ? '10% discount applied.' : 'Use SAVE10 for 10% off your subtotal.'}</p>
      <div class="shop-summary"><div class="summary-line"><span>Subtotal</span><strong>${money(t.sub)}</strong></div><div class="summary-line"><span>Discount</span><strong>−${money(t.discount)}</strong></div><div class="summary-line"><span>Shipping</span><strong>${t.shipping ? money(t.shipping) : 'FREE'}</strong></div><div class="summary-line total"><span>Total</span><strong>${money(t.total)}</strong></div></div>
      <button class="shop-primary" style="width:100%;margin-top:14px" id="go-checkout">Proceed to Checkout</button><p class="shop-note">Demo checkout only. No real payment will be collected.</p>`;
  }
  function renderCheckout() {
    if (!cart.length) return renderCart();
    const user = read(STORAGE.user, {});
    const t = totals();
    body.innerHTML = `<div class="shop-summary"><div class="summary-line"><span>Items (${cartCount()})</span><strong>${money(t.sub)}</strong></div><div class="summary-line"><span>Discount ${discountCode === 'SAVE10' ? '(SAVE10)' : ''}</span><strong>−${money(t.discount)}</strong></div><div class="summary-line"><span>Shipping</span><strong>${t.shipping ? money(t.shipping) : 'FREE'}</strong></div><div class="summary-line total"><span>Order total</span><strong>${money(t.total)}</strong></div></div>
      <form id="checkout-form" class="shop-form"><label>Full name<input name="name" autocomplete="name" required value="${escapeHtml(user.name || '')}"></label><label>Email address<input name="email" type="email" autocomplete="email" required value="${escapeHtml(user.email || '')}"></label><label>Phone number<input name="phone" type="tel" autocomplete="tel" required value="${escapeHtml(user.phone || '')}"></label><label>PIN code<input name="pin" inputmode="numeric" pattern="[0-9]{6}" required value="${escapeHtml(user.pin || '')}"></label><label class="full">Delivery address<textarea name="address" rows="3" required style="border:1px solid #ddd;border-radius:7px;padding:11px;font:inherit">${escapeHtml(user.address || '')}</textarea></label><label class="full">Payment method<select name="payment" style="padding:11px;border:1px solid #ddd;border-radius:7px"><option>Cash on Delivery (demo)</option><option>UPI (demo only)</option><option>Card (demo only)</option></select></label><button class="shop-secondary" type="button" id="back-cart">Back to Cart</button><button class="shop-primary" type="submit">Place Demo Order · ${money(t.total)}</button></form><p class="shop-note">Your details and order history are saved in this browser on this device using local storage. This demo does not securely store data on a server.</p>`;
  }
  function renderOrders() {
    const orders = read(STORAGE.orders, []);
    body.innerHTML = orders.length ? orders.map(order => `<article class="order-card"><strong>Order #${escapeHtml(order.id)}</strong><p>${new Date(order.date).toLocaleString('en-IN')} · ${escapeHtml(order.status)}</p><p>${order.items.map(i => `${escapeHtml(i.title)} × ${i.qty}`).join(', ')}</p><div class="summary-line"><span>Discount</span><strong>−${money(order.discount)}</strong></div><div class="summary-line"><span>Total paid (demo)</span><strong>${money(order.total)}</strong></div></article>`).join('') : '<div class="shop-empty"><h3>No past orders yet</h3><p>Your completed demo orders will appear here.</p></div>';
  }
  function renderProfile() {
    const user = read(STORAGE.user, {});
    body.innerHTML = `<form id="profile-form" class="shop-form"><label>Full name<input name="name" required value="${escapeHtml(user.name || '')}"></label><label>Email address<input name="email" type="email" required value="${escapeHtml(user.email || '')}"></label><label>Phone number<input name="phone" type="tel" value="${escapeHtml(user.phone || '')}"></label><label>PIN code<input name="pin" inputmode="numeric" pattern="[0-9]{6}" value="${escapeHtml(user.pin || '')}"></label><label class="full">Delivery address<textarea name="address" rows="3" style="border:1px solid #ddd;border-radius:7px;padding:11px;font:inherit">${escapeHtml(user.address || '')}</textarea></label><button class="shop-primary full" type="submit">Save My Details</button></form><p class="shop-note">Details are stored in this browser only, not in a shared online database.</p><button class="shop-secondary" id="view-orders" style="margin-top:10px">View Past Orders (${read(STORAGE.orders, []).length})</button>`;
  }

  document.addEventListener('click', e => {
    const add = e.target.closest('[data-add-product]');
    if (add) {
      const product = products.get(add.dataset.addProduct);
      if (!product) return;
      const existing = cart.find(item => item.id === product.id);
      if (existing) existing.qty += 1; else cart.push({ ...product, qty: 1 });
      save(STORAGE.cart, cart); updateBadges();
      const original = add.textContent; add.textContent = 'Added ✓'; setTimeout(() => { if (add.isConnected) add.textContent = original; }, 900);
      return;
    }
    if (e.target.closest('[data-close-panel]')) close();
    const qty = e.target.closest('[data-qty]');
    if (qty) {
      const item = cart.find(i => i.id === qty.dataset.qty);
      if (item) item.qty = Math.max(0, item.qty + Number(qty.dataset.change));
      cart = cart.filter(i => i.qty > 0); save(STORAGE.cart, cart); updateBadges(); renderCart();
    }
    const remove = e.target.closest('[data-remove]');
    if (remove) { cart = cart.filter(i => i.id !== remove.dataset.remove); save(STORAGE.cart, cart); updateBadges(); renderCart(); }
    if (e.target.id === 'apply-coupon') {
      const value = body.querySelector('#coupon-code').value.trim().toUpperCase();
      if (!value || value === 'SAVE10') { discountCode = value; renderCart(); }
      else body.querySelector('#coupon-note').textContent = 'Invalid code. Try SAVE10.';
    }
    if (e.target.id === 'go-checkout') open('Checkout', renderCheckout);
    if (e.target.id === 'back-cart') open('Your Cart', renderCart);
    if (e.target.id === 'view-orders') open('Past Orders', renderOrders);
  });
  document.addEventListener('submit', e => {
    if (e.target.id === 'profile-form') {
      e.preventDefault(); save(STORAGE.user, Object.fromEntries(new FormData(e.target)));
      const button = e.target.querySelector('button[type="submit"]'); button.textContent = 'Details Saved ✓'; return;
    }
    if (e.target.id === 'checkout-form') {
      e.preventDefault();
      if (!cart.length) return;
      const formData = Object.fromEntries(new FormData(e.target));
      save(STORAGE.user, { name: formData.name, email: formData.email, phone: formData.phone, pin: formData.pin, address: formData.address });
      const t = totals();
      const orders = read(STORAGE.orders, []);
      const order = { id: String(Date.now()).slice(-8), date: new Date().toISOString(), status: 'Placed (demo)', customer: formData, items: cart.map(item => ({ id: item.id, title: item.title, price: item.price, qty: item.qty })), subtotal: t.sub, discount: t.discount, shipping: t.shipping, total: t.total, coupon: discountCode };
      orders.unshift(order); save(STORAGE.orders, orders); cart = []; discountCode = ''; save(STORAGE.cart, cart); updateBadges();
      title.textContent = 'Order Confirmed';
      body.innerHTML = `<div class="shop-empty"><h3>Thank you, ${escapeHtml(formData.name)}!</h3><p>Your demo order <strong>#${escapeHtml(order.id)}</strong> has been saved.</p><p>Order total: <strong>${money(order.total)}</strong></p><p class="shop-note">This is a demo order. No payment was processed and no shipment will be created.</p><button class="shop-primary" id="view-orders">View Past Orders</button> <button class="shop-secondary" data-close-panel>Continue Shopping</button></div>`;
    }
  });

  // Hook all cart icons, user/profile icons, and mobile equivalents.
  document.querySelectorAll('.header-user-actions .action-btn, .mobile-bottom-navigation .action-btn').forEach(btn => {
    const icon = btn.querySelector('ion-icon')?.getAttribute('name') || '';
    if (icon.includes('bag-handle')) btn.addEventListener('click', () => open('Your Cart', renderCart));
    if (icon.includes('person')) btn.addEventListener('click', () => open('My Account', renderProfile));
  });
  // Add a visible order-history shortcut near the main header actions.
  const actions = document.querySelector('.header-user-actions');
  if (actions && !document.querySelector('[data-order-history]')) {
    const button = document.createElement('button'); button.className = 'action-btn'; button.type = 'button'; button.dataset.orderHistory = 'true'; button.title = 'Past orders'; button.innerHTML = '<ion-icon name="receipt-outline"></ion-icon><span style="font-size:11px;display:block">Orders</span>';
    button.addEventListener('click', () => open('Past Orders', renderOrders)); actions.append(button);
  }
  // Search existing product cards by name/category.
  const search = document.querySelector('.search-field');
  const searchBtn = document.querySelector('.search-btn');
  function doSearch() {
    const q = (search?.value || '').trim().toLowerCase();
    document.querySelectorAll('.showcase').forEach(card => {
      const match = !q || card.textContent.toLowerCase().includes(q);
      card.style.opacity = match ? '' : '.35';
      card.style.outline = q && match ? '2px solid #ddd' : '';
    });
    if (q) document.querySelectorAll('.showcase').forEach(card => { if (card.textContent.toLowerCase().includes(q)) card.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  }
  searchBtn?.addEventListener('click', doSearch);
  search?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });
  updateBadges();

  // Existing theme interactions, with guards for optional elements.
  const modal = document.querySelector('[data-modal]');
  const modalCloseBtn = document.querySelector('[data-modal-close]');
  const modalCloseOverlay = document.querySelector('[data-modal-overlay]');
  const closeNewsletter = () => modal?.classList.add('closed');
  modalCloseOverlay?.addEventListener('click', closeNewsletter);
  modalCloseBtn?.addEventListener('click', closeNewsletter);
  document.querySelector('[data-toast-close]')?.addEventListener('click', () => document.querySelector('[data-toast]')?.classList.add('closed'));
  const mobileOpen = document.querySelectorAll('[data-mobile-menu-open-btn]');
  const mobileMenus = document.querySelectorAll('[data-mobile-menu]');
  const mobileClose = document.querySelectorAll('[data-mobile-menu-close-btn]');
  const overlay = document.querySelector('[data-overlay]');
  mobileOpen.forEach((btn, i) => btn.addEventListener('click', () => { mobileMenus[i]?.classList.add('active'); overlay?.classList.add('active'); }));
  mobileClose.forEach((btn, i) => btn.addEventListener('click', () => { mobileMenus[i]?.classList.remove('active'); overlay?.classList.remove('active'); }));
  overlay?.addEventListener('click', () => { mobileMenus.forEach(menu => menu.classList.remove('active')); overlay.classList.remove('active'); });
  document.querySelectorAll('[data-accordion-btn]').forEach(btn => btn.addEventListener('click', () => {
    const target = btn.nextElementSibling;
    if (!target) return;
    target.classList.toggle('active'); btn.classList.toggle('active');
  }));
})();