(function () {
  'use strict';
  const root = document.getElementById('orders-list');
  if (!StoreAPI.token) {
    root.innerHTML = '<div class="empty-state"><h2>Your orders are just for you.</h2><p>Sign in to see the orders linked to your account.</p><a class="button button-dark" href="login.html">Sign in <span>↗</span></a></div>';
  } else {
    StoreAPI.request('/orders').then(orders => {
      root.replaceChildren();
      if (!orders.length) {
        root.innerHTML = '<div class="empty-state"><div class="empty-icon">⌁</div><h2>Your next good thing is out there.</h2><p>Orders you place will appear here.</p><a class="button button-dark" href="index.html#shop">Browse the collection</a></div>';
        return;
      }
      orders.forEach(order => {
        const card = document.createElement('article');
        card.className = 'order-card';
        const head = document.createElement('div');
        head.className = 'order-card-head';
        const meta = document.createElement('div');
        const heading = document.createElement('h2');
        heading.textContent = `Order ${order._id}`;
        const date = document.createElement('p');
        date.textContent = new Date(order.createdAt).toLocaleString();
        meta.append(heading, date);
        const status = document.createElement('span');
        status.className = 'order-status';
        status.textContent = order.status || 'placed';
        head.append(meta, status);
        card.append(head);
        (order.items || []).forEach(item => {
          const line = document.createElement('div');
          line.className = 'order-item';
          const name = document.createElement('span');
          name.textContent = `${item.name} × ${item.quantity}`;
          const price = document.createElement('strong');
          price.textContent = StoreAPI.money(item.unitPrice * item.quantity);
          line.append(name, price);
          card.append(line);
        });
        const total = document.createElement('div');
        total.className = 'summary-line summary-total';
        total.innerHTML = '<span>Order total</span>';
        const totalPrice = document.createElement('strong');
        totalPrice.textContent = StoreAPI.money(order.total);
        total.append(totalPrice);
        card.append(total);
        const address = document.createElement('div');
        address.className = 'order-address';
        const shipping = order.shippingAddress || {};
        address.textContent = `Delivering to ${shipping.fullName || ''} · ${shipping.street || ''}, ${shipping.city || ''}, ${shipping.country || ''}`;
        card.append(address);
        root.append(card);
      });
    }).catch(error => {
      root.innerHTML = `<div class="empty-state"><h2>We couldn't load your orders.</h2><p>${error.message}</p><a class="button button-dark" href="login.html">Sign in again</a></div>`;
    });
  }
})();
