// Progressive enhancement for the home-page photo strip.
//
// Jekyll renders the first few photos as plain links (see index.md), so the
// strip works without JavaScript. When this module loads it replaces that
// markup with a rotating selection (seeded by the day of the year, so the page
// is stable within a day but changes over the week) and opens photos in a
// native <dialog> instead of navigating away.
import { h, render } from "./vendor/preact-10.29.8.module.js";
import { useEffect, useRef, useState } from "./vendor/preact-hooks-10.29.8.module.js";
import htm from "./vendor/htm-3.1.1.module.js";

const html = htm.bind(h);
const STRIP_SIZE = 4;

function dayOfYear(d = new Date()) {
  const start = Date.UTC(d.getFullYear(), 0, 1);
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 86400000);
}

// Take STRIP_SIZE consecutive photos (wrapping) starting at a day-seeded offset.
function pick(photos) {
  const n = Math.min(STRIP_SIZE, photos.length);
  const offset = photos.length ? dayOfYear() % photos.length : 0;
  return Array.from({ length: n }, (_, i) => photos[(offset + i) % photos.length]);
}

function Lightbox({ photo, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (photo && !dialog.open) dialog.showModal();
    if (!photo && dialog.open) dialog.close();
  }, [photo]);

  // Close when the backdrop (the dialog element itself, not its child) is clicked.
  const onClick = (e) => { if (e.target === ref.current) onClose(); };

  return html`
    <dialog class="lightbox" ref=${ref} onClose=${onClose} onClick=${onClick}>
      ${photo && html`
        <figure>
          <img src="/assets/photos/${photo.slug}.webp" alt=${photo.alt}
               width=${photo.width} height=${photo.height} />
          <figcaption>${photo.caption}</figcaption>
        </figure>
      `}
    </dialog>`;
}

function PhotoStrip({ photos }) {
  const [shown] = useState(() => pick(photos));
  const [open, setOpen] = useState(null);
  return html`
    <ul class="photo-strip" style=${{ "--count": shown.length }}>
      ${shown.map((p) => html`
        <li key=${p.slug}>
          <button type="button" aria-label=${`View: ${p.caption}`} onClick=${() => setOpen(p)}>
            <img src="/assets/photos/${p.slug}-thumb.webp" alt=${p.alt}
                 width="480" height="480" loading="lazy" decoding="async" />
          </button>
        </li>`)}
    </ul>
    <${Lightbox} photo=${open} onClose=${() => setOpen(null)} />`;
}

const container = document.getElementById("photo-strip-root");
const data = document.getElementById("photo-strip-data");
if (container && data) {
  const photos = JSON.parse(data.textContent);
  if (photos.length) render(html`<${PhotoStrip} photos=${photos} />`, container);
}
