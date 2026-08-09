import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import instrumentImage from '../assets/shinji.jpeg';
import useScrollReveal from './useScrollReveal';
import Modal from './Modal';

// Placeholder 3D Component
function PlaceholderInstrument3D() {
  const meshRef = useRef();
  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta * 0.4;
    meshRef.current.rotation.y += delta * 0.6;
  });
  return (
    <Box ref={meshRef} args={[2.2, 2.2, 2.2]}>
      <meshStandardMaterial color="#34ff25" wireframe emissive="#34ff25" emissiveIntensity={0.5} />
    </Box>
  );
}

// Data-driven content
const instrumentSpecs = {
  dimensions: "840 × 320 × 65 mm",
  material: "Treated Hardwood / Composite",
  poweredBy: "Active Li-Ion Preamp Core",
  speakers: "Dual Neodymium Drivers"
};

export default function InstrumentSection() {
  const [ref, isVisible] = useScrollReveal();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        className={`content-section instrument-section-bg reveal ${isVisible ? 'is-visible' : ''}`}
        ref={ref}
      >
        <div className="instrument-showcase-section">
          <div 
            className="instrument-image-container clickable" 
            onClick={() => setIsModalOpen(true)}
            title="Click to view 3D Schematic"
          >
            <img
              src={instrumentImage}
              alt="Instrument Showcase"
              className="instrument-img"
            />
            <div className="click-indicator">VIEW SCHEMATIC</div>
          </div>

          <div className="specs-container">
            <h3 className="specs-title">Instrument Specifications</h3>
            <ul className="specs-list">
              <li><span>Configuration:</span> Custom Multi-Scale Build</li>
              <li><span>Body Material:</span> {instrumentSpecs.material}</li>
              <li><span>Electronics:</span> Active Preamp & Custom Pickups</li>
              <li><span>Finish:</span> Matte Dark Cyberpunk Finish</li>
            </ul>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="instrument-modal-layout">
          <h3 className="modal-title">System Schematic V1.0</h3>
          
          <div className="instrument-3d-stage">
            <div className="canvas-wrapper-3d">
              <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
                <PlaceholderInstrument3D />
              </Canvas>
            </div>

            {/* Technical Callouts */}
            <div className="callout callout-tl">
              <span className="callout-text">Dimensions<br/>{instrumentSpecs.dimensions}</span>
              <div className="callout-line"></div>
              <div className="callout-dot"></div>
            </div>
            
            <div className="callout callout-tr">
              <div className="callout-dot"></div>
              <div className="callout-line"></div>
              <span className="callout-text">Material<br/>{instrumentSpecs.material}</span>
            </div>

            <div className="callout callout-bl">
              <span className="callout-text">Powered By<br/>{instrumentSpecs.poweredBy}</span>
              <div className="callout-line"></div>
              <div className="callout-dot"></div>
            </div>

            <div className="callout callout-br">
              <div className="callout-dot"></div>
              <div className="callout-line"></div>
              <span className="callout-text">Output<br/>{instrumentSpecs.speakers}</span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}