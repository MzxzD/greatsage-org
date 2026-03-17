/**
 * Great Sage — Cookie consent (subtle corner notice)
 * Shows once; stores acknowledgement in localStorage.
 * We only use cookies/local storage for language preference.
 */
(function() {
  var KEY = 'greatsage-cookie-ack';

  function acked() {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setAcked() {
    try {
      localStorage.setItem(KEY, '1');
    } catch (e) {}
  }

  function dismiss(el) {
    if (!el || !el.parentNode) return;
    setAcked();
    el.classList.add('hidden');
    el.setAttribute('hidden', '');
    el.style.display = 'none';
    el.style.visibility = 'hidden';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    if (el.parentNode) el.parentNode.removeChild(el);
  }

  function init() {
    var el = document.getElementById('cookie-consent');
    if (!el) return;

    if (acked()) {
      el.classList.add('hidden');
      el.setAttribute('hidden', '');
      el.style.display = 'none';
      return;
    }

    function onOk(e) {
      e.preventDefault();
      e.stopPropagation();
      dismiss(el);
    }
    var btn = el.querySelector('.cookie-consent-btn');
    if (btn) {
      btn.addEventListener('click', onOk);
      btn.addEventListener('mousedown', onOk);
      btn.addEventListener('touchend', onOk);
    }
    var docHandler = function(e) {
      if (!el.parentNode) return;
      if (!el.contains(e.target)) return;
      if (e.target.closest && e.target.closest('.cookie-consent-btn')) {
        e.preventDefault();
        e.stopPropagation();
        document.removeEventListener('click', docHandler, true);
        if (btn) {
          btn.removeEventListener('click', onOk);
          btn.removeEventListener('mousedown', onOk);
          btn.removeEventListener('touchend', onOk);
        }
        dismiss(el);
      }
    };
    document.addEventListener('click', docHandler, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
