(function () {
  'use strict';
  const API_BASE_URL = 'http://localhost:5001/api';
  const CART_KEY = 'simpleStoreCart';
  const TOKEN_KEY = 'simpleStoreToken';
  const WISHLIST_KEY = 'simpleStoreWishlist';
  let drawerBusy = false;

  async function request(path, options) {
    const settings = options || {};
    const headers = Object.assign({ 'Content-Type': 'application/json' }, settings.headers || {});
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, Object.assign({}, settings, { headers }));
    } catch (error) {
      throw new Error('Could not reach the store API. Start the backend and check the API URL.');
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && token) {
        localStorage.removeItem(TOKEN_KEY);
        updateAccountLink();
      }
      const error = new Error(body.message || 'Something went wrong. Please try again.');
      error.status = response.status;
      throw error;
    }
    return body;
  }

  function getCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(cart) ? cart.filter(item => item && typeof item.productId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0) : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    document.dispatchEvent(new CustomEvent('store:cart-updated'));
  }

  function addToCart(productId, quantity) {
    const cart = getCart();
    const existing = cart.find(item => item.productId === productId);
    const amount = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
    if (existing) existing.quantity += amount;
    else cart.push({ productId, quantity: amount });
    saveCart(cart);
    showToast('Added to your bag — good choice.');
  }

  function getWishlist() {
    try {
      const list = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
      return Array.isArray(list) ? list.filter(id => typeof id === 'string') : [];
    } catch (error) {
      return [];
    }
  }

  function toggleWishlist(productId) {
    const wishlist = getWishlist();
    const index = wishlist.indexOf(productId);
    if (index === -1) wishlist.push(productId);
    else wishlist.splice(index, 1);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    return index === -1;
  }

  function money(value) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value || 0);
  }

  function safeImage(image) {
    return image || 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=900&q=80';
  }

  function updateCartCount() {
    const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(node => {
      node.textContent = String(count);
      const link = node.closest('.cart-link');
      if (link) link.setAttribute('aria-label', `Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`);
      node.classList.remove('bump');
      requestAnimationFrame(() => node.classList.add('bump'));
    });
  }

  function updateAccountLink() {
    const link = document.querySelector('.account-link');
    if (!link) return;
    const signedIn = Boolean(localStorage.getItem(TOKEN_KEY));
    if (!link.querySelector('svg')) {
      link.replaceChildren();
      link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.4-3.8 2.8-5.7 7-5.7s6.6 1.9 7 5.7"/></svg>';
      link.classList.add('icon-button');
    }
    link.href = signedIn ? '#signout' : 'login.html';
    link.setAttribute('aria-label', signedIn ? 'Sign out' : 'Sign in');
    link.title = signedIn ? 'Sign out' : 'Sign in';
    if (signedIn) {
      link.onclick = event => {
        event.preventDefault();
        localStorage.removeItem(TOKEN_KEY);
        showToast('You are signed out.');
        window.setTimeout(() => { window.location.href = 'index.html'; }, 250);
      };
    } else link.onclick = null;
  }

  function enhanceHeader() {
    const actions = document.querySelector('.header-actions');
    if (actions) {
      if (!actions.querySelector('.header-search')) {
        const search = document.createElement('button');
        search.className = 'header-search icon-button';
        search.type = 'button';
        search.setAttribute('aria-label', 'Search products');
        search.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 4 4"/></svg>';
        actions.prepend(search);
      }
      const cart = actions.querySelector('.cart-link');
      if (cart && !cart.querySelector('svg')) {
        const count = cart.querySelector('.cart-count') || document.createElement('span');
        count.className = 'cart-count';
        cart.replaceChildren();
        cart.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>';
        cart.append(count);
        cart.classList.add('icon-button');
      }
    }
    const toggle = document.querySelector('.menu-toggle');
    if (toggle && !toggle.querySelector('svg')) {
      toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
      toggle.classList.add('icon-button');
    }
  }

  function showToast(message) {
    let region = document.querySelector('.toast-region');
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      document.body.append(region);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
    const text = document.createElement('span');
    text.textContent = message;
    toast.append(text);
    region.append(toast);
    window.setTimeout(() => {
      toast.classList.add('leaving');
      window.setTimeout(() => toast.remove(), 220);
    }, 2600);
  }

  function setupDrawer() {
    const cartLink = document.querySelector('.cart-link');
    if (!cartLink) return;
    const drawer = document.createElement('aside');
    drawer.className = 'cart-drawer';
    drawer.setAttribute('aria-label', 'Shopping bag');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    drawer.innerHTML = '<div class="drawer-head"><div><h2>Your bag</h2><p>A little something good.</p></div><button class="drawer-close icon-button" type="button" aria-label="Close shopping bag"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div class="drawer-items"></div><div class="drawer-summary"></div>';
    const backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.append(backdrop, drawer);
    const closeButton = drawer.querySelector('.drawer-close');

    async function renderDrawer() {
      const itemsRoot = drawer.querySelector('.drawer-items');
      const summaryRoot = drawer.querySelector('.drawer-summary');
      const cart = getCart();
      itemsRoot.replaceChildren();
      summaryRoot.replaceChildren();
      if (!cart.length) {
        const empty = document.createElement('div');
        empty.className = 'drawer-empty';
        empty.innerHTML = '<strong>Room for something good.</strong>Your bag is currently empty.';
        itemsRoot.append(empty);
        return;
      }
      if (drawerBusy) return;
      drawerBusy = true;
      const status = document.createElement('p');
      status.className = 'state-message';
      status.textContent = 'Loading your bag…';
      itemsRoot.append(status);
      try {
        const products = await Promise.all(cart.map(async item => {
          try { return { item, product: await request(`/products/${encodeURIComponent(item.productId)}`) }; }
          catch (error) { return { item, error }; }
        }));
        const failed = products.filter(entry => entry.error);
        if (failed.length) {
          itemsRoot.replaceChildren();
          const issue = document.createElement('p');
          issue.className = 'state-message';
          issue.textContent = failed[0].error.message;
          itemsRoot.append(issue);
          return;
        }
        itemsRoot.replaceChildren();
        let total = 0;
        products.slice(0, 5).forEach(({ item, product }) => {
          const row = document.createElement('div');
          row.className = 'drawer-row';
          const image = document.createElement('img');
          image.src = safeImage(product.image);
          image.alt = product.name;
          image.onerror = () => { image.onerror = null; image.src = safeImage(); };
          const details = document.createElement('div');
          const name = document.createElement('strong');
          name.textContent = product.name;
          const qty = document.createElement('small');
          qty.textContent = `${item.quantity} × ${money(product.price)}`;
          details.append(name, qty);
          const price = document.createElement('b');
          price.textContent = money(item.quantity * product.price);
          row.append(image, details, price);
          itemsRoot.append(row);
          total += item.quantity * product.price;
        });
        if (products.length > 5) {
          const more = document.createElement('p');
          more.className = 'small-note';
          more.textContent = `And ${products.length - 5} more thoughtful finds in your bag.`;
          itemsRoot.append(more);
        }
        const subtotal = document.createElement('div');
        subtotal.className = 'summary-line summary-total';
        const label = document.createElement('span');
        label.textContent = 'Subtotal';
        const amount = document.createElement('strong');
        amount.textContent = money(total);
        subtotal.append(label, amount);
        const note = document.createElement('p');
        note.className = 'small-note';
        note.textContent = 'Shipping and final stock checks at checkout.';
        const checkout = document.createElement('a');
        checkout.className = 'button button-primary button-full';
        checkout.href = localStorage.getItem(TOKEN_KEY) ? 'checkout.html' : 'login.html?next=checkout';
        checkout.textContent = 'Continue to checkout';
        const viewCart = document.createElement('a');
        viewCart.className = 'drawer-footer-link';
        viewCart.href = 'cart.html';
        viewCart.textContent = 'View full bag';
        summaryRoot.append(subtotal, note, checkout, viewCart);
      } finally {
        drawerBusy = false;
      }
    }

    function open() {
      document.body.classList.add('drawer-open');
      drawer.setAttribute('aria-hidden', 'false');
      drawer.inert = false;
      renderDrawer();
      closeButton.focus();
    }

    function close() {
      document.body.classList.remove('drawer-open');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.inert = true;
      cartLink.focus();
    }

    cartLink.addEventListener('click', event => {
      event.preventDefault();
      open();
    });
    closeButton.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.body.classList.contains('drawer-open')) close();
    });
    drawer.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(drawer.querySelectorAll('a[href], button:not(:disabled)'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    document.addEventListener('store:cart-updated', () => {
      if (document.body.classList.contains('drawer-open')) renderDrawer();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    enhanceHeader();
    updateCartCount();
    updateAccountLink();
    setupDrawer();
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.main-nav');
    if (toggle && nav) toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    const searchButton = document.querySelector('.header-search');
    if (searchButton) searchButton.addEventListener('click', () => {
      const search = document.getElementById('product-search');
      if (search) {
        document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
        window.setTimeout(() => search.focus(), 450);
      } else window.location.href = 'index.html#shop';
    });
    document.addEventListener('keydown', event => {
      if (event.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        event.preventDefault();
        const search = document.getElementById('product-search');
        if (search) search.focus();
        else window.location.href = 'index.html#shop';
      }
    });
    const year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }), { threshold: 0.12 });
      document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
    } else document.querySelectorAll('.reveal').forEach(element => element.classList.add('is-visible'));
    document.querySelectorAll('a[href="#top"]').forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  });

  window.StoreAPI = {
    request, getCart, saveCart, addToCart, money, safeImage, getWishlist, toggleWishlist, showToast,
    get token() { return localStorage.getItem(TOKEN_KEY); },
    setToken(value) { localStorage.setItem(TOKEN_KEY, value); },
    clearToken() { localStorage.removeItem(TOKEN_KEY); },
    get baseUrl() { return API_BASE_URL; }
  };
})();
