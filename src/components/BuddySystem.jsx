import { useState, useEffect } from 'react';
import { isPushConfigured, isPushSupported, isPushSubscribed, getBuddyCode, pairWithBuddy, unpairBuddy } from '../push';

export default function BuddySystem() {
  const configured = isPushConfigured();
  const supported = isPushSupported();
  const [subscribed, setSubscribed] = useState(false);
  const [code, setCode] = useState(null);
  const [paired, setPaired] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!configured || !supported) return;
    isPushSubscribed().then(setSubscribed).catch(() => {});
  }, [configured, supported]);

  if (!configured || !supported || !subscribed) return null; // needs push enabled first — hide rather than show a broken flow

  const loadCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await getBuddyCode();
      setCode(result.code);
      setPaired(result.paired);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const doPair = async () => {
    if (!inputCode.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await pairWithBuddy(inputCode.trim());
      setPaired(true);
      setInputCode('');
      setNotice("🎉 Paired! You'll each get a nudge when the other completes a milestone.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const doUnpair = async () => {
    setBusy(true);
    setError(null);
    try {
      await unpairBuddy();
      setPaired(false);
      setNotice(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-sidebar-footer className="buddy-box">
      <div style={{ fontSize: '.78rem', fontWeight: 700, marginBottom: 6 }}>🤝 Accountability Buddy</div>

      {code === null && (
        <div onClick={busy ? undefined : loadCode} className="notif-toggle" style={{ cursor: 'pointer', padding: '6px 4px' }}>
          {busy ? '⏳ …' : 'Get my buddy code'}
        </div>
      )}

      {code !== null && (
        <>
          <div style={{ fontSize: '.7rem', color: '#a99bc2', marginBottom: 6 }}>
            Your code: <span style={{ color: '#8b5cf6', fontWeight: 700, letterSpacing: '.05em' }}>{code}</span> — share it with one friend
          </div>

          {paired ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '.72rem', color: '#22c55e', fontWeight: 700 }}>🤝 Paired</span>
              <span onClick={busy ? undefined : doUnpair} style={{ fontSize: '.68rem', color: '#ef4444', cursor: 'pointer' }}>Unpair</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text" placeholder="Friend's code" value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="input-sm" style={{ flex: 1, textTransform: 'uppercase' }}
              />
              <div onClick={busy ? undefined : doPair} className="btn-ghost" style={{ padding: '6px 10px', fontSize: '.7rem' }}>Pair</div>
            </div>
          )}
        </>
      )}

      {notice && <div style={{ fontSize: '.68rem', color: '#22c55e', marginTop: 6 }}>{notice}</div>}
      {error && <div style={{ fontSize: '.68rem', color: '#ef4444', marginTop: 6 }}>{error}</div>}
    </div>
  );
}
