// Site header behaviour, shared by the company pages and the product pages.
(function () {
  var header = document.querySelector('.site-hd');
  if (!header) return;

  // Header shadow once the page scrolls
  var onScroll = function () { header.classList.toggle('scrolled', scrollY > 8); };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
