import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { GameState } from '../types';
import { COLORS, GAME_CONFIG } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  onReachCheckpoint: () => void;
  customTexture: string | null;
  onCollect: () => void;
  onHit: () => void;
}

interface GameItem {
  id: number;
  x: number;
  z: number;
  type: 'good' | 'bad';
  active: boolean;
}

// ---- GAME ASSETS ----

const Player: React.FC<{ position: [number, number, number]; tilt: number }> = ({ position, tilt }) => {
  const mesh = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (mesh.current) {
      // Bobbing animation
      const yOffset = Math.sin(state.clock.elapsedTime * GAME_CONFIG.PLAYER_BOBBING_SPEED) * GAME_CONFIG.PLAYER_BOBBING_AMPLITUDE;
      mesh.current.position.y = position[1] + yOffset;
      mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, position[0], GAME_CONFIG.PLAYER_LERP_FACTOR);
      mesh.current.position.z = position[2];
      // Tilting when moving left/right
      mesh.current.rotation.z = THREE.MathUtils.lerp(mesh.current.rotation.z, -tilt * GAME_CONFIG.PLAYER_TILT_FACTOR, GAME_CONFIG.PLAYER_LERP_FACTOR);
    }
  });

  return (
    <group ref={mesh} position={position}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
        <meshStandardMaterial color={COLORS.player} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.3]} />
        <meshStandardMaterial color={COLORS.playerHead} />
      </mesh>
      {/* Simple Lantern Light */}
      <pointLight position={[0, 0.5, 0.5]} distance={5} intensity={1} color="orange" />
    </group>
  );
};

const Item: React.FC<{ position: [number, number, number]; type: 'good' | 'bad' }> = ({ position, type }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += GAME_CONFIG.ITEM_ROTATION_SPEED;
      ref.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * GAME_CONFIG.ITEM_FLOAT_SPEED + position[0]) * GAME_CONFIG.ITEM_FLOAT_AMPLITUDE;
    }
  });

  return (
    <group position={position}>
      {type === 'good' ? (
        <mesh ref={ref}>
          <boxGeometry args={[0.6, 0.8, 0.2]} />
          <meshStandardMaterial color={COLORS.graceItem} emissive={COLORS.graceEmissive} emissiveIntensity={0.2} />
        </mesh>
      ) : (
        <mesh ref={ref}>
          <dodecahedronGeometry args={[0.5]} />
          <meshStandardMaterial color={COLORS.indulgenceItem} />
        </mesh>
      )}
      <Text position={[0, 1.2, 0]} fontSize={0.3} color="white">
        {type === 'good' ? "Gnade" : "Ablass"}
      </Text>
    </group>
  );
};

const Floor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -50]}>
      <planeGeometry args={[GAME_CONFIG.FLOOR_WIDTH, GAME_CONFIG.FLOOR_LENGTH]} />
      <meshStandardMaterial color={COLORS.ground} roughness={0.8} />
    </mesh>
  );
};

