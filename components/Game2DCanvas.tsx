// Game2DCanvas - Main 2D game rendering component (Zelda ALTTP style)
import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Game2DCanvasProps, PlayerState, GameItem, ItemType, Enemy, PlayerAction, EnemyType } from '../types';
import { GAME_CONFIG, INITIAL_MAP, COLORS } from '../constants';
import { renderTileMap } from '../engine/TileRenderer';
import { createPlayerState, drawPlayer, updatePlayer, isOnCheckpoint } from '../engine/Player2D';
import { drawItems, checkItemCollision } from '../engine/ItemRenderer';
import { drawEnemies } from '../engine/EnemyRenderer';
import { updateEnemies, createEnemy } from '../engine/Enemy';
import {
    startAttack,
    updateAttack,
    getAttackHitbox,
    checkHitEnemy,
    damageEnemy,
    checkEnemyHitsPlayer,
    damagePlayer,
    COMBAT_CONFIG
} from '../engine/Combat';

// Initiale Gegner für die Karte
const INITIAL_ENEMIES: Enemy[] = [
    createEnemy(1, 5 * 16, 6 * 16, EnemyType.INDULGENCE_SELLER, [
        { x: 3 * 16, y: 6 * 16 },
        { x: 7 * 16, y: 6 * 16 },
    ]),
    createEnemy(2, 14 * 16, 6 * 16, EnemyType.INDULGENCE_SELLER, [
        { x: 12 * 16, y: 6 * 16 },
        { x: 16 * 16, y: 6 * 16 },
    ]),
    createEnemy(3, 9 * 16, 10 * 16, EnemyType.GUARD, [
        { x: 6 * 16, y: 10 * 16 },
        { x: 11 * 16, y: 10 * 16 },
    ]),
];

