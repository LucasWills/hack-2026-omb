import { useRef, useState, useMemo } from 'react';
import memberPhotoPlaceholder from '../assets/shinji.jpeg';
import lucasPhoto from '../assets/Lucas.png';
import musiePhoto from '../assets/Musie.png';
import useScrollReveal from './useScrollReveal';
import Modal from './Modal';

// Generates a set of randomized-but-directionally-biased particle configs.
// Each particle drifts from near the character out toward the upper-right,
// with most of the randomness happening *around* that direction rather
// than uniformly in every direction (a few wander, very few go down/left).
function generateParticles(count) {
  return Array.from({ length: count }, (_, i) => {
    const roll = Math.random();
    let angleDeg;
    if (roll < 0.5) {
      angleDeg = -55 + Math.random() * 35;   // diagonal up-right (dominant)
    } else if (roll < 0.78) {
      angleDeg = -88 + Math.random() * 20;   // mostly straight up
    } else if (roll < 0.94) {
      angleDeg = -22 + Math.random() * 22;   // mostly straight right
    } else {
      angleDeg = 80 + Math.random() * 90;    // rare wander: down / lower-left
    }
    const angle = (angleDeg * Math.PI) / 180;
    const distance = 55 + Math.random() * 135;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    return {
      id: i,
      style: {
        '--p-left': `${12 + Math.random() * 58}%`,
        '--p-top': `${38 + Math.random() * 48}%`,
        '--p-size': `${(2 + Math.random() * 3).toFixed(1)}px`,
        '--p-tx': `${tx.toFixed(1)}px`,
        '--p-ty': `${ty.toFixed(1)}px`,
        '--p-dur': `${(3.4 + Math.random() * 3.8).toFixed(2)}s`,
        '--p-delay': `${(Math.random() * 5.5).toFixed(2)}s`,
        '--p-op': (0.35 + Math.random() * 0.5).toFixed(2),
      },
    };
  });
}

// Seeds small orb-like embers ON THE CARD'S PERIMETER (not across its face),
// which is what makes the legendary effect read as an *edge* treatment.
// Positions are distributed around the border; travel is dominantly
// north-east with per-ember variation in distance, size, speed and lifetime
// so the field never looks like a repeating loop. Kept few and small on
// purpose — the brief asks for subtle embers, not a ring of flames.
function generateEdgeEmbers(count) {
  return Array.from({ length: count }, (_, i) => {
    // Walk the perimeter so embers are spread evenly around all four edges,
    // with a bias toward the bottom/left edges since energy travels up-right
    // and should appear to originate from the trailing side of the card.
    const t = (i + Math.random() * 0.6) / count;
    let left;
    let top;
    if (t < 0.3) {            // bottom edge
      left = `${(t / 0.3) * 100}%`;
      top = `${94 + Math.random() * 6}%`;
    } else if (t < 0.6) {     // left edge
      left = `${-2 + Math.random() * 5}%`;
      top = `${100 - ((t - 0.3) / 0.3) * 100}%`;
    } else if (t < 0.85) {    // right edge
      left = `${95 + Math.random() * 5}%`;
      top = `${100 - ((t - 0.6) / 0.25) * 100}%`;
    } else {                  // top edge
      left = `${((t - 0.85) / 0.15) * 100}%`;
      top = `${-2 + Math.random() * 5}%`;
    }

    // North-east travel: positive X, negative Y (screen coords), with the
    // angle jittered around -45deg so embers fan out slightly.
    const angleDeg = -62 + Math.random() * 34;
    const angle = (angleDeg * Math.PI) / 180;
    const distance = 34 + Math.random() * 66;

    return {
      id: i,
      style: {
        '--e-left': left,
        '--e-top': top,
        '--e-size': `${(2.5 + Math.random() * 3.5).toFixed(1)}px`,
        '--e-tx': `${(Math.cos(angle) * distance).toFixed(1)}px`,
        '--e-ty': `${(Math.sin(angle) * distance).toFixed(1)}px`,
        '--e-dur': `${(2.6 + Math.random() * 2.4).toFixed(2)}s`,
        '--e-delay': `${(Math.random() * 4.5).toFixed(2)}s`,
        '--e-op': (0.45 + Math.random() * 0.45).toFixed(2),
      },
    };
  });
}

