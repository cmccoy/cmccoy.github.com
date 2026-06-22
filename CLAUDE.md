# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Connor McCoy's personal website — a minimal, single-page static Jekyll site served by
**GitHub Pages** at `www.cmccoy.us` (see `CNAME`). There is no application code or test
suite; it is HTML/Markdown/CSS rendered by Jekyll. Keep it minimal.

## Commands

```bash
bundle install              # install gems (Jekyll 4, pinned via Gemfile.lock)
bundle exec jekyll serve    # local preview at http://localhost:4000 with live reload
bundle exec jekyll build    # render static site into _site/ (gitignored)
```

Local builds need a modern Ruby (see `.ruby-version`, currently `4.0`); macOS system
Ruby is too old. The easiest isolated option is the devcontainer
(`.devcontainer/devcontainer.json`) — "Reopen in Container" in VS Code or open in
Codespaces; it runs `bundle install` and serves on port 4000 in a Ruby 4.0 container, so
no host Ruby is touched. Its image tag and `.ruby-version` are kept in lockstep with the
deploy workflow's `ruby/setup-ruby`. Note: open the devcontainer from a normal clone, not
a `git worktree` (a worktree's `.git` lives outside the mount and breaks git inside the
container).

## Deployment

Pushing to `main` triggers the GitHub Actions workflow in
`.github/workflows/jekyll.yml`, which builds with Jekyll and deploys to GitHub Pages
(`actions/upload-pages-artifact` + `actions/deploy-pages`). The Pages source is set to
"GitHub Actions" (not "deploy from a branch"). There is no separate deploy step.

## Architecture

- `_config.yml` — site config: `title`/`description`/`url`, `kramdown` (GFM input) for
  Markdown, `rouge` for syntax highlighting. No theme gem — the layout is standalone.
- `index.md` — the home page content. Front matter selects `layout: default`.
- `_layouts/default.html` — the only layout; a small standalone HTML template that
  wraps `{{ content }}` in `<main>` and links `css/style.css`. No theme, no analytics.
- `css/style.css` — a small, hand-written, unminified stylesheet (system fonts,
  centered column, `prefers-color-scheme` dark support). Edit directly; no build step.
- `404.html` — custom not-found page (also uses `layout: default`).

## Notes

- `Gemfile` pins `jekyll ~> 4.3` (plus `webrick` for `jekyll serve` on Ruby 3+). The
  build runs in CI, so any GitHub-Pages-only constraints no longer apply.
- `Gemfile.lock` includes the `x86_64-linux` and `ruby` platforms so CI (Ubuntu) can
  install; regenerate with `bundle lock --add-platform x86_64-linux ruby` if needed.
- `CNAME` must stay in the repo root — Jekyll copies it into `_site`, preserving the
  custom domain through the Actions deploy.
