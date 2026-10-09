(function () {
  'use strict';
  const root = document.getElementById('cart-content');
  function empty() {
    root.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.1-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.8a4.4 4.4 0 0 1 8.8-.2 4.4 4.4 0 0 1 8.8.2Z"/></svg></div><h2>Your bag is taking a little breather.</h2><p>Find something thoughtful to bring home.</p><a class="button button-dark" href="index.html#shop">Explore the collection</a></div>';
  }
  function quantityControl(item, product) {
    const control = document.createElement('div');
    control.className = 'quantity-control';
    control.innerHTML = '<button type="button" aria-label="Decrease quantity">−</button><span></span><button type="button" aria-label="Increase quantity">+</button>';
    control.querySelector('span').textContent = String(item.quantity);
    control.addEventListener('click', event => {
      if (event.target.tagName !== 'BUTTON') return;
      const direction = event.target.textContent === '+' ? 1 : -1;
      const updated = StoreAPI.getCart();
      const found = updated.find(entry => entry.productId === item.productId);
      if (!found) return;
      found.quantity = Math.min(product.stock, found.quantity + direction);
      if (found.quantity < 1) StoreAPI.saveCart(updated.filter(entry => entry !== found));
      else StoreAPI.saveCart(updated);
      render();
    });
    return control;
  }
  async function render() {
    const cart = StoreAPI.getCart();
    if (!cart.length) { empty(); return; }
    root.innerHTML = '<p class="state-message">Updating your bag…</p>';
    try {
      const fetched = await Promise.all(cart.map(async item => {
        try { return { item, product: await StoreAPI.request(`/products/${encodeURIComponent(item.productId)}`) }; }
        catch (error) { return { item, error }; }
      }));
      const failed = fetched.find(entry => entry.error && entry.error.status !== 404);
      if (failed) {
        root.replaceChildren();
        const message = document.createElement('p');
        message.className = 'state-message';
        message.textContent = `${failed.error.message} Your saved bag is unchanged.`;
        root.append(message);
        return;
      }
      const missing = fetched.filter(entry => entry.error && entry.error.status === 404);
      if (missing.length) StoreAPI.saveCart(StoreAPI.getCart().filter(item => !missing.some(entry => entry.item.productId === item.productId)));
      const valid = fetched.filter(entry => entry.product);
      if (!valid.length) { empty(); return; }
      const items = document.createElement('div');
      items.className = 'cart-items';
      let total = 0;
      valid.forEach(({ item, product }) => {
        item.quantity = Math.max(1, Math.min(item.quantity, Math.max(1, product.stock)));
        total += product.price * item.quantity;
        const row = document.createElement('article');
        row.className = 'cart-row';
        const image = document.createElement('img');
        image.src = StoreAPI.safeImage(product.image);
        image.alt = product.name;
        image.onerror = () => { image.onerror = null; image.src = StoreAPI.safeImage(); };
        const details = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = product.name;
        const category = document.createElement('p');
        category.textContent = product.category;
        const actions = document.createElement('div');
        actions.className = 'cart-row-actions';
        actions.append(quantityControl(item, product));
        const remove = document.createElement('button');
        remove.className = 'remove-button';
        remove.textContent = 'Remove';
        remove.addEventListener('click', () => {
          StoreAPI.saveCart(StoreAPI.getCart().filter(entry => entry.productId !== item.productId));
          render();
        });
        actions.append(remove);
        details.append(title, category, actions);
        const price = document.createElement('span');
        price.className = 'line-price';
        price.textContent = StoreAPI.money(product.price * item.quantity);
        row.append(image, details, price);
        items.append(row);
      });
      StoreAPI.saveCart(valid.map(({ item }) => item));
      const summary = document.createElement('aside');
      summary.className = 'panel';
      summary.innerHTML = '<h2>Order summary</h2>';
      const subtotal = document.createElement('div');
      subtotal.className = 'summary-line';
      subtotal.innerHTML = '<span>Subtotal</span>';
      const subvalue = document.createElement('strong');
      subvalue.textContent = StoreAPI.money(total);
      subtotal.append(subvalue);
      const shipping = document.createElement('div');
      shipping.className = 'summary-line';
      shipping.innerHTML = '<span>Demo delivery</span><strong>No payment collected</strong>';
      const note = document.createElement('p');
      note.className = 'small-note';
      note.textContent = 'Final product prices and stock are checked by the store at checkout.';
      const checkout = document.createElement('a');
      checkout.className = 'button button-dark button-full';
      checkout.href = StoreAPI.token ? 'checkout.html' : 'login.html?next=checkout';
      checkout.innerHTML = 'Continue to checkout <span>↗</span>';
      summary.append(subtotal, shipping, checkout, note);
      root.replaceChildren(items, summary);
    } catch (error) {
      root.innerHTML = `<p class="state-message">${error.message}</p>`;
    }
  }
  render();
})();
