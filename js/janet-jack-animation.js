/**
 * JACK Mode — Ask Janet onboarding animation.
 * See docs/JACK_ANIMATION_DOCUMENTATION.md for named parts.
 *
 * Flow: Circle Halo (levitate) → Halo Expand → Janet Halo (boundary) → Halo Collect
 * Janet Halo is the basis throughout — no Three.js.
 * Glow inspired by https://github.com/jacobamobin/AppleIntelligenceGlowEffect
 * Respects prefers-reduced-motion → Reduced Spinner.
 */
export async function runJackAnimation(options) {
  var fab = options.fab;
  var loadPromise = options.loadPromise;
  var loadFn = options.loadFn;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || !fab) {
    return runReducedMotionAnimation(options);
  }

  var overlay = document.createElement('div'); /* JACK Stage */
  overlay.className = 'janet-jack-overlay';
  overlay.setAttribute('aria-hidden', 'false');
  var theme = document.documentElement.getAttribute('data-theme');
  if (theme) overlay.setAttribute('data-theme', theme);
  document.body.appendChild(overlay);

  var progressOverlay = document.createElement('div');
  progressOverlay.className = 'janet-jack-progress-overlay';
  progressOverlay.setAttribute('aria-live', 'polite');
  progressOverlay.setAttribute('aria-busy', 'true');
  overlay.appendChild(progressOverlay);

  if (loadFn && typeof loadFn === 'function') {
    loadPromise = loadFn(progressOverlay);
  } else if (!loadPromise) {
    loadPromise = Promise.reject(new Error('runJackAnimation requires loadPromise or loadFn'));
  }

  var glowInterval = null;

  var w = Math.min(420, window.innerWidth - 48);
  var h = Math.min(560, window.innerHeight - 120);
  overlay.style.width = w + 'px';
  overlay.style.height = h + 'px';

  var overlayRect = overlay.getBoundingClientRect();
  var fabRect = fab.getBoundingClientRect();
  var fabCx = (fabRect.left + fabRect.width / 2) - overlayRect.left;
  var fabCy = (fabRect.top + fabRect.height / 2) - overlayRect.top;

  function dispose() {
    if (glowInterval) glowInterval.forEach(clearInterval);
    overlay.remove();
  }

  return new Promise(function (resolve) {
    var phase = 'circle';
    var phaseStart = performance.now();
    var loadDone = false;

    loadPromise.then(function () {
      loadDone = true;
    }).catch(function () {
      loadDone = true;
    });

    function easeOutCubic(x) {
      return 1 - Math.pow(1 - x, 3);
    }

    var glowContainer = null;
    var glowGradData = [];
    var glowAngle = 0;

    var minDim = Math.min(w, h);

    function createHalo() {
      glowContainer = document.createElement('div');
      glowContainer.className = 'janet-jack-glow-container';
      overlay.appendChild(glowContainer);
      var layers = [
        { width: 4, blur: 0, interval: 400 },
        { width: 6, blur: 2, interval: 400 },
        { width: 8, blur: 4, interval: 500 }
      ];
      var palette = getGlowPalette();
      glowInterval = [];
      glowGradData = [];
      for (var li = 0; li < layers.length; li++) {
        var cfg = layers[li];
        var layer = document.createElement('div');
        layer.className = 'janet-jack-glow-layer';
        if (cfg.blur) layer.style.filter = 'blur(' + cfg.blur + 'px)';
        var grad = document.createElement('div');
        grad.className = 'janet-jack-glow-gradient';
        var stopsRef = { current: generateGradientStops(palette) };
        glowGradData.push({ grad: grad, stopsRef: stopsRef });
        var inner = document.createElement('div');
        inner.className = 'janet-jack-glow-inner';
        inner.style.inset = cfg.width + 'px';
        inner.style.borderRadius = Math.max(40, 55 - cfg.width) + 'px';
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
          (window.matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.getAttribute('data-theme') !== 'light');
        inner.style.background = isDark ? 'rgb(15, 23, 38)' : 'rgb(250, 249, 255)';
        layer.appendChild(grad);
        layer.appendChild(inner);
        glowContainer.appendChild(layer);
        glowInterval.push(setInterval(function () {
          stopsRef.current = generateGradientStops(palette);
        }, cfg.interval));
      }
    }

    function generateGradientStops(palette) {
      return palette.map(function (hex) {
        return { color: hex, location: Math.random() };
      }).sort(function (a, b) { return a.location - b.location; });
    }

    function updateGlowWave() {
      glowAngle = (glowAngle + 0.8) % 360;
      glowGradData.forEach(function (d) {
        var st = d.stopsRef.current;
        var bg = 'conic-gradient(from ' + glowAngle + 'deg, ' + st.map(function (s) { return s.color + ' ' + (s.location * 100) + '%'; }).join(', ') + ')';
        d.grad.style.background = bg;
      });
    }

    function setGlowShape(circular) {
      if (!glowContainer) return;
      glowContainer.setAttribute('data-shape', circular ? 'circle' : 'rect');
      if (circular) {
        glowContainer.style.width = minDim + 'px';
        glowContainer.style.height = minDim + 'px';
        glowContainer.style.left = ((w - minDim) / 2) + 'px';
        glowContainer.style.top = ((h - minDim) / 2) + 'px';
        glowContainer.style.right = 'auto';
        glowContainer.style.bottom = 'auto';
      } else {
        glowContainer.style.width = w + 'px';
        glowContainer.style.height = h + 'px';
        glowContainer.style.left = '0';
        glowContainer.style.top = '0';
        glowContainer.style.right = 'auto';
        glowContainer.style.bottom = 'auto';
      }
    }

    function updateCircleLevitate(t) {
      if (!glowContainer) return;
      setGlowShape(true);
      var k = easeOutCubic(t);
      var fromX = fabCx - w / 2;
      var fromY = fabCy - h / 2;
      var tx = fromX * (1 - k);
      var ty = fromY * (1 - k);
      var scale = 0.12;
      glowContainer.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + scale + ')';
      glowContainer.style.opacity = '1';
      glowContainer.style.transition = '';
    }

    function updateExpand(t) {
      if (!glowContainer) return;
      var k = easeOutCubic(t);
      glowContainer.style.transition = 'border-radius 0.35s ease-out, width 0.35s ease-out, height 0.35s ease-out, left 0.35s ease-out, top 0.35s ease-out';
      if (k < 0.45) {
        setGlowShape(true);
        var scale = 0.12 + 0.88 * (k / 0.45);
        glowContainer.style.transform = 'scale(' + scale + ')';
      } else {
        setGlowShape(false);
        glowContainer.style.transform = 'scale(1)';
      }
      glowContainer.style.opacity = '1';
    }

    function updateCollectGlow(t) {
      if (!glowContainer) return;
      var scale = Math.max(0.01, 1 - t);
      var cx = fabCx - w / 2;
      var cy = fabCy - h / 2;
      var tx = (1 - scale) * cx;
      var ty = (1 - scale) * cy;
      if (t > 0.6) setGlowShape(true);
      glowContainer.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + scale + ')';
      glowContainer.style.opacity = String(Math.max(0, 1 - t * 1.2));
      if (t > 0.5) glowContainer.style.transition = 'border-radius 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out, left 0.3s ease-out, top 0.3s ease-out';
    }

    var collectStart = 0;

    function animate(now) {
      if (phase === 'circle') {
        var elapsed = (now - phaseStart) / 1800;
        updateCircleLevitate(Math.min(1, elapsed));
        updateGlowWave();
        if (elapsed >= 1) {
          phase = 'expand';
          phaseStart = now;
        }
      } else if (phase === 'expand') {
        var expandElapsed = (now - phaseStart) / 500;
        updateExpand(Math.min(1, expandElapsed));
        updateGlowWave();
        if (expandElapsed >= 1) {
          setGlowShape(false);
          phase = 'boundary';
          phaseStart = now;
        }
      } else if (phase === 'boundary') {
        updateGlowWave();
        if (loadDone) {
          setGlowShape(false);
          phase = 'collect';
          collectStart = now;
        }
      } else if (phase === 'collect') {
        updateGlowWave();
        var t = (now - collectStart) / 1500;
        updateCollectGlow(t);
        if (t >= 1) {
          if (glowInterval) glowInterval.forEach(clearInterval);
          dispose();
          resolve();
          return;
        }
      }

      requestAnimationFrame(animate);
    }

    createHalo();
    setGlowShape(true);
    updateCircleLevitate(0);
    requestAnimationFrame(animate);
  });
}

