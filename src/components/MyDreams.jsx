import { useState } from 'react';
import { CATEGORIES, AFFIRMATIONS, dayOfYear, toDateStr } from '../data';
import { downloadICS, googleCalendarQuickAddUrl } from '../calendarExport';
import ProgressBar from './ui/ProgressBar';
import EmptyState from './ui/EmptyState';

function enrich(d, getProgress) {
  const info = CATEGORIES[d.category] || CATEGORIES.default;
  const pct = getProgress(d);
  const msDone = d.milestones.filter((m) => m.done).length;
  return { ...d, img: info.img, emoji: info.emoji, color: info.color, pct, msDone, msTotal: d.milestones.length, dateStr: d.createdAt.slice(0, 10) };
}

function dueLabel(dueDate, today) {
  if (!dueDate) return null;
  if (dueDate === today) return { text: '📅 Due today', color: '#ffb703' };
  if (dueDate < today) return { text: '⚠️ Overdue', color: '#ef4444' };
  return { text: '📅 ' + dueDate, color: '#a99bc2' };
}

export default function MyDreams({ dreams, expandedId, setExpandedId, confirmDeleteId, setConfirmDeleteId, toggleMilestone, addMilestone, setMilestoneDueDate, deleteDream, getProgress }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All categories');
  const [newMsText, setNewMsText] = useState({});
  const [newMsDate, setNewMsDate] = useState({});

  const hasDreams = dreams.length > 0;
  const affirmation = AFFIRMATIONS[dayOfYear() % AFFIRMATIONS.length];
  const today = toDateStr(new Date());

  const allCats = Array.from(new Set(dreams.map((d) => d.category)));
  const catOptions = ['All categories', ...allCats];

  let filtered = dreams;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((d) => d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
  }
  if (catFilter !== 'All categories') filtered = filtered.filter((d) => d.category === catFilter);

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div className="page-title">💭 My Dreams</div>
        <div className="page-subtitle">Track and manage your dreams and milestones</div>
      </div>
      <div className="affirmation-card" style={{ padding: '14px 20px', marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>✨ Today</div>
        <div style={{ fontSize: '.9rem' }}>{affirmation}</div>
      </div>

      {!hasDreams && (
        <EmptyState style={{ padding: '80px 20px' }} emoji="💭" title="Your dream journal is empty" subtitle={'Head to "➕ Add Dream" to plant your first seed 🌱'} />
      )}

      {hasDreams && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <input
              type="text" placeholder="🔍 Search dreams by title or keyword…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="input" style={{ flex: 2 }}
            />
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="input" style={{ flex: 1 }}>
              {catOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {filtered.length === 0 && (
            <EmptyState style={{ padding: '40px 20px', marginTop: 12 }} subtitle="No dreams match your search or filter." />
          )}

          {filtered.map((d0) => {
            const d = enrich(d0, getProgress);
            const expanded = expandedId === d.id;
            const confirming = confirmDeleteId === d.id;
            const icon = d.pct === 100 ? '🏆' : d.pct > 0 ? '🚀' : '🌱';
            const hasAnyDueDate = d.milestones.some((m) => m.dueDate);
            return (
              <div key={d.id} className="dream-row">
                <div
                  onClick={() => setExpandedId(expanded ? null : d.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '.92rem', fontWeight: 600 }}>{icon} {d.title} · {d.pct}% complete</div>
                  <div style={{ color: '#a99bc2', fontSize: '.8rem' }}>{expanded ? '▲' : '▼'}</div>
                </div>

                {expanded && (
                  <div style={{ padding: '0 20px 20px' }}>
                    <div data-grid-expand className="grid-expand">
                      <img src={d.img} alt="" className="expand-img" onError={(e) => { e.target.style.display = 'none'; }} />
                      <div>
                        <div style={{ color: '#a99bc2', fontSize: '.85rem', lineHeight: 1.6 }}>{d.description}</div>
                        <ProgressBar pct={d.pct} />
                        <div style={{ fontSize: '.72rem', color: '#a99bc2', marginTop: 4 }}>{d.msDone} of {d.msTotal} milestones · Started {d.dateStr}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 10px' }}>
                      <div className="eyebrow">MILESTONES</div>
                      {hasAnyDueDate && (
                        <div onClick={() => downloadICS(d0)} className="btn-ghost" style={{ padding: '5px 12px', fontSize: '.72rem' }}>
                          📅 Sync to Calendar
                        </div>
                      )}
                    </div>

                    {d.milestones.map((m) => {
                      const label = dueLabel(m.dueDate, today);
                      return (
                        <div key={m.id} className="milestone-row">
                          <div
                            onClick={() => toggleMilestone(d.id, m.id)}
                            style={{
                              flex: 1, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '.85rem',
                              textDecoration: m.done ? 'line-through' : 'none', opacity: m.done ? 0.45 : 1, color: m.done ? '#a99bc2' : '#f5f0ff',
                            }}
                          >
                            {m.done ? '✅' : '⭕'} {m.text}
                          </div>
                          <div className="milestone-due-controls">
                            {label && !m.done && <span style={{ fontSize: '.68rem', fontWeight: 600, color: label.color, whiteSpace: 'nowrap' }}>{label.text}</span>}
                            <input
                              type="date"
                              value={m.dueDate || ''}
                              onChange={(e) => setMilestoneDueDate(d.id, m.id, e.target.value)}
                              className="milestone-date-input"
                              title="Set a due date"
                            />
                            {m.dueDate && (
                              <a
                                href={googleCalendarQuickAddUrl(m, d.title)}
                                target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="milestone-gcal-link"
                                title="Add to Google Calendar"
                              >+ GCal</a>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                      <input
                        type="text" placeholder="Add a new milestone…"
                        value={newMsText[d.id] || ''}
                        onChange={(e) => setNewMsText({ ...newMsText, [d.id]: e.target.value })}
                        className="input-sm" style={{ flex: 1, minWidth: 160 }}
                      />
                      <input
                        type="date"
                        value={newMsDate[d.id] || ''}
                        onChange={(e) => setNewMsDate({ ...newMsDate, [d.id]: e.target.value })}
                        className="milestone-date-input"
                      />
                      <div
                        onClick={() => {
                          addMilestone(d.id, newMsText[d.id] || '', newMsDate[d.id] || null);
                          setNewMsText({ ...newMsText, [d.id]: '' });
                          setNewMsDate({ ...newMsDate, [d.id]: '' });
                        }}
                        className="btn-ghost"
                      >➕ Add</div>
                    </div>

                    {confirming ? (
                      <div className="delete-confirm">
                        <div style={{ fontSize: '.82rem', color: '#ffb703', marginBottom: 10 }}>Delete "{d.title}" permanently? This can't be undone.</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <div onClick={() => deleteDream(d.id)} className="btn-danger">✅ Yes, delete it</div>
                          <div onClick={() => setConfirmDeleteId(null)} className="btn-neutral">Cancel</div>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => setConfirmDeleteId(d.id)} style={{ marginTop: 16, display: 'inline-block', color: '#ef4444', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer' }}>
                        🗑️ Delete dream
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
