document.addEventListener('DOMContentLoaded', () => {
  const host = document.getElementById('wishlist-content');
  function render() {
    const products = ToyNest.getWishlist().map(ToyNest.findProduct).filter(Boolean);
    if (!products.length) {
      host.innerHTML = `<div class="empty-state"><i class="bi bi-heart"></i><h2>Your wishlist is a cozy little blank page</h2><p>Save the toys you love and they’ll be right here when you’re ready.</p><a href="shop.html" class="btn btn-primary btn-pill">Explore toys <i class="bi bi-arrow-right"></i></a></div>`;
      return;
    }
    host.innerHTML = `<div class="row g-4">${products.map(product => ToyNest.productCard(product)).join('')}</div>`;
    host.querySelectorAll('.product-card').forEach(card => {
      const removeButton = card.querySelector('.wishlist-toggle');
      const product = ToyNest.findProduct(removeButton.dataset.wishlistId);
      removeButton.setAttribute('aria-label', `Remove ${card.querySelector('.product-title').textContent} from wishlist`);
      const actions = card.querySelector('.product-card-actions');
      const detailLink = actions.querySelector('a');
      actions.innerHTML = '';
      const moveButton = document.createElement('button');
      moveButton.type = 'button';
      moveButton.className = 'btn btn-primary btn-sm';
      moveButton.textContent = 'Move to cart';
      moveButton.dataset.moveToCart = product.id;
      if (product.stock < 1) moveButton.disabled = true;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn-outline-primary btn-sm';
      remove.textContent = 'Remove';
      remove.dataset.removeWishlist = product.id;
      actions.prepend(moveButton);
      actions.append(remove, detailLink);
    });
  }
  host.addEventListener('click', event => {
    const move = event.target.closest('[data-move-to-cart]');
    if (move && ToyNest.addToCart(move.dataset.moveToCart)) {
      ToyNest.addToWishlist(move.dataset.moveToCart);
      render();
    }
    const remove = event.target.closest('[data-remove-wishlist]');
    if (remove) {
      ToyNest.addToWishlist(remove.dataset.removeWishlist);
      render();
    }
  });
  document.addEventListener('toynest-storage-update', render);
  document.addEventListener('toynest-wishlist-update', render);
  render();
});
