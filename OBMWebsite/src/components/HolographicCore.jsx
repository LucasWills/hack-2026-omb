import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function HolographicCore({ frequency = 0, isActive = false }) {
  const outerRef = useRef();
  const innerRef = useRef();

  // useFrame runs on every animation frame to continuously rotate the meshes
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    let outerSpeedY = 0.5;
    let outerSpeedZ = 0.2;
    let innerSpeed = 0.8;

    // React to the hardware frequency
    if (isActive) {
      outerSpeedY += (frequency / 100);
      innerSpeed += (frequency / 80);
    }

    if (outerRef.current) {
      outerRef.current.rotation.y = t * outerSpeedY;
      outerRef.current.rotation.z = t * outerSpeedZ;
      const scale = isActive ? 1 + Math.sin(t * 15) * 0.1 : 1;
      outerRef.current.scale.set(scale, scale, scale);
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * innerSpeed;
      innerRef.current.rotation.x = -t * 0.5; 
      const scale = isActive ? 1 + Math.sin(t * 15) * 0.1 : 1;
      innerRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      {/* Outer Neon Green Wireframe Diamond */}
      <mesh ref={outerRef}>
        <octahedronGeometry args={[1.8, 0]} />
        <meshStandardMaterial 
          color={isActive ? "#00ffff" : "#34ff25"} 
          wireframe={true} 
          emissive={isActive ? "#00ffff" : "#34ff25"} 
          emissiveIntensity={isActive ? 2.0 : 0.5} 
        />
      </mesh>
      
      {/* Inner Neon Purple Diamond */}
      <mesh ref={innerRef}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          color="#6b46ef" 
          wireframe={true} 
          emissive="#6b46ef" 
          emissiveIntensity={isActive ? 2.0 : 0.8} 
        />
      </mesh>
    </group>
  );
}