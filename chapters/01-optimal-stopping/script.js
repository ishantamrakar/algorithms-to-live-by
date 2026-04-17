// ── Selectors ────────────────────────────────────────────────────────────────

const canvas    = document.getElementById('chart');
const ctx       = canvas.getContext('2d');
const canvasPx  = document.getElementById('chart-px');
const ctxPx     = canvasPx.getContext('2d');
const canvasDpx = document.getElementById('chart-dpx');
const ctxDpx    = canvasDpx.getContext('2d');

const sliderN    = document.getElementById('slider-n');
const sliderR    = document.getElementById('slider-r');
const sliderSims = document.getElementById('slider-sims');
const valN       = document.getElementById('val-n');
const valR       = document.getElementById('val-r');
const valSims    = document.getElementById('val-sims');
const btnRun     = document.getElementById('btn-run');

const yourProb  = document.getElementById('your-prob');
const yourSub   = document.getElementById('your-sub');
const monteProb = document.getElementById('monte-prob');
const monteSub  = document.getElementById('monte-sub');

let monteResults = null;

// ── Math ─────────────────────────────────────────────────────────────────────

function theoreticalP(r, n) {
  if (r === 0) return 0;
  let sum = 0;
  for (let k = r + 1; k <= n; k++) sum += 1 / (k - 1);
  return (r / n) * sum;
}

// Continuous approximation P(x) = -x ln(x)
function Px(x) {
  if (x <= 0 || x >= 1) return 0;
  return -x * Math.log(x);
}

// Derivative dP/dx = -ln(x) - 1
function dPx(x) {
  if (x <= 0 || x >= 1) return 0;
  return -Math.log(x) - 1;
}

function buildTheoreticalCurve(n) {
  const curve = [];
  for (let pct = 1; pct <= 99; pct++) {
    const r = Math.max(1, Math.round((pct / 100) * n));
    curve.push({ pct, prob: theoreticalP(r, n) });
  }
  return curve;
}

function monteCarlo(r, n, sims) {
  let successes = 0;
  for (let i = 0; i < sims; i++) {
    const options = Array.from({ length: n }, (_, i) => i + 1);
    shuffle(options);
    let bestInLook = Infinity;
    for (let j = 0; j < r; j++) {
      if (options[j] < bestInLook) bestInLook = options[j];
    }
    let chosen = null;
    for (let j = r; j < n; j++) {
      if (options[j] < bestInLook) { chosen = options[j]; break; }
    }
    if (chosen === 1) successes++;
  }
  return successes / sims;
}

