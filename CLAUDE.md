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

Requires Ruby 4.0 (see `.ruby-version`; macOS system Ruby is too old).

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

## Notes

- `Gemfile` pins `jekyll ~> 4.3` plus `webrick` (required for `jekyll serve` on Ruby 3+).
- `Gemfile.lock` includes `x86_64-linux` and `ruby` platforms so CI (Ubuntu) can install; regenerate with `bundle lock --add-platform x86_64-linux ruby` if needed.
- `CNAME` must stay in the repo root — Jekyll copies it into `_site/`, preserving the custom domain through the Actions deploy.
