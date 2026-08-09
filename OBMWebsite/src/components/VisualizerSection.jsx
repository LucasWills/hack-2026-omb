import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import HolographicCore from './HolographicCore';
import useScrollReveal from './useScrollReveal';

const KEYS_CONFIG = [
  { note: 'C', isBlack: false },
  { note: 'C#', isBlack: true, left: 35 },
  { note: 'D', isBlack: false },
  { note: 'D#', isBlack: true, left: 85 },
  { note: 'E', isBlack: false },
  { note: 'F', isBlack: false },
  { note: 'F#', isBlack: true, left: 185 },
  { note: 'G', isBlack: false },
  { note: 'G#', isBlack: true, left: 235 },
  { note: 'A', isBlack: false },
  { note: 'A#', isBlack: true, left: 285 },
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
    const handleEsc = (e) => { if (e.key === 'Escape') setIsExpanded(false); };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = prevOverflow;
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

  // 10 Frequency Bands spanning the full piano range (27.5 Hz to 4186 Hz logarithmic distribution)
  const PIANO_LOW_HZ = 27.5;
  const PIANO_HIGH_HZ = 4186.01;
  const TOTAL_BARS = 10;

  const frequencyBars = Array.from({ length: TOTAL_BARS }, (_, i) => {
    const t0 = i / TOTAL_BARS;
    const t1 = (i + 1) / TOTAL_BARS;
    const lowFreq = PIANO_LOW_HZ * Math.pow(PIANO_HIGH_HZ / PIANO_LOW_HZ, t0);
    const highFreq = PIANO_LOW_HZ * Math.pow(PIANO_HIGH_HZ / PIANO_LOW_HZ, t1);
    const centerFreq = Math.sqrt(lowFreq * highFreq);
    return { id: i, center: centerFreq, side: i < 5 ? 'left' : 'right' };
  });

  const currentOctave = hardwareData.octave !== "---" ? hardwareData.octave : 4;

  // --- SMOOTHING LERP LOOP ---
  useEffect(() => {
    targetAmp.current = isDataFlowing ? Math.min(1, (hardwareData.velocity || 127) / 127) : 0;
    const freq = hardwareData.frequency || 0;
    if (freq > 0 && isDataFlowing) {
      const t = Math.max(0, Math.min(1, Math.log2(freq / 27) / Math.log2(4186 / 27)));
      targetFreq.current = 3 + (t * 11);
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
      frameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frameId);
  }, []);

  const normalizedAmp = isDataFlowing ? Math.min(1, (hardwareData.velocity || 127) / 127) : 0;

  return (
    <div
      className={`content-section visualizer-section-bg reveal ${isVisible ? 'is-visible' : ''}`}
      ref={ref}
    >
      <div className={isExpanded ? 'visualizer-fullscreen' : 'visualizer-stage-wrapper'}>
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
          <h2 className="section-main-title">Live Telemetry & Frequency Analyzer</h2>
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
              <Canvas camera={{ position: [0, 0, 5.5], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={2.5} color="#ffffff" />
                <pointLight
                  position={[-6, -4, -6]}
                  intensity={isDataFlowing ? 3 : 1}
                  color={isDataFlowing ? "#34ff25" : "#6b46ef"}
                />
                <HolographicCore
                  frequency={hardwareData.frequency}
                  velocity={hardwareData.velocity}
                  isActive={isDataFlowing}
                />
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
                        style={{ left: `${k.left}px` }}
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
      </div>
    </div>
  );
}