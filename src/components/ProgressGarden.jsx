import { CATEGORIES } from '../data';

// Growth stages, purely additive — never shrinks, never "wilts" from
// inactivity. Thresholds are total completed milestones across all dreams.
const STAGES = [
  { min: 0, name: 'Empty bed' },
  { min: 1, name: 'Seed planted' },
  { min: 3, name: 'Sprouting' },
  { min: 7, name: 'Budding' },
  { min: 15, name: 'In bloom' },
  { min: 30, name: 'Flowering tree' },
  { min: 50, name: 'Full garden' },
];

function getStageIndex(completed) {
  let idx = 0;
  for (let i = 0; i < STAGES.length; i++) if (completed >= STAGES[i].min) idx = i;
  return idx;
}

// Ground-level plant for the central growth stage, sized/detailed by stage.
function CentralPlant({ stage }) {
  const stemHeight = [0, 20, 38, 55, 70, 85, 95][stage] || 0;
  const stemY = 220;
  if (stage === 0) {
    return <ellipse cx="200" cy="222" rx="18" ry="5" fill="#3d2a1a" />;
  }
  return (
    <g>
      {/* stem */}
      {stemHeight > 0 && (
        <path d={`M200,${stemY} Q ${195},${stemY - stemHeight / 2} 200,${stemY - stemHeight}`} stroke="#22c55e" strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
      {/* leaves, appear from stage 2 */}
      {stage >= 2 && <ellipse cx="188" cy={stemY - stemHeight * 0.4} rx="10" ry="5" fill="#22c55e" transform={`rotate(-25 188 ${stemY - stemHeight * 0.4})`} />}
      {stage >= 2 && <ellipse cx="212" cy={stemY - stemHeight * 0.6} rx="10" ry="5" fill="#22c55e" transform={`rotate(25 212 ${stemY - stemHeight * 0.6})`} />}
      {/* bud/flower, appears from stage 3 */}
      {stage >= 3 && stage < 5 && (
        <g transform={`translate(200 ${stemY - stemHeight})`}>
          <circle r="10" fill="#ec4899" />
          <circle r="4" fill="#ffb703" />
        </g>
      )}
      {/* full bloom + petals, stage 4+ */}
      {stage >= 4 && (
        <g transform={`translate(200 ${stemY - stemHeight})`}>
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <ellipse key={deg} rx="9" ry="14" fill="#ec4899" transform={`rotate(${deg}) translate(0 -12)`} opacity="0.92" />
          ))}
          <circle r="7" fill="#ffb703" />
        </g>
      )}
      {/* tree canopy, stage 5+ */}
      {stage >= 5 && (
        <g>
          <circle cx="200" cy={stemY - stemHeight - 8} r="26" fill="#8b5cf6" opacity="0.85" />
          <circle cx="178" cy={stemY - stemHeight + 4} r="18" fill="#a855f7" opacity="0.85" />
          <circle cx="222" cy={stemY - stemHeight + 4} r="18" fill="#a855f7" opacity="0.85" />
        </g>
      )}
    </g>
  );
}

function CategoryFlower({ x, info, index }) {
  return (
    <g transform={`translate(${x} 222)`}>
      <path d="M0,0 Q -2,-14 0,-24" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="0" cy="-26" r="7" fill={info.color} opacity="0.9" />
      <text x="0" y="-23" fontSize="8" textAnchor="middle">{info.emoji}</text>
    </g>
  );
}

export default function ProgressGarden({ dreams }) {
  const completedByCategory = {};
  let totalCompleted = 0;
  dreams.forEach((d) => {
    d.milestones.forEach((m) => {
      if (m.done) {
        totalCompleted++;
        completedByCategory[d.category] = (completedByCategory[d.category] || 0) + 1;
      }
    });
  });
  const activeCategories = Object.keys(completedByCategory);

  const stageIdx = getStageIndex(totalCompleted);
  const stage = STAGES[stageIdx];
  const nextStage = STAGES[stageIdx + 1];
  const toNext = nextStage ? nextStage.min - totalCompleted : 0;

  // Spread category flowers evenly along the ground, avoiding the center plant.
  const flowerPositions = activeCategories.map((cat, i) => {
    const n = activeCategories.length;
    const spread = 140;
    const start = 200 - spread / 2;
    const gap = n > 1 ? spread / (n - 1) : 0;
    const x = n === 1 ? 130 : start + i * gap;
    return { cat, x: x < 175 || x > 225 ? x : (x < 200 ? 165 : 235) }; // nudge away from the center plant
  });

  return (
    <div className="garden-card">
      <svg viewBox="0 0 400 260" className="garden-svg">
        <defs>
          <linearGradient id="gardenSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#241a3d" />
            <stop offset="100%" stopColor="#1b1430" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="400" height="260" fill="url(#gardenSky)" rx="18" />
        <circle cx="340" cy="40" r="22" fill="#ffb703" opacity="0.18" />
        <circle cx="340" cy="40" r="12" fill="#ffb703" opacity="0.35" />
        <rect x="0" y="220" width="400" height="40" fill="#2a1f42" rx="0" />

        {flowerPositions.map(({ cat, x }, i) => (
          <CategoryFlower key={cat} x={x} info={CATEGORIES[cat] || CATEGORIES.default} index={i} />
        ))}
        <CentralPlant stage={stageIdx} />
      </svg>

      <div style={{ padding: '14px 18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: '.95rem', fontWeight: 700 }}>🌿 {stage.name}</div>
          <div style={{ fontSize: '.72rem', color: '#a99bc2' }}>{totalCompleted} milestone{totalCompleted === 1 ? '' : 's'} bloomed</div>
        </div>
        <div style={{ fontSize: '.75rem', color: '#a99bc2', marginTop: 4 }}>
          {nextStage
            ? `${toNext} more milestone${toNext === 1 ? '' : 's'} until "${nextStage.name}"`
            : 'Your garden is in full bloom — it only grows from here.'}
        </div>
      </div>
    </div>
  );
}
