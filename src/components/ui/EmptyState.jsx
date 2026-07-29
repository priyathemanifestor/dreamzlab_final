export default function EmptyState({ emoji, title, subtitle, style }) {
  return (
    <div className="empty-state" style={style}>
      {emoji && <div style={{ fontSize: '4rem', marginBottom: 16 }}>{emoji}</div>}
      {title && <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</div>}
      {subtitle && <div style={{ fontSize: '.85rem', color: '#a99bc2', marginTop: 6 }}>{subtitle}</div>}
    </div>
  );
}
