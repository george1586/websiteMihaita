# C&I Media — website

Marketing site for **C&I Media**, a done-for-you YouTube agency for coaches, consultants and founders.
One video a week: ideation, scripting, editing, thumbnails, SEO and posting. The client only records.

The site is plain HTML, CSS and JavaScript. No framework, no build step, no dependencies to install.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole site, one page. Copy, structure, meta tags and JSON-LD live here. |
| `styles.css` | Design tokens, layout, components and the responsive breakpoints. |
| `script.js` | Small interactions: nav, reveals, process rail, video playlist, FAQ, form. |

## Run it locally

Open `index.html` in a browser and it works. For a proper local server (recommended, so the Wistia players load the same way as in production):

```
npx serve .
```

or

```
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy

Upload the three files to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, cPanel). There is nothing to compile.
The canonical URL and Open Graph tags in the `<head>` point at `https://c-and-i-media.com/`. Change them if the domain changes.

## Page structure

Sections in order, with the ids the nav links to:

1. `#hero` — headline, hero VSL (Wistia), primary CTA.
2. `#problem` — why short-form content stops working.
3. Shift — the case for long-form YouTube.
4. `#process` — nine steps with a sticky rail that mirrors the card in focus.
5. `#why` — the "one decision" list and the comparison table (DIY, freelancer, agency, C&I Media).
6. `#work` — client channel grid.
7. `#watch` — "watch before you book" objection videos (Wistia playlist).
8. `#faq` — accordion, one item open at a time.
9. Review — social proof.
10. `#contact` — the booking form.

Every nav item, footer link and CTA is an in-page anchor to one of these ids.

## Editing content

All copy is in `index.html`. Some parts have small conventions:

- **Process steps** are `<li class="pstep">` items. Each carries `data-step` (1 to 9) and `data-phase` (0 to 4). The phase number must match a `<li>` in the rail's `#railPhases` list, which is what drives the "Discovery & research … Publish" label on the left.
- **Reveal animation**: add `class="reveal"` to any element and it fades up when scrolled into view.
- **Letter-by-letter paragraphs**: add `data-letters` to a paragraph and it lights up word by word as you reach it.
- **Wistia videos**: each video is a `<wistia-player media-id="…">` element plus a matching `<script src="https://fast.wistia.com/embed/<id>.js">` at the bottom of the file. Add or replace both when you change a video.
- **Comparison table**: plain HTML `<table class="ctable">`. The C&I Media column is marked with `class="is-us"` on its header and cells. The "Swipe to compare" hint is shown on phones only.
- **FAQ**: native `<details class="qa">` elements. The script closes the others when one opens.

## Design tokens

Everything is a CSS custom property at the top of `styles.css`:

| Token | Value | Use |
|---|---|---|
| `--bg` | `#141414` | Page background |
| `--surface` / `--surface-2` | `#1F1F1F` / `#191919` | Cards |
| `--border` | `#363230` | Card and table borders |
| `--text` / `--muted` / `--dim` | `#F2F2F2` / `#B5ADAA` / `#928A87` | Text hierarchy |
| `--accent` | `#EE4452` | Red accent, buttons, active states |
| `--f-display` | Antonio | Headlines (uppercase, outlined variant via `.outline`) |
| `--f-sans` | Plus Jakarta Sans | Body copy |

Fonts load from Google Fonts. Breakpoints are at 1080px, 900px (mobile nav, single-column layouts, slim process rail) and 640px (phone tweaks).

Motion respects `prefers-reduced-motion`. Without JavaScript the page still renders in full, since the reveal styles are gated on a `js` class on `<html>`.

## The process rail

The left rail in `#process` is `position: sticky`. The script picks the card whose centre is nearest a "focus line" (level with the big number on desktop, 42% of the viewport height on phones) and updates the number, the phase name, the phase list and the progress bar. A small dead zone stops it flickering at the switch point. Near the bottom of the grid the browser releases the sticky rail. The focus line stays where the number sat while stuck, so the last cards still activate.

## Contact form

The form validates name and email in the browser and then shows a success message. **It does not send anything yet.** Wire it up in `script.js` under the `contact form` block, where the `TODO` marks the spot. Options include a Calendly redirect, Formspree, Netlify Forms, or your own endpoint.

## Still to do

- Swap the placeholder thumbnails in `#work` for real video stills and link each card to the channel.
- Fill in the social links in the footer (currently `#`).
- Add real privacy, terms and refund pages, or remove those footer links.
- Add an `og:image` for link previews.
- Point the form at a real endpoint (see above).
