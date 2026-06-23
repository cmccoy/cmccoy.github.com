---
layout: default
title: World Cup 2026 Watchability
description: A spoiler-free guide to which completed World Cup 2026 matches are worth your time.
---

<span class="wc-ball" aria-hidden="true">⚽</span>

A spoiler-free guide to the [2026 FIFA World Cup](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026).
Every completed match gets a rating based only on how tense and dramatic it was —
never on who won. No scores, no winners, no goal counts. Watch the good ones;
reclaim your evenings from the rest.

{% comment %} Days are authored newest-first, so days[0] is the most recent. Derive the "through" date from it (year from its first kickoff) so this line can't drift out of sync with the match list. {% endcomment %}{% assign latest = site.data.world_cup.days[0] %}<p class="wc-asof">Completed matches through {{ latest.date }} {{ latest.matches[0].kickoff | date: "%Y" }}.</p>

<div id="wc-app" class="wc-app">
{% comment %} Server-rendered fallback shown when JavaScript is unavailable. {% endcomment %}
<p class="wc-legend">
{% for r in site.data.world_cup.ratings %}<span class="wc-pill">{{ r[1].emoji }} {{ r[1].label }}</span>{% endfor %}
</p>
{% for day in site.data.world_cup.days %}
<section class="wc-day">
{% comment %} Weekday is derived from a kickoff in this day, rendered in the site's Pacific timezone (the same zone the days are grouped by) via the epoch round-trip. {% endcomment %}{% assign day_epoch = day.matches[0].kickoff | date: "%s" %}<h2>{{ day_epoch | date: "%A" }}, {{ day.date }}</h2>
<table class="wc-table">
<thead><tr><th scope="col" class="wc-col-rating">Rating</th><th scope="col" class="wc-col-time">Time (PT)</th><th scope="col">Match</th><th scope="col">Note</th></tr></thead>
<tbody>
{% comment %} Matches are authored in ascending kickoff order; `reversed` shows them latest-first within the day. Pacific time is derived from the absolute `kickoff` instant: format to epoch seconds (UTC) first, then re-format so Time.at renders it in the site's configured timezone. {% endcomment %}{% for m in day.matches reversed %}{% assign r = site.data.world_cup.ratings[m.rating] %}{% assign sides = m.teams | split: " vs " %}{% assign epoch = m.kickoff | date: "%s" %}<tr class="wc-match"><td class="wc-rating" title="{{ r.label }}">{{ r.emoji }}</td><td class="wc-time">{{ epoch | date: "%-I:%M %p" }}</td><td class="wc-teams">{% for s in sides %}{% unless forloop.first %} vs {% endunless %}<span class="wc-side"><span class="wc-flag" aria-hidden="true">{{ site.data.world_cup.flags[s] }}</span> {{ s }}</span>{% endfor %}</td><td class="wc-note">{{ m.note }}</td></tr>
{% endfor %}</tbody>
</table>
</section>
{% endfor %}
</div>

<script type="application/json" id="wc-data">{{ site.data.world_cup | jsonify }}</script>
<script type="module" src="{{ '/js/world-cup.js' | relative_url }}"></script>
