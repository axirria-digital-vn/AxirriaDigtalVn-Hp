// Renders src/*.html into static pages per language so the text is in the HTML
// (search engines, link previews, no-JS). Run: node build.js
const fs = require('fs');
const path = require('path');

const cfg = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
const I18N = new Function(fs.readFileSync('i18n.js', 'utf8') + ';return I18N;')();
const LANGS = { ja: { dir: '', og: 'ja_JP' }, en: { dir: 'en/', og: 'en_US' } };
const PAGES = [
  { src: 'src/index.html', dir: '', title: 'meta.title' },
  { src: 'src/privacy.html', dir: 'privacy/', title: 'pp.title' },
  { src: 'src/products.html', dir: 'products/', title: 'pr.pageTitle', gh: 'h2' },
  { src: 'src/munemo.html', dir: 'munemo/', title: 'mu.pageTitle' },
];

const PRODUCTS = JSON.parse(fs.readFileSync('products.json', 'utf8')).products;
const GROUPS = ['partner', 'own'];
for (const p of PRODUCTS) if (!GROUPS.includes(p.group)) throw new Error(`products.json: ${p.id} has unknown group ${p.group}`);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const langLink = (l, href, current) =>
  `<a href="${href}" hreflang="${l}" lang="${l}" aria-label="${l === 'ja' ? '日本語' : 'English'}"${current ? ' aria-current="true"' : ''}>${l === 'ja' ? '<span class="lf">日本語</span><span class="ls">JP</span>' : 'EN'}</a>`;

// Site header (header.css / header.js), the same on every page. home = link to the top page
// ('' on the top page itself, so the menu scrolls instead of reloading).
function siteHeader(lang, home, base, langSwitch) {
  const dict = I18N[lang];
  const menu = ['services', 'products', 'offshore', 'cases', 'company', 'contact']
    .map((k) => `<li><a href="${home}#${k}">${dict['nav.' + k]}</a></li>`).join('');
  return `<header class="site-hd">
  <div class="nav">
    <a class="logo" href="${home || '#top'}" aria-label="Axirria Digital Vietnam"><img class="mark" src="${base}logo-mark.svg" width="44" height="44" alt=""><span class="nm"><span class="wm" aria-hidden="true">ax<i>ı<b class="h"></b></i>rr<i>ı<b class="f"></b></i>a</span><span class="r">digital vietnam</span></span></a>
    <ul class="menu" id="siteMenu">${menu}</ul>
    <nav class="lang" aria-label="Language">${langSwitch}</nav>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="siteMenu" aria-label="${esc(dict['nav.menu'])}"><span></span></button>
  </div>
</header>
<script src="${base}header.js" defer></script>`;
}

// Product pages are single-language static files: give them the site header, in the page's language.
const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&display=swap">';
function addSiteHeader(file) {
  let html = fs.readFileSync(file, 'utf8');
  const lang = /<html[^>]*\slang="ja"/.test(html) ? 'ja' : 'en';
  const langSwitch = Object.keys(LANGS).map((l) => langLink(l, '/' + LANGS[l].dir, l === lang)).join('');
  html = html.replace('</head>', `${FONTS}\n<link rel="stylesheet" href="/header.css">\n</head>`)
    .replace(/<body[^>]*>/, (m) => m + '\n' + siteHeader(lang, '/' + LANGS[lang].dir, '/', langSwitch));
  fs.writeFileSync(file, html);
}

// Stand-in for a draft product page: same head and title, body text replaced by a "coming soon" note.
function comingSoon(html) {
  const ja = /<html[^>]*\slang="ja"/.test(html);
  const note = ja ? 'このページは準備中です。公開まで今しばらくお待ちください。' : 'This page is being prepared and will be published soon.';
  return html.replace('</head>', '<meta name="robots" content="noindex">\n</head>')
    .replace(/(<\/h1>)[\s\S]*?(?=<nav class="pp-links"|<\/article>|<\/main>)/, `$1\n<p class="pp-meta">${note}</p>\n`)
    .replace(/\[\[[^\]]*\]\]/g, '');
}

