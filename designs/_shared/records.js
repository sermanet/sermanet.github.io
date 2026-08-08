/* Shared runtime for every design.
 *
 *   SiteRecords.init({ cards, hoverPlay, filters })
 *
 * Handles the three things all designs need identically: media that doesn't
 * download until it's nearly on screen, theme filtering, and the record
 * dialogs that keep the site's legacy #anchor URLs resolving.
 */
window.SiteRecords = (function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var playing = null;
  var openDialog = null;

  function all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ---------- lazy media ---------- */

  function hydrate(video) {
    if (!video || video.dataset.loaded) return;
    video.dataset.loaded = '1';
    video.src = video.dataset.src + '#t=' + (video.dataset.t || '0.1');
    video.load();
  }

  function observe(cards) {
    if (!('IntersectionObserver' in window)) {
      cards.forEach(function (c) { hydrate(c.querySelector('video[data-src]')); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target.querySelector('video[data-src]');
        if (!v) return;
        if (e.isIntersecting) hydrate(v);
        else if (!v.paused) v.pause();
      });
    }, { rootMargin: '400px 0px' });
    cards.forEach(function (c) { io.observe(c); });
  }

  /* ---------- hover playback: one stream at a time ---------- */

  function play(card) {
    if (reduceMotion) return;
    var v = card.querySelector('video');
    if (!v) return;
    hydrate(v);
    if (playing && playing !== v) playing.pause();
    playing = v;
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay refused: keep the still frame */ });
  }

  function stop(card) {
    var v = card.querySelector('video');
    if (!v) return;
    v.pause();
    if (playing === v) playing = null;
  }

  /* ---------- record dialogs ---------- */

  function dialogFor(id) {
    var el = document.getElementById(id);
    return el && el.tagName === 'DIALOG' ? el : null;
  }

  function clearHash() {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }

  function open(id, updateHash) {
    var dlg = dialogFor(id);
    if (!dlg) return false;
    if (openDialog && openDialog !== dlg) shut(openDialog);
    if (playing) { playing.pause(); playing = null; }
    if (!dlg.open) {
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
    }
    openDialog = dlg;
    all('video[data-src]', dlg).forEach(function (v) {
      hydrate(v);
      if (!reduceMotion) {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      }
    });
    if (updateHash !== false && location.hash !== '#' + id) {
      history.pushState(null, '', '#' + id);
    }
    return true;
  }

  /* Cleanup runs here rather than in a `close` listener alone: the listener
     stays as a backstop for closes we don't initiate, but every path we
     control calls shut() directly, so pausing and hash cleanup never depend
     on that event firing. Idempotent. */
  function shut(dlg) {
    if (!dlg) return;
    all('video', dlg).forEach(function (v) { v.pause(); });
    if (openDialog === dlg) { openDialog = null; clearHash(); }
    if (dlg.open) {
      if (typeof dlg.close === 'function') dlg.close();
      else dlg.removeAttribute('open');
    }
  }

  function wireDialogs() {
    all('dialog.detail').forEach(function (dlg) {
      dlg.addEventListener('close', function () { shut(dlg); });
      dlg.addEventListener('cancel', function () { shut(dlg); });
      // a click landing on the dialog element itself is a click on the backdrop
      dlg.addEventListener('click', function (e) { if (e.target === dlg) shut(dlg); });
      var closer = dlg.querySelector('.detail-close');
      if (closer) closer.addEventListener('click', function () { shut(dlg); });
    });

    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      if (id && open(id)) e.preventDefault();
    });

    window.addEventListener('popstate', function () {
      var id = location.hash.slice(1);
      if (id) open(id, false);
      else if (openDialog) shut(openDialog);
    });

    if (location.hash.length > 1) open(location.hash.slice(1), false);
  }

  /* ---------- theme filters ---------- */

  function wireFilters(cards, opts) {
    var buttons = all(opts.buttons);
    if (!buttons.length) return;
    var countEl = document.querySelector(opts.count);
    var emptyEl = document.querySelector(opts.empty);
    var active = 'all';

    function apply(theme) {
      active = theme;
      var shown = 0;
      cards.forEach(function (card) {
        var themes = (card.dataset.themes || '').split(' ');
        var match = theme === 'all' || themes.indexOf(theme) !== -1;
        card.hidden = !match;
        if (match) shown++;
        else stop(card);
      });
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.theme === theme));
      });
      if (countEl) countEl.textContent = shown + (shown === 1 ? ' project' : ' projects');
      if (emptyEl) emptyEl.hidden = shown > 0;
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        apply(b.dataset.theme === active ? 'all' : b.dataset.theme);
      });
    });

    apply('all');
  }

  return {
    reduceMotion: reduceMotion,
    init: function (opts) {
      opts = opts || {};
      var cards = all(opts.cards || '.tile');
      observe(cards);
      if (opts.hoverPlay !== false) {
        cards.forEach(function (card) {
          card.addEventListener('mouseenter', function () { play(card); });
          card.addEventListener('mouseleave', function () { stop(card); });
          card.addEventListener('focus', function () { play(card); });
          card.addEventListener('blur', function () { stop(card); });
        });
      }
      if (opts.filters) wireFilters(cards, opts.filters);
      wireDialogs();
    }
  };
})();
