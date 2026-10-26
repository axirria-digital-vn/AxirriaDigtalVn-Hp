// Page text is pre-rendered by build.js. This file only handles interactions;
// runtime strings come from I18N[<html lang>].
(function () {
  var dict = I18N[document.documentElement.lang] || I18N.ja;
  function $(id) { return document.getElementById(id); }

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // News: the latest NEWS_SHOWN items, the rest behind a button (all visible without script)
  var NEWS_SHOWN = 3, news = document.querySelector('.news');
  if (news && news.children.length > NEWS_SHOWN) {
    var extra = [].slice.call(news.children, NEWS_SHOWN), more = document.createElement('button');
    more.type = 'button';
    more.className = 'news-more';
    more.setAttribute('aria-expanded', 'false');
    var setNews = function (open) {
      extra.forEach(function (li) { li.hidden = !open; });
      more.setAttribute('aria-expanded', open);
      more.textContent = dict[open ? 'nw.less' : 'nw.more'];
    };
    more.addEventListener('click', function () { setNews(more.getAttribute('aria-expanded') !== 'true'); });
    news.after(more);
    setNews(false);
  }

  // Munemo demo
  var sumBtn = $('sumBtn');
  if (sumBtn) {
    sumBtn.addEventListener('click', function () {
      $('chatInput').hidden = true;
      $('chatEmpty').hidden = true;
      $('askMsg').hidden = false;
      $('thinkMsg').hidden = false;
      setTimeout(function () {
        $('thinkMsg').hidden = true;
        $('sumMsg').hidden = false;
      }, reduce ? 0 : 1200);
    });
  }
  // Demo only: follow-up buttons switch to their "done" label, nothing is sent.
  document.querySelectorAll('.act').forEach(function (b) {
    b.addEventListener('click', function () {
      b.textContent = dict[b.dataset.done];
      b.classList.add('done');
      b.disabled = true;
    });
  });

  // Contact form
  var form = $('contactForm'), msg = $('formMsg');
  if (form) {
    // Submit stays disabled until every required field is valid and consent is ticked,
    // so the browser's own validation bubbles never show.
    var send = form.querySelector('[type=submit]');
    // When the form was shown; the Worker drops submissions faster than a human could type.
    var stamp = function () { form.elements.ts.value = Date.now(); };
    stamp();
    // After a successful send, lock the form for COOLDOWN ms (kept across reloads).
    var COOLDOWN = 60000, KEY = 'contactSentAt';
    var sentAt = function () { try { return +localStorage.getItem(KEY) || 0; } catch (e) { return 0; } };
    var coolingDown = function () { return Date.now() - sentAt() < COOLDOWN; };
    // With Turnstile on the page, also wait for its token (set via the render callbacks below).
    var captcha = form.querySelector('.cf-turnstile');
    var captchaOk = function () {
      var t = form.elements['cf-turnstile-response'];
      return !captcha || !!(t && t.value);
    };
    // Rendered explicitly so the size fits the space: 'flexible' needs at least 300px.
    var captchaId = null;
    (function renderCaptcha() {
      if (!captcha) return;
      if (!window.turnstile) return setTimeout(renderCaptcha, 200);
      captchaId = turnstile.render(captcha, {
        sitekey: captcha.dataset.sitekey,
        language: captcha.dataset.language,
        size: captcha.clientWidth >= 300 ? 'flexible' : 'compact',
        theme: 'light', // match the light form even when the OS is in dark mode
        callback: function () { sync(); },
        'expired-callback': function () { sync(); },
        'error-callback': function () { sync(); },
      });
    })();
    var sync = function () {
      send.disabled = !form.checkValidity() || !captchaOk() || coolingDown();
      if (coolingDown() && !msg.textContent) msg.textContent = dict['f.wait'];
    };
    setInterval(function () { if (!coolingDown() && msg.textContent === dict['f.wait']) msg.textContent = ''; sync(); }, 5000);
    ['input', 'change', 'focusin'].forEach(function (ev) { form.addEventListener(ev, sync); });
    sync();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (send.disabled) return;
      send.disabled = true; // no double submits while sending
      msg.textContent = dict['f.sending'];
      msg.insertAdjacentHTML('beforeend', '<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>');
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (r.status === 429) { msg.textContent = dict['f.wait']; return; }
          // Log the server's reason for support/debugging (visible only in DevTools).
          if (!r.ok) return r.text().then(function (t) { console.warn('contact form error', r.status, t); throw 0; });
          try { localStorage.setItem(KEY, Date.now()); } catch (e) {}
          form.reset(); stamp(); if (captchaId !== null) turnstile.reset(captchaId); msg.textContent = dict['f.ok'];
        })
        .catch(function () { msg.textContent = dict['f.err']; })
        .then(sync);
    });
  }
})();
