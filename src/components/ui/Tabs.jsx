export default function Tabs({ tabs, active, onChange, style }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', ...style }}>
      {tabs.map((t) => (
        <div
          key={t.key}
          onClick={() => onChange(t.key)}
          className="tab"
          style={{ background: active === t.key ? 'rgba(139,92,246,.13)' : 'transparent', color: active === t.key ? '#f5f0ff' : '#a99bc2' }}
        >
          {t.label}
        </div>
      ))}
    </div>
  );
}
