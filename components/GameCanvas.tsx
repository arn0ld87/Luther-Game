import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { GameState } from '../types';
import { COLORS } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  onReachCheckpoint: () => void;
  customTexture: string | null;
  onCollect: () => void;
  onHit: () => void;
}

// ---- GAME ASSETS ----

const Player: React.FC<{ position: [number, number, number], tilt: number }> = ({ position, tilt }) => {
  const mesh = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (mesh.current) {
        // Bobbing animation
        const yOffset = Math.sin(state.clock.elapsedTime * 10) * 0.1;
        mesh.current.position.y = position[1] + yOffset;
        mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, position[0], 0.1);
        mesh.current.position.z = position[2];
        // Tilting when moving left/right
        mesh.current.rotation.z = THREE.MathUtils.lerp(mesh.current.rotation.z, -tilt * 0.5, 0.1);
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
        <meshStandardMaterial color="#f1c40f" />
      </mesh>
      {/* Simple Lantern Light */}
      <pointLight position={[0, 0.5, 0.5]} distance={5} intensity={1} color="orange" />
    </group>
  );
};

const Item: React.FC<{ position: [number, number, number], type: 'good' | 'bad' }> = ({ position, type }) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if(ref.current) {
            ref.current.rotation.y += 0.02;
            ref.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 3 + position[0]) * 0.2;
        }
    });

    return (
        <group position={position}>
            {type === 'good' ? (
                <mesh ref={ref}>
                    <boxGeometry args={[0.6, 0.8, 0.2]} /> {/* Bible shape */}
                    <meshStandardMaterial color="gold" emissive="#f1c40f" emissiveIntensity={0.2} />
                </mesh>
            ) : (
                <mesh ref={ref}>
                    <dodecahedronGeometry args={[0.5]} /> {/* Money Bag / Stone */}
                    <meshStandardMaterial color="#c0392b" />
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
            <planeGeometry args={[20, 200]} />
            <meshStandardMaterial color="#2d3436" roughness={0.8} />
        </mesh>
    );
};

// ---- MAIN SCENE LOGIC ----

const Scene = ({ gameState, onReachCheckpoint, customTexture, onCollect, onHit }: GameCanvasProps) => {
  const [playerZ, setPlayerZ] = useState(0);
  const [playerX, setPlayerX] = useState(0);
  const [tilt, setTilt] = useState(0); // -1 left, 1 right
  
  // Track inputs
  const inputs = useRef({ left: false, right: false });

  // Generate Items for this run
  const items = useMemo(() => {
    const arr = [];
    for(let z = -10; z > -100; z -= 5) {
        // Randomly place items
        const x = (Math.random() - 0.5) * 8; // Spread between -4 and 4
        const type = Math.random() > 0.4 ? 'good' : 'bad';
        arr.push({ id: Math.abs(z), x, z, type, active: true });
    }
    return arr;
  }, []);
  
  const itemsRef = useRef(items);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
        if(e.key === 'ArrowLeft' || e.key === 'a') inputs.current.left = true;
        if(e.key === 'ArrowRight' || e.key === 'd') inputs.current.right = true;
    };
    const handleUp = (e: KeyboardEvent) => {
        if(e.key === 'ArrowLeft' || e.key === 'a') inputs.current.left = false;
        if(e.key === 'ArrowRight' || e.key === 'd') inputs.current.right = false;
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
        window.removeEventListener('keydown', handleDown);
        window.removeEventListener('keyup', handleUp);
    }
  }, []);

  useFrame((state, delta) => {
    if (gameState === GameState.PLAYING) {
        // Lateral Movement
        let moveX = 0;
        if (inputs.current.left) moveX -= 1;
        if (inputs.current.right) moveX += 1;
        
        setTilt(moveX);
        
        setPlayerX(prev => {
            const next = prev + moveX * delta * 8;
            return Math.max(-4, Math.min(4, next)); // Clamp within path
        });

        // Forward Movement
        setPlayerZ((prev) => {
            const speed = 8;
            const nextZ = prev - delta * speed; 
            
            // Checkpoint logic (Gate at -100)
            if (nextZ < -100) {
                 onReachCheckpoint();
            }
            return nextZ;
        });

        // Camera Follow
        state.camera.position.z = playerZ + 6;
        state.camera.position.x = playerX * 0.3; // Slight camera sway
        state.camera.lookAt(0, 0, playerZ - 10);

        // Collision Detection
        itemsRef.current.forEach(item => {
            if (!item.active) return;
            // Simple distance check
            const dz = item.z - playerZ;
            const dx = item.x - playerX;
            if (Math.abs(dz) < 1 && Math.abs(dx) < 1) {
                item.active = false;
                if (item.type === 'good') onCollect();
                else onHit();
            }
        });
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 5]} intensity={1} castShadow />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={['#1a1a1a', 5, 40]} />

      <Player position={[playerX, 0, playerZ]} tilt={tilt} />
      <Floor />

      {/* Render Items */}
      {itemsRef.current.map((item) => (
          item.active && <Item key={item.id} position={[item.x, 0, item.z]} type={item.type as any} />
      ))}

      {/* The Gate at the end */}
      <group position={[0, 0, -105]}>
         <mesh position={[-4, 3, 0]}>
            <boxGeometry args={[1, 6, 1]} />
            <meshStandardMaterial color="#bdc3c7" />
         </mesh>
         <mesh position={[4, 3, 0]}>
            <boxGeometry args={[1, 6, 1]} />
            <meshStandardMaterial color="#bdc3c7" />
         </mesh>
         <mesh position={[0, 5, 0]}>
            <boxGeometry args={[10, 1, 1]} />
            <meshStandardMaterial color="#ecf0f1" />
         </mesh>
         <mesh position={[0, 3, 0]}>
            <planeGeometry args={[6, 6]} />
            <meshStandardMaterial 
                color={customTexture ? "white" : "#2c3e50"} 
                map={customTexture ? new THREE.TextureLoader().load(customTexture) : undefined} 
            />
         </mesh>
      </group>

      {/* Environment Markers */}
      <gridHelper args={[200, 50, COLORS.path, COLORS.ground]} position={[0, -0.1, -50]} />
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