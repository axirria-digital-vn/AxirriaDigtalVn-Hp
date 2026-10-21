// Site header behaviour, shared by the company pages and the product pages.
// Product pages carry one header per language (data-lang); only the visitor's language is shown.
(function () {
  var headers = [].slice.call(document.querySelectorAll('.site-hd'));
  if (!headers.length) return;
  var shown = function () { return headers.filter(function (h) { return !h.hidden; })[0] || headers[0]; };

  // Remember the language of the company page being read; product pages show their header in it.
  if (!headers[0].dataset.lang) try { localStorage.setItem('lang', document.documentElement.lang); } catch (e) {}

  // Header shadow once the page scrolls
  var onScroll = function () { headers.forEach(function (h) { h.classList.toggle('scrolled', scrollY > 8); }); };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Product pages: the language switch changes the header only; the visitor stays on the page.
  document.querySelectorAll('.site-hd .lang a[data-lang]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var l = a.dataset.lang;
      try { localStorage.setItem('lang', l); } catch (err) {}
      headers.forEach(function (h) { h.hidden = h.dataset.lang !== l; });
      var current = shown().querySelector('.lang a[aria-current]');
      if (current) current.focus();
    });
  });

  // Company pages: open the other language at the same place instead of at the top.
  // JA and EN pages share one template, so the n-th section/heading is the same block in both.
  var KEY = 'langScroll';
  var marks = function () { return document.querySelectorAll('section, h1, h2, h3'); };
  var line = function () { return shown().getBoundingClientRect().bottom; };
  var bare = function (p) { return p.replace(/^\/en\//, '/'); };
  document.querySelectorAll('.site-hd .lang a:not([aria-current]):not([data-lang])').forEach(function (a) {
    a.addEventListener('click', function () {
      var path = new URL(a.href).pathname;
      if (bare(path) !== bare(location.pathname)) return;
      var list = marks(), y = line(), i = -1;
      for (var n = 0; n < list.length; n++) if (list[n].getBoundingClientRect().top <= y + 1) i = n;
      if (i < 0) return;
      try { sessionStorage.setItem(KEY, JSON.stringify({ path: path, i: i, off: y - list[i].getBoundingClientRect().top })); } catch (e) {}
    });
  });
  try {
    var saved = JSON.parse(sessionStorage.getItem(KEY));
    sessionStorage.removeItem(KEY);
    var el = saved && saved.path === location.pathname && marks()[saved.i];
    if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY - line() + saved.off);
  } catch (e) {}

  // Mobile menu
  headers.forEach(function (header) {
    var menuBtn = header.querySelector('.menu-btn');
    var nav = menuBtn.parentNode;
    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open);
    };
    menuBtn.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    nav.querySelectorAll('.menu a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); menuBtn.focus(); }
    });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setOpen(false); });
  });
})();
