(function () {
  'use strict';
  function showMessage(form, message, success) {
    const node = form.querySelector('.form-message');
    node.textContent = message;
    node.classList.toggle('success', Boolean(success));
  }
  function destination() {
    const next = new URLSearchParams(window.location.search).get('next');
    return next === 'checkout' ? 'checkout.html' : 'index.html';
  }
  const login = document.getElementById('login-form');
  if (login) login.addEventListener('submit', async event => {
    event.preventDefault();
    if (!login.reportValidity()) return;
    const button = login.querySelector('button[type="submit"]');
    button.disabled = true;
    showMessage(login, 'Signing you in…');
    try {
      const data = await StoreAPI.request('/auth/login', { method: 'POST', body: JSON.stringify({ email: login.elements.email.value.trim(), password: login.elements.password.value }) });
      StoreAPI.setToken(data.token);
      showMessage(login, 'Signed in. Taking you to the shop…', true);
      window.location.href = destination();
    } catch (error) { showMessage(login, error.message); button.disabled = false; }
  });

  const register = document.getElementById('register-form');
  if (register) register.addEventListener('submit', async event => {
    event.preventDefault();
    if (!register.reportValidity()) return;
    const button = register.querySelector('button[type="submit"]');
    button.disabled = true;
    showMessage(register, 'Creating your account…');
    try {
      const data = await StoreAPI.request('/auth/register', { method: 'POST', body: JSON.stringify({ name: register.elements.name.value.trim(), email: register.elements.email.value.trim(), password: register.elements.password.value }) });
      StoreAPI.setToken(data.token);
      showMessage(register, 'Your account is ready. Welcome!', true);
      window.location.href = destination();
    } catch (error) { showMessage(register, error.message); button.disabled = false; }
  });
})();