// Gate component with optional custom texture
const Gate: React.FC<{ customTexture: string | null }> = ({ customTexture }) => {
  const textureRef = useRef<THREE.Texture | null>(null);

  // Load texture only when customTexture changes
  useEffect(() => {
    if (customTexture) {
      const loader = new THREE.TextureLoader();
      textureRef.current = loader.load(customTexture);
    } else {
      textureRef.current = null;
    }

    // Cleanup texture on unmount
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, [customTexture]);

  return (
    <group position={[0, 0, GAME_CONFIG.GATE_Z]}>
      {/* Left pillar */}
      <mesh position={[-4, 3, 0]}>
        <boxGeometry args={[1, 6, 1]} />
        <meshStandardMaterial color={COLORS.gatePillar} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[4, 3, 0]}>
        <boxGeometry args={[1, 6, 1]} />
        <meshStandardMaterial color={COLORS.gatePillar} />
      </mesh>
      {/* Top bar */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[10, 1, 1]} />
        <meshStandardMaterial color={COLORS.gateTop} />
      </mesh>
      {/* Gate plane with optional texture */}
      <mesh position={[0, 3, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial
          color={customTexture ? "white" : COLORS.gatePlane}
          map={textureRef.current}
        />
      </mesh>
    </group>
  );
};

// ---- MAIN SCENE LOGIC ----

const Scene = ({ gameState, onReachCheckpoint, customTexture, onCollect, onHit }: GameCanvasProps) => {
  const [playerZ, setPlayerZ] = useState(0);
  const [playerX, setPlayerX] = useState(0);
  const [tilt, setTilt] = useState(0);

  // Track inputs
  const inputs = useRef({ left: false, right: false });
  const checkpointTriggeredRef = useRef(false);

  // Access Three.js renderer for cleanup
  const { gl } = useThree();

  // Generate Items for this run
  const initialItems = useMemo((): GameItem[] => {
    const arr: GameItem[] = [];
    for (let z = GAME_CONFIG.ITEM_START_Z; z > GAME_CONFIG.ITEM_END_Z; z -= GAME_CONFIG.ITEM_SPACING) {
      const x = (Math.random() - 0.5) * GAME_CONFIG.ITEM_SPREAD;
      const type = Math.random() < GAME_CONFIG.ITEM_GOOD_CHANCE ? 'good' : 'bad';
      arr.push({ id: Math.abs(z), x, z, type, active: true });
    }
    return arr;
  }, []);

  const itemsRef = useRef<GameItem[]>(initialItems);

  // Reset items when component remounts
  useEffect(() => {
    itemsRef.current = initialItems.map(item => ({ ...item, active: true }));
    checkpointTriggeredRef.current = false;
    setPlayerZ(0);
    setPlayerX(0);
    setTilt(0);
  }, [initialItems]);

  // Keyboard input handlers
  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') inputs.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') inputs.current.right = true;
    };
    const handleUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') inputs.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') inputs.current.right = false;
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);

    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  // Cleanup Three.js resources on unmount
  useEffect(() => {
    return () => {
      // Dispose of renderer resources
      gl.dispose();
    };
  }, [gl]);

  // Memoized collision check function
  const checkCollisions = useCallback((currentPlayerX: number, currentPlayerZ: number) => {
    itemsRef.current.forEach((item) => {
      if (!item.active) return;

      const dz = Math.abs(item.z - currentPlayerZ);
      const dx = Math.abs(item.x - currentPlayerX);

      if (dz < GAME_CONFIG.COLLISION_RADIUS_Z && dx < GAME_CONFIG.COLLISION_RADIUS_X) {
        item.active = false;
        if (item.type === 'good') {
          onCollect();
        } else {
          onHit();
        }
      }
    });
  }, [onCollect, onHit]);

  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING) return;

    // Lateral Movement
    let moveX = 0;
    if (inputs.current.left) moveX -= 1;
    if (inputs.current.right) moveX += 1;

    setTilt(moveX);

    setPlayerX((prev) => {
      const next = prev + moveX * delta * GAME_CONFIG.PLAYER_LATERAL_SPEED;
      return Math.max(GAME_CONFIG.PLAYER_BOUNDS.MIN, Math.min(GAME_CONFIG.PLAYER_BOUNDS.MAX, next));
    });

    // Forward Movement
    setPlayerZ((prev) => {
      const nextZ = prev - delta * GAME_CONFIG.PLAYER_SPEED;

      // Checkpoint logic
      if (nextZ < GAME_CONFIG.CHECKPOINT_Z && !checkpointTriggeredRef.current) {
        checkpointTriggeredRef.current = true;
        onReachCheckpoint();
      }

      return nextZ;
    });

    // Camera Follow
    state.camera.position.z = playerZ + GAME_CONFIG.CAMERA_FOLLOW_OFFSET_Z;
    state.camera.position.x = playerX * GAME_CONFIG.CAMERA_SWAY_FACTOR;
    state.camera.lookAt(0, 0, playerZ - GAME_CONFIG.CAMERA_LOOK_AHEAD);

    // Collision Detection
    checkCollisions(playerX, playerZ);
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 5]} intensity={1} castShadow />
      <Stars radius={100} depth={50} count={GAME_CONFIG.STARS_COUNT} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={[COLORS.fog, GAME_CONFIG.FOG_NEAR, GAME_CONFIG.FOG_FAR]} />

      <Player position={[playerX, 0, playerZ]} tilt={tilt} />
      <Floor />

      {/* Render Items */}
      {itemsRef.current.map((item) =>
        item.active ? <Item key={item.id} position={[item.x, 0, item.z]} type={item.type} /> : null
      )}

      {/* The Gate at the end */}
      <Gate customTexture={customTexture} />

      {/* Environment Markers */}
      <gridHelper args={[GAME_CONFIG.FLOOR_LENGTH, 50, COLORS.path, COLORS.ground]} position={[0, -0.1, -50]} />
    </>
  );
};

const GameCanvas: React.FC<GameCanvasProps> = (props) => {
  return (
    <Canvas shadows camera={{ position: [0, 4, 6], fov: 60 }}>
      <Scene {...props} />
      {props.gameState === GameState.MENU && <OrbitControls autoRotate />}
    </Canvas>
  );
};

export default GameCanvas;
