# ICP Bull/Bear Tracker — Design Brief

## Direction
Brutalist data-driven dashboard. Sentiment gauge is focal point. Surgical accent usage (green/red only on critical signals). No decoration—every pixel serves thesis clarity.

## Tone
Technical, urgent, analytical. Monospaced typography for metric legibility. High contrast for immediate pattern recognition.

## Palette
| Use | OKLCH | Semantic |
|-----|-------|----------|
| Bull Signal | 0.70 0.22 142 | Primary (vibrant green) |
| Bear Signal | 0.55 0.22 25 | Secondary (warm red) |
| Neutral | 0.75 0.18 48 | Accent (amber for warns/events) |
| Background | 0.10 0.02 240 | Near-black, desaturated |
| Card/Layer | 0.16 0.02 240 | Elevated dark neutral |
| Text | 0.92 0.04 240 | Bright neutral for legibility |
| Border | 0.25 0.02 240 | Subtle containment |
| Muted | 0.22 0.02 240 | Disabled/secondary text |

## Typography
| Tier | Font | Use |
|------|------|-----|
| Display | General Sans | Headers, gauge sentiment label |
| Body/Data | Geist Mono | All metric values, numbers, tickers |
| Code | JetBrains Mono | Timestamps, technical details |

## Structural Zones
| Zone | Background | Border | Elevation |
|------|-----------|--------|----------|
| Header | card (0.16) | bottom, border-color | +1 |
| Metrics Grid | card (0.16) | top/bottom, subtle | +1 |
| Gauge Section | card (0.16) | border-color, outlined | +1 |
| Charts | card (0.16) | top/bottom | +1 |
| Footer | background (0.10) | top, border-color | 0 |

## Spacing & Rhythm
- Grid: 2rem container padding, 1rem gap between metric cards
- Type scale: 12px (labels) → 16px (body) → 24px (metric) → 32px (gauge label)
- Metric cards: 16px padding, 1px border
- Gauge: 256px diameter, 4px border stroke

## Component Patterns
- **Metric Card**: label + value + change% + sparkline (compact, 4-line layout)
- **Sentiment Gauge**: radial SVG, animated fill (red → yellow → green), 0–100 scale
- **Sparkline**: 6-point mini chart, chart-1/chart-2 colors for direction
- **Status Badge**: inline pill, text-xs, primary/secondary colors for signal

## Motion
- Gauge fill: 500ms ease-out on sentiment change
- Metric card hover: border-accent glow, 300ms transition
- Sparkline: 200ms fade-in on data refresh
- No bounce, no delay chaining

## Constraints
- Dark mode only (reduced eye strain for monitoring dashboard)
- Container: max-width 1400px, centered, 2rem padding
- Responsive: sm/md/lg breakpoints, grid reflow 2col→1col on mobile
- Font weights: 400 (body), 600 (labels), 700 (bold values)
- No gradients, no shadows beyond minimal elevation
- Border-radius: 0px grid lines, 8px card corners (--radius)

## Signature Detail
Sentiment gauge with radial fill animated to scale. Primary affordance that answers the user's question immediately: "Are we in bull or bear territory right now?"

## Accessibility
- WCAG AA contrast on all text ✓ (L diff ≥ 0.70)
- Semantic HTML for metric cards (dl/dt/dd structure)
- Gauge has ARIA label + live region for current sentiment
- Color + icons for signal (not color alone)
- Focus visible on all interactive elements

## Performance
- CSS-only gauge animation (no JS re-renders)
- Sparkline SVG paths pre-computed, not Canvas
- Metric cards use CSS variables for color swaps
- Auto-refresh every 5 min; polling, not WebSocket

## Data Visualization
- Chart-1 (0.70 0.22 142): Bull signals, uptrends
- Chart-2 (0.55 0.22 25): Bear signals, downtrends
- Chart-3 (0.60 0.18 55): Neutral/transition
- Chart-4 (0.75 0.18 48): Accent/warning events
- Chart-5 (0.65 0.15 100): TVL, cumulative metrics
