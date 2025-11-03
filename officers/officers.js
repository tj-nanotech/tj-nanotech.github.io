(function () {
  // Find the Officers grid on the page
  const grid = document.querySelector('.members-grid');
  if (!grid) return;

  // Allow overriding the data src via data attribute; fallback to /officers/officers.json
  const DATA_URL = grid.getAttribute('data-src') || '/officers/officers.json';

  function createFallbackAvatarSVG() {
    return `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
      </svg>
    `;
  }

  function makeCard(entry) {
    const { name, role, avatar_url } = entry;

    const card = document.createElement('div');
    card.className = 'member-card';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';

    if (avatar_url && typeof avatar_url === 'string' && avatar_url.trim() !== '') {
      const img = document.createElement('img');
      img.src = avatar_url;
      img.alt = name ? `${name}'s photo` : 'Officer photo';
      // Inline sizing so no CSS change is required
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
      avatar.appendChild(img);
    } else {
      avatar.innerHTML = createFallbackAvatarSVG();
    }

    const h3 = document.createElement('h3');
    h3.className = 'member-name';
    h3.textContent = name || 'Unnamed';

    const p = document.createElement('p');
    p.className = 'member-role';
    p.textContent = role || '';

    card.appendChild(avatar);
    card.appendChild(h3);
    card.appendChild(p);
    return card;
  }

  function validate(items) {
    if (!Array.isArray(items)) {
      throw new Error('Dataset must be an array of officers.');
    }
    const out = [];
    items.forEach((it, idx) => {
      if (!it || typeof it !== 'object') return;
      const name = typeof it.name === 'string' ? it.name.trim() : '';
      const role = typeof it.role === 'string' ? it.role.trim() : '';
      const order = typeof it.order === 'number' ? it.order : Number.POSITIVE_INFINITY;
      out.push({ name, role, order, avatar_url: it.avatar_url || '' });
    });
    return out;
  }

  function render(items) {
    grid.innerHTML = '';
    if (!items.length) return;
    items.forEach((entry) => grid.appendChild(makeCard(entry)));
    // If the page defined a layout updater (for mobile), re-run it now
    if (typeof window.updateLayout === 'function') {
      window.updateLayout();
    }
  }

  fetch(DATA_URL, { cache: 'no-store' })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status} while fetching ${DATA_URL}`);
      return r.json();
    })
    .then((data) => {
      const clean = validate(data)
        .sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));
      render(clean);
    })
    .catch((err) => {
      console.error('[Officers]', err);
    });
})();