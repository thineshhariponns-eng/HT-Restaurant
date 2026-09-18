(function () {
  document.querySelectorAll('[data-nav-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.querySelector(btn.getAttribute('data-nav-toggle'));
      if (!target) return;
      var open = target.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  document.querySelectorAll('[data-drawer-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.querySelector(btn.getAttribute('data-drawer-open'));
      if (target) target.classList.add('open');
    });
  });
  document.querySelectorAll('[data-drawer-close]').forEach(function (el) {
    el.addEventListener('click', function () {
      var container = el.closest('.admin-mobile-sidebar, .modal-backdrop');
      if (container) container.classList.remove('open');
    });
  });

  // Quantity steppers: adjust a sibling number input, then submit its form.
  document.querySelectorAll('[data-qty-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var form = btn.closest('form');
      var input = form.querySelector('input[type="number"]');
      var step = parseInt(btn.getAttribute('data-qty-step'), 10);
      var next = Math.max(0, Math.min(20, (parseInt(input.value, 10) || 0) + step));
      input.value = next;
      form.requestSubmit();
    });
  });

  document.querySelectorAll('[data-qty-input]').forEach(function (input) {
    input.addEventListener('change', function () {
      var form = input.closest('form');
      var value = Math.max(0, Math.min(20, parseInt(input.value, 10) || 0));
      input.value = value;
      form.requestSubmit();
    });
  });

  // Password visibility toggle on the login form.
  document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.closest('.auth-input').querySelector('[data-password-input]');
      if (!input) return;
      var shown = input.type === 'text';
      input.type = shown ? 'password' : 'text';
      btn.setAttribute('aria-label', shown ? 'Show password' : 'Hide password');
    });
  });

  // Admin clock.
  var clock = document.querySelector('[data-admin-clock]');
  if (clock) {
    var render = function () {
      var now = new Date();
      clock.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };
    render();
    setInterval(render, 30000);
  }

  // Simple confirm modal: any [data-confirm-modal] button opens the referenced
  // <template>/backdrop; the form inside submits normally on confirm.
  document.querySelectorAll('[data-open-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var modal = document.querySelector(btn.getAttribute('data-open-modal'));
      if (modal) modal.classList.add('open');
    });
  });
})();
