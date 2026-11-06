document.addEventListener('DOMContentLoaded', () => {
  const host = document.getElementById('product-detail');
  const id = new URLSearchParams(location.search).get('id');
  const product = ToyNest.findProduct(id) || TOYNEST_PRODUCTS[0];
  if (!id || !ToyNest.findProduct(id)) {
    if (id) ToyNest.notify('That product could not be found, so we picked a favorite for you.', 'warning');
  }
  document.title = `${product.name} | ToyNest`;
  const salePrice = ToyNest.priceOf(product);
  const images = [
    product.image,
    product.image.replace('w=900', 'w=900').replace('auto=format&fit=crop', 'auto=format&fit=crop&crop=entropy'),
    product.image.replace('w=900', 'w=900').replace('auto=format&fit=crop', 'auto=format&fit=crop&crop=faces')
  ];
  host.innerHTML = `<div class="product-gallery"><div class="gallery-main"><img id="gallery-main-image" src="${ToyNest.escapeHTML(images[0])}" alt="${ToyNest.escapeHTML(product.name)}"></div><div class="gallery-thumbs" role="group" aria-label="Choose product image">${images.map((image,index) => `<button class="gallery-thumb${index === 0 ? ' active' : ''}" type="button" data-gallery-image="${ToyNest.escapeHTML(image)}" aria-label="View product image ${index+1}" aria-pressed="${index===0}"><img src="${ToyNest.escapeHTML(image)}" alt=""></button>`).join('')}</div></div><section class="detail-info"><span class="product-category">${ToyNest.escapeHTML(product.category)} · ${ToyNest.escapeHTML(product.brand)}</span><h1>${ToyNest.escapeHTML(product.name)}</h1><div class="product-rating"><span aria-hidden="true">★★★★★</span><small>${product.rating} / 5 · ${product.reviews} reviews</small></div><div class="detail-price"><strong>${ToyNest.formatPrice(salePrice)}</strong>${product.discount ? `<del>${ToyNest.formatPrice(product.price)}</del><span class="discount-pill">Save ${product.discount}%</span>` : ''}</div><p class="detail-description">${ToyNest.escapeHTML(product.description)}</p><p class="stock-line"><i class="bi bi-check-circle-fill"></i> ${product.stock > 0 ? `${product.stock} in stock — ready for play` : 'Currently out of stock'}</p><div class="detail-actions"><div class="quantity-control" aria-label="Product quantity"><button id="quantity-minus" type="button" aria-label="Decrease quantity">−</button><input id="product-quantity" type="number" min="1" max="${product.stock || 1}" value="1" aria-label="Quantity" ${product.stock < 1 ? 'disabled' : ''}><button id="quantity-plus" type="button" aria-label="Increase quantity" ${product.stock < 1 ? 'disabled' : ''}>+</button></div><button id="detail-add-cart" class="btn btn-primary btn-pill" type="button" ${product.stock < 1 ? 'disabled' : ''}><i class="bi bi-bag-plus"></i> ${product.stock < 1 ? 'Sold out' : 'Add to cart'}</button><button id="buy-now" class="btn btn-dark btn-pill" type="button" ${product.stock < 1 ? 'disabled' : ''}>Buy Now</button><button class="btn btn-outline-primary btn-pill" type="button" data-wishlist-id="${ToyNest.escapeHTML(product.id)}" aria-pressed="${ToyNest.getWishlist().includes(product.id)}"><i class="bi bi-heart${ToyNest.getWishlist().includes(product.id) ? '-fill' : ''}"></i><span class="visually-hidden">Toggle wishlist</span></button></div><div class="spec-list"><div><strong>Recommended age</strong>${ToyNest.escapeHTML(product.age)} years</div><div><strong>Brand</strong>${ToyNest.escapeHTML(product.brand)}</div><div><strong>Customer rating</strong>${product.rating} out of 5</div><div><strong>Availability</strong>${product.stock > 0 ? 'In stock' : 'Out of stock'}</div></div><div class="shipping-note"><i class="bi bi-truck"></i> Free delivery on orders over $75. Easy returns within 30 days.</div></section>`;
  const quantity = document.getElementById('product-quantity');
  host.addEventListener('click', event => {
    const button = event.target.closest('[data-gallery-image]');
    if (button) {
      document.getElementById('gallery-main-image').src = button.dataset.galleryImage;
      document.querySelectorAll('.gallery-thumb').forEach(thumb => {
        thumb.classList.toggle('active', thumb === button);
        thumb.setAttribute('aria-pressed', String(thumb === button));
      });
    }
    if (event.target.closest('#quantity-minus')) quantity.value = String(Math.max(1, Number(quantity.value) - 1));
    if (event.target.closest('#quantity-plus')) quantity.value = String(Math.min(product.stock, Number(quantity.value) + 1));
    if (event.target.closest('#detail-add-cart')) ToyNest.addToCart(product.id, Number(quantity.value));
    if (event.target.closest('#buy-now') && ToyNest.addToCart(product.id, Number(quantity.value))) location.href = 'checkout.html';
  });
  quantity.addEventListener('change', () => {
    const amount = Number(quantity.value);
    quantity.value = String(Number.isInteger(amount) ? Math.max(1, Math.min(product.stock, amount)) : 1);
  });
  const related = TOYNEST_PRODUCTS.filter(item => item.id !== product.id && item.category === product.category).slice(0,4);
  const fallback = TOYNEST_PRODUCTS.filter(item => item.id !== product.id).slice(0,4-related.length);
  document.getElementById('related-products').innerHTML = [...related,...fallback].map(ToyNest.productCard).join('');
});
