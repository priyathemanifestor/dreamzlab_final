import { useState, useEffect, useRef, useCallback } from 'react';
import { addEpisode, listEpisodes, deleteEpisode, formatBytes } from '../podcastStorage';
import { uid, CATEGORIES } from '../data';
import EmptyState from './ui/EmptyState';

const MAX_FILE_BYTES = 150 * 1024 * 1024; // 150MB — generous for a podcast episode, keeps browser storage sane

export default function MyPodcasts() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [title, setTitle] = useState('');
  const [guest, setGuest] = useState('');
  const [category, setCategory] = useState('default');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState(null);
  const fileInputRef = useRef(null);

  const objectUrls = useRef({}); // episodeId -> object URL, created lazily, revoked on unmount

  const refresh = useCallback(async () => {
    try {
      const list = await listEpisodes();
      setEpisodes(list);
      setLoadError(null);
    } catch (e) {
      setLoadError("Your browser doesn't support local podcast storage, so this feature isn't available here.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      Object.values(objectUrls.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [refresh]);

  const getUrl = (episode) => {
    if (!objectUrls.current[episode.id]) {
      objectUrls.current[episode.id] = URL.createObjectURL(episode.blob);
    }
    return objectUrls.current[episode.id];
  };

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setFormError(null);
    if (!f) { setFile(null); return; }
    if (!f.type.startsWith('audio/')) {
      setFormError('Please choose an audio file (mp3, m4a, wav, etc.).');
      setFile(null);
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setFormError(`That file is ${formatBytes(f.size)} — please keep uploads under ${formatBytes(MAX_FILE_BYTES)}.`);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!title.trim() || !guest.trim() || !file) {
      setFormError('Add a title, who your guest is, and an audio file.');
      return;
    }
    setUploading(true);
    setFormError(null);
    try {
      const episode = {
        id: uid(),
        title: title.trim(),
        guest: guest.trim(),
        category,
        notes: notes.trim(),
        sizeBytes: file.size,
        createdAt: new Date().toISOString(),
        blob: file,
      };
      await addEpisode(episode);
      setTitle(''); setGuest(''); setNotes(''); setFile(null); setCategory('default');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refresh();
    } catch (e) {
      setFormError('Could not save that episode — your browser storage may be full.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (objectUrls.current[id]) {
      URL.revokeObjectURL(objectUrls.current[id]);
      delete objectUrls.current[id];
    }
    await deleteEpisode(id);
    await refresh();
  };

  if (loadError) {
    return <EmptyState emoji="🚫" subtitle={loadError} />;
  }

  return (
    <div>
      <div style={{ fontSize: '.8rem', color: '#a99bc2', lineHeight: 1.6, marginBottom: 20 }}>
        Upload episodes with your own niche mentors — people you've found who aren't in the built-in roster.
        These are stored only on this device (in your browser's local storage), not uploaded anywhere or shared with anyone.
      </div>

      <div className="podcast-upload-card">
        <div className="eyebrow" style={{ marginBottom: 12 }}>➕ Add an episode</div>
        <div className="podcast-upload-grid" style={{ marginBottom: 10 }}>
          <input type="text" placeholder="Episode title" value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
          <input type="text" placeholder="Guest / mentor name" value={guest} onChange={(e) => setGuest(e.target.value)} className="input" />
        </div>
        <div className="podcast-upload-grid" style={{ marginBottom: 10 }}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            {Object.keys(CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="file" accept="audio/*" ref={fileInputRef} onChange={handleFileChange} className="input" style={{ padding: '9px 12px' }} />
        </div>
        <textarea placeholder="Notes (optional) — what makes this person worth listening to?" value={notes} onChange={(e) => setNotes(e.target.value)} className="textarea" style={{ height: 70, marginBottom: 10 }} />
        {formError && <div style={{ color: '#ef4444', fontSize: '.8rem', marginBottom: 10 }}>{formError}</div>}
        <div onClick={uploading ? undefined : handleUpload} className="btn-primary" style={{ opacity: uploading ? 0.6 : 1, cursor: uploading ? 'default' : 'pointer' }}>
          {uploading ? '⏳ Saving…' : '📼 Save Episode'}
        </div>
      </div>

      <div className="eyebrow" style={{ margin: '24px 0 12px' }}>YOUR EPISODES</div>

      {loading && <div style={{ fontSize: '.85rem', color: '#a99bc2' }}>Loading…</div>}

      {!loading && episodes.length === 0 && (
        <EmptyState emoji="📼" subtitle="No episodes uploaded yet — add your first one above." />
      )}

      {!loading && episodes.map((ep) => {
        const info = CATEGORIES[ep.category] || CATEGORIES.default;
        return (
          <div key={ep.id} className="my-podcast-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <span className="dream-tag" style={{ borderColor: info.color, color: info.color }}>{info.emoji} {ep.category}</span>
                <div style={{ fontSize: '.92rem', fontWeight: 700, marginTop: 6 }}>{ep.title}</div>
                <div style={{ fontSize: '.74rem', color: '#a99bc2' }}>with {ep.guest} · {formatBytes(ep.sizeBytes)}</div>
              </div>
              <div onClick={() => handleDelete(ep.id)} style={{ color: '#ef4444', fontSize: '.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>🗑️ Delete</div>
            </div>
            {ep.notes && <div style={{ fontSize: '.8rem', color: '#a99bc2', lineHeight: 1.5, marginBottom: 10 }}>{ep.notes}</div>}
            <audio controls src={getUrl(ep)} style={{ width: '100%' }} />
          </div>
        );
      })}
    </div>
  );
}
