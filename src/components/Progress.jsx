import { CATEGORIES } from '../data';
import StatCard from './ui/StatCard';
import ProgressBar from './ui/ProgressBar';
import SectionLabel from './ui/SectionLabel';
import EmptyState from './ui/EmptyState';

export default function Progress({ dreams, getProgress }) {
  const hasDreams = dreams.length > 0;
  const totalMs = dreams.reduce((a, d) => a + d.milestones.length, 0);
  const doneMs = dreams.reduce((a, d) => a + d.milestones.filter((m) => m.done).length, 0);
  const overallPct = totalMs ? Math.round((doneMs / totalMs) * 100) : 0;
  const completedDreams = dreams.filter((d) => d.milestones.length && d.milestones.every((m) => m.done)).length;
  const inProgress = dreams.filter((d) => d.milestones.some((m) => m.done) && !d.milestones.every((m) => m.done)).length;

  const progressStatCards = [
    { value: String(dreams.length), label: 'Total Dreams', barGrad: 'linear-gradient(90deg,#8b5cf6,#ec4899)' },
    { value: String(completedDreams), label: 'Completed', barGrad: 'linear-gradient(90deg,#22c55e,#14b8a6)' },
    { value: String(inProgress), label: 'In Progress', barGrad: 'linear-gradient(90deg,#14b8a6,#3b82f6)' },
    { value: overallPct + '%', label: 'Overall', barGrad: 'linear-gradient(90deg,#ffb703,#f97316)' },
  ];

  const progressBars = dreams.map((d) => ({ title: d.title.length > 35 ? d.title.slice(0, 35) + '…' : d.title, pct: getProgress(d) }));

  const progressDetails = dreams.map((d) => {
    const info = CATEGORIES[d.category] || CATEGORIES.default;
    const pct = getProgress(d);
    return {
      ...d, img: info.img, pct,
      msDone: d.milestones.filter((m) => m.done).length, msTotal: d.milestones.length,
      dateStr: d.createdAt.slice(0, 10),
      color: pct === 100 ? '#ec4899' : pct > 50 ? '#8b5cf6' : '#3b82f6',
    };
  });

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div className="page-title">📊 Your Progress</div>
        <div className="page-subtitle">See how far you've come on every dream</div>
      </div>

      {!hasDreams && (
        <EmptyState style={{ padding: 80 }} emoji="📊" title="Nothing to track yet" subtitle="Add your first dream to start tracking progress" />
      )}

      {hasDreams && (
        <>
          <SectionLabel style={{ margin: '16px 0 14px' }}>OVERALL STATS</SectionLabel>
          <div data-grid-stats className="grid-stats" style={{ marginBottom: 8 }}>
            {progressStatCards.map((s, i) => <StatCard key={i} {...s} />)}
          </div>

          <SectionLabel style={{ marginTop: 28 }}>PROGRESS BY DREAM</SectionLabel>
          <div className="progress-list-card">
            {progressBars.map((p, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 6 }}>
                  <span>{p.title}</span><span style={{ color: '#8b5cf6', fontWeight: 700 }}>{p.pct}%</span>
                </div>
                <ProgressBar pct={p.pct} height={10} />
              </div>
            ))}
          </div>

          <SectionLabel style={{ marginTop: 28 }}>DREAM DETAILS</SectionLabel>
          {progressDetails.map((d) => (
            <div key={d.id} data-grid-progress-detail className="grid-progress-detail">
              <img src={d.img} alt="" className="progress-detail-img" onError={(e) => { e.target.style.display = 'none'; }} />
              <div className="progress-detail-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{d.title}</div>
                  <div style={{ fontSize: '.85rem', color: d.color, fontWeight: 700 }}>{d.pct}%</div>
                </div>
                <ProgressBar pct={d.pct} />
                <div style={{ fontSize: '.72rem', color: '#a99bc2', marginTop: 6 }}>{d.msDone} of {d.msTotal} milestones · Started {d.dateStr}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
