// Progressive enhancement for the home-page photo strip.
//
// Jekyll renders the first few photos as plain links (see index.md), so the
// strip works without JavaScript. When this module loads it replaces that
// markup with a rotating selection (seeded by the day of the year, so the page
// is stable within a day but changes over the week) and opens photos in a
// native <dialog> instead of navigating away, where the whole pool can be
// browsed.
//
// Source of truth for js/photo-strip.js — build with `pnpm build`. JSX is
// compiled to plain h() calls against the vendored Preact build (no runtime).
//
// tsc copies import specifiers through verbatim, so these paths must resolve
// from both src/ (for type-checking) and js/ (for the browser). `../js/vendor/`
// does, because src/ and js/ are sibling directories at the repo root.
import { h, Fragment, render } from "../js/vendor/preact-10.29.8.module.js";
import { useEffect, useRef, useState } from "../js/vendor/preact-hooks-10.29.8.module.js";

const STRIP_SIZE = 4;

/** One entry of _data/photos.yml, as serialised into #photo-strip-data. */
interface Photo {
  slug: string;
  caption: string;
  alt: string;
  width: number;
  height: number;
  /** Photos sharing a group never appear in the strip together. */
  group?: string;
}

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((today - start) / 86_400_000);
}

// Rotate the pool by a day-seeded offset, then take the first STRIP_SIZE
// photos, skipping any whose `group` is already represented.
export function pick(photos: readonly Photo[], today: Date): Photo[] {
  if (photos.length === 0) return [];
  const offset = dayOfYear(today) % photos.length;
  const rotated = [...photos.slice(offset), ...photos.slice(0, offset)];

  const chosen: Photo[] = [];
  const seen = new Set<string>();
  for (const photo of rotated) {
    if (chosen.length === STRIP_SIZE) break;
    if (photo.group && seen.has(photo.group)) continue;
    if (photo.group) seen.add(photo.group);
    chosen.push(photo);
  }
  return chosen;
}

interface LightboxProps {
  photos: readonly Photo[];
  /** Index into `photos` of the photo on show, or null when closed. */
  index: number | null;
  onChange: (index: number | null) => void;
}

const SWIPE_PX = 40;

// Full-size view of the whole pool (not just the strip), browsable with the
// arrow keys, the on-screen buttons, or a horizontal swipe.
function Lightbox({ photos, index, onChange }: LightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const photo = index === null ? null : photos[index];
  const n = photos.length;
  const step = (by: number) => { if (index !== null) onChange((index + by + n) % n); };

  // Keep the native dialog's open state in sync with `index`.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open === Boolean(photo)) return;
    if (photo) dialog.showModal();
    else dialog.close();
  }, [photo]);

  // Warm the cache for the neighbours so stepping through feels instant.
  useEffect(() => {
    if (index === null || n < 2) return;
    for (const i of [index + 1, index - 1 + n]) {
      const next = photos[i % n];
      if (next) new Image().src = `/assets/photos/${next.slug}.webp`;
    }
  }, [index]);

  return (
    <dialog
      class="lightbox"
      ref={ref}
      aria-label={photo?.caption}
      onClose={() => onChange(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") step(1);
        else if (e.key === "ArrowLeft") step(-1);
      }}
      onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        touchX.current = null;
        if (start === null || end === undefined) return;
        const dx = end - start;
        if (Math.abs(dx) > SWIPE_PX) step(dx < 0 ? 1 : -1);
      }}
      // A click on the dialog itself (not its contents) is a backdrop click.
      onClick={(e) => { if (e.target === e.currentTarget) onChange(null); }}
    >
      {photo && (
        <figure>
          <img key={photo.slug} src={`/assets/photos/${photo.slug}.webp`} alt={photo.alt}
               width={photo.width} height={photo.height} />
          <figcaption>
            {n > 1 && (
              <button type="button" class="lightbox-nav" aria-label="Previous photo"
                      onClick={() => step(-1)}>←</button>
            )}
            <span>{photo.caption}</span>
            {n > 1 && (
              <button type="button" class="lightbox-nav" aria-label="Next photo"
                      onClick={() => step(1)}>→</button>
            )}
          </figcaption>
        </figure>
      )}
    </dialog>
  );
}

function PhotoStrip({ photos }: { photos: readonly Photo[] }) {
  const [shown] = useState(() => pick(photos, new Date()));
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <ul class="photo-strip" style={`--count: ${shown.length}`}>
        {shown.map((p) => (
          <li key={p.slug}>
            {/* The button carries the label, so the thumbnail is decorative. */}
            <button type="button" aria-label={`View: ${p.caption}`}
                    onClick={() => setOpen(photos.indexOf(p))}>
              <img src={`/assets/photos/${p.slug}-thumb.webp`} alt=""
                   width={480} height={480} loading="lazy" decoding="async" />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox photos={photos} index={open} onChange={setOpen} />
    </>
  );
}

const container = document.getElementById("photo-strip-root");
const data = document.getElementById("photo-strip-data");
if (container && data) {
  const photos = JSON.parse(data.textContent ?? "[]") as Photo[];
  if (photos.length) render(<PhotoStrip photos={photos} />, container);
}
