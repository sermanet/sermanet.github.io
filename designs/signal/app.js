/* Signal: filterable card feed. Cards play their clip on hover. */
SiteRecords.init({
  cards: '.card',
  hoverPlay: true,
  filters: { buttons: '.chips button[data-theme]', views: '.chips .view button', count: '#count', empty: '#empty' }
});

/* Theme: system -> light -> dark -> system. The page already follows the OS
   via prefers-color-scheme; this lets a viewer override it, and remembers.
   The pre-paint half of this lives inline in <head>. */
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme');
  if (!btn) return;

  var MODES = ['auto', 'light', 'dark'];
  var meta = document.querySelector('meta[name="theme-color"]');
  var system = window.matchMedia('(prefers-color-scheme: dark)');

  function stored() {
    try { return localStorage.getItem('theme') || 'auto'; } catch (e) { return 'auto'; }
  }

  /* Read the resolved colour back off the page rather than duplicating the
     palette here — the stylesheet stays the single source of truth. */
  function syncMeta() {
    if (meta) meta.setAttribute('content', getComputedStyle(document.body).backgroundColor);
  }

  function apply(mode) {
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);

    try {
      if (mode === 'auto') localStorage.removeItem('theme');
      else localStorage.setItem('theme', mode);
    } catch (e) { /* private mode: the choice just won't persist */ }

    btn.setAttribute('data-mode', mode);
    var label = 'Theme: ' + (mode === 'auto' ? 'follow system' : mode);
    btn.setAttribute('aria-label', label);
    btn.title = label;
    syncMeta();
  }

  btn.addEventListener('click', function () {
    apply(MODES[(MODES.indexOf(stored()) + 1) % MODES.length]);
  });

  // while following the system, track changes to it
  var onSystemChange = function () { if (stored() === 'auto') syncMeta(); };
  if (system.addEventListener) system.addEventListener('change', onSystemChange);
  else if (system.addListener) system.addListener(onSystemChange);

  apply(stored());
})();

/* The hero repeats the name as its h1, so the nav brand only earns its place
   once the hero is gone. Opt in from JS so a no-JS page keeps the brand. */
(function () {
  var nav = document.querySelector('.topnav');
  var hero = document.querySelector('.hero h1');
  if (!nav || !hero || !('IntersectionObserver' in window)) return;

  nav.setAttribute('data-brand', 'auto');
  new IntersectionObserver(function (entries) {
    nav.classList.toggle('scrolled', !entries[0].isIntersecting);
  }, { rootMargin: '-48px 0px 0px 0px' }).observe(hero);
})();
