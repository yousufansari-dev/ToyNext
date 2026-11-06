document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('checkout-form');
  const empty = document.getElementById('checkout-empty');
  const cart = ToyNest.getCart();
  if (!cart.length) {
    empty.classList.remove('d-none');
    return;
  }
  form.classList.remove('d-none');
  const totals = ToyNest.calculateTotals(cart);
  const phone = document.getElementById('phone');
  phone.addEventListener('input', () => phone.setCustomValidity(''));
  const promo = ToyNest.getPromo();
  document.getElementById('checkout-summary').innerHTML = `<h2>Your order</h2><div class="checkout-summary-list">${cart.map(item => {
    const product = ToyNest.findProduct(item.id);
    return product ? `<div class="checkout-summary-item"><img src="${ToyNest.escapeHTML(product.image)}" alt=""><span>${ToyNest.escapeHTML(product.name)}<small>Qty ${item.quantity}</small></span><strong>${ToyNest.formatPrice(ToyNest.priceOf(product) * item.quantity)}</strong></div>` : '';
  }).join('')}</div><div class="summary-row"><span>Subtotal</span><strong>${ToyNest.formatPrice(totals.subtotal)}</strong></div>${totals.discount ? `<div class="summary-row"><span>Discount (${promo})</span><strong>−${ToyNest.formatPrice(totals.discount)}</strong></div>` : ''}<div class="summary-row"><span>Shipping</span><strong>${totals.shipping ? ToyNest.formatPrice(totals.shipping) : 'Free'}</strong></div><div class="summary-row summary-total"><span>Total</span><strong>${ToyNest.formatPrice(totals.total)}</strong></div><button class="btn btn-primary btn-pill mt-3 w-100" type="submit" form="checkout-form">Place demo order <i class="bi bi-arrow-right"></i></button><p class="summary-note mt-3 mb-0">No real payment is processed.</p>`;

  form.addEventListener('submit', event => {
    event.preventDefault();
    phone.setCustomValidity(phone.value.trim() && !/^[+()0-9 .-]{7,20}$/.test(phone.value.trim()) ? 'Enter a valid phone number.' : '');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      form.querySelector(':invalid')?.focus();
      return;
    }
    const currentCart = ToyNest.getCart();
    if (!currentCart.length) {
      ToyNest.notify('Your cart is empty. Add a toy before checking out.', 'warning');
      location.href = 'cart.html';
      return;
    }
    const unavailable = currentCart.find(item => {
      const product = ToyNest.findProduct(item.id);
      return !product || product.stock < item.quantity;
    });
    if (unavailable) {
      ToyNest.notify('One of the quantities in your cart is no longer available. Please review your cart.', 'warning');
      location.href = 'cart.html';
      return;
    }
    const data = new FormData(form);
    const finalTotals = ToyNest.calculateTotals(currentCart);
    const order = {
      number: `TN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
      date: new Date().toISOString(),
      name: String(data.get('name')).trim(),
      email: String(data.get('email')).trim(),
      payment: String(data.get('payment')),
      items: currentCart.map(item => {
        const product = ToyNest.findProduct(item.id);
        return { id: product.id, name: product.name, quantity: item.quantity, price: ToyNest.priceOf(product) };
      }),
      subtotal: finalTotals.subtotal,
      discount: finalTotals.discount,
      shipping: finalTotals.shipping,
      total: finalTotals.total
    };
    if (!ToyNest.saveLastOrder(order)) return;
    try {
      localStorage.setItem(ToyNest.STORAGE.cart, '[]');
      localStorage.removeItem(ToyNest.STORAGE.promo);
    } catch (error) {
      console.error('ToyNest could not clear the cart after saving the demo order.', error);
      ToyNest.notify('Your order was saved, but the cart could not be cleared. Please clear it manually.', 'warning');
    }
    ToyNest.updateBadges();
    location.href = 'success.html';
  });
});
