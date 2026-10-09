(function () {
  'use strict';
  const grid = document.getElementById('product-grid');
  const categories = document.getElementById('category-list');
  const search = document.getElementById('product-search');
  const sort = document.getElementById('product-sort');
  const countLabel = document.getElementById('product-result-count');
  if (!grid || !categories || !search || !sort) return;
  let selectedCategory = '';
  let searchTimer;
  let requestNumber = 0;
  const categoryImages = {
    accessories: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=650&q=75',
    clothing: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=650&q=75',
    footwear: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=650&q=75',
    'home & living': 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=650&q=75',
    'on the go': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=650&q=75',
    wellness: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=650&q=75',
    stationery: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=650&q=75'
  };

  function starRating(rating) {
    const value = Number.isFinite(Number(rating)) ? Math.min(5, Math.max(0, Number(rating))) : 4.8;
    const ratingRow = document.createElement('div');
    ratingRow.className = 'product-rating';
    ratingRow.setAttribute('aria-label', `${value.toFixed(1)} out of 5 stars`);
    const stars = document.createElement('span');
    stars.setAttribute('aria-hidden', 'true');
    stars.textContent = '★★★★★';
    const score = document.createElement('span');
    score.textContent = value.toFixed(1);
    ratingRow.append(stars, score);
    return ratingRow;
  }

  function card(product, index) {
    const article = document.createElement('article');
    article.className = 'product-card reveal is-visible';
    article.style.animationDelay = `${Math.min(index % 4, 3) * 65}ms`;

    const media = document.createElement('div');
    media.className = 'product-media';
    const link = document.createElement('a');
    link.className = 'product-image-link';
    link.href = `product.html?id=${encodeURIComponent(product._id)}`;
    link.setAttribute('aria-label', `View ${product.name}`);
    const image = document.createElement('img');
    image.src = StoreAPI.safeImage(product.image);
    image.alt = product.name;
    image.loading = index < 4 ? 'eager' : 'lazy';
    image.onerror = () => { image.onerror = null; image.src = StoreAPI.safeImage(); };
    link.append(image);

    const badge = document.createElement('span');
    badge.className = product.compareAtPrice > product.price ? 'sale-pill' : 'stock-pill';
    badge.textContent = product.compareAtPrice > product.price ? 'A LITTLE LESS' : product.stock > 0 ? 'READY TO SHIP' : 'SOLD OUT';
    link.append(badge);

    const wishlist = document.createElement('button');
    wishlist.type = 'button';
    wishlist.className = 'wish-button';
    wishlist.setAttribute('aria-label', `Add ${product.name} to wishlist`);
    wishlist.setAttribute('aria-pressed', String(StoreAPI.getWishlist().includes(product._id)));
    wishlist.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.1-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.8a4.4 4.4 0 0 1 8.8-.2 4.4 4.4 0 0 1 8.8.2Z"/></svg>';
    wishlist.classList.toggle('is-saved', wishlist.getAttribute('aria-pressed') === 'true');
    wishlist.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const saved = StoreAPI.toggleWishlist(product._id);
      wishlist.classList.toggle('is-saved', saved);
      wishlist.setAttribute('aria-pressed', String(saved));
      wishlist.setAttribute('aria-label', `${saved ? 'Remove' : 'Add'} ${product.name} ${saved ? 'from' : 'to'} wishlist`);
      StoreAPI.showToast(saved ? 'Saved to your favorites.' : 'Removed from your favorites.');
    });

    const add = document.createElement('button');
    add.className = 'quick-add';
    add.type = 'button';
    add.disabled = product.stock < 1;
    add.setAttribute('aria-label', product.stock > 0 ? `Quick add ${product.name} to your bag` : `${product.name} is sold out`);
    add.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>';
    const addLabel = document.createElement('span');
    addLabel.textContent = product.stock > 0 ? 'Quick add' : 'Sold out';
    add.append(addLabel);
    add.addEventListener('click', () => StoreAPI.addToCart(product._id, 1));
    media.append(link, wishlist, add);

    const info = document.createElement('div');
    info.className = 'product-info';
    const category = document.createElement('span');
    category.className = 'product-category';
    category.textContent = product.category;
    const heading = document.createElement('h3');
    const title = document.createElement('a');
    title.href = link.href;
    title.textContent = product.name;
    heading.append(title);
    const prices = document.createElement('div');
    prices.className = 'product-price-row';
    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = StoreAPI.money(product.price);
    prices.append(price);
    if (product.compareAtPrice > product.price) {
      const oldPrice = document.createElement('span');
      oldPrice.className = 'product-old-price';
      oldPrice.textContent = StoreAPI.money(product.compareAtPrice);
      prices.append(oldPrice);
    }
    const stockText = document.createElement('span');
    stockText.className = 'stock-text';
    stockText.textContent = product.stock > 0 ? `${product.stock} left` : 'Out of stock';
    prices.append(stockText);
    info.append(category, heading, starRating(product.rating), prices);
    article.append(media, info);
    return article;
  }

  async function loadProducts() {
    const currentRequest = ++requestNumber;
    const params = new URLSearchParams();
    const term = search.value.trim();
    if (term) params.set('search', term);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sort.value) params.set('sort', sort.value);
    grid.replaceChildren();
    for (let index = 0; index < 4; index += 1) {
      const skeleton = document.createElement('div');
      skeleton.className = 'product-skeleton';
      grid.append(skeleton);
    }
    try {
      const products = await StoreAPI.request(`/products?${params.toString()}`);
      if (currentRequest !== requestNumber) return;
      grid.replaceChildren();
      countLabel.textContent = `${products.length} thoughtful ${products.length === 1 ? 'find' : 'finds'}`;
      if (!products.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = '<div class="empty-icon">⌕</div><h2>Nothing here just yet.</h2><p>Try another search or browse all our thoughtful finds.</p>';
        grid.append(empty);
        return;
      }
      products.forEach((product, index) => grid.append(card(product, index)));
    } catch (error) {
      if (currentRequest !== requestNumber) return;
      grid.replaceChildren();
      countLabel.textContent = 'Collection unavailable';
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const title = document.createElement('h2');
      title.textContent = 'We couldn’t load the collection.';
      const message = document.createElement('p');
      message.textContent = `${error.message} Check your MongoDB connection, start the API, and seed the catalogue.`;
      empty.append(title, message);
      grid.append(empty);
    }
  }

  function drawCategories(items) {
    categories.replaceChildren();
    if (!items.length) {
      const error = document.createElement('p');
      error.className = 'state-message';
      error.textContent = 'Categories will appear once the API is connected and the catalogue is seeded.';
      categories.append(error);
      return;
    }
    items.slice(0, 5).forEach((item, index) => {
      const name = typeof item === 'string' ? item : item.name;
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'category-tile reveal is-visible';
      tile.dataset.category = name;
      tile.style.setProperty('--category-image', `url("${categoryImages[name.toLowerCase()] || categoryImages['home & living']}")`);
      const label = document.createElement('span');
      label.textContent = name;
      const categoryHint = document.createElement('small');
      categoryHint.textContent = 'Explore the edit';
      label.append(categoryHint);
      const arrow = document.createElement('span');
      arrow.className = 'category-arrow';
      arrow.textContent = '↗';
      tile.append(label, arrow);
      categories.append(tile);
    });
    categories.addEventListener('click', event => {
      const target = event.target.closest('[data-category]');
      if (!target) return;
      selectedCategory = selectedCategory === target.dataset.category ? '' : target.dataset.category;
      categories.querySelectorAll('.category-tile').forEach(tile => tile.classList.toggle('is-selected', tile.dataset.category === selectedCategory));
      loadProducts();
      document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
    });
  }

  search.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(loadProducts, 240);
  });
  sort.addEventListener('change', loadProducts);
  document.querySelectorAll('[data-promo-category]').forEach(link => link.addEventListener('click', () => {
    selectedCategory = link.dataset.promoCategory;
    window.setTimeout(loadProducts, 0);
  }));
  StoreAPI.request('/products/categories')
    .then(drawCategories)
    .catch(error => {
      categories.replaceChildren();
      const message = document.createElement('p');
      message.className = 'state-message';
      message.textContent = `Categories unavailable: ${error.message}`;
      categories.append(message);
    });
  loadProducts();
})();
