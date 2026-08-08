/* Two Tracks: no filters, no hover playback — the research column is a
   list, not a gallery. Media loads inside the record dialogs. */
SiteRecords.init({ cards: '.item', hoverPlay: false });

/* "All 31 projects" reveals the rest of the research track in place. */
var more = document.getElementById('reveal');
var rest = document.getElementById('rest');
if (more && rest) {
  more.addEventListener('click', function (e) {
    e.preventDefault();
    rest.hidden = !rest.hidden;
    more.textContent = rest.hidden ? more.dataset.show : more.dataset.hide;
    more.setAttribute('aria-expanded', String(!rest.hidden));
  });
}
