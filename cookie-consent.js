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

  function init() {
    if (acked()) return;

    var el = document.getElementById('cookie-consent');
    if (!el) return;

    var btn = el.querySelector('.cookie-consent-btn');
    if (btn) {
      btn.addEventListener('click', function() {
        setAcked();
        el.classList.add('hidden');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
