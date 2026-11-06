(function () {
  'use strict';

  const STORAGE = { cart: 'toynest-cart', wishlist: 'toynest-wishlist', promo: 'toynest-promo', order: 'toynest-last-order', newsletter: 'toynest-newsletter' };
  const fallbackImage = 'assets/images/toy-placeholder.svg';

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error(`ToyNest could not read "${key}" from LocalStorage.`, error);
      return fallback;
    }
  }
  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`ToyNest could not save "${key}" to LocalStorage.`, error);
      notify('Your browser could not save this change. Check its storage settings and try again.', 'warning');
      return false;
    }
  }
  function getCart() {
    const cart = readJSON(STORAGE.cart, []);
    if (!Array.isArray(cart)) return [];
    return cart.filter(item => item && typeof item.id === 'string' && Number.isInteger(item.quantity) && item.quantity > 0 && findProduct(item.id));
  }
  function getWishlist() {
    const wishlist = readJSON(STORAGE.wishlist, []);
    return Array.isArray(wishlist) ? [...new Set(wishlist.filter(id => typeof id === 'string' && findProduct(id)))] : [];
  }
  function getPromo() { return readJSON(STORAGE.promo, null); }
  function findProduct(id) { return window.TOYNEST_PRODUCTS.find(product => product.id === id); }
  function priceOf(product) { return Math.max(0, Number((product.price * (1 - product.discount / 100)).toFixed(2))); }
  function formatPrice(amount) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(Number(amount)) ? Number(amount) : 0); }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  }
  function notify(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container position-fixed top-0 end-0 p-3';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }
    const toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.innerHTML = `<div class="toast-header"><span class="brand-mark me-2" aria-hidden="true"><i class="bi bi-stars"></i></span><strong class="me-auto">ToyNest</strong><small>${type === 'success' ? 'Just now' : 'Notice'}</small><button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button></div><div class="toast-body">${escapeHTML(message)}</div>`;
    container.appendChild(toastEl);
    if (window.bootstrap && bootstrap.Toast) {
      const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3200 });
      toast.show();
      toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove(), { once: true });
    } else {
      toastEl.classList.add('show');
      window.setTimeout(() => toastEl.remove(), 3200);
    }
  }
  function updateBadges() {
    const cartCount = getCart().reduce((total, item) => total + item.quantity, 0);
    const wishlistCount = getWishlist().length;
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = String(cartCount);
      el.classList.toggle('d-none', cartCount === 0);
    });
    document.querySelectorAll('[data-wishlist-count]').forEach(el => {
      el.textContent = String(wishlistCount);
      el.classList.toggle('d-none', wishlistCount === 0);
    });
  }
  function addToCart(id, quantity = 1) {
    const product = findProduct(id);
    const amount = Number(quantity);
    if (!product || !Number.isInteger(amount) || amount < 1 || !Number.isFinite(product.price) || product.price < 0) {
      notify('That toy or quantity is not available.', 'warning');
      return false;
    }
    if (product.stock <= 0) {
      notify('This toy is currently out of stock.', 'warning');
      return false;
    }
    const cart = getCart();
    const existing = cart.find(item => item.id === id);
    const nextQuantity = (existing ? existing.quantity : 0) + amount;
    if (nextQuantity > product.stock) {
      notify(`Only ${product.stock} ${product.stock === 1 ? 'item is' : 'items are'} available.`, 'warning');
      return false;
    }
    if (existing) existing.quantity = nextQuantity;
    else cart.push({ id, quantity: amount });
    if (!writeJSON(STORAGE.cart, cart)) return false;
    updateBadges();
    notify(`${product.name} added to your cart.`);
    return true;
  }
  function setCartQuantity(id, quantity) {
    const product = findProduct(id);
    const amount = Number(quantity);
    if (!product || !Number.isInteger(amount) || amount < 1 || amount > product.stock) {
      notify(product && product.stock === 0 ? 'This toy is currently out of stock.' : 'Choose a valid quantity.', 'warning');
      return false;
    }
    const cart = getCart();
    const item = cart.find(entry => entry.id === id);
    if (!item) return false;
    item.quantity = amount;
    if (!writeJSON(STORAGE.cart, cart)) return false;
    updateBadges();
    return true;
  }
  function removeFromCart(id) {
    const cart = getCart().filter(item => item.id !== id);
    if (!writeJSON(STORAGE.cart, cart)) return false;
    updateBadges();
    return true;
  }
  function addToWishlist(id) {
    if (!findProduct(id)) return false;
    const wishlist = getWishlist();
    const adding = !wishlist.includes(id);
    const next = adding ? [...wishlist, id] : wishlist.filter(item => item !== id);
    if (!writeJSON(STORAGE.wishlist, next)) return false;
    updateBadges();
    notify(adding ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
    document.dispatchEvent(new CustomEvent('toynest-wishlist-update'));
    document.querySelectorAll(`[data-wishlist-id="${CSS.escape(id)}"]`).forEach(button => {
      button.classList.toggle('is-active', adding);
      button.setAttribute('aria-pressed', String(adding));
      button.innerHTML = `<i class="bi bi-heart${adding ? '-fill' : ''}" aria-hidden="true"></i><span class="visually-hidden">${adding ? 'Remove from' : 'Add to'} wishlist</span>`;
    });
    return true;
  }
  function calculateTotals(cart = getCart(), promo = readJSON(STORAGE.promo, null)) {
    const subtotal = cart.reduce((sum, item) => {
      const product = findProduct(item.id);
      return product ? sum + priceOf(product) * item.quantity : sum;
    }, 0);
    const discount = promo === 'SAVE10' ? Number((subtotal * .1).toFixed(2)) : 0;
    const shipping = subtotal === 0 || subtotal - discount >= 75 ? 0 : 6.95;
    return { subtotal: Number(subtotal.toFixed(2)), discount, shipping, total: Number((subtotal - discount + shipping).toFixed(2)) };
  }
  function productCard(product) {
    if (!product) return '';
    const inWishlist = getWishlist().includes(product.id);
    const salePrice = priceOf(product);
    const badge = product.discount > 0 ? `<span class="product-badge">${product.discount}% off</span>` : new Date(product.created) > new Date('2026-08-01') ? '<span class="product-badge badge-new">New</span>' : '';
    return `<div class="col-6 col-lg-3"><article class="product-card"><div class="product-image-wrap"><a href="product.html?id=${encodeURIComponent(product.id)}" aria-label="View ${escapeHTML(product.name)}"><img class="product-image" src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy"></a>${badge}<button class="wishlist-toggle${inWishlist ? ' is-active' : ''}" type="button" data-wishlist-id="${escapeHTML(product.id)}" aria-label="${inWishlist ? 'Remove from' : 'Add to'} wishlist" aria-pressed="${inWishlist}"><i class="bi bi-heart${inWishlist ? '-fill' : ''}" aria-hidden="true"></i></button><button class="quick-view-trigger" type="button" data-quick-view="${escapeHTML(product.id)}"><i class="bi bi-eye"></i> Quick view</button></div><div class="product-card-body"><span class="product-category">${escapeHTML(product.category)}</span><a class="product-title" href="product.html?id=${encodeURIComponent(product.id)}">${escapeHTML(product.name)}</a><div class="product-rating" aria-label="${product.rating} out of 5 stars"><span aria-hidden="true">★★★★★</span><small>${product.rating} (${product.reviews})</small></div><div class="product-price-row"><span class="product-price">${formatPrice(salePrice)}</span>${product.discount ? `<del class="product-old-price">${formatPrice(product.price)}</del>` : ''}</div><div class="product-card-actions"><button class="btn btn-primary btn-sm" type="button" data-add-cart="${escapeHTML(product.id)}"${product.stock < 1 ? ' disabled' : ''}>${product.stock < 1 ? 'Sold out' : '<i class="bi bi-bag-plus"></i> Add to cart'}</button><a class="btn btn-outline-primary btn-sm" href="product.html?id=${encodeURIComponent(product.id)}" aria-label="View ${escapeHTML(product.name)}">Details</a></div></div></article></div>`;
  }
  function renderHeader() {
    const host = document.getElementById('site-header');
    if (!host) return;
    const page = location.pathname.split('/').pop() || 'index.html';
    const active = href => (href === 'index.html' ? page === 'index.html' : page === href) ? ' active' : '';
    host.innerHTML = `<div class="announcement-bar"><span>Little joys, delivered. <a href="shop.html">Free shipping on orders over $75 <i class="bi bi-arrow-right"></i></a></span></div><header class="site-nav"><nav class="navbar navbar-expand-lg"><div class="container"><a class="brand-logo" href="index.html" aria-label="ToyNest home"><img class="brand-mark" src="assets/icons/toynest-mark.svg" alt="">ToyNest</a><button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#main-navigation" aria-controls="main-navigation" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse" id="main-navigation"><ul class="navbar-nav mx-lg-auto"><li class="nav-item"><a class="nav-link${active('index.html')}" href="index.html">Home</a></li><li class="nav-item"><a class="nav-link${active('shop.html')}" href="shop.html">Shop</a></li><li class="nav-item"><a class="nav-link${active('about.html')}" href="about.html">Our Story</a></li><li class="nav-item"><a class="nav-link${active('contact.html')}" href="contact.html">Contact</a></li></ul><form class="header-search" id="site-search" role="search"><label class="visually-hidden" for="search-input">Search toys</label><input id="search-input" type="search" placeholder="Find their next favorite..." autocomplete="off"><button class="search-submit" type="submit" aria-label="Search"><i class="bi bi-search"></i></button><div class="search-suggestions d-none" id="search-suggestions" role="listbox"></div></form><div class="header-actions"><a class="header-icon" href="contact.html" aria-label="Contact ToyNest"><i class="bi bi-person"></i></a><a class="header-icon" href="wishlist.html" aria-label="Wishlist"><i class="bi bi-heart"></i><span class="count-badge d-none" data-wishlist-count>0</span></a><a class="header-icon" href="cart.html" aria-label="Shopping cart"><i class="bi bi-bag"></i><span class="count-badge d-none" data-cart-count>0</span></a></div></div></div></nav></header>`;
  }
  function renderFooter() {
    const host = document.getElementById('site-footer');
    if (!host) return;
    host.innerHTML = `<footer class="site-footer"><div class="container"><div class="footer-main"><div class="footer-brand"><a class="brand-logo" href="index.html"><img class="brand-mark" src="assets/icons/toynest-mark.svg" alt="">ToyNest</a><p>Thoughtful toys, wonderful discoveries, and a little extra magic in every delivery.</p><div class="footer-social"><a href="https://www.instagram.com/" aria-label="Instagram"><i class="bi bi-instagram"></i></a><a href="https://www.facebook.com/" aria-label="Facebook"><i class="bi bi-facebook"></i></a><a href="https://www.pinterest.com/" aria-label="Pinterest"><i class="bi bi-pinterest"></i></a></div></div><div class="footer-col"><h3>Explore</h3><a href="shop.html">Shop all toys</a><a href="shop.html?category=Educational%20Toys">Learning toys</a><a href="wishlist.html">Your wishlist</a><a href="cart.html">Your cart</a></div><div class="footer-col"><h3>ToyNest</h3><a href="about.html">Our story</a><a href="contact.html">Contact us</a><a href="contact.html#faq-accordion">FAQs</a></div><div class="footer-col"><h3>A little help</h3><a href="contact.html">Shipping & returns</a><a href="contact.html">Toy safety</a><a href="checkout.html">Demo checkout</a></div></div><div class="footer-bottom"><p>© ${new Date().getFullYear()} ToyNest. Made for play.</p><p>Demo storefront · No real payments are processed.</p></div></div></footer><button class="back-to-top" type="button" aria-label="Back to top"><i class="bi bi-arrow-up"></i></button>`;
  }
  function updateSearch(query) {
    const panel = document.getElementById('search-suggestions');
    if (!panel) return;
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) { panel.classList.add('d-none'); panel.innerHTML = ''; return; }
    const results = window.TOYNEST_PRODUCTS.filter(product => product.name.toLowerCase().includes(normalized) || product.category.toLowerCase().includes(normalized)).slice(0, 5);
    panel.innerHTML = results.length ? results.map(product => `<a class="suggestion-item" role="option" href="product.html?id=${encodeURIComponent(product.id)}"><img src="${escapeHTML(product.image)}" alt=""><span><strong>${escapeHTML(product.name)}</strong><small>${formatPrice(priceOf(product))}</small></span></a>`).join('') : '<div class="p-2 text-secondary small">No toys found. Try another search.</div>';
    panel.classList.remove('d-none');
  }
  function initGlobalEvents() {
    document.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const add = target.closest('[data-add-cart]');
      if (add) addToCart(add.dataset.addCart, Number(add.dataset.quantity || 1));
      const wishlist = target.closest('[data-wishlist-id]');
      if (wishlist) addToWishlist(wishlist.dataset.wishlistId);
      const quick = target.closest('[data-quick-view]');
      if (quick) showQuickView(quick.dataset.quickView);
      if (!target.closest('.header-search')) document.getElementById('search-suggestions')?.classList.add('d-none');
      const backTop = target.closest('.back-to-top');
      if (backTop) window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.addEventListener('error', event => {
      const image = event.target;
      if (image instanceof HTMLImageElement && !image.dataset.fallbackApplied) {
        image.dataset.fallbackApplied = 'true';
        image.src = fallbackImage;
      }
    }, true);
    document.addEventListener('submit', event => {
      const form = event.target;
      if (form.id === 'site-search') {
        event.preventDefault();
        const query = document.getElementById('search-input').value.trim();
        window.location.href = `shop.html${query ? `?q=${encodeURIComponent(query)}` : ''}`;
      }
      if (form.id === 'newsletter-form') {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const email = form.querySelector('input[type="email"]').value.trim();
        const emails = readJSON(STORAGE.newsletter, []);
        if (!emails.includes(email)) emails.push(email);
        if (writeJSON(STORAGE.newsletter, emails)) {
          notify('You’re on the list! Look out for a little ToyNest joy.');
          form.reset();
        }
      }
    });
    document.addEventListener('input', event => {
      if (event.target.id === 'search-input') updateSearch(event.target.value);
    });
    window.addEventListener('storage', event => {
      if ([STORAGE.cart, STORAGE.wishlist].includes(event.key)) {
        updateBadges();
        document.dispatchEvent(new CustomEvent('toynest-storage-update', { detail: { key: event.key } }));
      }
    });
    const topButton = document.querySelector('.back-to-top');
    if (topButton) window.addEventListener('scroll', () => topButton.classList.toggle('visible', window.scrollY > 500), { passive: true });
  }
  function showQuickView(id) {
    const product = findProduct(id);
    const modal = document.getElementById('quick-view-modal');
    if (!product || !modal || !window.bootstrap) return;
    modal.innerHTML = `<div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content border-0 rounded-4 p-2"><div class="modal-header border-0"><button type="button" class="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Close"></button></div><div class="modal-body"><div class="quick-view-content"><img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}"><div><span class="product-category">${escapeHTML(product.category)}</span><h2 id="quick-view-title">${escapeHTML(product.name)}</h2><div class="product-rating"><span aria-hidden="true">★★★★★</span><small>${product.rating} (${product.reviews} reviews)</small></div><p class="modal-product-description">${escapeHTML(product.description)}</p><p class="product-price">${formatPrice(priceOf(product))} ${product.discount ? `<del class="product-old-price">${formatPrice(product.price)}</del>` : ''}</p><div class="d-flex gap-2 flex-wrap"><button class="btn btn-primary btn-pill" data-add-cart="${escapeHTML(product.id)}"${product.stock < 1 ? ' disabled' : ''}>${product.stock < 1 ? 'Sold out' : 'Add to cart'}</button><a class="btn btn-outline-primary btn-pill" href="product.html?id=${encodeURIComponent(product.id)}">Full details</a></div></div></div></div></div></div>`;
    bootstrap.Modal.getOrCreateInstance(modal).show();
  }
  function startCountdown(element) {
    if (!element) return;
    const expiryKey = 'toynest-sale-expiry';
    let expiry = Number(localStorage.getItem(expiryKey));
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      expiry = Date.now() + 3 * 24 * 60 * 60 * 1000;
      localStorage.setItem(expiryKey, String(expiry));
    }
    const update = () => {
      let remaining = Math.max(0, expiry - Date.now());
      const hours = Math.floor(remaining / 3600000);
      remaining %= 3600000;
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      element.innerHTML = `<span><strong>${String(hours).padStart(2,'0')}</strong><small>hours</small></span><b>:</b><span><strong>${String(minutes).padStart(2,'0')}</strong><small>minutes</small></span><b>:</b><span><strong>${String(seconds).padStart(2,'0')}</strong><small>seconds</small></span>`;
    };
    update();
    window.setInterval(update, 1000);
  }
  function saveLastOrder(order) { return writeJSON(STORAGE.order, order); }

  window.ToyNest = { STORAGE, getCart, getWishlist, getPromo, findProduct, priceOf, formatPrice, escapeHTML, notify, updateBadges, addToCart, setCartQuantity, removeFromCart, addToWishlist, calculateTotals, productCard, showQuickView, saveLastOrder, getLastOrder: () => readJSON(STORAGE.order, null), renderHeader, renderFooter, startCountdown };
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderFooter();
    updateBadges();
    initGlobalEvents();
  });
})();
