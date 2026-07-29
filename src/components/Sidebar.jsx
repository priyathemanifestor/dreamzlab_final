import PushToggle from './PushToggle';
import BuddySystem from './BuddySystem';

const NAV_ITEMS = [
  { key: 'home', emoji: '🏠', text: 'Home' },
  { key: 'founders', emoji: '🤝', text: 'Founders' },
  { key: 'dreams', emoji: '💭', text: 'My Dreams' },
  { key: 'add', emoji: '➕', text: 'Add Dream' },
  { key: 'social', emoji: '🌐', text: 'Social Feed' },
  { key: 'mentors', emoji: '🎓', text: 'Mentors' },
  { key: 'bingo', emoji: '🎯', text: 'Dream Bingo' },
  { key: 'progress', emoji: '📊', text: 'Progress' },
];

export default function Sidebar({ page, navigate, hasDreams, overallPct, openQuiz, streak, notifPermission, enableNotifications, dreams }) {
  const notifLabel = notifPermission === 'granted' ? '🔔 Reminders on'
    : notifPermission === 'denied' ? '🔕 Blocked in browser settings'
    : notifPermission === 'unsupported' ? '🔕 Not supported here'
    : '🔔 Enable Reminders';
  const notifClickable = notifPermission === 'default';

  return (
    <div data-sidebar className="sidebar">
      <div data-sidebar-header className="sidebar-header">
        <div className="sidebar-title">✨ DreamzLab</div>
        <div className="sidebar-subtitle">Bring your dreams to reality</div>
      </div>

      <div data-sidebar-stats className="sidebar-stats-row">
        <div className="sidebar-stat-chip" title="Consecutive days you've opened DreamzLab">🔥 {streak?.count || 0}-day streak</div>
      </div>

      <div data-sidebar-rule className="sidebar-rule" />

      <div data-nav-list className="nav-list">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.key}
            data-nav-item
            onClick={() => navigate(item.key)}
            className="nav-item"
            style={{
              background: page === item.key ? 'rgba(139,92,246,.13)' : 'transparent',
              color: page === item.key ? '#f5f0ff' : '#a99bc2',
            }}
          >
            {item.emoji}<span data-nav-text> {item.text}</span>
          </div>
        ))}
      </div>

      {hasDreams && (
        <div data-sidebar-progress>
          <div className="hr" style={{ margin: '16px 0 12px' }} />
          <div className="eyebrow" style={{ marginBottom: 8 }}>Overall progress</div>
          <div className="progress-track" style={{ margin: '8px 0' }}>
            <div className="progress-fill" style={{ width: `${overallPct}%` }} />
          </div>
          <div style={{ fontSize: '.72rem', color: '#8b5cf6', fontWeight: 600, marginTop: 4 }}>
            {overallPct}% of all milestones done
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />
      <div
        onClick={notifClickable ? enableNotifications : undefined}
        data-sidebar-footer
        className="notif-toggle"
        style={{ cursor: notifClickable ? 'pointer' : 'default', opacity: notifPermission === 'unsupported' ? 0.5 : 1 }}
      >{notifLabel}</div>
      <PushToggle dreams={dreams} />
      <BuddySystem />
      <div onClick={openQuiz} data-sidebar-footer className="retake-quiz">🧭 Retake Discovery Quiz</div>
      <div data-sidebar-footer>
        <div className="hr" style={{ margin: '16px 0 12px' }} />
        <div style={{ fontSize: '.72rem', color: '#a99bc2', lineHeight: 2.2 }}>
          ✨ Dream it &nbsp; 📝 Plan it &nbsp; 🎯 Do it &nbsp; 🏆 Live it
        </div>
      </div>
    </div>
  );
}
