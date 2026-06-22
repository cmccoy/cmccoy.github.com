# cmccoy.us

Connor McCoy's personal website — a minimal single-page [Jekyll](https://jekyllrb.com/)
site published with GitHub Pages at [www.cmccoy.us](https://www.cmccoy.us).

## Edit the content

The page text lives in [`index.md`](index.md). Edit it, commit, and push to `main` —
GitHub Actions rebuilds and deploys automatically (see `.github/workflows/jekyll.yml`).

## Preview locally

### Devcontainer (easiest)

Open in VS Code and choose **Reopen in Container**, or open in
[GitHub Codespaces](https://codespaces.new/cmccoy/cmccoy.github.com). The container
installs gems and starts `jekyll serve` automatically on port 4000.

> **Note:** open from a normal clone, not a `git worktree` — a worktree's `.git` lives
> outside the container mount and breaks git inside.

### Host Ruby

Requires Ruby 4.0 (see [`.ruby-version`](.ruby-version); macOS system Ruby is too old).

```bash
bundle install
bundle exec jekyll serve   # http://localhost:4000, with live reload
```

## Layout

- `index.md` — home page content.
- `_layouts/default.html` — the single page template.
- `css/style.css` — small, hand-written stylesheet.
- `CNAME` — custom domain; leave it in place.