/** Janet Palette — glow colors for Janet Halo. Theme-aware. */
function getGlowPalette() {
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.getAttribute('data-theme') !== 'light');
  if (isDark) {
    return ['#0A84FF', '#3da3ff', '#8D9FFF', '#5aa8ff', '#C686FF', '#BC82F3'];
  }
  return ['#7C3AED', '#9b5cff', '#BC82F3', '#F5B9EA', '#8D9FFF', '#C686FF'];
}

/** Reduced Spinner — accessibility fallback when prefers-reduced-motion. */
function runReducedMotionAnimation(options) {
  var loadPromise = options.loadPromise;
  var loadFn = options.loadFn;
  var overlay = document.createElement('div'); /* JACK Stage, reduced variant */
  overlay.className = 'janet-jack-overlay janet-jack-overlay-reduced';
  overlay.setAttribute('aria-hidden', 'false');
  var content = document.createElement('div');
  content.className = 'janet-jack-reduced-content';
  content.innerHTML = '<div class="janet-jack-reduced-spinner"></div><p class="janet-jack-reduced-text">Loading Janet…</p>';
  overlay.appendChild(content);
  var progressContainer = document.createElement('div');
  progressContainer.className = 'janet-jack-progress-overlay';
  overlay.appendChild(progressContainer);
  document.body.appendChild(overlay);

  if (loadFn && typeof loadFn === 'function') {
    loadPromise = loadFn(progressContainer);
  }
  if (!loadPromise) return Promise.reject(new Error('runReducedMotionAnimation requires loadPromise or loadFn'));

  return loadPromise.then(function () {
    overlay.classList.add('janet-jack-overlay-fadeout');
    return new Promise(function (r) {
      setTimeout(function () {
        overlay.remove();
        r();
      }, 400);
    });
  }).catch(function () {
    overlay.remove();
    throw new Error('Load failed');
  });
}
