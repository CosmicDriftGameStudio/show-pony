// Colors and font mirror src/styles.css (dark theme) so the cards match the app.
const CARD_CSS = `
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 100vw; height: 100vh; overflow: hidden;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px;
    background: radial-gradient(ellipse at 50% 35%, #2d1b4e 0%, #140a24 70%);
    color: #f5f0ff;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  .rise { animation: rise 900ms ease-out both; }
  @keyframes rise {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }
  h1 { font-size: 104px; font-weight: 700; letter-spacing: -0.02em; color: #a78bfa; }
  .subtitle { font-size: 38px; color: #d8ccff; }
  .line { font-size: 40px; color: #f5f0ff; }
  .line.last { color: #a78bfa; font-weight: 600; }
`;

function card(body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CARD_CSS}</style></head><body>${body}</body></html>`;
}

export function introCard(): string {
  return card(`
    <h1 class="rise" style="animation-delay: 200ms">Show Pony</h1>
    <p class="subtitle rise" style="animation-delay: 900ms">A guest-list app, built from scratch with Kumiko</p>
  `);
}

export function outroCard(): string {
  return card(`
    <p class="line rise" style="animation-delay: 200ms">Tutorial: docs.kumiko.rocks/en/show-pony</p>
    <p class="line rise" style="animation-delay: 800ms">Live demo: show-pony.kumiko.rocks</p>
    <p class="line last rise" style="animation-delay: 1400ms">kumiko.rocks</p>
    <p class="line rise" style="animation-delay: 2000ms">Terminal: Cogno · cogno.rocks</p>
  `);
}
