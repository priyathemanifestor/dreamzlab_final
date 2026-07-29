import { CATEGORIES, QUOTES, AFFIRMATIONS, dayOfYear, toDateStr } from '../data';
import StatCard from './ui/StatCard';
import ProgressBar from './ui/ProgressBar';
import SectionLabel from './ui/SectionLabel';
import EmptyState from './ui/EmptyState';
import ProgressGarden from './ProgressGarden';

function enrich(d, getProgressFn) {
  const info = CATEGORIES[d.category] || CATEGORIES.default;
  const pct = getProgressFn(d);
  const msDone = d.milestones.filter((m) => m.done).length;
  return {
    ...d, img: info.img, emoji: info.emoji, color: info.color, pct, msDone, msTotal: d.milestones.length,
    shortDesc: d.description.length > 110 ? d.description.slice(0, 110) + '…' : d.description,
    dateStr: d.createdAt.slice(0, 10),
  };
}

export default function Home({ dreams, totalMs, doneMs, overallPct, openShareModal, toggleMilestone }) {
  const dayIdx = dayOfYear();
  const [qText, qAuthor] = QUOTES[dayIdx % QUOTES.length];
  const affirmation = AFFIRMATIONS[dayIdx % AFFIRMATIONS.length];
  const hasDreams = dreams.length > 0;
  const today = toDateStr(new Date());

  const getProgress = (d) => (d.milestones.length ? Math.round(d.milestones.filter((m) => m.done).length / d.milestones.length * 100) : 0);

  const dueItems = [];
  dreams.forEach((d) => {
    d.milestones.forEach((m) => {
      if (!m.done && m.dueDate && m.dueDate <= today) {
        dueItems.push({ dream: d, milestone: m, overdue: m.dueDate < today });
      }
    });
  });
  dueItems.sort((a, b) => a.milestone.dueDate.localeCompare(b.milestone.dueDate));

  const statCards = [
    { value: String(dreams.length), label: 'Dreams', barGrad: 'linear-gradient(90deg,#8b5cf6,#ec4899)' },
    { value: String(totalMs), label: 'Milestones', barGrad: 'linear-gradient(90deg,#14b8a6,#3b82f6)' },
    { value: String(doneMs), label: 'Completed', barGrad: 'linear-gradient(90deg,#22c55e,#14b8a6)' },
    { value: overallPct + '%', label: 'Progress', barGrad: 'linear-gradient(90deg,#ffb703,#f97316)' },
  ];

  const recentDreams = [...dreams].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3).map((d) => enrich(d, getProgress));

  return (
    <>
      <div data-hero className="hero">
        <div className="hero-glow" />
        <div className="eyebrow" style={{ position: 'relative' }}>✨ Your Dream Journal</div>
        <div data-hero-title className="hero-title">Make Your Dreams<br />Your Reality</div>
        <div className="hero-desc">Set intentions. Build milestones. Get daily motivation. Every big dream starts with one small step taken today.</div>
        <div onClick={openShareModal} className="hero-share-btn">📢 Share Your Dreamz</div>
      </div>

      <ProgressGarden dreams={dreams} />

      <div className="affirmation-card">
        <div className="eyebrow" style={{ marginBottom: 8 }}>✨ Your daily affirmation</div>
        <div style={{ fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.65 }}>{affirmation}</div>
      </div>

      {dueItems.length > 0 && (
        <>
          <SectionLabel style={{ marginTop: 28 }}>📅 DUE TODAY{dueItems.some((i) => i.overdue) ? ' & OVERDUE' : ''}</SectionLabel>
          <div className="due-today-card">
            {dueItems.map(({ dream, milestone, overdue }) => (
              <div key={milestone.id} onClick={() => toggleMilestone(dream.id, milestone.id)} className="due-today-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1rem' }}>⭕</span>
                  <div>
                    <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{milestone.text}</div>
                    <div style={{ fontSize: '.7rem', color: '#a99bc2', marginTop: 2 }}>{dream.title}</div>
                  </div>
                </div>
                <span style={{ fontSize: '.68rem', fontWeight: 700, color: overdue ? '#ef4444' : '#ffb703', whiteSpace: 'nowrap' }}>
                  {overdue ? '⚠️ Overdue' : 'Due today'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionLabel>YOUR JOURNEY AT A GLANCE</SectionLabel>
      <div data-grid-stats className="grid-stats">
        {statCards.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {hasDreams && (
        <>
          <SectionLabel style={{ marginTop: 28 }}>RECENT DREAMS</SectionLabel>
          <div data-grid-recent className="grid-recent">
            {recentDreams.map((d) => (
              <div key={d.id} className="dream-card">
                <img src={d.img} alt="" className="dream-card-img" onError={(e) => { e.target.style.display = 'none'; }} />
                <div style={{ padding: '18px 20px' }}>
                  <span className="dream-tag" style={{ borderColor: d.color, color: d.color }}>{d.emoji} {d.category}</span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{d.title}</div>
                  <div style={{ fontSize: '.78rem', color: '#a99bc2', lineHeight: 1.5, marginBottom: 12 }}>{d.shortDesc}</div>
                  <ProgressBar pct={d.pct} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <span style={{ fontSize: '.68rem', color: '#a99bc2' }}>📅 {d.dateStr}</span>
                    <span className="pill">{d.msDone}/{d.msTotal} milestones · {d.pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!hasDreams && (
        <EmptyState style={{ marginTop: 16 }} emoji="💭" title="No dreams yet" subtitle={'Click "➕ Add Dream" in the sidebar to plant your first seed 🌱'} />
      )}

      <SectionLabel style={{ marginTop: 28 }}>DAILY INSPIRATION</SectionLabel>
      <div className="quote-card">
        <div style={{ fontSize: '.95rem', fontStyle: 'italic', lineHeight: 1.65 }}>"{qText}"</div>
        <div style={{ fontSize: '.75rem', color: '#ffb703', fontWeight: 700, marginTop: 10 }}>— {qAuthor}</div>
      </div>
    </>
  );
}
