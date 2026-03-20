/**
 * Janet Web LLM — In-browser SmolLM2 for greatsage.org
 * 100% client-side. No cloud. No API keys.
 * Singularity-approved. Maximum JANET <3
 */
(function() {
  var JANET_SYSTEM_PROMPT = "You are Janet, The Great Sage's AI companion. Explain our mission: privacy-first, voice-first AI that runs on your devices. No cloud. No subscription. Constitutional AI, open source. J.A.N.E.T. Glasses. Keep answers concise and friendly. If asked about something outside our mission, gently steer back.";
  var MODEL_ID = "SmolLM2-360M-Instruct-q4f16_1-MLC";

  var fab = document.getElementById('janet-fab');
  var panel = document.getElementById('janet-panel');
  var messagesEl = document.getElementById('janet-messages');
  var inputEl = document.getElementById('janet-input');
  var sendBtn = document.getElementById('janet-send');
  var closeBtn = panel && panel.querySelector('.janet-panel-close');

  function t(key) {
    return (window.greatsageT && window.greatsageT(key)) || key;
  }

  function appendMsg(role, content, className) {
    if (!messagesEl) return;
    var div = document.createElement('div');
    div.className = 'janet-msg janet-msg-' + (role || 'loading') + (className ? ' ' + className : '');
    div.textContent = content || '';
    div.setAttribute('role', role === 'user' ? 'status' : 'article');
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function showFallback() {
    if (!messagesEl) return;
    messagesEl.innerHTML = '';
    var fallback = document.createElement('div');
    fallback.className = 'janet-fallback';
    fallback.innerHTML = '<p>' + (t('janet.fallbackBody') || "The Great Sage builds Janet — privacy-first, voice-first AI on your devices. No cloud. No subscription. Constitutional AI, open source. J.A.N.E.T. Glasses. Your data stays yours.") + '</p><p>' + (t('janet.fallbackHint') || "Try Chrome, Edge, or Safari for the full in-browser AI experience.") + '</p>';
    messagesEl.appendChild(fallback);
  }

  function hasWebGPU() {
    return !!(navigator.gpu && typeof navigator.gpu.requestAdapter === 'function');
  }

  function openPanel() {
    if (!panel || !fab) return;
    panel.setAttribute('aria-hidden', 'false');
    fab.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    inputEl && inputEl.focus();
  }

  function closePanel() {
    if (!panel || !fab) return;
    panel.setAttribute('aria-hidden', 'true');
    fab.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function initPanel() {
    chatHistory = [];
    if (!hasWebGPU()) {
      showFallback();
      sendBtn && (sendBtn.disabled = true);
      inputEl && (inputEl.disabled = true);
      return;
    }

    messagesEl.innerHTML = '';
    var welcome = t('janet.welcome') || "Hi! I'm Janet. Ask me about The Great Sage — our mission, privacy-first AI, or J.A.N.E.T. Glasses. Everything runs right here in your browser.";
    appendMsg('assistant', welcome);
  }

  var engine = null;
  var loadPromise = null;
  var chatHistory = [];

  function loadEngine() {
    if (loadPromise) return loadPromise;
    loadPromise = (async function() {
      try {
        var mod = await import('https://esm.sh/@mlc-ai/web-llm');
        var CreateMLCEngine = mod.CreateMLCEngine || mod.default?.CreateMLCEngine;
        if (!CreateMLCEngine) throw new Error('CreateMLCEngine not found');

        var progressEl = document.createElement('div');
        progressEl.className = 'janet-progress';
        progressEl.innerHTML = '<span data-progress-text>' + (t('janet.loading') || 'Downloading model… ~200MB, one-time. Runs 100% in your browser.') + '</span><div class="janet-progress-bar"><div class="janet-progress-fill" data-progress-fill style="width:0%"></div></div>';
        messagesEl.innerHTML = '';
        messagesEl.appendChild(progressEl);

        var txt = progressEl.querySelector('[data-progress-text]');
        var fill = progressEl.querySelector('[data-progress-fill]');

        engine = await CreateMLCEngine(MODEL_ID, {
          initProgressCallback: function(progress) {
            if (txt && progress.text) txt.textContent = progress.text;
            if (fill && typeof progress.progress === 'number') fill.style.width = (progress.progress * 100) + '%';
          }
        });

        progressEl.remove();
        var welcome = t('janet.welcome') || "Hi! I'm Janet. Ask me about The Great Sage — our mission, privacy-first AI, or J.A.N.E.T. Glasses. Everything runs right here in your browser.";
        appendMsg('assistant', welcome);
        return engine;
      } catch (err) {
        console.error('Janet WebLLM load error:', err);
        messagesEl.innerHTML = '';
        appendMsg('assistant', (t('janet.error') || 'Could not load the model. Try a modern browser (Chrome, Edge, Safari) with WebGPU.') + ' ' + (t('janet.fallbackHint') || ''), 'janet-msg-error');
        return null;
      }
    })();
    return loadPromise;
  }

  async function sendMessage() {
    var text = (inputEl && inputEl.value || '').trim();
    if (!text) return;

    if (!hasWebGPU()) return;

    inputEl.value = '';
    inputEl.disabled = true;
    sendBtn.disabled = true;

    if (!engine) {
      await loadEngine();
      if (!engine) {
        inputEl.disabled = false;
        sendBtn.disabled = false;
        return;
      }
    }

    appendMsg('user', text);
    chatHistory.push({ role: 'user', content: text });

    var msgDiv = appendMsg('assistant', '', 'janet-msg-loading');
    msgDiv.textContent = '…';

    try {
      var messages = [
        { role: 'system', content: JANET_SYSTEM_PROMPT }
      ].concat(chatHistory.map(function(m) { return { role: m.role, content: m.content }; }));

      var stream = await engine.chat.completions.create({
        messages: messages,
        stream: true,
        max_tokens: 256
      });

      msgDiv.classList.remove('janet-msg-loading');
      msgDiv.classList.add('janet-msg-assistant');
      msgDiv.textContent = '';

      var fullReply = '';
      for await (var chunk of stream) {
        var delta = (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) || '';
        if (delta) {
          fullReply += delta;
          msgDiv.textContent = fullReply;
        }
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
      chatHistory.push({ role: 'assistant', content: fullReply });
    } catch (err) {
      console.error('Janet chat error:', err);
      msgDiv.classList.remove('janet-msg-loading');
      msgDiv.classList.add('janet-msg-error');
      msgDiv.textContent = t('janet.error') || 'Something went wrong. Try again.';
    }

    inputEl.disabled = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }

  function init() {
    if (!fab || !panel) return;

    fab.addEventListener('click', function() {
      if (panel.getAttribute('aria-hidden') === 'true') {
        initPanel();
        openPanel();
      } else {
        closePanel();
      }
    });

    closeBtn && closeBtn.addEventListener('click', closePanel);

    panel.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closePanel();
    });

    sendBtn && sendBtn.addEventListener('click', sendMessage);

    inputEl && inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && panel.getAttribute('aria-hidden') === 'false') closePanel();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
