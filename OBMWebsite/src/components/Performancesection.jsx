import useScrollReveal from './useScrollReveal';

// Placeholder tour dates - swap in real shows as they're booked.
const tourDates = [
  { date: '09.20', month: 'SEP', event: 'Neo Tokyo Circuit', venue: 'Shibuya Underground Hall', city: 'Neo Tokyo', status: 'Tickets Live' },
  { date: '10.04', month: 'OCT', event: 'Signal Feedback Tour', venue: 'The Amplifier', city: 'Los Angeles', status: 'Tickets Live' },
  { date: '11.15', month: 'NOV', event: 'Final Transmission', venue: 'Warehouse 7', city: 'Austin', status: 'Waitlist Open' },
];

export default function PerformanceSection() {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div
      className={`content-section performance-section-bg reveal ${isVisible ? 'is-visible' : ''}`}
      ref={ref}
    >
      <div className="marquee-strip" aria-hidden="true">
        <div className="marquee-track">
          <span>ONE MAN BAND — LIVE ON STAGE — </span>
          <span>ONE MAN BAND — LIVE ON STAGE — </span>
          <span>ONE MAN BAND — LIVE ON STAGE — </span>
          <span>ONE MAN BAND — LIVE ON STAGE — </span>
        </div>
      </div>

      <div className="section-header-block">
        <h2 className="section-main-title">Live On Stage</h2>
        <p className="section-subtitle">Catch the full rig in action — dates announced as they lock in.</p>
      </div>

      <div className="tour-date-list">
        {tourDates.map((show, index) => (
          <div className="tour-date-card" key={index}>
            <div className="tour-date-block">
              <span className="tour-date-day">{show.date}</span>
              <span className="tour-date-month">{show.month}</span>
            </div>
            <div className="tour-date-info">
              <h3 className="tour-event-name">{show.event}</h3>
              <p className="tour-venue">{show.venue} · {show.city}</p>
            </div>
            <div className="tour-date-action">
              <span className="tour-status-badge">{show.status}</span>
              <button className="tour-cta-btn" type="button">Get Tickets</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}