
import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  useGLTF,
  MeshTransmissionMaterial,
  Environment,
  Lightformer,
} from '@react-three/drei';
import {
  CuboidCollider,
  BallCollider,
  Physics,
  RigidBody,
} from '@react-three/rapier';
import { EffectComposer, N8AO } from '@react-three/postprocessing';
import { easing } from 'maath';

// Removed export interface LusionSceneProps

export default function LusionScene({
  index,
  shouldPulse,
  accentColor,
  className,
  ...canvasProps
}) {
  /* pulse tick increments only when parent says so */
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (shouldPulse) setPulse((p) => p + 1);
  }, [shouldPulse]);

  /* 9 connectors, all tinted with accentColor */
  const connectors = useMemo(() => {
    const num = 9;
    return Array.from({ length: num }, (_, i) => ({
      color: accentColor,
      roughness: i % 2 === 0 ? 0.1 : 0.75,
      accent: true,
    }));
  }, [accentColor]);

  return (
    <Canvas
      className={className}
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: false }}
      camera={{ position: [0, 0, 15], fov: 17.5, near: 1, far: 20 }}
      {...canvasProps}
    >
      {/* background & key lights */}
      <color attach="background" args={['#141622']} />
      <ambientLight intensity={0.4} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

      {/* physics world */}
      <Physics gravity={[0, 0, 0]}>
        <Pointer />
        {connectors.map((cfg, i) => (
          <Connector key={i} pulse={pulse} {...cfg} />
        ))}

        {/* centre crystal */}
        <Connector position={[10, 10, 5]} color={accentColor} roughness={0} accent={false} pulse={pulse}>
          <Model color={accentColor} roughness={0}>
            <MeshTransmissionMaterial
              clearcoat={1}
              thickness={0.1}
              anisotropicBlur={0.1}
              chromaticAberration={0.1}
              samples={8}
              resolution={512}
            />
          </Model>
        </Connector>
      </Physics>

      {/* ambient occlusion */}
      <EffectComposer enableNormalPass={false} multisampling={8}>
        <N8AO distanceFalloff={1} aoRadius={1} intensity={4} />
      </EffectComposer>

      {/* HDRI accents */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
        </group>
      </Environment>
    </Canvas>
  );
}

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */
function Connector({
  position,
  children,
  color,
  roughness,
  accent,
  pulse,
  vec = new THREE.Vector3(),
  r = THREE.MathUtils.randFloatSpread,
}) { // Removed type annotation for props
  const api = useRef(null); // Removed <any>
  const pos = useMemo(() => position || [r(10), r(10), r(10)], [position, r]);

  /* impulse every pulse tick */
  useEffect(() => {
    api.current?.applyImpulse(vec.set(r(600), r(600), r(600)));
  }, [pulse, vec, r]);

  /* gentle spring back to origin */
  useFrame((_, dt) => {
    dt = Math.min(dt, 0.1);
    api.current?.applyImpulse(
      vec.copy(api.current.translation()).negate().multiplyScalar(0.2)
    );
  });

  return (
    <RigidBody
      ref={api}
      position={pos} // Removed as any
      colliders={false}
      linearDamping={2}
      angularDamping={0.8}
      friction={0.1}
    >
      <CuboidCollider args={[0.38, 1.27, 0.38]} />
      <CuboidCollider args={[1.27, 0.38, 0.38]} />
      <CuboidCollider args={[0.38, 0.38, 1.27]} />
      {children ?? <Model color={color} roughness={roughness} />}
      {accent && <pointLight intensity={4} distance={2.5} color={color} />}
    </RigidBody>
  );
}

function Pointer({ vec = new THREE.Vector3() }) { // Removed type annotation for props
  const ref = useRef(null); // Removed <any>
  useFrame(({ mouse, viewport }) => {
    ref.current?.setNextKinematicTranslation(
      vec.set((mouse.x * viewport.width) / 2, (mouse.y * viewport.height) / 2, 0)
    );
  });
  return (
    <RigidBody type="kinematicPosition" colliders={false} ref={ref}>
      <BallCollider args={[1]} />
    </RigidBody>
  );
}

function Model({
  children,
  color = 'white',
  roughness = 0,
}) { // Removed type annotation for props
  const ref = useRef(null); // Removed <THREE.Mesh>(null!)
  const { nodes, materials } = useGLTF('/c-transformed.glb');
  useFrame((_, dt) => {
    // Removed type assertion for material. It will be dynamic now.
    easing.dampC(ref.current.material.color, color, 0.2, dt); // Removed as any
  });

  return (
    <mesh
      ref={ref}
      castShadow
      receiveShadow
      scale={10}
      geometry={nodes.connector.geometry} // Removed as any
    >
      <meshStandardMaterial
        color={color}
        metalness={0.2}
        roughness={roughness}
        map={materials.base.map} // Removed as any
      />
      {children}
    </mesh>
  );
}

useGLTF.preload('/c-transformed.glb');