const Game2DCanvas: React.FC<Game2DCanvasProps> = ({
    gameState,
    onReachCheckpoint,
    onCollect,
    onHit,
    onEnemyKill,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playerRef = useRef<PlayerState>(createPlayerState(INITIAL_MAP.startX, INITIAL_MAP.startY));
    const itemsRef = useRef<GameItem[]>([...INITIAL_MAP.items.map(item => ({ ...item }))]);
    const enemiesRef = useRef<Enemy[]>(INITIAL_ENEMIES.map(e => ({ ...e })));
    const keysRef = useRef({ up: false, down: false, left: false, right: false, attack: false });
    const frameRef = useRef(0);
    const animationIdRef = useRef<number>(0);
    const checkpointTriggeredRef = useRef(false);
    const lastTimeRef = useRef(0);
    const attackPressedRef = useRef(false);

    // Reset game state when starting new game
    useEffect(() => {
        if (gameState === GameState.PLAYING) {
            playerRef.current = createPlayerState(INITIAL_MAP.startX, INITIAL_MAP.startY);
            itemsRef.current = [...INITIAL_MAP.items.map(item => ({ ...item, collected: false }))];
            enemiesRef.current = INITIAL_ENEMIES.map(e => ({ ...e, health: e.maxHealth, state: 'patrol' as const }));
            checkpointTriggeredRef.current = false;
        }
    }, [gameState]);

    // Keyboard input handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    keysRef.current.up = true;
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    keysRef.current.down = true;
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    keysRef.current.left = true;
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    keysRef.current.right = true;
                    e.preventDefault();
                    break;
                case ' ':  // Leertaste für Angriff
                    keysRef.current.attack = true;
                    e.preventDefault();
                    break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    keysRef.current.up = false;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    keysRef.current.down = false;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    keysRef.current.left = false;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    keysRef.current.right = false;
                    break;
                case ' ':
                    keysRef.current.attack = false;
                    attackPressedRef.current = false;
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Main game loop
    const gameLoop = useCallback((timestamp: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate delta time
        const deltaTime = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        frameRef.current++;
        const frame = frameRef.current;

        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate camera position (center on player)
        const cameraX = Math.max(0, Math.min(
            playerRef.current.x - GAME_CONFIG.CANVAS_WIDTH / 2 + GAME_CONFIG.TILE_SIZE / 2,
            INITIAL_MAP.width * GAME_CONFIG.TILE_SIZE - GAME_CONFIG.CANVAS_WIDTH
        ));
        const cameraY = Math.max(0, Math.min(
            playerRef.current.y - GAME_CONFIG.CANVAS_HEIGHT / 2 + GAME_CONFIG.TILE_SIZE / 2,
            INITIAL_MAP.height * GAME_CONFIG.TILE_SIZE - GAME_CONFIG.CANVAS_HEIGHT
        ));

        // Render tile map
        renderTileMap(ctx, INITIAL_MAP.tiles, cameraX, cameraY);

        // Render items
        drawItems(ctx, itemsRef.current, frame, cameraX, cameraY);

        // Update and render enemies
        ctx.save();
        ctx.translate(-cameraX, -cameraY);
        drawEnemies(ctx, enemiesRef.current, frame, cameraX, cameraY);
        ctx.restore();

        // Update game logic (only if playing)
        if (gameState === GameState.PLAYING) {
            // Handle attack input
            if (keysRef.current.attack && !attackPressedRef.current) {
                attackPressedRef.current = true;
                playerRef.current = startAttack(playerRef.current, frame);
            }

            // Update attack animation
            if (playerRef.current.action === PlayerAction.ATTACKING) {
                playerRef.current = updateAttack(playerRef.current, frame);

                // Check attack hits on enemies (during active frames)
                if (playerRef.current.attackFrame >= 4 && playerRef.current.attackFrame <= 10) {
                    const hitbox = getAttackHitbox(playerRef.current);

                    enemiesRef.current = enemiesRef.current.map(enemy => {
                        if (checkHitEnemy(hitbox, enemy, frame)) {
                            const damaged = damageEnemy(enemy, COMBAT_CONFIG.PLAYER_DAMAGE, frame);
                            if (damaged.state === 'dead' && onEnemyKill) {
                                onEnemyKill();
                            }
                            return damaged;
                        }
                        return enemy;
                    });
                }
            }

            // Update player position (if not attacking)
            if (playerRef.current.action !== PlayerAction.ATTACKING) {
                playerRef.current = updatePlayer(
                    playerRef.current,
                    keysRef.current,
                    INITIAL_MAP,
                    deltaTime
                );
            }

            // Update enemies
            enemiesRef.current = updateEnemies(
                enemiesRef.current,
                playerRef.current,
                INITIAL_MAP,
                frame
            );

            // Check enemy collisions with player
            for (const enemy of enemiesRef.current) {
                if (checkEnemyHitsPlayer(enemy, playerRef.current, frame)) {
                    playerRef.current = damagePlayer(playerRef.current, frame);
                    onHit();
                    break;
                }
            }

            // Check item collisions
            const collectedItem = checkItemCollision(
                playerRef.current.x,
                playerRef.current.y,
                itemsRef.current
            );

            if (collectedItem) {
                collectedItem.collected = true;
                if (collectedItem.type === ItemType.GRACE) {
                    onCollect();
                } else if (collectedItem.type === ItemType.INDULGENCE) {
                    onHit();
                }
            }

            // Check checkpoint (only if all enemies dead or none required)
            const aliveEnemies = enemiesRef.current.filter(e => e.state !== 'dead').length;
            if (!checkpointTriggeredRef.current &&
                isOnCheckpoint(playerRef.current, INITIAL_MAP) &&
                aliveEnemies === 0) {
                checkpointTriggeredRef.current = true;
                onReachCheckpoint();
            }
        }

        // Draw player (adjusted for camera)
        ctx.save();
        ctx.translate(-cameraX, -cameraY);
        drawPlayer(ctx, playerRef.current, frame);
        ctx.restore();

        // Draw attack hint if enemies alive
        if (gameState === GameState.PLAYING) {
            const aliveEnemies = enemiesRef.current.filter(e => e.state !== 'dead').length;
            if (aliveEnemies > 0) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(GAME_CONFIG.CANVAS_WIDTH / 2 - 60, GAME_CONFIG.CANVAS_HEIGHT - 16, 120, 14);
                ctx.fillStyle = '#ffffff';
                ctx.font = '8px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Leertaste = Angriff (${aliveEnemies} Gegner)`, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT - 6);
            }
        }

        // Continue loop
        animationIdRef.current = requestAnimationFrame(gameLoop);
    }, [gameState, onCollect, onHit, onReachCheckpoint, onEnemyKill]);

    // Start/stop game loop
    useEffect(() => {
        animationIdRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
        };
    }, [gameLoop]);

    // Handle canvas scaling for pixel-perfect rendering
    const scaledWidth = GAME_CONFIG.CANVAS_WIDTH * GAME_CONFIG.SCALE;
    const scaledHeight = GAME_CONFIG.CANVAS_HEIGHT * GAME_CONFIG.SCALE;

    return (
        <div
            className="flex items-center justify-center w-full h-full"
            style={{ backgroundColor: '#000000' }}
        >
            <canvas
                ref={canvasRef}
                width={GAME_CONFIG.CANVAS_WIDTH}
                height={GAME_CONFIG.CANVAS_HEIGHT}
                style={{
                    width: scaledWidth,
                    height: scaledHeight,
                    imageRendering: 'pixelated',
                }}
            />
        </div>
    );
};

export default Game2DCanvas;
