# Forza Paint Database 🎨

A fast, searchable database of **10,936 real manufacturer paint codes** with HSB values for recreating them in **Forza Horizon 6** (and FH4/FH5).

Built with React + Vite. No backend, no API — pure static app, runs entirely in the browser.

![Forza Paint DB screenshot](https://i.imgur.com/placeholder.png)

---

## Features

- **10,936 vehicle colours** across 187 makes
- **68 wheel colours**
- Colour swatches generated from HSB values
- Filter by make, paint type, or search by name
- Detail panel with full HSB values (H / S / B + L/R direction)
- **FH6 paint type mapping** — old types mapped to FH6 equivalents
- ⚠ Metal Flake recalibration warnings (FH6 changed the blend formula)
- FH6 new types: Metal Flake Fine / Medium / Glitter / Candy

## FH6 Paint Type Changes

| Old (FH4/FH5)  | FH6 Equivalent        | Notes |
|----------------|-----------------------|-------|
| Metal Flake    | Metal Flake Medium    | ⚠ Blend formula changed — needs recalibration |
| —              | Metal Flake Fine      | New: subtle pearl/sparkle |
| —              | Metal Flake Glitter   | New: large visible flakes |
| —              | Candy                 | New: single-slider, pearlescent |
| Normal         | Normal                | Unchanged |
| Matte          | Matte                 | Unchanged |
| Semigloss      | Semigloss             | Unchanged |
| Chrome         | Chrome                | Unchanged |
| Two-Tone *     | Two-Tone *            | Unchanged |
| Carbon Fiber * | Carbon Fiber          | Unchanged |
| Aluminum *     | Aluminum *            | Unchanged |

> Source: [PlumCrazy010 on Forza forums](https://forums.forza.net/t/forza-horizon-6-livery-editor/798772/109), May 2026

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Data Source

Paint codes sourced from the community-maintained [GTplanet Forza Colour Database](https://www.gtplanet.net/forum/threads/forza-horizon-4-colour-creation-database-constant-work-in-progress-read-first-post.384407/) spreadsheet (originally compiled from 2019).

The dataset lives in `src/data.js` — a compact encoded format:

```
Row: [make_idx, name, type_idx, h1, hd1, s1, sd1, b1, bd1, h2, hd2, s2, sd2, b2, bd2, note]
Direction: 0 = L (left), 1 = R (right)
```

## Contributing

Paint codes go stale as games update. PRs welcome for:
- Corrected HSB values for FH6 (especially Metal Flake recalibrations)
- New manufacturer colours
- Candy paint equivalents for existing entries

## Stack

- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/)
- Fonts: [Rajdhani](https://fonts.google.com/specimen/Rajdhani) + [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) via Google Fonts

## License

MIT
