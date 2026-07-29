import { useState } from 'react';
import { catInfo } from '../data';
import { generateDreamCardBlob } from '../shareCard';

function buildCaption(dream, pct) {
  const info = catInfo(dream.category);
  return `${info.emoji} ${dream.title} — ${pct}% of the way there. Tracking it with DreamzLab! #DreamzLab #Goals`;
}

export default function ShareModal({ dreams, getProgress, onShare, onClose }) {
  const [pickedId, setPickedId] = useState(null);
  const [busy, setBusy] = useState(null); // which external action is in flight
  const [copied, setCopied] = useState(false);

  const options = dreams.map((d) => ({ ...d, info: catInfo(d.category), pct: getProgress(d) }));
  const picked = options.find((o) => o.id === pickedId) || null;

  const shareFacebook = () => {
    const url = window.location.origin;
    const quote = buildCaption(picked, picked.pct);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(quote)}`, '_blank', 'noopener,width=600,height=600');
  };

  const shareLinkedIn = () => {
    const url = window.location.origin;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'noopener,width=600,height=600');
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(buildCaption(picked, picked.pct));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) { /* clipboard unavailable — ignore */ }
  };

  const shareImage = async (mode) => {
    setBusy(mode);
    try {
      const blob = await generateDreamCardBlob(picked, picked.pct);
      const file = new File([blob], 'dreamzlab-card.png', { type: 'image/png' });

      if (mode === 'native' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: picked.title, text: buildCaption(picked, picked.pct) });
      } else {
        // Download fallback — works everywhere, including desktop, and is
        // what you'd manually upload to Instagram if native share isn't available.
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'dreamzlab-card.png';
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } catch (e) {
      // user cancelled the native share sheet, or something else went wrong — no-op
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 480 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>📢 Share Your Dreamz</div>

        {!picked && (
          <>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 18 }}>Pick a dream to share</div>
            {options.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {options.map((o) => (
                  <div key={o.id} onClick={() => setPickedId(o.id)} className="share-option">
                    <span style={{ fontSize: '.86rem', fontWeight: 600 }}>{o.info.emoji} {o.title}</span>
                    <span style={{ fontSize: '.72rem', color: '#8b5cf6', fontWeight: 700 }}>{o.pct}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '.85rem', color: '#a99bc2', marginBottom: 16 }}>Add a dream first, then come back to share it.</div>
            )}
            <div onClick={onClose} style={{ textAlign: 'center', fontSize: '.8rem', color: '#a99bc2', cursor: 'pointer' }}>Cancel</div>
          </>
        )}

        {picked && (
          <>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{picked.info.emoji} {picked.title}</div>
            <div style={{ fontSize: '.78rem', color: '#a99bc2', marginBottom: 20 }}>{picked.pct}% complete</div>

            <div className="eyebrow" style={{ marginBottom: 8 }}>Post to DreamzLab</div>
            <div onClick={() => onShare(picked)} className="share-option" style={{ marginBottom: 18, justifyContent: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: '.86rem', fontWeight: 600 }}>🌐 Post to your Social Feed (in-app)</span>
            </div>

            <div className="eyebrow" style={{ marginBottom: 8 }}>Share outside DreamzLab</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              <div onClick={shareFacebook} className="share-option" style={{ justifyContent: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: '.86rem', fontWeight: 600 }}>📘 Share to Facebook</span>
              </div>
              <div onClick={shareLinkedIn} className="share-option" style={{ justifyContent: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: '.86rem', fontWeight: 600 }}>💼 Share to LinkedIn</span>
              </div>
              <div onClick={() => shareImage('native')} className="share-option" style={{ justifyContent: 'flex-start', gap: 10, opacity: busy === 'native' ? 0.6 : 1 }}>
                <span style={{ fontSize: '.86rem', fontWeight: 600 }}>{busy === 'native' ? '⏳ Preparing…' : '📱 Share via your phone (Instagram, WhatsApp, etc.)'}</span>
              </div>
              <div onClick={() => shareImage('download')} className="share-option" style={{ justifyContent: 'flex-start', gap: 10, opacity: busy === 'download' ? 0.6 : 1 }}>
                <span style={{ fontSize: '.86rem', fontWeight: 600 }}>{busy === 'download' ? '⏳ Preparing…' : '🖼️ Download image card'}</span>
              </div>
              <div onClick={copyCaption} className="share-option" style={{ justifyContent: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: '.86rem', fontWeight: 600 }}>{copied ? '✅ Caption copied!' : '📋 Copy caption text'}</span>
              </div>
            </div>

            <div style={{ fontSize: '.7rem', color: '#a99bc2', lineHeight: 1.5, marginBottom: 16 }}>
              Instagram doesn't allow posting directly from a website link — download or share the image card, then post it from the Instagram app. "Share via your phone" opens your device's native share sheet where Instagram will show up if it's installed.
            </div>

            <div onClick={() => setPickedId(null)} style={{ textAlign: 'center', fontSize: '.8rem', color: '#a99bc2', cursor: 'pointer' }}>← Back</div>
          </>
        )}
      </div>
    </div>
  );
}
