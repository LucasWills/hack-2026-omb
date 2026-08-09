import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Octahedron, Torus, Environment } from '@react-three/drei';
import * as THREE from 'three';

const IDLE_COLOR = new THREE.Color('#6b46ef');
const ACTIVE_COLOR = new THREE.Color('#34ff25');

export default function HolographicCore({ frequency = 0, velocity = 0, isActive = false, immersive = false }) {
  const coreRef = useRef();
  const shellRef = useRef();
  const ringARef = useRef();
  const ringBRef = useRef();
  const ringCRef = useRef();
  const coreMatRef = useRef();
  const shellMatRef = useRef();
  const liveColor = useRef(IDLE_COLOR.clone());

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const amp = isActive ? Math.min(1, (velocity || 64) / 127) : 0;

    // Base rotation speeds up with input energy
    const spin = 0.4 + amp * 1.1;
    coreRef.current.rotation.y += spin * delta;
    coreRef.current.rotation.x += spin * 0.5 * delta;

    // Wireframe glow shell counter-rotates for a layered, energized look
    if (shellRef.current) {
      shellRef.current.rotation.y -= spin * 0.35 * delta;
      shellRef.current.rotation.x -= spin * 0.2 * delta;
    }

    // Halo rings spin independently, like a rotating targeting array
    if (ringARef.current) ringARef.current.rotation.z += (0.3 + amp * 0.7) * delta;
    if (ringBRef.current) ringBRef.current.rotation.x += (0.25 + amp * 0.55) * delta;
    // Wide outer ring only really reads once the core is large on screen
    if (ringCRef.current) ringCRef.current.rotation.y -= (0.15 + amp * 0.35) * delta;

    // Pulse scale driven directly by the incoming frequency/velocity
    if (isActive) {
      const pulse = 1 + Math.sin(t * 14) * (frequency / 2200) * (0.5 + amp * 0.5);
      coreRef.current.scale.setScalar(
        THREE.MathUtils.lerp(coreRef.current.scale.x, pulse, 0.3)
      );
      if (shellRef.current) {
        shellRef.current.scale.setScalar(
          THREE.MathUtils.lerp(shellRef.current.scale.x, 1.55 + amp * 0.3, 0.15)
        );
      }
    } else {
      coreRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.08);
      if (shellRef.current) shellRef.current.scale.lerp(new THREE.Vector3(1.5, 1.5, 1.5), 0.08);
    }

    // Smoothly cross-fade color instead of snapping idle -> active
    const target = isActive ? ACTIVE_COLOR : IDLE_COLOR;
    liveColor.current.lerp(target, 0.06);

    if (coreMatRef.current) {
      coreMatRef.current.color.copy(liveColor.current);
      coreMatRef.current.emissive.copy(liveColor.current);
      coreMatRef.current.emissiveIntensity = isActive ? 1.1 + amp * 0.7 : 0.35;
    }
    if (shellMatRef.current) {
      shellMatRef.current.color.copy(liveColor.current);
      shellMatRef.current.opacity = isActive ? 0.32 + amp * 0.28 : 0.14;
    }
  });

  return (
    <group>
      {/* Environment reflections give the faces real directional highlights
          that shift as the shape rotates, instead of a flat metallic sheen —
          this is most of what reads as genuine 3D depth rather than a
          drop-shadow-on-a-flat-shape look (brief section 20). */}
      <Environment preset="city" background={false} />

      {/* Core pyramidal diamond, Ramiel-style bipyramid silhouette */}
      <Octahedron ref={coreRef} args={[1, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={coreMatRef}
          color={IDLE_COLOR}
          emissive={IDLE_COLOR}
          emissiveIntensity={0.35}
          metalness={0.75}
          roughness={0.32}
          clearcoat={1}
          clearcoatRoughness={0.18}
          envMapIntensity={1.3}
          reflectivity={0.6}
        />
      </Octahedron>

      {/* Wireframe glow shell for a layered energy-field look */}
      <Octahedron ref={shellRef} args={[1, 0]} scale={1.5}>
        <meshBasicMaterial ref={shellMatRef} color={IDLE_COLOR} wireframe transparent opacity={0.14} />
      </Octahedron>

      {/* Rotating halo rings */}
      <Torus ref={ringARef} args={[1.9, 0.008, 8, 64]} rotation={[Math.PI / 2.4, 0, 0]}>
        <meshBasicMaterial color="#9d5ece" transparent opacity={0.5} />
      </Torus>
      <Torus ref={ringBRef} args={[2.15, 0.006, 8, 64]} rotation={[0, 0, Math.PI / 3]}>
        <meshBasicMaterial color="#34ff25" transparent opacity={0.35} />
      </Torus>

      {/* Wide outer ring — extra layering for a stronger sense of depth,
          especially once the core is scaled up in immersive mode */}
      {immersive && (
        <Torus ref={ringCRef} args={[2.6, 0.005, 8, 72]} rotation={[Math.PI / 5, Math.PI / 6, 0]}>
          <meshBasicMaterial color="#9d5ece" transparent opacity={0.28} />
        </Torus>
      )}
    </group>
  );
}