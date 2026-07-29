import { useState } from 'react';
import { CATEGORIES, getCategory, makeMilestones, uid } from '../data';

// Calls the /api/generate-milestones serverless function, which asks the
// real Claude API for a category + 5 personalised milestones. Falls back to
// the local keyword-matched templates if the API isn't configured or fails,
// so the app still works out of the box.
async function generateMilestonesWithAI(title, description) {
  const response = await fetch('/api/generate-milestones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  const data = await response.json();
  return data; // { category, milestones: string[] }
}

export default function AddDream({ dreams, addDream, navigate, getProgress }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [mode, setMode] = useState('auto');
  const [custom, setCustom] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);

  const previewCat = getCategory(title, '');
  const previewInfo = CATEGORIES[previewCat] || CATEGORIES.default;

  const finishAdd = (category, milestones) => {
    const dream = { id: uid(), title: title.trim(), description: desc.trim(), category, createdAt: new Date().toISOString(), milestones };
    addDream(dream);
    setTitle(''); setDesc(''); setCustom(''); setMode('auto'); setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  const handleAdd = async () => {
    if (!title.trim() || !desc.trim()) { setError(true); setSuccess(false); return; }
    setError(false);
    setAiNotice(null);

    if (mode === 'custom' && custom.trim()) {
      const milestones = custom.split('\n').map((l) => l.trim()).filter(Boolean).map((t) => ({ id: uid(), text: t, done: false }));
      finishAdd(getCategory(title, desc), milestones);
      return;
    }

    // Auto mode: try the real AI endpoint first, fall back to local templates.
    setGenerating(true);
    try {
      const { category, milestones } = await generateMilestonesWithAI(title.trim(), desc.trim());
      finishAdd(category, milestones.map((text) => ({ id: uid(), text, done: false })));
    } catch (e) {
      const cat = getCategory(title, desc);
      const milestones = makeMilestones(cat, 0, title.trim());
      setAiNotice("Couldn't reach the AI just now, so we used a template roadmap instead.");
      finishAdd(cat, milestones);
    } finally {
      setGenerating(false);
    }
  };

  const recentAddedTwo = [...dreams].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2).map((d) => ({ ...d, pct: getProgress(d) }));

  return (
    <div data-grid-add className="grid-add">
      <div>
        <div style={{ marginBottom: 20 }}>
          <div className="page-title">➕ Add a Dream</div>
          <div className="page-subtitle">Describe your dream and we'll build your personalised roadmap</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="label">What's your dream? *</label>
          <input
            type="text" placeholder="e.g. Run a marathon, Launch a startup, Learn Spanish…"
            value={title} onChange={(e) => { setTitle(e.target.value); setError(false); }}
            className="input"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Tell us more *</label>
          <textarea
            placeholder="Describe your dream in detail. What does success look like to you?"
            value={desc} onChange={(e) => { setDesc(e.target.value); setError(false); }}
            className="textarea"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="label" style={{ marginBottom: 8 }}>Milestones</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <div
              onClick={() => setMode('auto')}
              className="mode-btn"
              style={{ background: mode === 'auto' ? 'rgba(139,92,246,.13)' : '#1b1430', color: mode === 'auto' ? '#8b5cf6' : '#a99bc2' }}
            >✨ Build my roadmap for me</div>
            <div
              onClick={() => setMode('custom')}
              className="mode-btn"
              style={{ background: mode === 'custom' ? 'rgba(139,92,246,.13)' : '#1b1430', color: mode === 'custom' ? '#8b5cf6' : '#a99bc2' }}
            >✏️ I'll write my own</div>
          </div>
        </div>

        {mode === 'custom' && (
          <div style={{ marginBottom: 16 }}>
            <label className="label">Your milestones (one per line)</label>
            <textarea
              placeholder={'Step 1: …\nStep 2: …\nStep 3: …'}
              value={custom} onChange={(e) => setCustom(e.target.value)}
              className="textarea"
            />
          </div>
        )}

        {error && <div style={{ color: '#ef4444', fontSize: '.82rem', marginBottom: 12 }}>Please fill in both the title and description.</div>}
        {aiNotice && <div style={{ color: '#ffb703', fontSize: '.8rem', marginBottom: 12 }}>{aiNotice}</div>}
        {success && <div style={{ color: '#22c55e', fontSize: '.82rem', marginBottom: 12 }}>✨ Dream added! Head to My Dreams to see it.</div>}

        <div
          onClick={generating ? undefined : handleAdd}
          className="btn-primary"
          style={{ opacity: generating ? 0.6 : 1, cursor: generating ? 'default' : 'pointer' }}
        >
          {generating ? '✨ Asking Claude for your roadmap…' : '🚀 Start My Journey'}
        </div>
      </div>

      <div>
        <div className="preview-card">
          <img src={previewInfo.img} alt="" className="preview-img" />
          <div style={{ padding: 20 }}>
            <div className="eyebrow" style={{ color: previewInfo.color, marginBottom: 8 }}>{previewInfo.emoji} Dream Category Preview</div>
            <div style={{ fontSize: '.85rem', color: '#a99bc2', lineHeight: 1.6 }}>
              Describe your dream on the left — Claude reads it and writes a 5-step roadmap tailored to exactly what you typed. 🎯
            </div>
            <div className="how-it-works">
              <div style={{ fontSize: '.72rem', fontWeight: 600, color: '#8b5cf6', marginBottom: 6 }}>✨ HOW IT WORKS</div>
              <div style={{ fontSize: '.78rem', color: '#a99bc2', lineHeight: 1.7 }}>
                1. Describe your dream in detail<br />2. Claude reads it and picks a category<br />3. Get 5 specific, actionable milestones written for you<br />4. Track your progress every day
              </div>
            </div>
          </div>
        </div>

        {dreams.length > 0 && (
          <>
            <div style={{ marginTop: 16, fontSize: '.68rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#a99bc2' }}>RECENTLY ADDED</div>
            {recentAddedTwo.map((d) => (
              <div key={d.id} className="recent-added-card">
                <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{d.title}</div>
                <div className="progress-track" style={{ margin: '8px 0' }}>
                  <div className="progress-fill" style={{ width: `${d.pct}%` }} />
                </div>
                <div style={{ fontSize: '.68rem', color: '#a99bc2', marginTop: 4 }}>{d.pct}% complete</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
