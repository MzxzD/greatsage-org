/**
 * GoFundMe embed accessibility — set iframe title for screen readers
 * The embed script creates an iframe without a title; we fix that.
 */
(function () {
  var title = 'Janet Glasses campaign on GoFundMe';
  function setIframeTitle() {
    var iframe = document.querySelector('.gfm-embed iframe, .gfm-embed .gfm-embed-iframe');
    if (iframe && !iframe.getAttribute('title')) {
      iframe.setAttribute('title', title);
    }
  }
  function observe() {
    var observer = new MutationObserver(function () {
      setIframeTitle();
    });
    var containers = document.querySelectorAll('.gfm-embed');
    containers.forEach(function (el) {
      observer.observe(el, { childList: true, subtree: true });
    });
    setIframeTitle();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observe);
  } else {
    observe();
  }
})();
