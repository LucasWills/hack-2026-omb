import useScrollReveal from './useScrollReveal';

// 1. Past Show in LA | 2. Tomorrow's Show at UCLA | 3. Future Show in LA
const tourDates = [
  { 
    date: '07.15', 
    month: 'JUL', 
    event: 'Summer Echoes Showcase', 
    venue: 'The Wiltern', 
    city: 'Los Angeles', 
    status: 'Ended / Sold Out' 
  },
  { 
    date: '08.09', 
    month: 'AUG', 
    event: 'UCLA Hackathon Showcase', 
    venue: 'Engineering 6 Room 134', 
    city: 'UCLA, Los Angeles', 
    status: 'Live Today!' 
  },
  { 
    date: '10.31', 
    month: 'OCT', 
    event: 'Halloween Frequency Fest', 
    venue: 'El Rey Theatre', 
    city: 'Los Angeles', 
    status: 'Tickets Live' 
  },
];

export default function PerformanceSection() {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div
      id="live-shows"
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