(async function init() {
  const DATA_URL = 'lectures.json';
  const $errorBlock = document.getElementById('error-block');
  const $errorJson = document.getElementById('error-json');
  const $list = document.getElementById('lecture-list');
  const $empty = document.getElementById('empty-state');

  function showError(obj) {
    $errorJson.textContent = JSON.stringify(obj, null, 2);
    $errorBlock.classList.remove('hidden');
  }

  function hideError() {
    $errorBlock.classList.add('hidden');
    $errorJson.textContent = '';
  }

  function isISODate(dateStr) {
    if (typeof dateStr !== 'string') return false;
    const m = dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
    if (!m) return false;
    const [y, mo, d] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
  }

  function isValidUrl(urlStr) {
    try { new URL(urlStr); return true; } catch { return false; }
  }

  function validateDataset(data) {
    const details = [];

    if (!Array.isArray(data)) {
      return { error: 'Malformed dataset', details: 'Root must be a JSON array' };
    }

    const nameSet = new Set();

    data.forEach((entry, i) => {
      const idx = i + 1; // 1-based for friendlier messages
      const required = ['lecture_name', 'lecture_date', 'slides_url'];

      // Required fields present & non-empty strings
      for (const key of required) {
        if (!(key in entry)) {
          details.push(`Missing field: ${key} in entry ${idx}`);
          continue;
        }
        if (typeof entry[key] !== 'string' || entry[key].trim() === '') {
          details.push(`Invalid value for ${key} in entry ${idx}: must be a non-empty string`);
        }
      }

      // Only attempt deeper checks if keys exist and are strings
      if (typeof entry.lecture_date === 'string' && !isISODate(entry.lecture_date)) {
        details.push(`Invalid date format in entry ${idx}: expected YYYY-MM-DD`);
      }

      if (typeof entry.slides_url === 'string' && !isValidUrl(entry.slides_url)) {
        details.push(`Invalid slides_url in entry ${idx}: must be a valid URL`);
      }

      if (typeof entry.lecture_name === 'string') {
        const name = entry.lecture_name.trim();
        if (nameSet.has(name)) {
          details.push(`Duplicate lecture_name detected: "${name}" (entry ${idx})`);
        } else {
          nameSet.add(name);
        }
      }
    });

    if (details.length) {
      return { error: 'Malformed entry detected', details: details.join('; ') };
    }
    return { ok: true };
  }

  function formatDateISOToReadable(iso) {
    try {
      const [y, m, d] = iso.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return iso;
    }
  }

  function renderLectures(items) {
    $list.innerHTML = '';
    if (!items.length) {
      $empty.classList.remove('hidden');
      return;
    }
    $empty.classList.add('hidden');

    for (const lec of items) {
      const li = document.createElement('li');
      li.className = 'lecture-item';

      const title = document.createElement('div');
      title.className = 'lecture-name';
      title.textContent = lec.lecture_name;

      const date = document.createElement('div');
      date.className = 'lecture-date';
      date.textContent = formatDateISOToReadable(lec.lecture_date);

      const actions = document.createElement('div');
      actions.className = 'lecture-actions';
      const a = document.createElement('a');
      a.href = lec.slides_url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Open slides';
      actions.appendChild(a);

      li.appendChild(title);
      li.appendChild(date);
      li.appendChild(actions);
      $list.appendChild(li);
    }
  }

  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) {
      showError({ error: 'Load failure', details: `HTTP ${res.status} while fetching ${DATA_URL}` });
      return;
    }
    const data = await res.json();

    const validation = validateDataset(data);
    if (validation.error) {
      showError(validation);
      return;
    }

    hideError();

    // Sort reverse chronological by ISO date string (YYYY-MM-DD sorts lexicographically)
    const sorted = [...data].sort((a, b) => (a.lecture_date < b.lecture_date ? 1 : a.lecture_date > b.lecture_date ? -1 : 0));

    renderLectures(sorted);
  } catch (e) {
    showError({ error: 'Unexpected error', details: String(e) });
  }
})();