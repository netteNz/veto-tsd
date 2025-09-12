// New analytics helper for GA4 (gtag). Call init() once at app startup.
let _measurementId = null;
let _created = null;
let _initialized = false;
let _autoTrack = false;

function readCreatedFromMeta() {
  if (typeof document !== 'undefined') {
    return document.querySelector('meta[name="ga-created"]')?.content || null;
  }
  return null;
}

function injectGtag(measurementId) {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`script[src*="${measurementId}"]`)) return;

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
}

function trackPage(path) {
  if (!window.gtag || !_measurementId) return;
  window.gtag('config', _measurementId, {
    page_path: path,
    created: _created,
  });
}

function hookHistory() {
  if (typeof window === 'undefined') return;

  const wrap = (original) => function (...args) {
    const result = original.apply(this, args);
    // Small timeout to allow react-router to update location if needed
    setTimeout(() => trackPage(location.pathname + location.search + location.hash), 0);
    return result;
  };

  history.pushState = wrap(history.pushState);
  history.replaceState = wrap(history.replaceState);
  window.addEventListener('popstate', () => {
    trackPage(location.pathname + location.search + location.hash);
  });
}

export function init({ measurementId, created, autoTrack = true } = {}) {
  if (!measurementId) return;
  if (_initialized && _measurementId === measurementId) return;

  _measurementId = measurementId;
  _created = created || readCreatedFromMeta() || (import.meta?.env?.VITE_GA_CREATED ?? null);
  _autoTrack = autoTrack;

  if (typeof window === 'undefined') return;
  injectGtag(_measurementId);

  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', _measurementId, { created: _created });

  if (_autoTrack) hookHistory();
  _initialized = true;
}

export function pageview(path, title) {
  if (!window.gtag) return;
  window.gtag('config', _measurementId, {
    page_path: path,
    page_title: title,
    created: _created,
  });
}

export function event(name, params = {}) {
  if (!window.gtag) return;
  const payload = { ...params };
  if (_created) payload.created = _created;
  window.gtag('event', name, payload);
}

export function getCreated() {
  return _created || readCreatedFromMeta() || (import.meta?.env?.VITE_GA_CREATED ?? null);
}

export default { init, pageview, event, getCreated };