import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sparkles, ContactShadows } from '@react-three/drei';
import HolographicCore from './HolographicCore';
import useScrollReveal from './useScrollReveal';

// Standard 88-key piano range (brief section 22)
const PIANO_LOW_HZ = 27.5;    // A0
const PIANO_HIGH_HZ = 4186.01; // C8
const TOTAL_BARS = 10;
const FREQ_GRAPH_BARS = 48;

// 10 side-wing bands spanning the full piano range, log-distributed
const FREQUENCY_BARS = Array.from({ length: TOTAL_BARS }, (_, i) => {
  const t0 = i / TOTAL_BARS;
  const t1 = (i + 1) / TOTAL_BARS;
  const lowFreq = PIANO_LOW_HZ * Math.pow(PIANO_HIGH_HZ / PIANO_LOW_HZ, t0);
  const highFreq = PIANO_LOW_HZ * Math.pow(PIANO_HIGH_HZ / PIANO_LOW_HZ, t1);
  const centerFreq = Math.sqrt(lowFreq * highFreq);
  return { id: i, center: centerFreq, side: i < 5 ? 'left' : 'right' };
});

// Finer-grained bands for the frequency response graph above the keys —
// same log distribution across A0-C8 so the graph reflects the instrument's
// actual playable range rather than an arbitrary spectrum (section 22).
const FREQ_GRAPH_BANDS = Array.from({ length: FREQ_GRAPH_BARS }, (_, i) => {
  const t0 = i / FREQ_GRAPH_BARS;
  const t1 = (i + 1) / FREQ_GRAPH_BARS;
  const lowFreq = PIANO_LOW_HZ * Math.pow(PIANO_HIGH_HZ / PIANO_LOW_HZ, t0);
  const highFreq = PIANO_LOW_HZ * Math.pow(PIANO_HIGH_HZ / PIANO_LOW_HZ, t1);
  return { id: i, center: Math.sqrt(lowFreq * highFreq) };
});

// `left` is a PERCENTAGE of the keyboard width, not a pixel offset, so the
// keyboard stays correctly aligned at any size (8 white keys = 12.5% each;
// each black key is 7.5% wide and centred on a white-key boundary).
const KEYS_CONFIG = [
  { note: 'C', isBlack: false },
  { note: 'C#', isBlack: true, left: 8.75 },
  { note: 'D', isBlack: false },
  { note: 'D#', isBlack: true, left: 21.25 },
  { note: 'E', isBlack: false },
  { note: 'F', isBlack: false },
  { note: 'F#', isBlack: true, left: 46.25 },
  { note: 'G', isBlack: false },
  { note: 'G#', isBlack: true, left: 58.75 },
  { note: 'A', isBlack: false },
  { note: 'A#', isBlack: true, left: 71.25 },
  { note: 'B', isBlack: false },
  { note: 'C', isBlack: false, isHigh: true }
];

