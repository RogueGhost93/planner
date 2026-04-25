/**
 * Modul: Setup-Seite (Erst-Einrichtung)
 * Zweck: Web-basierte Erstellung des ersten Admin-Kontos. Ersetzt `node setup.js`.
 *        Erreichbar nur solange noch kein Admin existiert (Server gibt 409 sonst).
 * Abhängigkeiten: /api.js
 */

import { auth } from '/api.js';

export async function render(container) {
  container.innerHTML = `
    <main class="login-page" id="main-content">
      <div class="login-hero">
        <h1 class="login-hero__title">Planium</h1>
        <p class="login-hero__tagline">First-time setup — create your admin account.</p>
      </div>
      <div class="login-card card card--padded">
        <div class="setup-warning" role="note">
          <strong>Before you continue:</strong> make sure
          <code>SESSION_SECRET</code> is set to a strong random value in your
          <code>.env</code> file. Generate one with:
          <pre><code>openssl rand -hex 32</code></pre>
          Changing it later will invalidate every active session.
        </div>

        <form class="login-form" id="setup-form" novalidate>
          <div class="form-group">
            <label class="label" for="username">Username</label>
            <input
              class="input"
              type="text"
              id="username"
              name="username"
              autocomplete="username"
              autocapitalize="none"
              autocorrect="off"
              minlength="3"
              maxlength="64"
              placeholder="admin"
              required
            />
          </div>

          <div class="form-group">
            <label class="label" for="display_name">Display name</label>
            <input
              class="input"
              type="text"
              id="display_name"
              name="display_name"
              maxlength="128"
              placeholder="Jane Doe"
              required
            />
          </div>

          <div class="form-group">
            <label class="label" for="password">Password</label>
            <input
              class="input"
              type="password"
              id="password"
              name="password"
              autocomplete="new-password"
              minlength="8"
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div class="form-group">
            <label class="label" for="password_confirm">Confirm password</label>
            <input
              class="input"
              type="password"
              id="password_confirm"
              name="password_confirm"
              autocomplete="new-password"
              minlength="8"
              required
            />
          </div>

          <div class="login-error" id="setup-error" role="alert" aria-live="polite" hidden></div>

          <button type="submit" class="btn btn--primary login-form__submit" id="setup-btn">
            Create admin account
          </button>
        </form>
      </div>
    </main>
  `;

  const form = container.querySelector('#setup-form');
  const errorEl = container.querySelector('#setup-error');
  const submitBtn = container.querySelector('#setup-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const username = form.username.value.trim();
    const displayName = form.display_name.value.trim();
    const password = form.password.value;
    const confirm = form.password_confirm.value;

    if (!username || !displayName || !password) {
      return showError(errorEl, 'All fields are required.');
    }
    if (password.length < 8) {
      return showError(errorEl, 'Password must be at least 8 characters.');
    }
    if (password !== confirm) {
      return showError(errorEl, 'Passwords do not match.');
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating…';

    try {
      await auth.setup({ username, display_name: displayName, password });
      const result = await auth.login(username, password);
      window.planium.navigate('/', result.user);
    } catch (err) {
      showError(errorEl, err.data?.error || err.message || 'Setup failed.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create admin account';
    }
  });
}

function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
}
