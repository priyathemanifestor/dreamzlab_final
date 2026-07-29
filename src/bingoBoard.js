// Dream Bingo — turns your real milestones into a bingo board. The board
// itself is just a fixed arrangement of references to real milestones
// (dreamId + milestone id); "done" state always comes live from your
// actual dream data, never duplicated or faked here.

import { loadJSON, saveJSON } from './storage';

const BOARD_KEY = 'dreamzlab_v1_bingo_board';

export function pickBoardSize(milestoneCount) {
  if (milestoneCount >= 25) return 5;
  if (milestoneCount >= 16) return 4;
  if (milestoneCount >= 9) return 3;
  return null; // not enough milestones yet for even a 3x3 board
}

function allMilestoneRefs(dreams) {
  const refs = [];
  dreams.forEach((d) => {
    d.milestones.forEach((m) => refs.push({ dreamId: d.id, msId: m.id }));
  });
  return refs;
}

// Simple deterministic shuffle (mulberry32) seeded from a string, so the
// same board doesn't reshuffle itself on every render, but still looks
// mixed rather than "first N milestones in creation order."
function seededShuffle(arr, seedStr) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildFreshBoard(dreams) {
  const refs = allMilestoneRefs(dreams);
  const size = pickBoardSize(refs.length);
  if (!size) return null;
  const seed = refs.map((r) => r.msId).join(',').slice(0, 200) + Date.now();
  const shuffled = seededShuffle(refs, seed).slice(0, size * size);
  return { size, cells: shuffled, celebratedLines: [], createdAt: new Date().toISOString() };
}

// Loads the persisted board if it's still valid (enough of its milestones
// still exist), otherwise builds and persists a fresh one.
export function loadOrCreateBoard(dreams, forceFresh) {
  const allIds = new Set();
  dreams.forEach((d) => d.milestones.forEach((m) => allIds.add(d.id + '::' + m.id)));

  if (!forceFresh) {
    const stored = loadJSON(BOARD_KEY, null);
    if (stored && stored.size && Array.isArray(stored.cells)) {
      const stillValid = stored.cells.filter((c) => allIds.has(c.dreamId + '::' + c.msId));
      if (stillValid.length === stored.cells.length) return stored; // fully intact
    }
  }

  const fresh = buildFreshBoard(dreams);
  if (fresh) saveJSON(BOARD_KEY, fresh);
  else saveJSON(BOARD_KEY, null);
  return fresh;
}

export function saveBoard(board) {
  saveJSON(BOARD_KEY, board);
}

// Given a flat array of booleans (in row-major order) and the grid size,
// returns the set of currently-complete line keys, e.g. 'row0', 'col2', 'diag0'.
export function detectCompleteLines(doneFlags, size) {
  const lines = [];
  for (let r = 0; r < size; r++) {
    let complete = true;
    for (let c = 0; c < size; c++) if (!doneFlags[r * size + c]) { complete = false; break; }
    if (complete) lines.push(`row${r}`);
  }
  for (let c = 0; c < size; c++) {
    let complete = true;
    for (let r = 0; r < size; r++) if (!doneFlags[r * size + c]) { complete = false; break; }
    if (complete) lines.push(`col${c}`);
  }
  let d0 = true, d1 = true;
  for (let i = 0; i < size; i++) {
    if (!doneFlags[i * size + i]) d0 = false;
    if (!doneFlags[i * size + (size - 1 - i)]) d1 = false;
  }
  if (d0) lines.push('diag0');
  if (d1) lines.push('diag1');
  return lines;
}