export default function VisualizerSection() {
  const [ref, isVisible] = useScrollReveal();
  const [hardwareData, setHardwareData] = useState({ pitch: "---", octave: "---", frequency: 0, velocity: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const [isDataFlowing, setIsDataFlowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Lock page scroll and allow Escape to exit while in immersive mode
  useEffect(() => {
    if (!isExpanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('immersive-active'); // Recede the site behind the visualizer (shared layer)
    const handleEsc = (e) => { if (e.key === 'Escape') setIsExpanded(false); };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove('immersive-active');
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isExpanded]);

  const dashboardRef = useRef(null);
  const pathRef = useRef(null);
  const currentAmp = useRef(0);
  const targetAmp = useRef(0);
  const currentFreq = useRef(3);
  const targetFreq = useRef(3);
  const phase = useRef(0);
  // Last actively-played note frequency in Hz, and the DOM/smoothed-value
  // storage for the frequency response graph above the keys (section 21).
  const noteFreqHz = useRef(0);
  const freqBarElsRef = useRef([]);
  const freqAmpsRef = useRef(new Float32Array(FREQ_GRAPH_BARS));

  const connectToUSB = async () => {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      setIsConnected(true);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            try {
              const parsedData = JSON.parse(line);
              setHardwareData(parsedData);
              setIsDataFlowing(parsedData.velocity > 0);
            } catch (err) {}
          }
        }
      }
    } catch (error) {
      console.error("Connection failed", error);
      setIsConnected(false);
    }
  };

  const frequencyBars = FREQUENCY_BARS;

  const currentOctave = hardwareData.octave !== "---" ? hardwareData.octave : 4;

  // --- SMOOTHING LERP LOOP ---
  useEffect(() => {
    targetAmp.current = isDataFlowing ? Math.min(1, (hardwareData.velocity || 127) / 127) : 0;
    const freq = hardwareData.frequency || 0;
    if (freq > 0 && isDataFlowing) {
      const t = Math.max(0, Math.min(1, Math.log2(freq / 27) / Math.log2(4186 / 27)));
      targetFreq.current = 3 + (t * 11);
      noteFreqHz.current = freq;
    }
  }, [hardwareData.velocity, hardwareData.frequency, isDataFlowing]);

  useEffect(() => {
    let frameId;
    const loop = () => {
      const diffAmp = targetAmp.current - currentAmp.current;
      currentAmp.current += diffAmp > 0 ? diffAmp * 0.45 : diffAmp * 0.05;

      const diffFreq = targetFreq.current - currentFreq.current;
      currentFreq.current += diffFreq * 0.05;

      phase.current += 0.015 + (currentAmp.current * 0.03);

      if (dashboardRef.current) {
        dashboardRef.current.style.setProperty('--smooth-amp', currentAmp.current);
      }

      if (pathRef.current) {
        const cx = 150, cy = 150, baseR = 100;
        const maxDeform = 35;
        const f1 = Math.floor(currentFreq.current);
        const f2 = f1 + 1;
        const blend = currentFreq.current - f1;

        let d = "";
        const numPoints = 120;
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const w1 = Math.sin(angle * f1 + phase.current) * 0.75 + Math.cos(angle * f1 * 1.5 - phase.current * 1.2) * 0.25;
          const w2 = Math.sin(angle * f2 + phase.current) * 0.75 + Math.cos(angle * f2 * 1.5 - phase.current * 1.2) * 0.25;
          const wave = w1 * (1 - blend) + w2 * blend;
          const r = baseR + (wave * maxDeform * currentAmp.current);
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);

          if (i === 0) d += `M ${x} ${y} `;
          else d += `L ${x} ${y} `;
        }
        pathRef.current.setAttribute('d', d);
      }

      // Frequency response graph (section 21-22): each bar's target height is
      // how close its band's center frequency sits to the actively-played
      // note (in semitones), scaled by the same smoothed amplitude envelope
      // driving the rest of the visualizer. Fast attack / slow release gives
      // the "reverberates outward, then decays" feel called for in the brief,
      // and it naturally quiets on its own once a note is released.
      const bars = freqBarElsRef.current;
      if (bars.length) {
        const amps = freqAmpsRef.current;
        const freqHz = noteFreqHz.current;
        const activeAmp = currentAmp.current;
        for (let i = 0; i < FREQ_GRAPH_BARS; i++) {
          let target = 0.05;
          if (freqHz > 0 && activeAmp > 0.01) {
            const semitoneDist = Math.abs(12 * Math.log2(FREQ_GRAPH_BANDS[i].center / freqHz));
            if (semitoneDist < 14) {
              target = Math.max(0.05, 1 - semitoneDist / 14) * activeAmp;
            }
          }
          const cur = amps[i];
          amps[i] = target > cur ? cur + (target - cur) * 0.55 : cur + (target - cur) * 0.08;
          const el = bars[i];
          if (el) {
            el.style.height = `${Math.max(5, amps[i] * 100)}%`;
            el.style.opacity = (0.3 + amps[i] * 0.7).toFixed(2);
          }
        }
      }

      frameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frameId);
  }, []);

  const normalizedAmp = isDataFlowing ? Math.min(1, (hardwareData.velocity || 127) / 127) : 0;

  // The dashboard itself (header + 3D core + HUD) is identical whether it's
  // sitting inline on the page or filling the viewport — only its container
  // changes between the two. Built once and mounted in exactly one place
  // per render (see the portal in the final return below), so the Canvas
  // never has two live instances at once.
  const dashboardContent = (
    <>
      {isExpanded && (
        <button
          className="visualizer-exit-btn"
          onClick={() => setIsExpanded(false)}
          aria-label="Exit immersive mode"
        >
          ×
        </button>
      )}

      <div className="section-header-block">
        <h2
          key={isConnected ? 'live' : 'standby'}
          className={`section-main-title visualizer-title-anim ${isConnected ? 'is-live' : 'is-standby'}`}
        >
          {isConnected ? 'LIVE' : 'STAND BY...'}
        </h2>
        <p className="section-subtitle">
          Status: {isConnected ? <span className="status-live">LINK ACTIVE (A0 - C8, 88-Key Range)</span> : <span className="status-down">DISCONNECTED</span>}
        </p>

        <div className="visualizer-header-actions">
          {!isConnected && (
            <button className="connect-btn" onClick={connectToUSB}>
              CONNECT HARDWARE
            </button>
          )}
          <button
            className="visualizer-expand-btn"
            onClick={() => setIsExpanded((v) => !v)}
          >
            {isExpanded ? 'EXIT IMMERSIVE MODE' : 'ENTER IMMERSIVE MODE'}
          </button>
        </div>
      </div>

      <div
        className={`visualizer-dashboard ${isExpanded ? 'is-immersive' : ''}`}
        ref={dashboardRef}
        onClick={() => { if (!isExpanded) setIsExpanded(true); }}
      >

        {/* TOP: Core and frequency-dependent SVG wobble halo */}
        <div className="core-stage">
          <div className="ambient-effects left-effect">
            <div className="tech-circle"></div>
            <div className="tech-line"></div>
            <div className="tech-wave">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </div>

          <div className="core-container">
            <div className="halo-pulse-container">
              <svg viewBox="0 0 300 300" className="halo-svg">
                <defs>
                  <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(52, 255, 37, 0.35)" />
                    <stop offset="50%" stopColor="rgba(52, 255, 37, 0.15)" />
                    <stop offset="100%" stopColor="rgba(52, 255, 37, 0)" />
                  </radialGradient>
                </defs>
                <path ref={pathRef} fill="url(#haloGrad)" />
              </svg>
            </div>
            
            <div className="canvas-wrapper">
              <Canvas shadows camera={{ position: [0, 0, isExpanded ? 6.5 : 5.5], fov: 50 }}>
                <ambientLight intensity={0.35} />
                {/* Key light: a real directional light with shadows enabled so the
                    octahedron's faces actually shade against each other instead of
                    each catching an even, shadowless highlight (brief section 20). */}
                <directionalLight
                  position={[6, 8, 6]}
                  intensity={2.2}
                  color="#ffffff"
                  castShadow
                  shadow-mapSize={[512, 512]}
                />
                <pointLight
                  position={[-6, -4, -6]}
                  intensity={isDataFlowing ? 3 : 1}
                  color={isDataFlowing ? "#34ff25" : "#6b46ef"}
                />
                {/* Rim light from behind for edge separation — cheap way to add
                    perceived depth without a full environment map / postprocessing */}
                <pointLight position={[0, 2, -8]} intensity={isExpanded ? 2.2 : 1.2} color="#9d5ece" />

                <HolographicCore
                  frequency={hardwareData.frequency}
                  velocity={hardwareData.velocity}
                  isActive={isDataFlowing}
                  immersive={isExpanded}
                />

                {/* Ambient depth particles — denser and further-reaching in immersive mode */}
                <Sparkles
                  count={isExpanded ? 90 : 40}
                  scale={isExpanded ? 7 : 4.2}
                  size={2.4}
                  speed={0.25}
                  opacity={0.5}
                  color={isDataFlowing ? "#34ff25" : "#9d5ece"}
                />

                {/* Grounds the core with a real cast shadow instead of a flat drop-shadow */}
                <ContactShadows
                  position={[0, -1.8, 0]}
                  opacity={0.45}
                  scale={8}
                  blur={2.6}
                  far={3}
                  color="#05030a"
                />

                {/* Only takes over the camera in immersive mode — a slow auto-orbit
                    that reads as "you've activated something," while staying gentle
                    enough not to fight the data-driven core animation */}
                {isExpanded && (
                  <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={isDataFlowing ? 1.4 : 0.6}
                    maxPolarAngle={Math.PI / 1.6}
                    minPolarAngle={Math.PI / 3}
                  />
                )}
              </Canvas>
            </div>
          </div>

          <div className="ambient-effects right-effect">
            <div className="tech-wave">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <div className="tech-line"></div>
            <div className="tech-circle" style={{ animationDirection: 'reverse' }}></div>
          </div>
        </div>

        {/* BOTTOM HUD: Framed Piano with 10 Vertical Frequency Columns (5 Left, 5 Right) */}
        <div className="hud-lower-framed">
          
          {/* Label Row: Frequency on Left, Playing Note on Right */}
          <div className="hud-labels-row">
            <div className="side-readout left">
              <span className="label">FREQ</span>
              <span className="value">{hardwareData.frequency > 0 ? hardwareData.frequency : "---"} HZ</span>
            </div>
            <div className="side-readout right">
              <span className="label">NOTE</span>
              <span className="value">
                {hardwareData.pitch !== "---" ? hardwareData.pitch : "---"} 
                {hardwareData.octave !== "---" ? ` (OCT ${hardwareData.octave})` : ""}
              </span>
            </div>
          </div>

          {/* Frequency response graph — reacts to the note being played,
              mapped across the full 88-key range (A0-C8). Sits directly
              above the keys rather than off to the side (section 21-22). */}
          <div className="freq-response-range-label">
            <span>A0 · 27.5HZ</span>
            <span>FREQUENCY RESPONSE</span>
            <span>C8 · 4186HZ</span>
          </div>
          <div className="freq-response-graph" aria-hidden="true">
            {FREQ_GRAPH_BANDS.map((band, i) => (
              <div
                className="freq-response-bar"
                key={band.id}
                ref={(el) => { freqBarElsRef.current[i] = el; }}
              />
            ))}
            <div className="freq-response-baseline"></div>
          </div>

          {/* Core Framing Architecture: Left 5 Vertical Bars | Piano | Right 5 Vertical Bars */}
          <div className="piano-framing-grid">
            
            {/* Left Wing: 5 Vertical Columns (Low to Mid-Low) growing bottom-up */}
            <div className="frequency-wing left-wing">
              {frequencyBars.filter(b => b.side === 'left').map((bar) => {
                let intensity = 0.08;
                if (isDataFlowing && hardwareData.frequency > 0) {
                  const dist = Math.abs(12 * Math.log2(bar.center / hardwareData.frequency));
                  if (dist < 18) {
                    intensity = Math.max(0.08, 1 - (dist / 18)) * normalizedAmp;
                  }
                }
                return (
                  <div className="vertical-wing-bar" key={bar.id}>
                    <div 
                      className="vertical-wing-bar-fill" 
                      style={{ 
                        height: `${Math.max(15, intensity * 100)}%`,
                        opacity: 0.25 + (intensity * 0.75),
                        boxShadow: intensity > 0.3 ? '0 0 10px rgba(52, 255, 37, 0.6)' : 'none'
                      }} 
                    />
                  </div>
                );
              })}
            </div>

            {/* Central Piano Keyboard with Particle Strip */}
            <div className="keyboard-wrapper">
              <div className={`key-particle-strip ${isDataFlowing ? 'active' : ''}`}>
                {Array.from({ length: 26 }).map((_, i) => (
                  <span
                    className="shimmer-particle"
                    key={i}
                    style={{ '--x': `${(i / 26) * 100}%`, '--d': `${(i * 0.29) % 4.2}s`, '--dur': `${3.2 + (i % 5) * 0.4}s` }}
                  />
                ))}
              </div>

              <div className="piano-keyboard">
                {KEYS_CONFIG.map((k, index) => {
                  const displayedOctave = k.isHigh ? currentOctave + 1 : currentOctave;
                  const displayNote = `${k.note}${displayedOctave}`;
                  
                  let isActive = hardwareData.pitch === k.note && isDataFlowing;
                  if (isActive && k.note === 'C') {
                    if (k.isHigh && hardwareData.frequency < 500) isActive = false;
                    if (!k.isHigh && hardwareData.frequency > 500) isActive = false;
                  }

                  if (k.isBlack) {
                    return (
                      <div 
                        key={index} 
                        className={`synth-key black-key ${isActive ? 'key-active' : ''}`} 
                        style={{ left: `${k.left}%` }}
                      />
                    );
                  } else {
                    return (
                      <div 
                        key={index} 
                        className={`synth-key white-key ${isActive ? 'key-active' : ''}`}
                      >
                        <span className="note-label">{displayNote}</span>
                      </div>
                    );
                  }
                })}
              </div>
            </div>

            {/* Right Wing: 5 Vertical Columns (Mid-High to High) growing bottom-up */}
            <div className="frequency-wing right-wing">
              {frequencyBars.filter(b => b.side === 'right').map((bar) => {
                let intensity = 0.08;
                if (isDataFlowing && hardwareData.frequency > 0) {
                  const dist = Math.abs(12 * Math.log2(bar.center / hardwareData.frequency));
                  if (dist < 18) {
                    intensity = Math.max(0.08, 1 - (dist / 18)) * normalizedAmp;
                  }
                }
                return (
                  <div className="vertical-wing-bar" key={bar.id}>
                    <div 
                      className="vertical-wing-bar-fill" 
                      style={{ 
                        height: `${Math.max(15, intensity * 100)}%`,
                        opacity: 0.25 + (intensity * 0.75),
                        boxShadow: intensity > 0.3 ? '0 0 10px rgba(52, 255, 37, 0.6)' : 'none'
                      }} 
                    />
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        </div>
    </>
  );

  // Rendered in exactly one place: inline within the section while at rest,
  // or portaled straight onto document.body while immersive. Portaling is
  // what guarantees a genuine 100vw x 100vh overlay — an ancestor further up
  // the tree carrying so much as `transform: translateY(0)` (which several
  // of the scroll-reveal states above do) silently becomes the containing
  // block for a `position: fixed` descendant, which is what was trapping
  // immersive mode inside the section before (brief section 19).
  return (
    <div
      id="stage"
      className={`content-section visualizer-section-bg reveal ${isVisible ? 'is-visible' : ''} ${isExpanded ? 'is-immersive-active' : ''}`}
      ref={ref}
    >
      {!isExpanded && (
        <div className="visualizer-stage-wrapper">
          {dashboardContent}
        </div>
      )}

      {isExpanded && createPortal(
        <div className="visualizer-fullscreen">
          {dashboardContent}
        </div>,
        document.body
      )}
    </div>
  );
}