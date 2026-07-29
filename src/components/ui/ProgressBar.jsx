export default function ProgressBar({ pct, height = 8 }) {
  return (
    <div className="progress-track" style={{ height, margin: '8px 0' }}>
      <div className="progress-fill" style={{ height, width: `${pct}%` }} />
    </div>
  );
}