function render(page, lang) {
  const dict = I18N[lang];
  // Every page is a directory index (clean URLs like /en/privacy/), so links are dir-relative.
  const here = LANGS[lang].dir + page.dir;
  const base = '../'.repeat(here.split('/').filter(Boolean).length);
  const url = (l, dir = page.dir) => cfg.siteUrl + LANGS[l].dir + dir;
  const rel = (to) => (path.posix.relative('/' + here, '/' + to) || '.') + '/';
  const title = page.dir ? dict[page.title] + (lang === 'ja' ? '｜' : ' | ') + 'Axirria Digital Vietnam' : dict['meta.title'];

  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(dict['meta.desc'])}">`,
    `<link rel="canonical" href="${url(lang)}">`,
    `<link rel="alternate" hreflang="ja" href="${url('ja')}">`,
    `<link rel="alternate" hreflang="en" href="${url('en')}">`,
    `<link rel="alternate" hreflang="x-default" href="${url('ja')}">`,
    `<link rel="icon" href="${base}logo-mark.svg" type="image/svg+xml">`,
    `<link rel="stylesheet" href="${base}header.css">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Axirria Digital Vietnam">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(dict['meta.desc'])}">`,
    `<meta property="og:url" content="${url(lang)}">`,
    `<meta property="og:image" content="${cfg.siteUrl}og.png">`,
    `<meta property="og:locale" content="${LANGS[lang].og}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ].join('\n');

  const langSwitch = Object.keys(LANGS).map((l) => langLink(l, rel(LANGS[l].dir + page.dir), l === lang)).join('');
  const header = siteHeader(lang, page.dir ? rel(LANGS[lang].dir) : '', base, langSwitch);

  // Smallest-team size from site.config.json `plan` (no prices are published on the site).
  // Cloudflare Turnstile widget, only when a site key is configured.
  const turnstile = cfg.turnstileSiteKey
    ? `<div class="cf-turnstile" data-sitekey="${esc(cfg.turnstileSiteKey)}" data-language="${lang}"></div><script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>`
    : '';
  // Product cards and footer links from products.json (hrefs are site-absolute paths),
  // grouped by `group` in GROUPS order; each group has a heading and a note in i18n (pr.g.<group>).
  const card = (p) => {
    const icon = p.icon ? `<img src="${esc(p.icon)}" width="56" height="56" alt="">` : `<span aria-hidden="true">${esc(p.name[0])}</span>`;
    const status = p.status ? ` <em class="prod-st">${esc(p.status[lang])}</em>` : '';
    return `<a class="prod" href="${esc(p.href[lang])}"><span class="prod-ic">${icon}</span><span class="prod-b"><span class="prod-n">${esc(p.name)}${status}</span><span class="prod-t">${esc(p.tagline[lang])}</span><span class="prod-more">${dict['pr.more']}</span></span></a>`;
  };
  const gh = page.gh || 'h4';
  const productCards = GROUPS.map((g) => {
    const items = PRODUCTS.filter((p) => p.group === g);
    if (!items.length) return '';
    return `<div class="prod-group"><${gh} class="prod-gt">${dict['pr.g.' + g]}</${gh}><p class="prod-gn">${dict['pr.g.' + g + 'Note']}</p><div class="prod-grid">${items.map(card).join('')}</div></div>`;
  }).join('');
  const productLinks = PRODUCTS.map((p) => `<a href="${esc(p.href[lang])}">${esc(p.name)}</a>`).join('');
  const vars = { lang, base, head, header, langSwitch, productCards, productLinks, productsHref: rel(LANGS[lang].dir + 'products/'), turnstile, 'plan.hours': cfg.plan.devHoursPerMonth, homeHref: rel(LANGS[lang].dir), privacyHref: rel(LANGS[lang].dir + 'privacy/') };
  for (const [k, v] of Object.entries(cfg)) if (typeof v !== 'object') vars['cfg.' + k] = v;

  let html = fs.readFileSync(page.src, 'utf8');
  // Fill empty elements marked data-i18n="key"; textarea content is escaped.
  html = html.replace(/<(\w+)([^>]*?)\sdata-i18n="([^"]+)"([^>]*)><\/\1>/g, (m, tag, a, key, b) => {
    if (dict[key] == null) throw new Error(`${lang}: missing key ${key}`);
    return `<${tag}${a}${b}>${tag === 'textarea' ? esc(dict[key]) : dict[key]}</${tag}>`;
  });
  html = html.replace(/\sdata-i18n-label="([^"]+)"/g, (m, key) => ` aria-label="${esc(dict[key])}"`);
  // Two passes: copy may itself contain {{privacyHref}} / {{cfg.email}}.
  for (let i = 0; i < 2; i++) {
    html = html.replace(/\{\{([\w.]+)\}\}/g, (m, k) => {
      if (vars[k] == null) throw new Error(`${lang}: unknown placeholder ${k}`);
      return vars[k];
    });
  }
  if (/data-i18n=|\{\{/.test(html)) throw new Error(`${page.src} (${lang}): unrendered markers left`);
  return html;
}

// Everything the site serves goes to dist/ (the deploy folder); sources stay out of it.
const OUT = 'dist';
const ASSETS = ['style.css', 'header.css', 'header.js', 'main.js', 'i18n.js', 'logo-mark.svg', 'og.png'];
fs.rmSync(OUT, { recursive: true, force: true });
for (const page of PAGES) {
  for (const lang of Object.keys(LANGS)) {
    const out = path.join(OUT, LANGS[lang].dir, page.dir, 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, render(page, lang));
    console.log('wrote', out);
  }
}
for (const f of ASSETS) fs.copyFileSync(f, path.join(OUT, f));
console.log('copied', ASSETS.join(', '));
// Product pages (static, generated in each product's repo): products/<name>/ -> dist/<name>/
// e.g. products/tsunagu/ is built by the Tsunagu repo (scripts/build-site.js) and served at /tsunagu/.
if (fs.existsSync('products')) {
  for (const name of fs.readdirSync('products')) {
    if (!fs.statSync(path.join('products', name)).isDirectory()) continue;
    // Pages still holding [[...]] placeholders are drafts: their content is not deployed.
    // A "coming soon" page (noindex, not in the sitemap) takes their place so links keep working.
    fs.cpSync(path.join('products', name), path.join(OUT, name), { recursive: true, filter: (src) => {
      const draft = src.endsWith('.html') && fs.readFileSync(src, 'utf8').includes('[[');
      if (draft) {
        const out = path.join(OUT, path.relative('products', src));
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, comingSoon(fs.readFileSync(src, 'utf8')));
        console.log('draft, coming soon page: ' + src);
      }
      return !draft;
    } });
    const htmlFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? htmlFiles(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir, e.name)] : []);
    htmlFiles(path.join(OUT, name)).forEach(addSiteHeader);
    console.log('copied products/' + name + ' -> ' + OUT + '/' + name);
  }
}
// sitemap.xml: every dist/**/index.html except noindex ones (pages and product pages), written last so nothing is missed.
const pageDirs = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? pageDirs(path.join(dir, e.name))
    : e.name === 'index.html' && !fs.readFileSync(path.join(dir, e.name), 'utf8').includes('name="robots" content="noindex"') ? [path.relative(OUT, dir)] : []);
const urls = pageDirs(OUT).sort().map((d) => cfg.siteUrl + (d ? d.split(path.sep).join('/') + '/' : ''));
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map((u) => `<url><loc>${esc(u)}</loc></url>`).join('\n') + '\n</urlset>\n');
console.log('wrote', path.join(OUT, 'sitemap.xml'), '(' + urls.length + ' urls)');
