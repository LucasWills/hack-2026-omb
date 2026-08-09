import { useState } from 'react';
import useScrollReveal from './useScrollReveal';
import Modal from './Modal';
import trackPlaceholderImg from '../assets/shinji.jpeg'; // Reusing for placeholder

// Data-driven content
const setlistTracks = [
  { id: 1, number: "TRACK 01", title: "Awakening Sequence", duration: "1:45", type: "Main Set", album: "SYSTEM: INITIALIZE", artist: "ONE MAN BAND", photo: trackPlaceholderImg },
  { id: 2, number: "TRACK 02", title: "Cybernetic Pulse", duration: "2:10", type: "Main Set", album: "SYSTEM: INITIALIZE", artist: "ONE MAN BAND", photo: trackPlaceholderImg },
  { id: 3, number: "ENCORE 01", title: "Ramiel Overdrive", duration: "1:55", type: "Encore 1", album: "LIVE AT NEO TOKYO", artist: "ONE MAN BAND", photo: trackPlaceholderImg },
  { id: 4, number: "ENCORE 02", title: "Final Transmission", duration: "1:05", type: "Encore 2", album: "LIVE AT NEO TOKYO", artist: "ONE MAN BAND", photo: trackPlaceholderImg }
];

export default function SetlistSection() {
  const [ref, isVisible] = useScrollReveal();
  const [selectedTrack, setSelectedTrack] = useState(null);

  const openTrack = (track) => setSelectedTrack(track);
  const closeTrack = () => setSelectedTrack(null);

  return (
    <>
      <div
        className={`content-section setlist-section-bg reveal ${isVisible ? 'is-visible' : ''}`}
        ref={ref}
      >
        <div className="section-header-block">
          <h2 className="section-main-title">Latest Album Setlist</h2>
          <p className="section-subtitle">Live performance recordings and studio cuts from our newest release.</p>
        </div>

        <div className="setlist-grid">
          {setlistTracks.map((track) => (
            <div className="track-card clickable" key={track.id} onClick={() => openTrack(track)}>
              <div>
                <div className="track-header">
                  <span className="track-number">{track.number}</span>
                  <span className="track-type-badge">{track.type}</span>
                </div>
                <h3 className="track-title">{track.title}</h3>
                <p className="track-duration">Duration: {track.duration}</p>
              </div>
              <div className="audio-player-mock">
                <div className="audio-progress-bar"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={!!selectedTrack} onClose={closeTrack}>
        {selectedTrack && (
          <div className="track-modal-layout">
            <img src={selectedTrack.photo} alt={selectedTrack.title} className="track-modal-photo" />
            
            <div className="track-modal-info">
              <span className="track-type-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>{selectedTrack.type}</span>
              <h2 className="modal-title" style={{ textAlign: 'left', marginBottom: '0.5rem' }}>{selectedTrack.title}</h2>
              
              <ul className="modal-data-list">
                <li><span>Duration:</span> {selectedTrack.duration}</li>
                <li><span>Album:</span> {selectedTrack.album}</li>
                <li><span>Artist:</span> {selectedTrack.artist}</li>
              </ul>
              
              {/* Visual audio player representation for the modal */}
              <div className="modal-audio-visualizer">
                {Array.from({length: 20}).map((_, i) => (
                  <div key={i} className="mini-eq-bar" style={{ animationDelay: `${i * 0.05}s` }}></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}