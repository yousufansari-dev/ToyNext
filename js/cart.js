document.addEventListener('DOMContentLoaded', () => {
  const host = document.getElementById('cart-content');
  const escape = ToyNest.escapeHTML;

  function renderSummary(totals) {
    return `<aside class="order-summary-card cart-summary"><h2>Order summary</h2><div class="summary-row"><span>Subtotal</span><strong>${ToyNest.formatPrice(totals.subtotal)}</strong></div>${totals.discount ? `<div class="summary-row"><span>Discount (SAVE10)</span><strong>−${ToyNest.formatPrice(totals.discount)}</strong></div>` : ''}<div class="summary-row"><span>Shipping</span><strong>${totals.shipping ? ToyNest.formatPrice(totals.shipping) : 'Free'}</strong></div><div class="summary-row summary-total"><span>Total</span><strong>${ToyNest.formatPrice(totals.total)}</strong></div><form class="discount-form" id="discount-form"><label class="visually-hidden" for="discount-code">Discount code</label><input id="discount-code" placeholder="Discount code" value="${ToyNest.getPromo() === 'SAVE10' ? 'SAVE10' : ''}"><button type="submit">Apply</button></form><p id="discount-status" class="discount-status" aria-live="polite">${totals.discount ? 'SAVE10 applied — enjoy 10% off!' : 'Try SAVE10 for 10% off your toys.'}</p><div class="summary-buttons"><a class="btn btn-primary btn-pill" href="checkout.html">Proceed to checkout <i class="bi bi-arrow-right"></i></a></div><a class="continue-link" href="shop.html"><i class="bi bi-arrow-left"></i> Continue shopping</a><p class="summary-note mt-3 mb-0"><i class="bi bi-shield-check"></i> Demo checkout · No real payment</p></aside>`;
  }
  function render() {
    const cart = ToyNest.getCart();
    if (!cart.length) {
      host.innerHTML = `<div class="empty-state"><i class="bi bi-basket3"></i><h2>Your cart is ready for a little joy</h2><p>Pick out something lovely and it’ll be waiting right here.</p><a class="btn btn-primary btn-pill" href="shop.html">Shop now <i class="bi bi-arrow-right"></i></a></div>`;
      return;
    }
    const items = cart.map(item => {
      const product = ToyNest.findProduct(item.id);
      if (!product) return '';
      const unitPrice = ToyNest.priceOf(product);
      return `<article class="cart-item" data-cart-item="${escape(product.id)}"><img src="${escape(product.image)}" alt="${escape(product.name)}"><div><h3><a href="product.html?id=${encodeURIComponent(product.id)}">${escape(product.name)}</a></h3><p class="cart-item-meta">${escape(product.category)} · ${ToyNest.formatPrice(unitPrice)} each</p><div class="cart-item-actions"><div class="quantity-control"><button type="button" data-quantity-change="-1" aria-label="Decrease ${escape(product.name)} quantity">−</button><input type="number" min="1" max="${product.stock}" value="${item.quantity}" aria-label="${escape(product.name)} quantity"><button type="button" data-quantity-change="1" aria-label="Increase ${escape(product.name)} quantity"${item.quantity >= product.stock ? ' disabled' : ''}>+</button></div><button class="remove-item" type="button" data-remove-item="${escape(product.id)}"><i class="bi bi-trash3"></i> Remove</button></div></div><strong class="line-total">${ToyNest.formatPrice(unitPrice * item.quantity)}</strong></article>`;
    }).join('');
    host.innerHTML = `<div class="cart-layout"><section><div class="cart-items">${items}</div><button id="clear-cart" class="cart-clear" type="button"><i class="bi bi-trash3"></i> Clear cart</button></section>${renderSummary(ToyNest.calculateTotals(cart))}</div>`;
  }
  host.addEventListener('click', event => {
    const target = event.target;
    const item = target.closest('[data-cart-item]');
    if (target.closest('[data-remove-item]')) {
      ToyNest.removeFromCart(target.closest('[data-remove-item]').dataset.removeItem);
      ToyNest.notify('Toy removed from your cart.');
      render();
    } else if (target.closest('[data-quantity-change]') && item) {
      const amount = Number(target.closest('[data-quantity-change]').dataset.quantityChange);
      const cartItem = ToyNest.getCart().find(entry => entry.id === item.dataset.cartItem);
      if (cartItem) {
        const updated = Math.max(1, Math.min(ToyNest.findProduct(cartItem.id).stock, cartItem.quantity + amount));
        if (updated !== cartItem.quantity) ToyNest.setCartQuantity(cartItem.id, updated);
        render();
      }
    } else if (target.closest('#clear-cart')) {
      if (window.confirm('Clear all toys from your cart?')) {
        localStorage.setItem(ToyNest.STORAGE.cart, '[]');
        ToyNest.updateBadges();
        render();
      }
    }
  });
  host.addEventListener('change', event => {
    const item = event.target.closest('[data-cart-item]');
    if (item && event.target.matches('input[type="number"]')) {
      const amount = Number(event.target.value);
      const product = ToyNest.findProduct(item.dataset.cartItem);
      if (Number.isInteger(amount) && amount >= 1 && amount <= product.stock) ToyNest.setCartQuantity(product.id, amount);
      render();
    }
  });
  host.addEventListener('submit', event => {
    if (event.target.id !== 'discount-form') return;
    event.preventDefault();
    const code = document.getElementById('discount-code').value.trim().toUpperCase();
    if (code === 'SAVE10') {
      localStorage.setItem(ToyNest.STORAGE.promo, JSON.stringify(code));
      ToyNest.notify('SAVE10 applied — 10% off your toys!');
      render();
    } else {
      const status = document.getElementById('discount-status');
      status.textContent = 'That code did not work. Try SAVE10.';
      status.style.color = '#bd5e54';
    }
  });
  document.addEventListener('toynest-storage-update', render);
  render();
});
