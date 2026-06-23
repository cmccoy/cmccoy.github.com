---
layout: default
title: World Cup 2026 Watchability
description: A spoiler-free guide to which completed World Cup 2026 matches are worth your time.
---

A spoiler-free guide to the [2026 FIFA World Cup](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026).
Every completed match gets a rating based only on how tense and dramatic it was —
never on who won. No scores, no winners, no goal counts. Watch the good ones;
reclaim your evenings from the rest.

<p class="wc-asof">Completed matches through {{ site.data.world_cup.through }}.</p>

<div id="wc-app" class="wc-app">
{% comment %} Server-rendered fallback shown when JavaScript is unavailable. {% endcomment %}
<p class="wc-legend">
{% for r in site.data.world_cup.ratings %}<span class="wc-pill">{{ r[1].emoji }} {{ r[1].label }}</span>{% endfor %}
</p>
{% for day in site.data.world_cup.days %}
<section class="wc-day">
<h2>{{ day.date }}</h2>
<ul class="wc-matches">
{% for m in day.matches %}{% assign r = site.data.world_cup.ratings[m.rating] %}{% assign sides = m.teams | split: " vs " %}<li class="wc-match"><span class="wc-rating" title="{{ r.label }}">{{ r.emoji }}</span> <span class="wc-teams">{% for s in sides %}{% unless forloop.first %} vs {% endunless %}<span class="wc-flag" aria-hidden="true">{{ site.data.world_cup.flags[s] }}</span> {{ s }}{% endfor %}</span> <span class="wc-note">— {{ m.note }}</span></li>
{% endfor %}</ul>
</section>
{% endfor %}
</div>

<script type="application/json" id="wc-data">{{ site.data.world_cup | jsonify }}</script>
<script type="module" src="{{ '/js/world-cup.js' | relative_url }}"></script>
