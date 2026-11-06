document.addEventListener('DOMContentLoaded', () => {
  const allCategories = [...new Set(TOYNEST_PRODUCTS.map(product => product.category))];
  const allBrands = [...new Set(TOYNEST_PRODUCTS.map(product => product.brand))];
  const categoryHost = document.getElementById('category-filters');
  const brandHost = document.getElementById('brand-filters');
  categoryHost.innerHTML = allCategories.map((category, index) => `<label><input type="checkbox" name="category" value="${ToyNest.escapeHTML(category)}" id="category-${index}"> ${ToyNest.escapeHTML(category)}</label>`).join('');
  brandHost.innerHTML = allBrands.map((brand, index) => `<label><input type="checkbox" name="brand" value="${ToyNest.escapeHTML(brand)}" id="brand-${index}"> ${ToyNest.escapeHTML(brand)}</label>`).join('');

  const filters = document.querySelector('.filter-panel');
  document.getElementById('mobile-filter-content').append(filters.cloneNode(true));
  const params = new URLSearchParams(location.search);
  const initialQuery = params.get('q') || '';
  const initialCategory = params.get('category');
  const initialSort = params.get('sort');
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = initialQuery;
  if (['popular','newest','price-low','price-high','rating'].includes(initialSort)) {
    document.getElementById('sort-products').value = initialSort;
    document.getElementById('mobile-sort').value = initialSort;
  }
  if (initialCategory) document.querySelectorAll('input[name="category"]').forEach(input => { if (input.value === initialCategory) input.checked = true; });

  let pageSize = 8;
  let filteredProducts = [];
  const selected = name => [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
  const firstValue = selector => document.querySelector(selector)?.value ?? '';

  function render() {
    const query = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
    const categories = selected('category');
    const ages = selected('age');
    const brands = selected('brand');
    const min = Number(firstValue('#min-price')) || 0;
    const maxInput = firstValue('#max-price');
    const max = maxInput === '' ? Infinity : Number(maxInput);
    const rating = Number(firstValue('input[name="rating"]:checked')) || 0;
    const sort = document.getElementById('sort-products').value;

    filteredProducts = TOYNEST_PRODUCTS.filter(product => {
      const matchesQuery = !query || `${product.name} ${product.description} ${product.category} ${product.brand}`.toLowerCase().includes(query);
      return matchesQuery &&
        (!categories.length || categories.includes(product.category)) &&
        (!ages.length || ages.includes(product.age)) &&
        (!brands.length || brands.includes(product.brand)) &&
        product.price >= min && product.price <= max &&
        product.rating >= rating;
    });
    const sorters = {
      popular: (a,b) => b.popularity - a.popularity,
      newest: (a,b) => new Date(b.created) - new Date(a.created),
      'price-low': (a,b) => ToyNest.priceOf(a) - ToyNest.priceOf(b),
      'price-high': (a,b) => ToyNest.priceOf(b) - ToyNest.priceOf(a),
      rating: (a,b) => b.rating - a.rating || b.reviews - a.reviews
    };
    filteredProducts.sort(sorters[sort] || sorters.popular);
    document.getElementById('result-count').textContent = `${filteredProducts.length} ${filteredProducts.length === 1 ? 'toy' : 'toys'} to explore`;
    document.getElementById('product-grid').innerHTML = filteredProducts.slice(0, pageSize).map(ToyNest.productCard).join('');
    document.getElementById('no-products').classList.toggle('d-none', filteredProducts.length > 0);
    document.getElementById('load-more').classList.toggle('d-none', filteredProducts.length <= pageSize);
  }
  function resetFilters() {
    document.querySelectorAll('.filter-panel input[type="checkbox"], .filter-panel input[type="radio"]').forEach(input => { input.checked = false; });
    document.querySelectorAll('.filter-panel input[type="number"]').forEach(input => { input.value = ''; });
    document.getElementById('search-input').value = '';
    document.getElementById('sort-products').value = 'popular';
    document.getElementById('mobile-sort').value = 'popular';
    pageSize = 8;
    render();
  }
  document.addEventListener('input', event => {
    if (event.target.closest('.filter-panel')) {
      if (event.target.id === 'min-price' || event.target.id === 'max-price') {
        const minInputs = [...document.querySelectorAll('#min-price')];
        const maxInputs = [...document.querySelectorAll('#max-price')];
        if (event.target.id === 'min-price') minInputs.forEach(input => { if (input !== event.target) input.value = event.target.value; });
        else maxInputs.forEach(input => { if (input !== event.target) input.value = event.target.value; });
      }
      pageSize = 8;
      render();
    }
    if (event.target.id === 'search-input') { pageSize = 8; render(); }
  });
  document.addEventListener('change', event => {
    if (event.target.closest('.filter-panel')) { pageSize = 8; render(); }
    if (event.target.id === 'sort-products' || event.target.id === 'mobile-sort') {
      const value = event.target.value;
      document.getElementById('sort-products').value = value;
      document.getElementById('mobile-sort').value = value;
      render();
    }
  });
  document.getElementById('clear-filters').addEventListener('click', resetFilters);
  document.getElementById('empty-reset').addEventListener('click', resetFilters);
  document.getElementById('load-more').addEventListener('click', () => { pageSize += 8; render(); });
  document.getElementById('mobile-filter-content').addEventListener('click', event => {
    if (event.target.closest('#clear-filters')) resetFilters();
  });
  document.getElementById('search-input').addEventListener('input', () => {
    const search = document.getElementById('search-input');
    if (search.value) document.querySelectorAll('input[name="category"]').forEach(input => { input.checked = false; });
  });
  render();
});
