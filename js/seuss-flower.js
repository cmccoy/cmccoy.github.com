import { h, render } from "./vendor/preact-10.29.2.module.js";
import { useState } from "./vendor/preact-hooks-10.29.2.module.js";
import htm from "./vendor/htm-3.1.1.module.js";

const html = htm.bind(h);

const FLOWERS = [
  { src: "/assets/seuss-flower-orb.png",  alt: "A fluffy, Dr. Seuss-like flower seed head on a tall stem" },
  { src: "/assets/seuss-flower-wisp.png", alt: "A fluffy, Dr. Seuss-like flower seed head with wild flowing tendrils" },
];

function SeussFlower() {
  const [flower] = useState(() => FLOWERS[Math.floor(Math.random() * FLOWERS.length)]);
  return html`<img src=${flower.src} alt=${flower.alt} class="photo" />`;
}

const container = document.getElementById("seuss-flower-root");
if (container) render(html`<${SeussFlower} />`, container);
