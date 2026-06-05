# cmccoy.us

Connor McCoy's personal website — a minimal single-page [Jekyll](https://jekyllrb.com/)
site published with GitHub Pages at [www.cmccoy.us](https://www.cmccoy.us).

## Edit the content

The page text lives in [`index.md`](index.md). Edit it, commit, and push to `master` —
GitHub Actions rebuilds and deploys automatically (see `.github/workflows/jekyll.yml`).

## Preview locally

Requires Ruby (see [`.ruby-version`](.ruby-version)).

```bash
bundle install
bundle exec jekyll serve   # http://localhost:4000, with live reload
```

## Layout

- `index.md` — the home page content.
- `_layouts/default.html` — the single page template.
- `css/style.css` — the (small, hand-written) stylesheet.
- `CNAME` — the custom domain. Leave it in place.
