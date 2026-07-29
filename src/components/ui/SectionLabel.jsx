export default function SectionLabel({ children, style }) {
  return (
    <div className="section-label" style={style}>
      {children}
      <div className="section-rule" />
    </div>
  );
}
