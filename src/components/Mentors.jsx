import { useState, useEffect } from 'react';
import { MENTORS, PODCASTS, catInfo } from '../data';
import Tabs from './ui/Tabs';
import SectionLabel from './ui/SectionLabel';
import EmptyState from './ui/EmptyState';
import VideoFeed from './VideoFeed';
import MyPodcasts from './MyPodcasts';

function useMentorRecommendations(dreams) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!dreams || dreams.length === 0) { setRecs([]); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/recommend-mentors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dreams: dreams.map((d) => ({ title: d.title, description: d.description, category: d.category })) }),
    })
      .then((r) => { if (!r.ok) throw new Error('request failed'); return r.json(); })
      .then((data) => { if (!cancelled) setRecs(data.recommendations || []); })
      .catch(() => { if (!cancelled) setError('Could not load AI recommendations right now.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [JSON.stringify((dreams || []).map((d) => d.id))]);

  return { recs, loading, error };
}

function InspirationTab({ dreams, isSubscribed }) {
  const [dreamId, setDreamId] = useState(dreams[0]?.id || '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dream = dreams.find((d) => d.id === dreamId) || null;

  const search = async () => {
    if (!dream) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const r = await fetch('/api/find-inspiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: dream.title, description: dream.description }),
      });
      if (!r.ok) throw new Error('request failed');
      const data = await r.json();
      setResults(data.results || []);
    } catch (e) {
      setError("Couldn't run the search right now — try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  if (dreams.length === 0) {
    return <EmptyState emoji="🔎" subtitle="Add a dream first, then come back to find real people who've done it." />;
  }

  return (
    <div>
      <div style={{ fontSize: '.85rem', color: '#a99bc2', lineHeight: 1.6, marginBottom: 16 }}>
        Claude searches the web for real people with a publicly documented, similar achievement — with a source link for each, so you can read the real story.
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select value={dreamId} onChange={(e) => { setDreamId(e.target.value); setResults(null); }} className="input" style={{ flex: 1 }}>
          {dreams.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
        <div onClick={loading ? undefined : search} className="btn-ghost" style={{ whiteSpace: 'nowrap', opacity: loading ? 0.6 : 1, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? '⏳ Searching…' : '🔎 Find real people'}
        </div>
      </div>

      {error && <div style={{ color: '#ef4444', fontSize: '.82rem', marginBottom: 12 }}>{error}</div>}

      {results && results.length === 0 && !error && (
        <EmptyState subtitle="No solid, verifiable matches turned up for this one — try rephrasing the dream's description." />
      )}

      {results && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.map((r, i) => (
            <a key={i} href={r.source_url} target="_blank" rel="noopener noreferrer" className="inspiration-card">
              <div style={{ fontSize: '.92rem', fontWeight: 700, marginBottom: 4, color: '#f5f0ff' }}>{r.name}</div>
              <div style={{ fontSize: '.82rem', color: '#a99bc2', lineHeight: 1.5, marginBottom: 8 }}>{r.achievement}</div>
              <div style={{ fontSize: '.7rem', color: '#8b5cf6' }}>🔗 View source</div>
            </a>
          ))}
          <div style={{ fontSize: '.68rem', color: '#a99bc2', marginTop: 4 }}>AI-curated from web search — worth double-checking the source before relying on details.</div>
        </div>
      )}
    </div>
  );
}

export default function Mentors({ dreams, isSubscribed, billingCycle, subscribe, cancelSubscription, bookMentor, bookingMsg, bookedMentors, togglePlayed, playedEpisodes }) {
  const [tab, setTab] = useState('mentors');
  const billingLabel = billingCycle === 'monthly' ? 'Monthly · $9/mo' : 'Yearly · $79/yr (save 27%)';
  const { recs, loading: recsLoading, error: recsError } = useMentorRecommendations(dreams);
  const recommendedIds = new Set(recs.map((r) => r.mentorId));

  const tabs = [
    { key: 'mentors', label: '🎓 Mentors' },
    { key: 'podcasts', label: '🎧 Podcasts' },
    { key: 'my-podcasts', label: '📼 My Podcasts' },
    { key: 'videos', label: '🎥 Videos' },
    { key: 'inspiration', label: '🔎 Inspiration' },
  ];

  const renderMentorCard = (m, reason) => {
    const info = catInfo(m.category);
    const booked = bookedMentors.includes(m.id);
    return (
      <div key={m.id} className="mentor-card">
        {reason && <div className="ai-badge">✨ Recommended for you</div>}
        <div className="mentor-avatar" style={{ background: m.color }}>{m.initials}</div>
        <div style={{ fontSize: '.92rem', fontWeight: 700, marginBottom: 4 }}>{m.name}</div>
        <div style={{ fontSize: '.68rem', color: '#8b5cf6', marginBottom: 8 }}>{info.emoji} {m.category}</div>
        <div style={{ fontSize: '.78rem', color: '#a99bc2', lineHeight: 1.5, marginBottom: reason ? 8 : 16, minHeight: 40 }}>{m.achievement}</div>
        {reason && <div style={{ fontSize: '.72rem', color: '#f5f0ff', lineHeight: 1.5, marginBottom: 16, fontStyle: 'italic' }}>"{reason}"</div>}
        {isSubscribed ? (
          <div onClick={() => !booked && bookMentor(m)} className="btn-ghost-block">
            {booked ? '✓ Session Requested' : '📅 Book a Session'}
          </div>
        ) : (
          <div className="btn-locked">🔒 Unlock with Premium</div>
        )}
      </div>
    );
  };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div className="page-title">🎓 Mentors &amp; Podcasts</div>
        <div className="page-subtitle">Learn directly from people who've already lived your dream</div>
      </div>

      {isSubscribed && (
        <div className="premium-active-banner">
          <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#22c55e' }}>✓ Dreemz Premium is active — {billingLabel}</div>
          <div onClick={cancelSubscription} style={{ fontSize: '.75rem', color: '#a99bc2', cursor: 'pointer' }}>Cancel</div>
        </div>
      )}

      {!isSubscribed && (
        <div data-grid-add className="premium-upsell">
          <div>
            <div className="eyebrow" style={{ color: '#8b5cf6', marginBottom: 8 }}>✨ Dreemz Premium</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>Get 1-on-1 time with people who've done it</div>
            <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.85)', lineHeight: 1.6 }}>
              Book sessions with mentors across every category, and unlock full episodes of our podcast with high-achievers sharing exactly how they got there.
            </div>
          </div>
          <div className="premium-price-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>$9</span><span style={{ fontSize: '.72rem', color: '#a99bc2' }}>/month</span>
            </div>
            <div onClick={() => subscribe('monthly')} className="btn-primary" style={{ marginBottom: 10 }}>Subscribe Monthly</div>
            <div onClick={() => subscribe('yearly')} className="btn-outline">Subscribe Yearly · $79 (save 27%)</div>
          </div>
        </div>
      )}

      {bookingMsg && <div className="booking-msg">✨ {bookingMsg}</div>}

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'mentors' && (
        <>
          {recsLoading && <div style={{ fontSize: '.8rem', color: '#a99bc2', marginBottom: 14 }}>✨ Asking Claude which mentors fit your dreams…</div>}
          {recsError && <div style={{ fontSize: '.8rem', color: '#a99bc2', marginBottom: 14 }}>{recsError}</div>}
          {recs.length > 0 && (
            <>
              <SectionLabel style={{ margin: '0 0 14px' }}>RECOMMENDED FOR YOUR DREAMS</SectionLabel>
              <div data-grid-recent className="grid-recent" style={{ marginBottom: 28 }}>
                {recs.map((r) => {
                  const m = MENTORS.find((mm) => mm.id === r.mentorId);
                  return m ? renderMentorCard(m, r.reason) : null;
                })}
              </div>
            </>
          )}
          <SectionLabel style={{ margin: '0 0 14px' }}>ALL MENTORS</SectionLabel>
          <div data-grid-recent className="grid-recent">
            {MENTORS.map((m) => renderMentorCard(m, null))}
          </div>
        </>
      )}

      {tab === 'podcasts' && (
        <div className="podcast-list">
          {PODCASTS.map((p) => {
            const info = catInfo(p.category);
            const played = playedEpisodes.includes(p.id);
            return (
              <div key={p.id} className="podcast-row">
                <div>
                  <div style={{ fontSize: '.88rem', fontWeight: 700, marginBottom: 2 }}>{p.title}</div>
                  <div style={{ fontSize: '.72rem', color: '#a99bc2' }}>{info.emoji} with {p.guest} · {p.duration}</div>
                </div>
                {isSubscribed ? (
                  <div onClick={() => togglePlayed(p.id)} className="btn-ghost" style={{ whiteSpace: 'nowrap' }}>
                    {played ? '✓ Played' : '▶ Play Episode'}
                  </div>
                ) : (
                  <div className="btn-locked" style={{ whiteSpace: 'nowrap' }}>🔒 Locked</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'my-podcasts' && (
        isSubscribed ? (
          <MyPodcasts />
        ) : (
          <div className="premium-lock-panel">
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>Uploading your own podcasts is a Premium feature</div>
            <div style={{ fontSize: '.85rem', color: '#a99bc2', lineHeight: 1.6, marginBottom: 18 }}>
              Subscribe to add episodes with your own niche mentors — people you've found who aren't in the built-in roster.
            </div>
            <div onClick={() => subscribe('monthly')} className="btn-primary" style={{ display: 'inline-block', padding: '11px 24px' }}>Subscribe Monthly · $9</div>
          </div>
        )
      )}

      {tab === 'videos' && <VideoFeed />}

      {tab === 'inspiration' && <InspirationTab dreams={dreams} isSubscribed={isSubscribed} />}
    </>
  );
}
