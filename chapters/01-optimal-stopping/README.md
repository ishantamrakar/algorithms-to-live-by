**Live demo:** https://ishantamrakar.github.io/algorithms-to-live-by/chapters/01-optimal-stopping/

---

# Chapter 1: Optimal Stopping

The problem: options arrive one at a time, you can't revisit past ones, and you must decide on the spot. How do you know when to stop looking and commit?

The answer, under those conditions, is the **37% rule** (also called the secretary problem solution): spend the first 37% of candidates just observing, establish the best you saw as your benchmark, then hire the next person who beats it. This maximizes your probability of landing the best candidate at ~37%.

## Demo: The Secretary Problem

You interview a sequence of candidates (5-30, your choice). Each has a numerical interview score. You decide to **Pass** or **Hire** for each one in real time.

- The first 37% are your look phase. The game shows which phase you're in.
- After the look phase, you can hire anyone who beats your look-phase best.
- If you reach the last candidate without hiring, you're forced to take them.

At the end, you see whether you got the best candidate, what rank you actually hired, and how the 37% strategy would have played out on the same sequence.

## Simulator

Monte Carlo slider panel. Adjust N (pool size) and run thousands of trials to see:
- How often the 37% strategy finds the best candidate
- What the success rate curve looks like across different look-phase thresholds (0% to 100%)
- The theoretical 1/e ≈ 36.8% peak marked on the curve

## The Math

Derivation of the 37% threshold from first principles using KaTeX. Covers the probability of success as a function of the look-phase cutoff r/N, the limit as N → ∞, and why 1/e falls out naturally.
