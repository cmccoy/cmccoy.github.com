// Progressive enhancement for the home-page photo strip.
//
// Jekyll renders the first few photos as plain links (see index.md), so the
// strip works without JavaScript. When this module loads it replaces that
// markup with a rotating selection (seeded by the day of the year, so the page
// is stable within a day but changes over the week) and opens photos in a
// native <dialog> instead of navigating away.
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
  photo: Photo | null;
  onClose: () => void;
}

function Lightbox({ photo, onClose }: LightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);

  // Keep the native dialog's open state in sync with `photo`.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open === Boolean(photo)) return;
    if (photo) dialog.showModal();
    else dialog.close();
  }, [photo]);

  return (
    <dialog
      class="lightbox"
      ref={ref}
      aria-label={photo?.caption}
      onClose={onClose}
      // A click on the dialog itself (not its contents) is a backdrop click.
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {photo && (
        <figure>
          <img src={`/assets/photos/${photo.slug}.webp`} alt={photo.alt}
               width={photo.width} height={photo.height} />
          <figcaption>{photo.caption}</figcaption>
        </figure>
      )}
    </dialog>
  );
}

function PhotoStrip({ photos }: { photos: readonly Photo[] }) {
  const [shown] = useState(() => pick(photos, new Date()));
  const [open, setOpen] = useState<Photo | null>(null);
  return (
    <>
      <ul class="photo-strip" style={`--count: ${shown.length}`}>
        {shown.map((p) => (
          <li key={p.slug}>
            {/* The button carries the label, so the thumbnail is decorative. */}
            <button type="button" aria-label={`View: ${p.caption}`} onClick={() => setOpen(p)}>
              <img src={`/assets/photos/${p.slug}-thumb.webp`} alt=""
                   width={480} height={480} loading="lazy" decoding="async" />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox photo={open} onClose={() => setOpen(null)} />
    </>
  );
}

const container = document.getElementById("photo-strip-root");
const data = document.getElementById("photo-strip-data");
if (container && data) {
  const photos = JSON.parse(data.textContent ?? "[]") as Photo[];
  if (photos.length) render(<PhotoStrip photos={photos} />, container);
}
