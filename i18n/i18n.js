/**
 * Great Sage — Client-side i18n
 * Loads JSON translations, applies to data-i18n elements, persists choice.
 */
(function() {
  var STORAGE_KEY = 'greatsage-lang';
  var SUPPORTED = ['en', 'de', 'es', 'hr', 'ja'];
  var DEFAULT = 'en';
  var LANG_LABELS = { en: 'English', de: 'Deutsch', es: 'Español', hr: 'Hrvatski', ja: '日本語' };
  var LANG_SHORT = { en: 'EN', de: 'DE', es: 'ES', hr: 'HR', ja: '日' };

  var cache = {};
  var current = DEFAULT;

  function getStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setStored(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }

  function detectBrowserLang() {
    var nav = navigator.language || navigator.userLanguage || '';
    var code = nav.split('-')[0].toLowerCase();
    if (SUPPORTED.indexOf(code) >= 0) return code;
    if (code === 'pt') return 'en';
    if (code === 'zh') return 'en';
    return DEFAULT;
  }

  function load(lang) {
    if (cache[lang]) return Promise.resolve(cache[lang]);
    return fetch('i18n/' + lang + '.json')
      .then(function(r) {
        if (!r.ok) throw new Error('Failed to load ' + lang);
        return r.json();
      })
      .then(function(data) {
        cache[lang] = data;
        return data;
      })
      .catch(function() {
        return load(DEFAULT);
      });
  }

  function apply(t) {
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var val = t[key];
      if (val != null) el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-html');
      var val = t[key];
      if (val != null) el.innerHTML = val;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-placeholder');
      var val = t[key];
      if (val != null) el.placeholder = val;
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(function(el) {
      var spec = el.getAttribute('data-i18n-attr');
      var parts = spec.split(':');
      if (parts.length === 2) {
        var attr = parts[0];
        var key = parts[1];
        var val = t[key];
        if (val != null) el.setAttribute(attr, val);
      }
    });

    document.documentElement.setAttribute('lang', langAttr(current));
  }

  function langAttr(lang) {
    if (lang === 'ja') return 'ja';
    if (lang === 'de') return 'de';
    if (lang === 'es') return 'es';
    if (lang === 'hr') return 'hr';
    return 'en';
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) < 0) lang = DEFAULT;
    current = lang;
    setStored(lang);

    load(lang).then(function(t) {
      apply(t);
      updateSwitcher();
      exposeT();
      try { document.dispatchEvent(new CustomEvent('greatsage-lang-changed', { detail: { lang: lang } })); } catch (e) {}
    });
  }

  function updateSwitcher() {
    document.querySelectorAll('[data-lang]').forEach(function(btn) {
      var lang = btn.getAttribute('data-lang');
      var attr = btn.getAttribute('role') === 'option' ? 'aria-selected' : 'aria-current';
      btn.setAttribute(attr, lang === current ? 'true' : 'false');
    });
    var label = document.querySelector('.lang-dropdown-label');
    if (label) label.textContent = LANG_LABELS[current] || LANG_SHORT[current] || current;
  }

  function initDropdown() {
    var dropdown = document.querySelector('.lang-dropdown');
    if (!dropdown) return;
    var trigger = dropdown.querySelector('.lang-dropdown-trigger');
    var menu = dropdown.querySelector('.lang-dropdown-menu');
    if (!trigger || !menu) return;

    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
      dropdown.setAttribute('aria-expanded', dropdown.classList.contains('open'));
    });

    menu.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    menu.querySelectorAll('[data-lang]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        setLang(btn.getAttribute('data-lang'));
        dropdown.classList.remove('open');
        dropdown.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', function() {
      dropdown.classList.remove('open');
      dropdown.setAttribute('aria-expanded', 'false');
    });
  }

  function exposeT() {
    window.greatsageT = function(k) {
      var t = cache[current] || cache[DEFAULT];
      return (t && t[k]) || null;
    };
    window.greatsageLang = function() { return current; };
  }

  function init() {
    var stored = getStored();
    var lang = stored && SUPPORTED.indexOf(stored) >= 0
      ? stored
      : detectBrowserLang();

    current = lang;
    setStored(lang);

    load(lang).then(function(t) {
      apply(t);
      updateSwitcher();
      exposeT();
      try { document.dispatchEvent(new CustomEvent('greatsage-i18n-ready')); } catch (e) {}

      document.querySelectorAll('.lang-switcher a[data-lang]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          setLang(btn.getAttribute('data-lang'));
        });
      });
      initDropdown();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
