import { useState, useEffect } from 'react';
import {
  isPushConfigured, isPushSupported, isPushSubscribed,
  subscribeToPush, unsubscribeFromPush, syncPushProfile, buildDreamProfile,
} from '../push';

const HOUR_OPTIONS = [6, 7, 8, 9, 10, 12, 14, 17, 19, 21];
const formatHour = (h) => (h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`);

export default function PushToggle({ dreams }) {
  const configured = isPushConfigured();
  const supported = isPushSupported();
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [preferredHour, setPreferredHour] = useState(8);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!configured || !supported) return;
    isPushSubscribed().then(setSubscribed).catch(() => {});
  }, [configured, supported]);

  // Keep the personalized affirmation topic current if dreams change after subscribing.
  useEffect(() => {
    if (!configured || !supported || !subscribed) return;
    syncPushProfile(buildDreamProfile(dreams));
  }, [configured, supported, subscribed, dreams]);

  if (!configured || !supported) return null; // hide entirely rather than show a broken control

  const confirmSubscribe = async () => {
    setBusy(true);
    setError(null);
    try {
      await subscribeToPush(preferredHour, buildDreamProfile(dreams));
      setSubscribed(true);
      setShowPicker(false);
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async () => {
    setBusy(true);
    setError(null);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-sidebar-footer>
      {!subscribed && !showPicker && (
        <div onClick={() => setShowPicker(true)} className="notif-toggle" style={{ cursor: 'pointer' }}>
          📲 Enable push (works when closed)
        </div>
      )}

      {!subscribed && showPicker && (
        <div className="push-picker">
          <div style={{ fontSize: '.72rem', color: '#a99bc2', marginBottom: 6 }}>Send my daily affirmation around:</div>
          <select value={preferredHour} onChange={(e) => setPreferredHour(Number(e.target.value))} className="input-sm" style={{ width: '100%', marginBottom: 8 }}>
            {HOUR_OPTIONS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
          </select>
          <div onClick={busy ? undefined : confirmSubscribe} className="btn-ghost" style={{ textAlign: 'center', opacity: busy ? 0.6 : 1 }}>
            {busy ? '⏳ …' : '✅ Confirm'}
          </div>
        </div>
      )}

      {subscribed && (
        <div onClick={busy ? undefined : unsubscribe} className="notif-toggle" style={{ cursor: busy ? 'default' : 'pointer' }}>
          {busy ? '⏳ …' : '📲 Push notifications on'}
        </div>
      )}

      {error && <div style={{ fontSize: '.68rem', color: '#ef4444', marginTop: 4 }}>{error}</div>}
    </div>
  );
}
