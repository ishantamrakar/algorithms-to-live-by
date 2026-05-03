# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Personal reading project: working through *Algorithms to Live By* by Brian Christian and Tom Griffiths chapter by chapter, building an interactive demo for each one. The goal is to make each algorithm feel intuitive and applicable to everyday decisions — not just correct, but explorable.

Deployed to `ishantamrakar.github.io/algorithms-to-live-by` (GitHub Pages, static files only).

## Voice and Aesthetic

This is a personal project by a PhD student. It should read and look that way. Avoid anything that feels AI-generated, templated, or over-polished.

- **Text**: write like someone who actually read the book and found it interesting. Precise, slightly informal, no buzzwords. Don't hedge. Don't over-explain. Assume the reader is smart. Plain language — not scholarly, not dumbed down.
- **UI**: minimal and functional. No hero gradients, no decorative icons, no card hover shadows, no rounded-everything. Closer to a research notebook than a product page.
- **Math and terminology**: use the book's own language where possible (e.g. "look phase", "leap", "benchmark", "regret"). Don't invent friendlier synonyms.
- **Copy**: short. Labels, hints, stat cards — terse. If it reads like marketing or a tutorial, rewrite it.
- **Punctuation**: do not use the long em dash (—) in copy. It reads as AI-generated.

## Color Palette

All chapters share this palette, defined as CSS variables in each chapter's `style.css`:

```css
--bg:      #ffffff   /* white */
--surface: #f7f7f7   /* cards, controls */
--border:  #e5e5e5   /* dividers */
--text:    #111      /* near-black */
--muted:   #666      /* secondary text */
--theory:  #2563eb   /* blue — theoretical curves */
--monte:   #16a34a   /* green — simulated / best outcome */
--cursor:  #dc2626   /* red — user selection / current threshold */
--optimal: #f59e0b   /* amber — optimal marker (37%, 1/e) */
--deriv:   #7c3aed   /* purple — derivative curves */
```

Canvas charts use the same hex values hardcoded (they can't read CSS variables). When updating colors, change both the CSS variables and the canvas draw calls in the corresponding JS file.

## Development

No build step. Any static file server works:

```bash
python3 -m http.server 8000
```

## Structure

```
index.html                          # Chapter index / landing page
chapters/
  01-optimal-stopping/
    index.html                      # Chapter page (intro + demo + simulator + math)
    style.css                       # Base styles, shared palette
    script.js                       # Monte Carlo simulator + canvas charts
    game.css                        # Secretary Problem demo styles
    game.js                         # Secretary Problem demo logic
    game.html                       # Standalone demo (legacy, kept as fallback)
  02-explore-exploit/
    index.html                      # Intro section done; demo is a placeholder
    style.css
```

Each chapter lives in `chapters/NN-chapter-name/`. The root `index.html` is the table of contents.

## Chapter Page Architecture

Each chapter follows this section order:

1. **Tagline** — one short paragraph: the problem, the conditions under which the algorithm applies, the answer
2. **Interactive demo** — the reader plays it; understanding comes from doing, not reading
3. **Simulator** — sliders to explore the math empirically (Monte Carlo, parameter sweeps)
4. **The Math** — derivation with KaTeX equations and canvas mini-charts

Math via KaTeX (CDN, deferred). Canvas charts drawn with the 2D API directly — no chart libraries. Vanilla JS, no frameworks, no bundlers.

## Chapter 02 Demo Design (reference for building)

The demo is "The New City": 100 nights in a city, 5 restaurants with unknown quality. The user picks restaurants manually while a chosen algorithm runs alongside and gives guidance. At the end, performance is compared across algorithms.

Key mechanics:
- 5 restaurants with hidden true quality scores, drawn from a distribution
- User picks one per night; algorithm suggests which to pick based on selected strategy
- Live stats: running average satisfaction, regret vs. optimal, nights remaining
- Algorithm selector: epsilon-greedy, UCB, Thompson Sampling, Gittins Index
- End screen: side-by-side comparison of user vs. each algorithm's cumulative score

The "information value" of unvisited restaurants should visually decay as days run out (opacity or glow fading as nights remaining drops).

## Adding a New Chapter

1. Add a row in root `index.html` (swap badge for link when ready)
2. Create `chapters/NN-chapter-name/` with `index.html` and `style.css`
3. Copy the palette from chapter 01's `style.css` as the starting point
4. Follow section order: tagline → demo → simulator → math

## Chapters

| # | Chapter | Status |
|---|---------|--------|
| 01 | Optimal Stopping | Done |
| 02 | Explore / Exploit | Intro done, demo placeholder |
| 03 | Sorting | Not started |
| 04 | Caching | Not started |
| 05 | Scheduling | Not started |
| 06 | Bayes's Rule | Not started |
