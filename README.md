# Sermanet Home

The live site at <https://sermanet.github.io> is `index.html`, generated from
`data/site.json` by one of the designs in `designs/`.

## Content

Everything lives in **`data/site.json`** — profile, links, highlights, and the
33 projects. Edit that file, rebuild, done. Nothing else needs touching to add a
paper.

Each project carries:

- `summary` — one line, used as the card blurb. Not shown inside the record,
  where it would just restate the opening description.
- `body` — the description, in your words.
- `extended` — a longer, abstract-length write-up rendered *below* the
  description, never in place of it. Present for the 27 projects with a paper.
- `media` — images and videos. A video may carry a `preview`: a short, small
  loop used for the card, so a thumbnail never streams a minute-long clip.

## Building

```bash
./bin/build-design signal index.html   # publish Signal as the live homepage
./bin/build-design contact-sheet       # -> contact-sheet.html (local preview)
```

| Design | Description |
| --- | --- |
| `signal` | **Live.** Founder-facing feed. UMA leads; projects are filterable cards. Light and dark, with a theme toggle. |
| `contact-sheet` | Media-first grid on a dark ground. Hover a tile to play it. |
| `two-tracks` | Building and research as parallel columns, converging at the foot. |

A design is a directory under `designs/` exporting `render(site)` from
`render.js`, plus its own CSS and JS. `designs/_shared/` holds what they all
need: `build.js` (escaping, asset versioning, the record markup, the analytics
tag) and `records.js` (lazy media, filtering, the record dialogs). A new design
writes layout and styling only.

No npm dependencies — the build is plain Node.

**Keep `.nojekyll` at the repo root.** GitHub Pages runs Jekyll by default, and
Jekyll silently refuses to publish directories starting with an underscore — so
without it `designs/_shared/` 404s and every interactive part of the site (video
thumbnails, filtering, record dialogs, the theme toggle) dies quietly, with no
console error.

### Preview locally

```bash
python3 -m http.server 8000
```

## Analytics

Cookieless traffic counting via [GoatCounter](https://www.goatcounter.com).
Sign up, then put your site code in `profile.analytics.goatcounter` in
`data/site.json` and rebuild. While it is empty, no script is emitted at all.

GoatCounter sets no cookies and stores no personal data, so no consent banner is
needed.

## Paper figures

```bash
./bin/extract-figures papers/<name>.pdf --out /tmp/figs
```

Pulls every figure out of a paper PDF: finds each caption with pdftotext's word
boxes, takes the band of page above it, renders at 300 DPI and trims the
margins, writing a `manifest.json` with each caption so figures can be chosen on
what they show. `--only 2,3,4,5` limits it to particular figures.

Handles two-column (IEEE) and single-column (JFR) layouts, and strips running
page headers (arXiv preprints repeat the title on every page) plus the title
block above a figure on page one. It is not perfect — a few figures come out
over-captured. Review before installing; the manifest makes that quick.

`papers/` holds local copies of papers that aren't reliably reachable online,
mirrored alongside the official links.

## UMA assets

```bash
./bin/import-uma
```

Copies the UMA images out of Drive, transcodes the `.mov` files to web-sized
mp4, cuts a short low-res loop from each for the card thumbnails, and points the
`uma-chapter-*` entries at whatever landed. Needs ffmpeg — install it with
`~/infra/setup/install-ffmpeg.sh`. Safe to re-run; it skips anything already
imported and never writes to Drive. Tune loop length, width and start offset via
`PREVIEW` at the top of the script.

## Project anchors

Each project keeps its `id` from the old page as a URL fragment, so existing
links like `sermanet.github.io/#robovqa`, `#tcn` or `#asimov` still resolve —
they open that project's record directly.

## History

The site was previously a Distill article template (`draft.md` + `bin/make`).
That pipeline was removed once the site became data-driven; it remains in git
history, and a full backup of the last deployed version is in
`~/backup/websites/`.
