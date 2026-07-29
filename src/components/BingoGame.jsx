import { useState, useEffect, useMemo } from 'react';
import { CATEGORIES } from '../data';
import { loadOrCreateBoard, saveBoard, detectCompleteLines } from '../bingoBoard';
import EmptyState from './ui/EmptyState';

function findMilestone(dreams, dreamId, msId) {
  const dream = dreams.find((d) => d.id === dreamId);
  if (!dream) return null;
  const milestone = dream.milestones.find((m) => m.id === msId);
  if (!milestone) return null;
  return { dream, milestone };
}

export default function BingoGame({ dreams, toggleMilestone }) {
  const [board, setBoard] = useState(null);
  const [celebrating, setCelebrating] = useState(null);

  const totalMilestones = useMemo(() => dreams.reduce((a, d) => a + d.milestones.length, 0), [dreams]);

  // Build/load the board once on mount — regeneration afterward is an
  // explicit user action ("New board"), not automatic on every render.
  useEffect(() => {
    setBoard(loadOrCreateBoard(dreams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const size = board ? board.size : 0;
  const cells = board ? board.cells : [];
  const doneFlags = cells.map((c) => {
    const found = findMilestone(dreams, c.dreamId, c.msId);
    return found ? found.milestone.done : false;
  });
  const completeLines = board ? detectCompleteLines(doneFlags, size) : [];
  const isBlackout = board ? doneFlags.length > 0 && doneFlags.every(Boolean) : false;

  // Fire a one-time celebration when a *new* line completes (not on every
  // re-render or page reload) — every hook is declared unconditionally
  // above any early return, per the Rules of Hooks.
  useEffect(() => {
    if (!board) return;
    const newlyCompleted = completeLines.filter((l) => !board.celebratedLines.includes(l));
    if (newlyCompleted.length > 0) {
      const updated = { ...board, celebratedLines: [...board.celebratedLines, ...newlyCompleted] };
      saveBoard(updated);
      setBoard(updated);
      setCelebrating(isBlackout ? '🎉 BLACKOUT! Every milestone on the board is done!' : '🎉 BINGO! You completed a line!');
      setTimeout(() => setCelebrating(null), 4000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completeLines.join(','), board && board.createdAt]);

  const newBoard = () => {
    const fresh = loadOrCreateBoard(dreams, true);
    setBoard(fresh);
    setCelebrating(null);
  };

  if (!board) {
    return (
      <>
        <div style={{ marginBottom: 20 }}>
          <div className="page-title">🎯 Dream Bingo</div>
          <div className="page-subtitle">Turn your real milestones into a board — complete a row, column, or diagonal to win</div>
        </div>
        <EmptyState
          emoji="🎲"
          title="Not enough milestones yet"
          subtitle={`You need at least 9 milestones across your dreams to fill a board (you have ${totalMilestones}). Add a dream or a few milestones and come back.`}
        />
      </>
    );
  }

  const cellInLine = (idx) => {
    const r = Math.floor(idx / size), c = idx % size;
    return completeLines.some((line) =>
      (line === `row${r}`) || (line === `col${c}`) || (line === 'diag0' && r === c) || (line === 'diag1' && r === size - 1 - c)
    );
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="page-title">🎯 Dream Bingo</div>
          <div className="page-subtitle">Tap a tile to mark that milestone done. Real progress, real board.</div>
        </div>
        <div onClick={newBoard} className="btn-ghost">🔄 New board</div>
      </div>

      {celebrating && <div className="bingo-celebrate">{celebrating}</div>}

      <div className="bingo-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {cells.map((c, i) => {
          const found = findMilestone(dreams, c.dreamId, c.msId);
          if (!found) return <div key={i} className="bingo-cell bingo-cell-missing">—</div>;
          const { dream, milestone } = found;
          const info = CATEGORIES[dream.category] || CATEGORIES.default;
          const inLine = cellInLine(i);
          return (
            <div
              key={c.dreamId + c.msId}
              onClick={() => toggleMilestone(c.dreamId, c.msId)}
              className="bingo-cell"
              style={{
                background: milestone.done ? 'rgba(34,197,94,.15)' : '#1b1430',
                borderColor: inLine ? '#ffb703' : milestone.done ? '#22c55e' : '#33254a',
                boxShadow: inLine ? '0 0 0 2px #ffb703 inset' : 'none',
              }}
              title={dream.title}
            >
              <div style={{ fontSize: '.9rem' }}>{milestone.done ? '✅' : info.emoji}</div>
              <div className="bingo-cell-text">{milestone.text}</div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: '.72rem', color: '#a99bc2', marginTop: 16, lineHeight: 1.6 }}>
        {completeLines.length > 0 && !isBlackout && `${completeLines.length} line${completeLines.length === 1 ? '' : 's'} complete. `}
        {isBlackout ? 'Full blackout — every tile done! Start a new board to keep playing.' : 'Complete a full row, column, or diagonal to win a line.'}
      </div>
    </>
  );
}
