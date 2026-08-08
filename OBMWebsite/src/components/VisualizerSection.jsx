import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import HolographicCore from './HolographicCore';

export default function VisualizerSection() {
  const [hardwareData, setHardwareData] = useState({ pitch: "---", octave: "---", frequency: 0, velocity: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const [isDataFlowing, setIsDataFlowing] = useState(false);

  // USB Connection Logic
  const connectToUSB = async () => {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      setIsConnected(true);

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
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

  const leftEqBands = Array.from({ length: 10 });
  const rightEqBands = Array.from({ length: 10 });
  
  // 13-key piano layout: C to C inclusive
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C'];

  return (
    <div className="content-section visualizer-section-bg">
      <div className="section-header-block">
        <h2 className="section-main-title">Live Telemetry</h2>
        <p className="section-subtitle">
          Status: {isConnected ? <span style={{color: '#34ff25'}}>LINK ACTIVE</span> : <span style={{color: '#ff3434'}}>DISCONNECTED</span>}
        </p>

        {!isConnected && (
          <button 
            onClick={connectToUSB} 
            style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#6b46ef', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
          >
            CONNECT HARDWARE
          </button>
        )}
      </div>

      <div className="visualizer-dashboard">
        
        {/* TOP/CENTER: The Holographic Core & EQ */}
        <div className="hud-upper">
          
          {/* Left 10-Band EQ */}
          <div className="eq-block left-eq">
            {leftEqBands.map((_, i) => (
              <div className="eq-bar" key={`l-${i}`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="eq-fill" style={{ height: isDataFlowing ? `${Math.random() * 100}%` : '10%' }}></div>
              </div>
            ))}
          </div>

          {/* Center 3D Holographic Core */}
          <div className="core-container">
            <div className="canvas-wrapper">
              <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
                <HolographicCore frequency={hardwareData.frequency} isActive={isDataFlowing} />
              </Canvas>
            </div>
            <div className="octave-readout">
              [ FREQ: {hardwareData.frequency} Hz | OCT: {hardwareData.octave} ]
            </div>
          </div>

          {/* Right 10-Band EQ */}
          <div className="eq-block right-eq">
            {rightEqBands.map((_, i) => (
              <div className="eq-bar" key={`r-${i}`} style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="eq-fill" style={{ height: isDataFlowing ? `${Math.random() * 100}%` : '10%' }}></div>
              </div>
            ))}
          </div>

        </div>

        {/* BOTTOM: Hardware Input Key Layout */}
        <div className="hud-lower">
          <div className="keyboard-layout">
            {keys.map((note, index) => {
              const isBlackKey = note.includes('#');
              
              // Dynamic check against live hardware data (no hardcoded keys)
              let isActive = hardwareData.pitch === note && isDataFlowing;

              // Tie-breaker for the two 'C' keys using frequency
              if (isActive && note === 'C') {
                if (index === 0 && hardwareData.frequency > 500) {
                  isActive = false; // Turn off Low C if playing High C
                } else if (index === 12 && hardwareData.frequency < 500) {
                  isActive = false; // Turn off High C if playing Low C
                }
              }

              return (
                <div 
                  key={index} 
                  className={`synth-key ${isBlackKey ? 'black-key' : 'white-key'} ${isActive ? 'key-active' : ''}`}
                >
                  <span className="key-label">{note}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}