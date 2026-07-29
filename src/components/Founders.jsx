export default function Founders() {
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div className="page-title">🤝 Founders</div>
        <div className="page-subtitle">The people behind DreamzLab</div>
      </div>
      <div data-grid-recent className="grid-founders">
        <div className="founder-card">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div className="founder-avatar">PK</div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>Prahlad Kakkar</div>
              <div style={{ fontSize: '.72rem', color: '#8b5cf6', fontWeight: 600, marginTop: 2 }}>Co-Founder · Ad Filmmaker &amp; Branding Expert</div>
            </div>
          </div>
          <div style={{ fontSize: '.8rem', color: '#a99bc2', lineHeight: 1.6, marginTop: 14 }}>
            Renowned Indian ad filmmaker and branding expert who revolutionized Indian advertising with witty, unconventional storytelling. Founder of Genesis Film Productions, he crafted iconic campaigns for Pepsi, Britannia, and Nestlé — and remains a passionate advocate for creative education and leadership.
          </div>
        </div>
        <div className="founder-card">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div className="founder-avatar">PV</div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>Priya Verma</div>
              <div style={{ fontSize: '.72rem', color: '#8b5cf6', fontWeight: 600, marginTop: 2 }}>Co-Founder · Financial Strategist</div>
            </div>
          </div>
          <div style={{ fontSize: '.8rem', color: '#a99bc2', lineHeight: 1.6, marginTop: 14 }}>
            A visionary entrepreneur and financial strategist with two decades across Aditya Birla, Standard Chartered, HSBC, and Deutsche Bank. Through Millennial Dreamcatchers, she pioneers passive income and inheritance planning strategies that help clients turn financial dreams into reality.
          </div>
        </div>
      </div>
    </>
  );
}
