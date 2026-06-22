// Interactive World Cup 2026 watchability guide.
// Preact + htm via CDN — no build step, in keeping with the site's minimal setup.
// Progressive enhancement: the page ships a server-rendered list; this script
// replaces it with a filterable/searchable version once it loads.
import { h, render } from "https://esm.sh/preact@10.26.4";
import { useMemo, useState } from "https://esm.sh/preact@10.26.4/hooks";
import htm from "https://esm.sh/htm@3.1.1";

const html = htm.bind(h);

const dataEl = document.getElementById("wc-data");
const mount = document.getElementById("wc-app");

if (dataEl && mount) {
  const data = JSON.parse(dataEl.textContent);
  const ratingOrder = ["must", "look", "skip"];

  function App() {
    // All ratings visible by default.
    const [active, setActive] = useState(() => new Set(ratingOrder));
    const [query, setQuery] = useState("");

    const toggle = (key) => {
      setActive((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    };

    const needle = query.trim().toLowerCase();

    const days = useMemo(() => {
      return data.days
        .map((day) => ({
          ...day,
          matches: day.matches.filter(
            (m) =>
              active.has(m.rating) &&
              (needle === "" || m.teams.toLowerCase().includes(needle)),
          ),
        }))
        .filter((day) => day.matches.length > 0);
    }, [active, needle]);

    const total = days.reduce((n, d) => n + d.matches.length, 0);

    return html`
      <div class="wc-controls" role="group" aria-label="Filter matches">
        <div class="wc-filters">
          ${ratingOrder.map((key) => {
            const r = data.ratings[key];
            const on = active.has(key);
            return html`
              <button
                type="button"
                class=${"wc-filter" + (on ? " is-on" : "")}
                aria-pressed=${on}
                onClick=${() => toggle(key)}
              >
                <span class="wc-rating">${r.emoji}</span> ${r.label}
              </button>
            `;
          })}
        </div>
        <input
          type="search"
          class="wc-search"
          placeholder="Search by team…"
          aria-label="Search by team"
          value=${query}
          onInput=${(e) => setQuery(e.currentTarget.value)}
        />
      </div>

      ${total === 0
        ? html`<p class="wc-empty">No matches fit those filters.</p>`
        : days.map(
            (day) => html`
              <section class="wc-day" key=${day.date}>
                <h2>${day.date}</h2>
                <ul class="wc-matches">
                  ${day.matches.map(
                    (m) => html`
                      <li class="wc-match" key=${m.teams}>
                        <span class="wc-rating" title=${data.ratings[m.rating].label}
                          >${data.ratings[m.rating].emoji}</span
                        >
                        <span class="wc-teams">${m.teams}</span>
                        <span class="wc-note">— ${m.note}</span>
                      </li>
                    `,
                  )}
                </ul>
              </section>
            `,
          )}
    `;
  }

  // Clear the server-rendered fallback, then mount the interactive app.
  mount.innerHTML = "";
  render(html`<${App} />`, mount);
}
