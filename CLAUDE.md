# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Connor McCoy's personal website — a minimal, single-page static Jekyll site served by
**GitHub Pages** at `www.cmccoy.us` (see `CNAME`). There is no application code or test
suite; it is HTML/Markdown/CSS rendered by Jekyll. Keep it minimal.

## Local development

### Devcontainer (recommended)

Open in VS Code → **Reopen in Container**, or open in GitHub Codespaces. The container
runs `bundle install` and serves the site on port 4000 with live reload automatically.
Ruby version, image tag, and `ruby/setup-ruby` in the deploy workflow are kept in lockstep.

> Open from a normal clone, not a `git worktree` — a worktree's `.git` lives outside the
> container mount and breaks git inside.

### Host Ruby

Requires Ruby 4.0 (see `.ruby-version`; macOS system Ruby is too old). Install via `mise` (`mise install`) or Homebrew (`brew install ruby`).

```bash
bundle install
bundle exec jekyll serve    # http://localhost:4000, live reload
bundle exec jekyll build    # renders into _site/ (gitignored)
```

## Deployment

Pushing to `main` triggers `.github/workflows/jekyll.yml`, which builds with Jekyll and
deploys to GitHub Pages (`actions/upload-pages-artifact` + `actions/deploy-pages`). The
Pages source is set to "GitHub Actions" (not "deploy from a branch"). No separate deploy
step needed.

## Architecture

- `_config.yml` — site config: `title`/`description`/`url`, `kramdown` (GFM input), `rouge` for syntax highlighting. No theme gem.
- `index.md` — home page content. Front matter selects `layout: default`.
- `_layouts/default.html` — the only layout; wraps `{{ content }}` in `<main>` and links `css/style.css`.
- `css/style.css` — small, hand-written stylesheet (system fonts, centered column, `prefers-color-scheme` dark support).
- `404.html` — custom not-found page (also uses `layout: default`).
- `js/photo-strip.js` — a small [Preact](https://preactjs.com/) + [htm](https://github.com/developit/htm) enhancement on the home page; see “Photo strip” below.
- `js/vendor/` — vendored (self-hosted) copies of Preact and htm; see “Vendored JS dependencies” below.
- `_data/photos.yml` + `assets/photos/` — the photo pool and its WebP derivatives, managed by `bin/photos`.

## Photo strip

The home page ends with a row of four square thumbnails drawn from `_data/photos.yml`.
Jekyll renders the first four as plain links (works without JS); `js/photo-strip.js`
then swaps in a day-of-year-rotated selection and opens photos in a native `<dialog>`.

To add a photo (needs `cwebp`, `brew install webp`):

```bash
bin/photos add ~/Downloads/IMG_1234.jpg some-slug "Caption, Month Year" "Alt text"
```

This writes `assets/photos/<slug>.webp` (1600px long edge) and `<slug>-thumb.webp`
(480px centre-cropped square), strips all metadata including GPS, and appends an entry
to `_data/photos.yml`. Only the derivatives are committed; keep originals elsewhere.
Reorder or edit captions in the YAML by hand.

## Vendored JS dependencies

The interactive pieces use Preact + htm as ESM modules **vendored into `js/vendor/`** rather than loaded from a CDN. This keeps the site fully self-contained: no third-party runtime dependency, no visitor requests leaking to a CDN, and nothing that can break the page if a CDN has an outage. (A shared cross-site CDN cache no longer helps anyway — modern browsers partition the HTTP cache per site.) The libraries are tiny (~16 KB total) and rarely change, so manual updates are cheap.

Conventions:

- Filenames are **version-pinned** (e.g. `preact-10.29.8.module.js`). This self-documents the version and acts as automatic cache-busting: a new version is a new URL, so browsers never serve a stale file.
- Each file keeps a provenance/license header. Files are the package's published **ESM build** (`dist/*.module.js`), copied verbatim except for one rewrite below. Do not hand-edit them otherwise.
- `preact/hooks` ships with a bare `import … from "preact"`; browsers can't resolve bare specifiers without an import map, so it's rewritten to the relative vendored path (`./preact-<ver>.module.js`).
- Import paths live in `js/seuss-flower.js` (relative to that file, so `./vendor/…`).

To update a vendored library (the host CDNs may be blocked in sandboxes, so pull from the npm registry directly):

1. Find the latest stable version:
   `curl -s https://registry.npmjs.org/preact | python3 -c 'import sys,json;print(json.load(sys.stdin)["dist-tags"])'`
2. Download and extract the tarball (no `npm` needed):
   `curl -sL https://registry.npmjs.org/preact/-/preact-<ver>.tgz | tar xz` → files under `package/`.
3. Copy the ESM build into `js/vendor/` with a version-pinned name, prepend the provenance/license header, and (for `hooks`) rewrite `from"preact"` to the relative path of the new core file. Use:
   - `package/dist/preact.module.js` → `js/vendor/preact-<ver>.module.js`
   - `package/hooks/dist/hooks.module.js` → `js/vendor/preact-hooks-<ver>.module.js`
   - htm: `package/dist/htm.module.js` → `js/vendor/htm-<ver>.module.js`
4. Update the `import` paths at the top of `js/seuss-flower.js` and delete the old version files.
5. Verify the graph resolves before committing (no DOM needed):
   `node --input-type=module -e 'import {h,render} from "./js/vendor/preact-<ver>.module.js"; import {useState} from "./js/vendor/preact-hooks-<ver>.module.js"; import htm from "./js/vendor/htm-<ver>.module.js"; console.log("ok", typeof h, typeof render, typeof useState, typeof htm)'`

## Notes

- `Gemfile` pins `jekyll ~> 4.3` plus `webrick` (required for `jekyll serve` on Ruby 3+).
- `Gemfile.lock` includes `x86_64-linux` and `ruby` platforms so CI (Ubuntu) can install; regenerate with `bundle lock --add-platform x86_64-linux ruby` if needed.
- `CNAME` must stay in the repo root — Jekyll copies it into `_site/`, preserving the custom domain through the Actions deploy.
