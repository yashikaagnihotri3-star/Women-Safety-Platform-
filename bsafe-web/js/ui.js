/**
 * bSafe shared UI utilities
 */

/* ───────────────────────── Toasts ───────────────────────── */

function ensureToastContainer() {
  let el = document.getElementById('toast-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-container';
    document.body.appendChild(el);
  }
  return el;
}

function showToast(type, title, msg = '', duration = 3800) {
  const container = ensureToastContainer();
  const icons = { success: 'ti-circle-check', error: 'ti-alert-circle', info: 'ti-info-circle' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="ti ${icons[type] || icons.info}" aria-hidden="true"></i>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.2s, transform 0.2s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

/* ───────────────────────── Modal helper ───────────────────────── */

function openModal(innerHtml, { onClose } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">${innerHtml}</div>`;
  document.body.appendChild(overlay);

  function close() {
    overlay.remove();
    if (onClose) onClose();
  }

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', close));

  return { overlay, close };
}

/* ───────────────────────── Geo helpers ───────────────────────── */

// Get current position, falling back to a demo coordinate (Noida) if denied/unavailable
function getCurrentPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 28.5708, lng: 77.3260, simulated: true });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, simulated: false }),
      () => resolve({ lat: 28.5708, lng: 77.3260, simulated: true }),
      { timeout: 5000, maximumAge: 60000 }
    );
  });
}

// Haversine distance in km between two {lat,lng} points
function distanceKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDistance(km) {
  if (km == null) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function estimateEtaMinutes(km) {
  if (km == null) return '—';
  // Assume average urban speed ~22 km/h including walk + ride
  const mins = Math.max(1, Math.round((km / 22) * 60));
  return `${mins} min`;
}

/* ───────────────────────── Time helpers ───────────────────────── */

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function formatDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatSeconds(sec) {
  if (sec == null) return '—';
  const mins = Math.floor(sec / 60);
  const s = sec % 60;
  return mins > 0 ? `${mins} min ${s}s` : `${s}s`;
}

/* ───────────────────────── Misc ───────────────────────── */

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

function escapeHtml(str = '') {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function setLoading(btn, loading, label) {
  if (loading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${label || 'Please wait...'}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
  }
}

window.bsafeUI = {
  showToast, openModal, getCurrentPosition, distanceKm, formatDistance, estimateEtaMinutes,
  timeAgo, formatDateTime, formatSeconds, initials, escapeHtml, qs, qsa, setLoading,
};
