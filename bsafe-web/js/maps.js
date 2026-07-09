/**
 * bSafe Google Maps integration
 *
 * Set your API key below (or via localStorage 'bsafe_gmaps_key') to enable
 * real interactive maps. Without a key, all map containers gracefully fall
 * back to a static styled placeholder so the app remains fully functional.
 *
 * Get a key at: https://console.cloud.google.com/google/maps-apis
 * Enable: "Maps JavaScript API"
 */

const GMAPS_KEY_STORAGE = 'AlzaSyAijNP8JinKel9eXLqmWG4-hXPu2S8gVrY';

function getGMapsKey() {
  return localStorage.getItem(GMAPS_KEY_STORAGE) || '';
}

function setGMapsKey(key) {
  if (key) localStorage.setItem(GMAPS_KEY_STORAGE, key);
  else localStorage.removeItem(GMAPS_KEY_STORAGE);
}

let _gmapsLoadingPromise = null;

function loadGoogleMaps() {
  const key = getGMapsKey();
  if (!key) return Promise.resolve(false);
  if (window.google && window.google.maps) return Promise.resolve(true);
  if (_gmapsLoadingPromise) return _gmapsLoadingPromise;

  _gmapsLoadingPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return _gmapsLoadingPromise;
}

const ROSE_PIN = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 27 17 27s17-14.3 17-27C34 7.6 26.4 0 17 0z" fill="#E8394A"/>
    <circle cx="17" cy="17" r="7" fill="#fff"/>
  </svg>`);

const TEAL_PIN = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 34 44">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 27 17 27s17-14.3 17-27C34 7.6 26.4 0 17 0z" fill="#0F9E6E"/>
    <circle cx="17" cy="17" r="7" fill="#fff"/>
  </svg>`);

const AMBER_PIN = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 34 44">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 27 17 27s17-14.3 17-27C34 7.6 26.4 0 17 0z" fill="#D4820F"/>
    <circle cx="17" cy="17" r="7" fill="#fff"/>
  </svg>`);

/**
 * Render a map into `container`. Falls back to a static styled placeholder
 * if no API key is configured.
 *
 * @param {HTMLElement} container
 * @param {{center:{lat,lng}, markers: Array<{lat,lng,type:'user'|'volunteer'|'zone',label?:string}>, zoom?: number}} opts
 */
async function renderMap(container, opts) {
  const { center, markers = [], zoom = 14 } = opts;
  const loaded = await loadGoogleMaps();

  if (loaded && window.google && window.google.maps) {
    const map = new google.maps.Map(container, {
      center, zoom,
      disableDefaultUI: true,
      zoomControl: true,
      styles: MAP_STYLE,
    });

    markers.forEach(m => {
      const icon = m.type === 'user' ? ROSE_PIN : m.type === 'volunteer' ? TEAL_PIN : AMBER_PIN;
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map, title: m.label || '',
        icon: { url: icon, scaledSize: new google.maps.Size(m.type === 'user' ? 34 : 28, m.type === 'user' ? 44 : 36) },
      });
      if (m.label) {
        const info = new google.maps.InfoWindow({ content: `<div style="font-family:Inter,sans-serif;font-size:12.5px;font-weight:600;">${m.label}</div>` });
        marker.addListener('click', () => info.open(map, marker));
      }
    });

    return { type: 'google', map };
  }

  // Fallback static map
  renderStaticMapFallback(container, opts);
  return { type: 'fallback' };
}

function renderStaticMapFallback(container, opts) {
  const { center, markers = [] } = opts;
  // Project markers to a simple relative grid around center for visual placement
  const spread = 0.02; // degrees
  function toPct(lat, lng) {
    const x = 50 + ((lng - center.lng) / spread) * 50;
    const y = 50 - ((lat - center.lat) / spread) * 50;
    return { x: Math.max(6, Math.min(94, x)), y: Math.max(10, Math.min(90, y)) };
  }

  const pins = markers.map(m => {
    const { x, y } = toPct(m.lat, m.lng);
    const icon = m.type === 'user' ? 'ti-alert-triangle' : m.type === 'volunteer' ? 'ti-user-check' : 'ti-shield';
    const cls = m.type === 'user' ? 'fb-pin-user' : m.type === 'volunteer' ? 'fb-pin-vol' : 'fb-pin-zone';
    return `<div class="fb-pin ${cls}" style="left:${x}%;top:${y}%;" title="${m.label || ''}">
      <i class="ti ${icon}" aria-hidden="true"></i>
      ${m.label ? `<span class="fb-pin-label">${m.label}</span>` : ''}
    </div>`;
  }).join('');

  container.innerHTML = `
    <div class="fb-map">
      <div class="fb-map-grid"></div>
      ${pins}
      <div class="fb-map-note"><i class="ti ti-info-circle" aria-hidden="true"></i> Add a Google Maps API key in Settings for live maps</div>
    </div>
  `;

  if (!document.getElementById('fb-map-styles')) {
    const style = document.createElement('style');
    style.id = 'fb-map-styles';
    style.textContent = `
      .fb-map { position: relative; width: 100%; height: 100%; background: #e8f4e8; overflow: hidden; border-radius: inherit; }
      .fb-map-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px); background-size: 32px 32px; }
      .fb-pin { position: absolute; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; gap: 2px; }
      .fb-pin i { font-size: 22px; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.25)); }
      .fb-pin-user i { color: #E8394A; }
      .fb-pin-vol i { color: #0F9E6E; }
      .fb-pin-zone i { color: #D4820F; }
      .fb-pin-label { font-size: 10px; font-weight: 600; background: rgba(255,255,255,0.92); padding: 2px 6px; border-radius: 6px; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
      .fb-map-note { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.92); border-radius: 20px; padding: 5px 12px; font-size: 10.5px; color: #5C5850; display:flex; align-items:center; gap:5px; white-space: nowrap; }
      .fb-map-note i { font-size: 13px; filter: none; }
    `;
    document.head.appendChild(style);
  }
}

const MAP_STYLE = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

window.bsafeMaps = { loadGoogleMaps, renderMap, getGMapsKey, setGMapsKey };
