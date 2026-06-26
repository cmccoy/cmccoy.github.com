// Cheeky hover sidebars for the home page.
// On link hover, shows a small aside note to the right of the main column.
import { h, render } from "./vendor/preact-10.29.2.module.js";
import { useState, useEffect } from "./vendor/preact-hooks-10.29.2.module.js";
import htm from "./vendor/htm-3.1.1.module.js";

const html = htm.bind(h);

// URL fragment → aside text. Matched with href.includes(key).
const ASIDES = {
  "anthropic.com": "makes Claude.",
  "//www.google.com": "search company, founded 1998.",
};

function findAside(href) {
  for (const [key, text] of Object.entries(ASIDES)) {
    if (href.includes(key)) return text;
  }
  return null;
}

function AsideNote() {
  const [active, setActive] = useState(null); // { text, rect }

  useEffect(() => {
    const onOver = (e) => {
      const a = e.target.closest("a[href]");
      if (!a) return;
      const aside = findAside(a.href);
      if (aside) setActive({ text: aside, rect: a.getBoundingClientRect() });
    };
    const onOut = (e) => {
      const a = e.target.closest("a[href]");
      if (a && findAside(a.href)) setActive(null);
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  if (!active) return null;

  const main = document.querySelector("main");
  const mainRect = main ? main.getBoundingClientRect() : null;
  const left = mainRect ? mainRect.right + 20 : active.rect.right + 12;
  const top = active.rect.top;

  return html`
    <div class="aside-note" style="top:${top}px;left:${left}px">
      ${active.text}
    </div>
  `;
}

const container = document.createElement("div");
document.body.appendChild(container);
render(html`<${AsideNote} />`, container);
