// ── State ─────────────────────────────────────────────────────────────────────

const state = {
  n: 20,
  candidates: [],   // array of scores (shuffled)
  current: 0,
  bestSeen: -Infinity,
  chosen: null,
  roundResults: [], // { rank, n } per round
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function lookCount(n) {
  return Math.max(1, Math.round(n / Math.E));
}

// Generate n distinct integer scores in 1–99, shuffled
function generateCandidates(n) {
  const scores = new Set();
  while (scores.size < n) scores.add(Math.floor(Math.random() * 99) + 1);
  const arr = [...scores];
  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// What would the 37% rule pick on this sequence?
function optimalPick(candidates) {
  const n = candidates.length;
  const r = lookCount(n);
  const bestInLook = Math.max(...candidates.slice(0, r));
  for (let i = r; i < n; i++) {
    if (candidates[i] > bestInLook) return candidates[i];
  }
  return candidates[n - 1]; // fallback
}

// Rank of a score in the candidates array (1 = best)
function rankOf(score, candidates) {
  const sorted = [...candidates].sort((a, b) => b - a);
  return sorted.indexOf(score) + 1;
}

// ── DOM refs ──────────────────────────────────────────────────────────────────

const screenSetup  = document.getElementById('screen-setup');
const screenGame   = document.getElementById('screen-game');
const screenResult = document.getElementById('screen-result');

const setupN      = document.getElementById('setup-n');
const setupNVal   = document.getElementById('setup-n-val');
const setupLook   = document.getElementById('setup-look');
const btnStart    = document.getElementById('btn-start');

const progressBar       = document.getElementById('progress-bar');
const progressThreshold = document.getElementById('progress-threshold');
const progressLabel     = document.getElementById('progress-label');
const progTotal         = document.getElementById('prog-total');
const phaseLabel        = document.getElementById('phase-label');

const candidateNum     = document.getElementById('candidate-num');
const candidateScore   = document.getElementById('candidate-score');
const candidateBar     = document.getElementById('candidate-bar');
const candidateContext = document.getElementById('candidate-context');
const bestSeenVal      = document.getElementById('best-seen-val');

const btnPass = document.getElementById('btn-pass');
const btnHire = document.getElementById('btn-hire');

const resultRank    = document.getElementById('result-rank');
const resultRankSub = document.getElementById('result-rank-sub');
const resultVerdict = document.getElementById('result-verdict');
const resYourScore  = document.getElementById('res-your-score');
const resBestScore  = document.getElementById('res-best-score');
const resOptScore   = document.getElementById('res-opt-score');
const resultTimeline = document.getElementById('result-timeline');
const scoreVal      = document.getElementById('score-val');
const scoreSub      = document.getElementById('score-sub');
const btnReplay     = document.getElementById('btn-replay');
const btnChange     = document.getElementById('btn-change');

// ── Setup ─────────────────────────────────────────────────────────────────────

setupN.addEventListener('input', () => {
  const n = parseInt(setupN.value);
  setupNVal.textContent  = n;
  setupLook.textContent  = lookCount(n);
});

btnStart.addEventListener('click', startGame);

// ── Game ──────────────────────────────────────────────────────────────────────

function startGame() {
  state.n          = parseInt(setupN.value);
  state.candidates = generateCandidates(state.n);
  state.current    = 0;
  state.bestSeen   = -Infinity;
  state.chosen     = null;

  progTotal.textContent = state.n;
  progressThreshold.style.left = ((1 / Math.E) * 100) + '%';

  hide(screenSetup);
  hide(screenResult);
  show(screenGame);

  renderCandidate();
}

function renderCandidate() {
  const i     = state.current;
  const n     = state.n;
  const score = state.candidates[i];
  const r     = lookCount(n);
  const inLook = i < r;
  const isLast = i === n - 1;

  // Progress
  progressBar.style.width = ((i / n) * 100) + '%';
  progressBar.style.background = inLook ? '#2563eb' : '#16a34a';
  progressLabel.innerHTML = `Candidate <strong>${i + 1}</strong> of <strong>${n}</strong>`;

  if (isLast) {
    phaseLabel.textContent = 'Last candidate';
    phaseLabel.className   = 'phase-last';
  } else if (inLook) {
    phaseLabel.textContent = 'Look phase — observe, do not hire';
    phaseLabel.className   = 'phase-look';
  } else {
    phaseLabel.textContent = 'Leap phase — hire if they beat your benchmark';
    phaseLabel.className   = 'phase-leap';
  }

  // Card
  candidateNum.textContent   = `Candidate #${i + 1}`;
  candidateScore.textContent = score;
  candidateBar.style.width   = score + '%';

  // Context message
  if (i === 0) {
    candidateContext.textContent = 'No benchmark yet.';
  } else if (inLook) {
    const better = score > state.bestSeen;
    candidateContext.textContent = better
      ? `Look phase best so far.`
      : `Look phase — best seen is ${state.bestSeen}.`;
  } else {
    const beats = score > state.bestSeen;
    candidateContext.textContent = beats
      ? `Beats benchmark (${state.bestSeen}).`
      : `Below benchmark (${state.bestSeen}).`;
  }

  // Best seen
  bestSeenVal.textContent = state.bestSeen === -Infinity ? '—' : state.bestSeen;

  // Disable pass on last candidate
  btnPass.disabled = isLast;
}

btnPass.addEventListener('click', () => {
  const score = state.candidates[state.current];
  if (score > state.bestSeen) state.bestSeen = score;
  state.current++;
  if (state.current >= state.n) {
    // Passed everyone — forced to take last
    finish(state.candidates[state.n - 1]);
  } else {
    renderCandidate();
  }
});

btnHire.addEventListener('click', () => {
  finish(state.candidates[state.current]);
});

// ── Result ────────────────────────────────────────────────────────────────────

function finish(score) {
  state.chosen = score;
  const candidates = state.candidates;
  const n          = state.n;
  const best       = Math.max(...candidates);
  const opt        = optimalPick(candidates);
  const rank       = rankOf(score, candidates);

  // Record round
  state.roundResults.push({ rank, n });

  // Rank display
  resultRank.textContent    = `#${rank}`;
  resultRankSub.textContent = `out of ${n}`;

  const rankClass = rank === 1                      ? 'rank-great'
    : rank <= Math.max(1, Math.ceil(n * 0.1))       ? 'rank-great'
    : rank <= Math.max(2, Math.ceil(n * 0.25))      ? 'rank-good'
    : rank <= Math.max(3, Math.ceil(n * 0.5))       ? 'rank-okay'
    : 'rank-poor';
  resultRank.className = 'result-rank ' + rankClass;

  const verdicts = {
    'rank-great': rank === 1 ? `The best candidate. The rule paid off.` : `Near the top. Good enough in practice.`,
    'rank-good':  `Top quartile. Not optimal, but not bad.`,
    'rank-okay':  `Middle of the pool. Better candidates passed through.`,
    'rank-poor':  `Bottom half. The look phase benchmark wasn't enough here.`,
  };
  resultVerdict.textContent = verdicts[rankClass];

  resYourScore.textContent = score;
  resBestScore.textContent = best;
  resOptScore.textContent  = opt + (opt === best ? ' ✓' : ` (rank #${rankOf(opt, candidates)})`);

  // Timeline
  renderTimeline(candidates, score, best, opt);

  // Session stats
  const rounds  = state.roundResults.length;
  const bestHit = state.roundResults.filter(r => r.rank === 1).length;
  const top25   = state.roundResults.filter(r => r.rank <= Math.ceil(r.n * 0.25)).length;
  scoreVal.textContent = rounds === 1
    ? `Rank #${rank} of ${n}`
    : `${bestHit} / ${rounds} best`;
  scoreSub.textContent = rounds > 1
    ? `top 25% in ${top25} of ${rounds} rounds — rule hits ~37% over many trials`
    : `run more rounds to see the hit rate settle`;

  hide(screenGame);
  show(screenResult);
}

function renderTimeline(candidates, chosen, best, opt) {
  resultTimeline.innerHTML = '';
  const n      = candidates.length;
  const sorted = [...candidates].sort((a, b) => b - a);

  candidates.forEach((score, idx) => {
    const rank = sorted.indexOf(score) + 1;
    const pct  = (n - rank) / (n - 1); // 0=worst, 1=best

    const div = document.createElement('div');
    div.className = 'tl-apt';

    const isChosen = score === chosen;
    const isBest   = score === best;
    const isOpt    = score === opt && opt !== chosen;

    if (isChosen && isBest) {
      div.style.background = '#16a34a';
      div.style.color      = '#fff';
      div.style.border     = '2px solid #16a34a';
    } else if (isChosen) {
      div.style.background = '#111';
      div.style.color      = '#fff';
      div.style.border     = '2px solid #111';
    } else if (isBest) {
      div.style.background = '#f0fdf4';
      div.style.color      = '#111';
      div.style.border     = '2px solid #16a34a';
    } else if (isOpt) {
      div.style.background = '#fffbeb';
      div.style.color      = '#111';
      div.style.border     = '2px solid #f59e0b';
    } else {
      div.style.background = '#f5f5f5';
      div.style.color      = '#999';
      div.style.border     = '2px solid transparent';
    }

    div.textContent = score;

    // Tooltip
    const tip = document.createElement('div');
    tip.className = 'tl-tooltip';
    let label = `#${idx + 1} shown, score ${score}`;
    if (score === chosen) label += ' — your hire';
    if (score === best)   label += ' — best candidate';
    if (score === opt && opt !== chosen) label += ' — 37% pick';
    tip.textContent = label;
    div.appendChild(tip);

    resultTimeline.appendChild(div);
  });
}

// ── Replay ────────────────────────────────────────────────────────────────────

btnReplay.addEventListener('click', startGame);
btnChange.addEventListener('click', () => { hide(screenResult); show(screenSetup); });