// Data-driven content: Mussie -> Lucas -> Asher
// colorKey drives each member's signature border/glow color (see member-color-* in styles.css)
// bio is an array of paragraphs so longer intros break naturally in the modal.
const teamMembers = [
  {
    id: 3,
    name: "Mussie Yigzaw",
    role: "Yabai",
    bio: [
      "Hey, I'm Mussie and I'm a UCLA transfer student studying mechanical engineering.",
      "Day to day, I love singing, dancing, playing video games, doom scrolling, and going to the gym. Outside of that, I love to hike and snowboard.",
      "My top three favorite musical artists in order are Michael Jackson, Kanye West, and the Weeknd."
    ],
    photo: musiePhoto,
    colorKey: "red"
  },
  {
    id: 2,
    name: "Lucas Wills",
    role: "Yabai",
    bio: [
      "Placeholder description detailing Lucas's contributions to the collective. Responsible for overseeing the core system architecture and prototyping workflows."
    ],
    photo: lucasPhoto,
    colorKey: "gold"
  },
  {
    id: 1,
    name: "Asher Vicera",
    role: "Yabai",
    bio: [
      "Placeholder description detailing Asher's contributions to the collective. Engineered the live telemetry pipelines, UI development, and data-driven visualizers."
    ],
    photo: memberPhotoPlaceholder,
    colorKey: "blue"
  }
];

function MemberCard({ member, isRevealed, onClick }) {
  const cardRef = useRef(null);
  // Stable per-card randomization — generated once, not re-rolled on every render.
  const particles = useMemo(() => generateParticles(16), []);
  const edgeEmbers = useMemo(() => generateEdgeEmbers(14), []);

  const handleMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * -8;
    const rotateY = ((x / rect.width) - 0.5) * 8;
    card.style.setProperty('--rx', `${rotateX}deg`);
    card.style.setProperty('--ry', `${rotateY}deg`);
    card.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--my', `${(y / rect.height) * 100}%`);
  };

  const handleLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      className={`member-card clickable member-color-${member.colorKey} ${isRevealed ? 'is-revealed' : ''}`}
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={() => onClick(member)}
      title={isRevealed ? member.name : 'Click to reveal'}
    >
      <div className="member-card-visual">
        <div
          className="member-card-photo"
          style={{ backgroundImage: `url("${member.photo}")` }}
        />
        <div className="member-card-scrim" />
        <div className="member-card-sheen" />
        {!isRevealed && <span className="member-reveal-hint">Click to reveal</span>}
        <div className="member-card-info">
          <span className="member-role">{member.role}</span>
          <h3 className="member-name">{member.name}</h3>
          <span className="member-name-streak" aria-hidden="true"></span>
        </div>
      </div>

      {/* Legendary-tier edge energy: aurora bloom on the border (CSS
          pseudo-elements) plus perimeter embers drifting north-east. */}
      <div className="member-card-edge" aria-hidden="true">
        {edgeEmbers.map((e) => (
          <span key={e.id} className="member-edge-ember" style={e.style} />
        ))}
      </div>

      <div className="member-particle-field" aria-hidden="true">
        {particles.map((p) => (
          <span key={p.id} className="member-particle" style={p.style} />
        ))}
      </div>
    </div>
  );
}

export default function TeamMembersSection() {
  const [ref, isVisible] = useScrollReveal();
  const [selectedMember, setSelectedMember] = useState(null);
  // Once a member's photo is revealed it stays revealed — no re-blurring on
  // a second click, which reads cleaner than a toggle.
  const [revealedIds, setRevealedIds] = useState(() => new Set());

  const openMember = (member) => {
    setRevealedIds((prev) => {
      if (prev.has(member.id)) return prev;
      const next = new Set(prev);
      next.add(member.id);
      return next;
    });
    setSelectedMember(member);
  };
  const closeMember = () => setSelectedMember(null);

  return (
    <>
      <div
        className={`content-section team-members-section-bg reveal ${isVisible ? 'is-visible' : ''}`}
        ref={ref}
      >
        <div className="section-header-block">
          <h2 className="section-main-title">The Collective</h2>
          <p className="section-subtitle">Meet the minds driving the project forward.</p>
        </div>

        <div className="members-grid">
          {teamMembers.map((member) => (
            <MemberCard
              member={member}
              key={member.id}
              isRevealed={revealedIds.has(member.id)}
              onClick={openMember}
            />
          ))}
        </div>
      </div>

      <Modal isOpen={!!selectedMember} onClose={closeMember}>
        {selectedMember && (
          /* The member-color-* class lives on the LAYOUT, not just the photo,
             so the badge, streak, divider, portrait frame and bio rail all
             resolve from this one member's palette. */
          <div className={`member-modal-layout member-color-${selectedMember.colorKey}`}>
            <img
              src={selectedMember.photo}
              alt={selectedMember.name}
              className="member-modal-photo"
            />

            <div className="member-modal-info">
              <span className="member-role">{selectedMember.role}</span>
              <h2 className="member-modal-name">{selectedMember.name}</h2>
              <span className="member-modal-streak" aria-hidden="true"></span>
              <div className="modal-bio-text">
                {selectedMember.bio.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}