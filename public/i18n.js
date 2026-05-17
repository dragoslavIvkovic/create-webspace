/**
 * Geo-based locale: RS & HR → Serbian; other regions → English (unless user override).
 * Exposes initCwpI18n() for script.js to await before initWebPlacePage.
 */
(function () {
  'use strict';

  var LS_USER = 'cwp_lang_user';
  var SS_GEO = 'cwp_geo_lang';

  var state = {
    lang: null,
    bundle: null,
    loaded: false,
  };

  function getNested(obj, path) {
    if (!obj || !path) return null;
    var parts = path.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return null;
      cur = cur[parts[i]];
    }
    return typeof cur === 'string' ? cur : null;
  }

  function resolveKey(bundle, key) {
    if (!key || !bundle) return null;
    if (key.indexOf('c:') === 0) return getNested(bundle.common, key.slice(2));
    if (key.indexOf('p:') === 0) {
      var pageId = document.body && document.body.getAttribute('data-page');
      if (!pageId) return null;
      var page = bundle.pages && bundle.pages[pageId];
      return page ? getNested(page, key.slice(2)) : null;
    }
    return null;
  }

  function localeUrl(filename) {
    try {
      return new URL('locales/' + filename, window.location.href).href;
    } catch (e) {
      return 'locales/' + filename;
    }
  }

  function fetchJson(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('i18n fetch ' + r.status);
      return r.json();
    });
  }

  function shallowMerge(dest, src) {
    var out = dest || {};
    if (!src) return out;
    for (var k in src) {
      if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = src[k];
    }
    return out;
  }

  function mergeBundles(parts) {
    var bundle = { common: {}, pages: {} };
    parts.forEach(function (p) {
      if (!p || typeof p !== 'object') return;
      shallowMerge(bundle.common, p.common);
      shallowMerge(bundle.pages, p.pages);
    });
    return bundle;
  }

  function readUserOverride() {
    try {
      var x = localStorage.getItem(LS_USER);
      if (x === 'sr' || x === 'en') return x;
    } catch (e) {}
    return null;
  }

  function detectRegionLang() {
    try {
      var g = sessionStorage.getItem(SS_GEO);
      if (g === 'sr' || g === 'en') return Promise.resolve(g);
    } catch (e) {}

    var done = function (code) {
      try {
        sessionStorage.setItem(SS_GEO, code);
      } catch (e) {}
      return code;
    };

    var ctrl = new AbortController();
    var ms = 4500;
    var t = setTimeout(function () {
      ctrl.abort();
    }, ms);

    return fetch('https://ipwho.is/', { signal: ctrl.signal })
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        clearTimeout(t);
        if (d && d.success && (d.country_code === 'RS' || d.country_code === 'HR'))
          return done('sr');
        return done('en');
      })
      .catch(function () {
        clearTimeout(t);
        var nav = (navigator.language || '').toLowerCase();
        if (nav.indexOf('sr') === 0 || nav.indexOf('hr') === 0 || nav.indexOf('bs') === 0)
          return done('sr');
        if (nav.indexOf('en') === 0) return done('en');
        return done('en');
      });
  }

  function resolveLang() {
    var u = readUserOverride();
    if (u) return Promise.resolve(u);
    return detectRegionLang();
  }

  function applyMeta(bundle) {
    var pageId = document.body && document.body.getAttribute('data-page');
    if (!pageId || !bundle.pages || !bundle.pages[pageId]) return;
    var meta = bundle.pages[pageId].meta;
    if (!meta) return;
    if (meta.title) document.title = meta.title;
    var md = document.querySelector('meta[name="description"]');
    if (md && meta.description) md.setAttribute('content', meta.description);
  }

  function applyBundle(bundle, lang) {
    if (lang !== 'en' || !bundle) return;

    applyMeta(bundle);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      var s = resolveKey(bundle, key);
      if (s != null) el.textContent = s;
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (!key) return;
      var s = resolveKey(bundle, key);
      if (s != null) el.innerHTML = s;
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (!key) return;
      var s = resolveKey(bundle, key);
      if (s != null) el.setAttribute('aria-label', s);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (!key) return;
      var s = resolveKey(bundle, key);
      if (s != null) el.setAttribute('title', s);
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-alt');
      if (!key) return;
      var s = resolveKey(bundle, key);
      if (s != null) el.setAttribute('alt', s);
    });

    document.querySelectorAll('iframe[data-i18n-iframetitle]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-iframetitle');
      if (!key) return;
      var s = resolveKey(bundle, key);
      if (s != null) el.setAttribute('title', s);
    });
  }

  function wireLangSwitcher() {
    document.querySelectorAll('[data-cwp-lang]').forEach(function (btn) {
      if (btn.getAttribute('data-cwp-wired') === '1') return;
      btn.setAttribute('data-cwp-wired', '1');
      btn.addEventListener('click', function () {
        var v = btn.getAttribute('data-cwp-lang');
        if (v === 'sr' || v === 'en') {
          try {
            localStorage.setItem(LS_USER, v);
            sessionStorage.removeItem(SS_GEO);
          } catch (e) {}
          window.location.reload();
        }
      });
    });
  }

  function updateLangSwitcherHighlight() {
    var lg = state.lang || 'sr';
    document.querySelectorAll('[data-cwp-lang]').forEach(function (btn) {
      var v = btn.getAttribute('data-cwp-lang');
      btn.setAttribute('aria-pressed', lg === v ? 'true' : 'false');
    });
  }

  window.initCwpI18n = async function () {
    if (!state.loaded) {
      state.lang = await resolveLang();
      document.documentElement.lang = state.lang === 'en' ? 'en' : 'sr';
      if (state.lang === 'en') {
        state.bundle = mergeBundles(
          await Promise.all(
            ['en-common.json', 'en-pages-main.json', 'en-pages-services.json'].map(function (f) {
              return fetchJson(localeUrl(f));
            }),
          ),
        );
      }
      state.loaded = true;
    }
    applyBundle(state.bundle, state.lang);
    wireLangSwitcher();
    updateLangSwitcherHighlight();
  };

  window.__cwpRefreshI18n = function () {
    if (!(state.loaded && state.lang === 'en' && state.bundle)) return;
    applyBundle(state.bundle, state.lang);
    updateLangSwitcherHighlight();
  };

  window.__cwpLang = function () {
    return state.lang;
  };

  document.addEventListener(
    'DOMContentLoaded',
    function () {
      if (!window.__NEON_SPA && typeof window.initCwpI18n === 'function') {
        void window.initCwpI18n();
      }
    },
    { once: true },
  );
})();
