(function () {
  'use strict';
  const form = document.getElementById('checkout-form');
  const summary = document.getElementById('checkout-summary');
  if (!StoreAPI.token) {
    window.location.replace('login.html?next=checkout');
  }
  async function loadSummary() {
    const cart = StoreAPI.getCart();
    if (!cart.length) {
      summary.innerHTML = '<h2>Your order</h2><p class="state-message">Your bag is empty.</p><a href="index.html#shop">Browse the collection</a>';
      form.querySelector('button[type="submit"]').disabled = true;
      return;
    }
    try {
      const products = await Promise.all(cart.map(item => StoreAPI.request(`/products/${encodeURIComponent(item.productId)}`)));
      summary.innerHTML = '<h2>Your order</h2>';
      let total = 0;
      products.forEach((product, index) => {
        const item = cart[index];
        total += product.price * item.quantity;
        const line = document.createElement('div');
        line.className = 'summary-product';
        const image = document.createElement('img');
        image.src = StoreAPI.safeImage(product.image);
        image.alt = product.name;
        const details = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = product.name;
        const qty = document.createElement('span');
        qty.textContent = `Qty ${item.quantity}`;
        details.append(name, qty);
        const price = document.createElement('b');
        price.textContent = StoreAPI.money(product.price * item.quantity);
        line.append(image, details, price);
        summary.append(line);
      });
      const totalRow = document.createElement('div');
      totalRow.className = 'summary-line summary-total';
      totalRow.innerHTML = '<span>Estimated total</span>';
      const totalValue = document.createElement('strong');
      totalValue.textContent = StoreAPI.money(total);
      totalRow.append(totalValue);
      summary.append(totalRow);
      const note = document.createElement('p');
      note.className = 'small-note';
      note.textContent = 'Demo checkout. No payment is collected.';
      summary.append(note);
    } catch (error) {
      summary.innerHTML = `<h2>Your order</h2><p class="state-message">${error.message}</p>`;
    }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!StoreAPI.getCart().length) {
      form.querySelector('.form-message').textContent = 'Your bag is empty.';
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    const message = form.querySelector('.form-message');
    button.disabled = true;
    message.textContent = 'Placing your demo order…';
    const address = Object.fromEntries(['fullName', 'email', 'phone', 'street', 'city', 'postalCode', 'country'].map(key => [key, form.elements[key].value.trim()]));
    let requestId = sessionStorage.getItem('simpleStoreCheckoutRequestId');
    if (!requestId) {
      requestId = window.crypto && typeof window.crypto.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('simpleStoreCheckoutRequestId', requestId);
    }
    try {
      const result = await StoreAPI.request('/orders', { method: 'POST', headers: { 'Idempotency-Key': requestId }, body: JSON.stringify({ items: StoreAPI.getCart(), shippingAddress: address }) });
      sessionStorage.removeItem('simpleStoreCheckoutRequestId');
      StoreAPI.saveCart([]);
      const receipt = document.createElement('div');
      receipt.className = 'empty-state';
      const icon = document.createElement('div');
      icon.className = 'empty-icon';
      icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
      const title = document.createElement('h2');
      title.textContent = 'Your order is in the books.';
      const copy = document.createElement('p');
      copy.textContent = `Order ${result.order._id} is confirmed. This was a demo checkout; no payment was taken.`;
      const ordersLink = document.createElement('a');
      ordersLink.className = 'button button-dark';
      ordersLink.href = 'orders.html';
      ordersLink.textContent = 'See your orders';
      receipt.append(icon, title, copy, ordersLink);
      document.querySelector('.checkout-layout').replaceChildren(receipt);
      document.querySelector('.page-title h1').textContent = 'Thank you.';
      document.querySelector('.page-title p').textContent = 'Your demo order has been saved.';
    } catch (error) {
      message.textContent = error.message;
      button.disabled = false;
      loadSummary();
    }
  });
  loadSummary();
})();
