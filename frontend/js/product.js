(function () {
  'use strict';
  const root = document.getElementById('product-detail');
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    root.innerHTML = '<div class="empty-state"><h2>Which one caught your eye?</h2><p>Choose something lovely from our collection.</p><a class="button button-dark" href="index.html#shop">Browse the shop</a></div>';
    return;
  }

  StoreAPI.request(`/products/${encodeURIComponent(id)}`).then(product => {
    document.title = `${product.name} — Simple Store`;
    const image = document.createElement('img');
    image.className = 'detail-image';
    image.src = StoreAPI.safeImage(product.image);
    image.alt = product.name;
    image.onerror = () => { image.onerror = null; image.src = StoreAPI.safeImage(); };
    const copy = document.createElement('section');
    copy.className = 'detail-copy';
    const category = document.createElement('span');
    category.className = 'product-category';
    category.textContent = product.category;
    const title = document.createElement('h1');
    title.textContent = product.name;
    const price = document.createElement('div');
    price.className = 'detail-price';
    price.textContent = StoreAPI.money(product.price);
    if (product.compareAtPrice > product.price) {
      const previousPrice = document.createElement('span');
      previousPrice.className = 'detail-old-price';
      previousPrice.textContent = StoreAPI.money(product.compareAtPrice);
      price.append(previousPrice);
    }
    const rating = document.createElement('div');
    rating.className = 'detail-rating';
    rating.textContent = `★★★★★ `;
    const ratingScore = document.createElement('span');
    ratingScore.textContent = `${Number(product.rating || 4.8).toFixed(1)} / 5`;
    rating.append(ratingScore);
    const stock = document.createElement('p');
    stock.className = 'detail-stock';
    stock.textContent = product.stock > 0 ? `${product.stock} thoughtfully made ${product.stock === 1 ? 'piece' : 'pieces'} in stock` : 'Currently out of stock';
    const description = document.createElement('p');
    description.className = 'detail-description';
    description.textContent = product.description;
    const quantity = document.createElement('div');
    quantity.className = 'quantity-control';
    quantity.innerHTML = '<button type="button" aria-label="Decrease quantity">−</button><span>1</span><button type="button" aria-label="Increase quantity">+</button>';
    const count = quantity.querySelector('span');
    quantity.addEventListener('click', event => {
      if (event.target.tagName !== 'BUTTON') return;
      const change = event.target.textContent === '+' ? 1 : -1;
      count.textContent = String(Math.max(1, Math.min(product.stock, Number(count.textContent) + change)));
    });
    const actions = document.createElement('div');
    actions.className = 'detail-actions';
    const add = document.createElement('button');
    add.className = 'button button-dark';
    add.type = 'button';
    add.disabled = product.stock < 1;
    add.textContent = product.stock > 0 ? 'Add to bag' : 'Out of stock';
    const wishlist = document.createElement('button');
    wishlist.className = 'wish-button detail-wishlist';
    wishlist.type = 'button';
    const saved = StoreAPI.getWishlist().includes(product._id);
    wishlist.classList.toggle('is-saved', saved);
    wishlist.setAttribute('aria-pressed', String(saved));
    wishlist.setAttribute('aria-label', saved ? 'Remove from favorites' : 'Add to favorites');
    wishlist.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.1-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.8a4.4 4.4 0 0 1 8.8-.2 4.4 4.4 0 0 1 8.8.2Z"/></svg>';
    wishlist.addEventListener('click', () => {
      const isSaved = StoreAPI.toggleWishlist(product._id);
      wishlist.classList.toggle('is-saved', isSaved);
      wishlist.setAttribute('aria-pressed', String(isSaved));
      wishlist.setAttribute('aria-label', isSaved ? 'Remove from favorites' : 'Add to favorites');
      StoreAPI.showToast(isSaved ? 'Saved to your favorites.' : 'Removed from your favorites.');
    });
    actions.append(quantity, add, wishlist);
    const feedback = document.createElement('div');
    feedback.className = 'detail-message';
    add.addEventListener('click', () => {
      StoreAPI.addToCart(product._id, Number(count.textContent));
      feedback.textContent = `${product.name} added to your bag.`;
    });
    copy.append(category, title, price, rating, stock, description, actions, feedback);
    root.replaceChildren(image, copy);
  }).catch(error => {
    root.innerHTML = `<div class="empty-state"><h2>We couldn't find that product</h2><p>${error.message}</p><a class="button button-dark" href="index.html#shop">Back to the shop</a></div>`;
  });
})();
