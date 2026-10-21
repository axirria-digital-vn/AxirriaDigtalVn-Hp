// Site header behaviour, shared by the company pages and the product pages.
(function () {
  var header = document.querySelector('.site-hd');
  if (!header) return;

  // Header shadow once the page scrolls
  var onScroll = function () { header.classList.toggle('scrolled', scrollY > 8); };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Language switch: open the other language at the same place instead of at the top.
  // JA and EN pages share one template, so the n-th section/heading is the same block in both.
  var KEY = 'langScroll';
  var marks = function () { return document.querySelectorAll('section, h1, h2, h3'); };
  var line = function () { return header.getBoundingClientRect().bottom; };
  var bare = function (p) { return p.replace(/^\/en\//, '/'); };
  header.querySelectorAll('.lang a:not([aria-current])').forEach(function (a) {
    a.addEventListener('click', function () {
      var path = new URL(a.href).pathname;
      if (bare(path) !== bare(location.pathname)) return; // product pages link to the company top page
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
})();
