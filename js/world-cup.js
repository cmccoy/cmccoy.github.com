// Interactive World Cup 2026 watchability guide.
// Preact + htm, vendored locally (js/vendor/) — no build step, no third-party
// CDN at runtime, in keeping with the site's minimal setup.
// Progressive enhancement: the page ships a server-rendered list; this script
// replaces it with a filterable/searchable version once it loads.
import { h, render } from "./vendor/preact-10.29.2.module.js";
import { useMemo, useState } from "./vendor/preact-hooks-10.29.2.module.js";
import htm from "./vendor/htm-3.1.1.module.js";

const html = htm.bind(h);

const dataEl = document.getElementById("wc-data");
const mount = document.getElementById("wc-app");

if (dataEl && mount) {
  const data = JSON.parse(dataEl.textContent);
  const ratingOrder = ["must", "look", "skip"];
  const flags = data.flags || {};

  // "Spain vs Saudi Arabia" -> [{ flag, name }, …], so each side can show
  // its flag. Falls back to no flag for any team missing from the lookup.
  const sidesOf = (teams) =>
    teams.split(" vs ").map((name) => ({ flag: flags[name] || "", name }));

  // Kickoffs are stored as absolute instants (the `kickoff` field is ISO 8601
  // with the venue's UTC offset), so we can render them in the viewer's own
  // time zone. The no-JS fallback shows Pacific; this enhanced view localises.
  const timeFmt = new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const localDateFmt = new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
  });
  // Day sections are grouped by Pacific date, so we flag any kickoff whose
  // local date differs (a late game that rolls past midnight for the viewer).
  const ptDateFmt = new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });

  // Short label for the viewer's zone (e.g. "PDT", "GMT+9"), derived from a
  // real kickoff so it reflects that date's DST state.
  const sampleKickoff = data.days
    .flatMap((d) => d.matches)
    .map((m) => m.kickoff)
    .find(Boolean);
  const zoneLabel = (() => {
    if (!sampleKickoff) return "local time";
    const part = new Intl.DateTimeFormat([], { timeZoneName: "short" })
      .formatToParts(new Date(sampleKickoff))
      .find((p) => p.type === "timeZoneName");
    return part ? part.value : "local time";
  })();

  // Local kickoff time; appends the local date only when it differs from the
  // Pacific date the match is grouped under.
  const localKickoff = (m) => {
    if (!m.kickoff) return "";
    const d = new Date(m.kickoff);
    const time = timeFmt.format(d);
    return localDateFmt.format(d) === ptDateFmt.format(d)
      ? time
      : `${time} (${localDateFmt.format(d)})`;
  };

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
          matches: day.matches
            .filter(
              (m) =>
                active.has(m.rating) &&
                (needle === "" || m.teams.toLowerCase().includes(needle)),
            )
            // Earliest kickoff first within each day.
            .sort((a, b) => (Date.parse(a.kickoff) || 0) - (Date.parse(b.kickoff) || 0)),
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
                <table class="wc-table">
                  <thead>
                    <tr>
                      <th scope="col" class="wc-col-rating">Rating</th>
                      <th scope="col" class="wc-col-time">Time (${zoneLabel})</th>
                      <th scope="col">Match</th>
                      <th scope="col">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${day.matches.map(
                      (m) => html`
                        <tr class="wc-match" key=${m.teams}>
                          <td
                            class="wc-rating"
                            title=${data.ratings[m.rating].label}
                          >
                            ${data.ratings[m.rating].emoji}
                          </td>
                          <td class="wc-time">${localKickoff(m)}</td>
                          <td class="wc-teams">
                            ${sidesOf(m.teams).map(
                              (s, i) => html`${i > 0 ? " vs " : ""}<span
                                  class="wc-flag"
                                  aria-hidden="true"
                                  >${s.flag}</span
                                > ${s.name}`,
                            )}
                          </td>
                          <td class="wc-note">${m.note}</td>
                        </tr>
                      `,
                    )}
                  </tbody>
                </table>
              </section>
            `,
          )}
    `;
  }

  // Clear the server-rendered fallback, then mount the interactive app.
  mount.innerHTML = "";
  render(html`<${App} />`, mount);
}