function buildMonteCarloCurve(n, sims) {
  const curve = [];
  for (let pct = 1; pct <= 99; pct += 2) {
    const r = Math.max(1, Math.round((pct / 100) * n));
    curve.push({ pct, prob: monteCarlo(r, n, sims) });
  }
  return curve;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ── Canvas helpers ────────────────────────────────────────────────────────────

const PAD = { top: 24, right: 24, bottom: 48, left: 56 };
const PAD_SM = { top: 20, right: 16, bottom: 36, left: 44 };

function setupCanvas(c) {
  const dpr  = window.devicePixelRatio || 1;
  const rect = c.getBoundingClientRect();
  c.width  = rect.width  * dpr;
  c.height = rect.height * dpr;
  const cx = c.getContext('2d');
  cx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;
  return { w, h };
}

function plotDims(w, h, pad) {
  return {
    plotW: w - pad.left - pad.right,
    plotH: h - pad.top  - pad.bottom,
  };
}

// ── Main simulator chart ──────────────────────────────────────────────────────

function renderMain() {
  const { w, h } = setupCanvas(canvas);
  const { plotW, plotH } = plotDims(w, h, PAD);

  ctx.clearRect(0, 0, w, h);

  const n   = parseInt(sliderN.value);
  const pct = parseInt(sliderR.value);

  const toX = p  => PAD.left + (p / 100) * plotW;
  const toY = pr => PAD.top  + plotH - pr * plotH;

  // Grid
  ctx.strokeStyle = '#e5e5e5';
  ctx.lineWidth   = 1;
  ctx.setLineDash([]);
  for (let p = 0; p <= 60; p += 10) {
    const y = toY(p / 100);
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + plotW, y); ctx.stroke();
    ctx.fillStyle = '#bbb'; ctx.font = '11px -apple-system,sans-serif';
    ctx.textAlign = 'right'; ctx.fillText(p + '%', PAD.left - 8, y + 4);
  }
  for (let p = 0; p <= 100; p += 10) {
    const x = toX(p);
    ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, PAD.top + plotH); ctx.stroke();
    ctx.fillStyle = '#bbb'; ctx.textAlign = 'center';
    ctx.fillText(p + '%', x, PAD.top + plotH + 18);
  }

  // Axes
  ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top); ctx.lineTo(PAD.left, PAD.top + plotH);
  ctx.lineTo(PAD.left + plotW, PAD.top + plotH); ctx.stroke();

  // 37% optimal marker
  const xOpt = toX(37);
  ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(xOpt, PAD.top); ctx.lineTo(xOpt, PAD.top + plotH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#f59e0b'; ctx.font = '11px -apple-system,sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('37%', xOpt, PAD.top - 6);

  // Theoretical curve
  const theory = buildTheoreticalCurve(n);
  ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2.5; ctx.setLineDash([]);
  ctx.beginPath();
  theory.forEach(({ pct: p, prob }, i) => {
    const x = toX(p), y = toY(prob);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Monte Carlo
  if (monteResults) {
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    monteResults.forEach(({ pct: p, prob }, i) => {
      const x = toX(p), y = toY(prob);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    monteResults.forEach(({ pct: p, prob }) => {
      ctx.beginPath(); ctx.arc(toX(p), toY(prob), 3, 0, Math.PI * 2);
      ctx.fillStyle = '#16a34a'; ctx.fill();
    });
  }

  // Cursor line
  const xCur = toX(pct);
  ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xCur, PAD.top); ctx.lineTo(xCur, PAD.top + plotH); ctx.stroke();
  ctx.setLineDash([]);

  // Stat cards
  const r = Math.max(1, Math.round((pct / 100) * n));
  const p = theoreticalP(r, n);
  yourProb.textContent = (p * 100).toFixed(1) + '%';
  yourSub.textContent  = `look at ${r} of ${n}, then leap`;
}

// ── P(x) mini chart ───────────────────────────────────────────────────────────

function renderPx() {
  const { w, h } = setupCanvas(canvasPx);
  const pad = PAD_SM;
  const { plotW, plotH } = plotDims(w, h, pad);

  ctxPx.clearRect(0, 0, w, h);

  const toX = x  => pad.left + x * plotW;
  const toY = y  => pad.top  + plotH - (y / 0.4) * plotH;

  // Grid
  ctxPx.strokeStyle = '#e5e5e5'; ctxPx.lineWidth = 1; ctxPx.setLineDash([]);
  [0, 0.1, 0.2, 0.3, 0.4].forEach(v => {
    const y = toY(v);
    ctxPx.beginPath(); ctxPx.moveTo(pad.left, y); ctxPx.lineTo(pad.left + plotW, y); ctxPx.stroke();
    ctxPx.fillStyle = '#bbb'; ctxPx.font = '10px -apple-system,sans-serif';
    ctxPx.textAlign = 'right'; ctxPx.fillText(v.toFixed(1), pad.left - 5, y + 3);
  });
  [0, 0.25, 0.5, 0.75, 1].forEach(v => {
    const x = toX(v);
    ctxPx.beginPath(); ctxPx.moveTo(x, pad.top); ctxPx.lineTo(x, pad.top + plotH); ctxPx.stroke();
    ctxPx.fillStyle = '#bbb'; ctxPx.textAlign = 'center';
    ctxPx.fillText(v.toFixed(2), x, pad.top + plotH + 14);
  });

  // Axes
  ctxPx.strokeStyle = '#ccc'; ctxPx.lineWidth = 1;
  ctxPx.beginPath();
  ctxPx.moveTo(pad.left, pad.top); ctxPx.lineTo(pad.left, pad.top + plotH);
  ctxPx.lineTo(pad.left + plotW, pad.top + plotH); ctxPx.stroke();

  // 1/e marker
  const xe = toX(1 / Math.E);
  ctxPx.strokeStyle = '#f59e0b'; ctxPx.lineWidth = 1; ctxPx.setLineDash([3, 3]);
  ctxPx.beginPath(); ctxPx.moveTo(xe, pad.top); ctxPx.lineTo(xe, pad.top + plotH); ctxPx.stroke();
  ctxPx.setLineDash([]);
  ctxPx.fillStyle = '#f59e0b'; ctxPx.font = '10px -apple-system,sans-serif';
  ctxPx.textAlign = 'center'; ctxPx.fillText('1/e', xe, pad.top - 5);

  // P(x) curve
  ctxPx.strokeStyle = '#2563eb'; ctxPx.lineWidth = 2; ctxPx.setLineDash([]);
  ctxPx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const x = 0.001 + (i / 200) * 0.999;
    const y = Px(x);
    const cx = toX(x), cy = toY(y);
    i === 0 ? ctxPx.moveTo(cx, cy) : ctxPx.lineTo(cx, cy);
  }
  ctxPx.stroke();

  // Peak dot
  ctxPx.beginPath(); ctxPx.arc(toX(1/Math.E), toY(1/Math.E), 4, 0, Math.PI*2);
  ctxPx.fillStyle = '#2563eb'; ctxPx.fill();
}

// ── dP/dx mini chart ──────────────────────────────────────────────────────────

function renderDpx() {
  const { w, h } = setupCanvas(canvasDpx);
  const pad = PAD_SM;
  const { plotW, plotH } = plotDims(w, h, pad);

  ctxDpx.clearRect(0, 0, w, h);

  const yMin = -3, yMax = 3;
  const toX = x => pad.left + x * plotW;
  const toY = y => pad.top  + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  // Grid
  ctxDpx.strokeStyle = '#e5e5e5'; ctxDpx.lineWidth = 1; ctxDpx.setLineDash([]);
  [-2, -1, 0, 1, 2].forEach(v => {
    const y = toY(v);
    ctxDpx.beginPath(); ctxDpx.moveTo(pad.left, y); ctxDpx.lineTo(pad.left + plotW, y); ctxDpx.stroke();
    ctxDpx.fillStyle = v === 0 ? '#999' : '#bbb';
    ctxDpx.font = '10px -apple-system,sans-serif';
    ctxDpx.textAlign = 'right'; ctxDpx.fillText(v, pad.left - 5, y + 3);
  });
  [0, 0.25, 0.5, 0.75, 1].forEach(v => {
    const x = toX(v);
    ctxDpx.beginPath(); ctxDpx.moveTo(x, pad.top); ctxDpx.lineTo(x, pad.top + plotH); ctxDpx.stroke();
    ctxDpx.fillStyle = '#bbb'; ctxDpx.textAlign = 'center';
    ctxDpx.fillText(v.toFixed(2), x, pad.top + plotH + 14);
  });

  // Zero line
  ctxDpx.strokeStyle = '#ccc'; ctxDpx.lineWidth = 1;
  ctxDpx.beginPath(); ctxDpx.moveTo(pad.left, toY(0)); ctxDpx.lineTo(pad.left + plotW, toY(0)); ctxDpx.stroke();

  // Axes
  ctxDpx.strokeStyle = '#ccc'; ctxDpx.lineWidth = 1;
  ctxDpx.beginPath();
  ctxDpx.moveTo(pad.left, pad.top); ctxDpx.lineTo(pad.left, pad.top + plotH);
  ctxDpx.lineTo(pad.left + plotW, pad.top + plotH); ctxDpx.stroke();

  // 1/e marker
  const xe = toX(1 / Math.E);
  ctxDpx.strokeStyle = '#f59e0b'; ctxDpx.lineWidth = 1; ctxDpx.setLineDash([3, 3]);
  ctxDpx.beginPath(); ctxDpx.moveTo(xe, pad.top); ctxDpx.lineTo(xe, pad.top + plotH); ctxDpx.stroke();
  ctxDpx.setLineDash([]);
  ctxDpx.fillStyle = '#f59e0b'; ctxDpx.font = '10px -apple-system,sans-serif';
  ctxDpx.textAlign = 'center'; ctxDpx.fillText('1/e', xe, pad.top - 5);

  // dP/dx curve
  ctxDpx.strokeStyle = '#7c3aed'; ctxDpx.lineWidth = 2; ctxDpx.setLineDash([]);
  ctxDpx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const x = 0.001 + (i / 200) * 0.999;
    const dy = dPx(x);
    const cx = toX(x), cy = toY(Math.max(yMin, Math.min(yMax, dy)));
    i === 0 ? ctxDpx.moveTo(cx, cy) : ctxDpx.lineTo(cx, cy);
  }
  ctxDpx.stroke();

  // Zero crossing dot at x=1/e, y=0
  ctxDpx.beginPath(); ctxDpx.arc(toX(1/Math.E), toY(0), 4, 0, Math.PI*2);
  ctxDpx.fillStyle = '#7c3aed'; ctxDpx.fill();

  // Label zero crossing
  ctxDpx.fillStyle = '#7c3aed'; ctxDpx.font = '10px -apple-system,sans-serif';
  ctxDpx.textAlign = 'left';
  ctxDpx.fillText('dP/dx = 0', toX(1/Math.E) + 6, toY(0) - 6);
}

// ── Event listeners ───────────────────────────────────────────────────────────

sliderN.addEventListener('input', () => {
  valN.textContent = sliderN.value;
  monteResults = null;
  monteProb.textContent = '--';
  monteSub.textContent  = 'click Run Monte Carlo';
  renderMain();
});

sliderR.addEventListener('input', () => {
  valR.textContent = sliderR.value;
  renderMain();
});

sliderSims.addEventListener('input', () => {
  valSims.textContent = sliderSims.value;
});

btnRun.addEventListener('click', () => {
  const n    = parseInt(sliderN.value);
  const sims = parseInt(sliderSims.value);
  const pct  = parseInt(sliderR.value);
  const r    = Math.max(1, Math.round((pct / 100) * n));

  btnRun.textContent = 'Running...';
  btnRun.classList.add('running');
  btnRun.disabled = true;

  setTimeout(() => {
    monteResults = buildMonteCarloCurve(n, sims);

    const closest = monteResults.reduce((best, pt) =>
      Math.abs(pt.pct - pct) < Math.abs(best.pct - pct) ? pt : best
    );
    monteProb.textContent = (closest.prob * 100).toFixed(1) + '%';
    monteSub.textContent  = `${sims} trials, r=${r}`;

    btnRun.textContent = 'Run Monte Carlo';
    btnRun.classList.remove('running');
    btnRun.disabled = false;
    renderMain();
  }, 16);
});

window.addEventListener('resize', () => {
  renderMain();
  renderPx();
  renderDpx();
});

// ── Init ──────────────────────────────────────────────────────────────────────

renderMain();
renderPx();
renderDpx();
