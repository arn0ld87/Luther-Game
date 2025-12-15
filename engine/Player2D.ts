// Player2D - Player rendering and state management
import { COLORS, GAME_CONFIG } from '../constants';
import { Direction, PlayerState, PlayerAction, MapData, TileType } from '../types';
import { COMBAT_CONFIG } from './Combat';

const TILE_SIZE = GAME_CONFIG.TILE_SIZE;

/**
 * Create initial player state
 */
export function createPlayerState(startX: number, startY: number): PlayerState {
    return {
        x: startX,
        y: startY,
        direction: Direction.DOWN,
        isMoving: false,
        animFrame: 0,
        action: PlayerAction.IDLE,
        attackFrame: 0,
        attackCooldown: 0,
        invulnerableUntil: 0,
    };
}

/**
 * Draw Luther sprite (programmatic pixel art)
 */
export function drawPlayer(
    ctx: CanvasRenderingContext2D,
    player: PlayerState,
    frameCount: number
): void {
    const { x, y, direction, isMoving, action, attackFrame } = player;

    // Animation frame for walking (cycle through 0-3)
    const walkFrame = isMoving ? Math.floor(frameCount / GAME_CONFIG.ANIM_SPEED) % 4 : 0;

    // Save context for transformations
    ctx.save();
    ctx.translate(x, y);

    // Blink-Effekt wenn verletzt
    if (action === PlayerAction.HURT && Math.floor(frameCount / 4) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Slight bob when walking
    const yOffset = isMoving ? Math.sin(walkFrame * Math.PI / 2) * 1 : 0;
    ctx.translate(0, yOffset);

    drawLutherSprite(ctx, direction, walkFrame, isMoving, action, attackFrame);

    // Zeichne Angriffs-Effekt (Bibel/Thesen)
    if (action === PlayerAction.ATTACKING && attackFrame >= 4 && attackFrame <= 12) {
        drawAttackEffect(ctx, direction, attackFrame);
    }

    ctx.restore();
}

/**
 * Draw attack effect (Bibel/Thesen flying out)
 */
function drawAttackEffect(
    ctx: CanvasRenderingContext2D,
    direction: Direction,
    attackFrame: number
): void {
    const progress = (attackFrame - 4) / 8; // 0 to 1
    const distance = progress * COMBAT_CONFIG.ATTACK_RANGE;

    ctx.save();

    // Position based on direction
    let offsetX = 0;
    let offsetY = 0;
    switch (direction) {
        case Direction.UP:
            offsetY = -distance - 8;
            offsetX = 4;
            break;
        case Direction.DOWN:
            offsetY = distance + 8;
            offsetX = 4;
            break;
        case Direction.LEFT:
            offsetX = -distance - 8;
            offsetY = 4;
            break;
        case Direction.RIGHT:
            offsetX = distance + 16;
            offsetY = 4;
            break;
    }

    ctx.translate(offsetX, offsetY);

    // Rotation animation
    ctx.rotate(progress * Math.PI * 2);

    // Draw book/theses (small rectangle)
    ctx.fillStyle = '#f5f5dc'; // Parchment color
    ctx.fillRect(-4, -3, 8, 6);

    // Book spine
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(-4, -3, 2, 6);

    // Cross on cover
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(0, -2, 1, 4);
    ctx.fillRect(-1, -1, 3, 1);

    ctx.restore();
}

/**
 * Draw Luther as 16x16 pixel art sprite
 */
function drawLutherSprite(
    ctx: CanvasRenderingContext2D,
    direction: Direction,
    walkFrame: number,
    isMoving: boolean,
    action: PlayerAction,
    attackFrame: number
): void {
    // Colors for Luther
    const robeColor = COLORS.player;      // Dark red/brown robe
    const skinColor = COLORS.playerSkin;  // Skin
    const hairColor = '#2c1810';          // Dark hair
    const outlineColor = '#1a0f0a';       // Dark outline

    // Draw based on direction
    switch (direction) {
        case Direction.DOWN:
            drawLutherFront(ctx, robeColor, skinColor, hairColor, outlineColor, walkFrame, isMoving, action, attackFrame);
            break;
        case Direction.UP:
            drawLutherBack(ctx, robeColor, skinColor, hairColor, outlineColor, walkFrame, isMoving, action, attackFrame);
            break;
        case Direction.LEFT:
            drawLutherSide(ctx, robeColor, skinColor, hairColor, outlineColor, walkFrame, isMoving, true, action, attackFrame);
            break;
        case Direction.RIGHT:
            drawLutherSide(ctx, robeColor, skinColor, hairColor, outlineColor, walkFrame, isMoving, false, action, attackFrame);
            break;
    }
}

/**
 * Draw Luther facing down (front view)
 */
function drawLutherFront(
    ctx: CanvasRenderingContext2D,
    robe: string,
    skin: string,
    hair: string,
    outline: string,
    frame: number,
    isMoving: boolean,
    action: PlayerAction,
    attackFrame: number
): void {
    // Head/hair (top)
    ctx.fillStyle = hair;
    ctx.fillRect(5, 0, 6, 3);
    ctx.fillRect(4, 1, 8, 2);

    // Face
    ctx.fillStyle = skin;
    ctx.fillRect(5, 3, 6, 4);
    ctx.fillRect(4, 4, 8, 2);

    // Eyes
    ctx.fillStyle = outline;
    ctx.fillRect(6, 4, 1, 1);
    ctx.fillRect(9, 4, 1, 1);

    // Robe body
    ctx.fillStyle = robe;
    ctx.fillRect(4, 7, 8, 7);
    ctx.fillRect(3, 8, 10, 5);

    // Robe outline/shadow
    ctx.fillStyle = outline;
    ctx.fillRect(3, 7, 1, 1);
    ctx.fillRect(12, 7, 1, 1);

    // Arm animation for attack
    if (action === PlayerAction.ATTACKING) {
        ctx.fillStyle = robe;
        const armExtend = attackFrame < 8 ? (attackFrame / 8) * 4 : ((16 - attackFrame) / 8) * 4;
        ctx.fillRect(12, 8, 2 + armExtend, 3);

        // Hand with book
        ctx.fillStyle = skin;
        ctx.fillRect(13 + armExtend, 9, 2, 2);
    }

    // Feet (animate when walking)
    ctx.fillStyle = '#3d2817';
    if (isMoving) {
        const legOffset = frame % 2 === 0 ? 0 : 1;
        ctx.fillRect(5 - legOffset, 14, 2, 2);
        ctx.fillRect(9 + legOffset, 14, 2, 2);
    } else {
        ctx.fillRect(5, 14, 2, 2);
        ctx.fillRect(9, 14, 2, 2);
    }
}

/**
 * Draw Luther facing up (back view)
 */
function drawLutherBack(
    ctx: CanvasRenderingContext2D,
    robe: string,
    skin: string,
    hair: string,
    outline: string,
    frame: number,
    isMoving: boolean,
    action: PlayerAction,
    attackFrame: number
): void {
    // Head/hair (rounder from back)
    ctx.fillStyle = hair;
    ctx.fillRect(5, 0, 6, 4);
    ctx.fillRect(4, 1, 8, 4);
    ctx.fillRect(5, 5, 6, 2);

    // Robe body (same as front)
    ctx.fillStyle = robe;
    ctx.fillRect(4, 7, 8, 7);
    ctx.fillRect(3, 8, 10, 5);

    // Cross on back (white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 8, 2, 4);
    ctx.fillRect(6, 9, 4, 2);

    // Arm animation for attack
    if (action === PlayerAction.ATTACKING) {
        ctx.fillStyle = robe;
        const armExtend = attackFrame < 8 ? (attackFrame / 8) * 4 : ((16 - attackFrame) / 8) * 4;
        ctx.fillRect(12, 8, 2 + armExtend, 3);
    }

    // Feet
    ctx.fillStyle = '#3d2817';
    if (isMoving) {
        const legOffset = frame % 2 === 0 ? 0 : 1;
        ctx.fillRect(5 - legOffset, 14, 2, 2);
        ctx.fillRect(9 + legOffset, 14, 2, 2);
    } else {
        ctx.fillRect(5, 14, 2, 2);
        ctx.fillRect(9, 14, 2, 2);
    }
}

/**
 * Draw Luther facing left or right (side view)
 */
function drawLutherSide(
    ctx: CanvasRenderingContext2D,
    robe: string,
    skin: string,
    hair: string,
    outline: string,
    frame: number,
    isMoving: boolean,
    facingLeft: boolean,
    action: PlayerAction,
    attackFrame: number
): void {
    ctx.save();

    // Flip for right-facing
    if (!facingLeft) {
        ctx.translate(16, 0);
        ctx.scale(-1, 1);
    }

    // Head/hair
    ctx.fillStyle = hair;
    ctx.fillRect(5, 0, 6, 3);
    ctx.fillRect(4, 1, 7, 3);
    ctx.fillRect(3, 2, 2, 2);

    // Face (side profile)
    ctx.fillStyle = skin;
    ctx.fillRect(3, 3, 3, 4);
    ctx.fillRect(5, 4, 4, 2);

    // Eye
    ctx.fillStyle = outline;
    ctx.fillRect(4, 4, 1, 1);

    // Robe body
    ctx.fillStyle = robe;
    ctx.fillRect(5, 7, 6, 7);
    ctx.fillRect(4, 8, 8, 5);

    // Arm (attack animation)
    if (action === PlayerAction.ATTACKING) {
        const armExtend = attackFrame < 8 ? (attackFrame / 8) * 6 : ((16 - attackFrame) / 8) * 6;
        ctx.fillRect(0 - armExtend, 9, 4 + armExtend, 3);
        // Hand
        ctx.fillStyle = skin;
        ctx.fillRect(-1 - armExtend, 10, 2, 2);
    } else if (isMoving && frame % 2 === 0) {
        ctx.fillRect(3, 9, 2, 4);
    } else {
        ctx.fillRect(4, 9, 2, 4);
    }

    // Feet
    ctx.fillStyle = '#3d2817';
    if (isMoving) {
        const legOffset = (frame % 4) - 1;
        ctx.fillRect(6, 14, 2, 2);
        ctx.fillRect(8 + legOffset, 14, 2, 2);
    } else {
        ctx.fillRect(6, 14, 2, 2);
        ctx.fillRect(8, 14, 2, 2);
    }

    ctx.restore();
}

/**
 * Update player position based on input
 */
export function updatePlayer(
    player: PlayerState,
    keys: { up: boolean; down: boolean; left: boolean; right: boolean },
    mapData: MapData,
    deltaTime: number
): PlayerState {
    // Don't move while attacking
    if (player.action === PlayerAction.ATTACKING) {
        return player;
    }

    // Don't move while hurt (brief stun)
    if (player.action === PlayerAction.HURT) {
        return { ...player, action: PlayerAction.IDLE };
    }

    let { x, y, direction, isMoving, animFrame, action, attackFrame, attackCooldown, invulnerableUntil } = player;
    let dx = 0;
    let dy = 0;

    // Calculate movement direction
    if (keys.up) {
        dy = -GAME_CONFIG.PLAYER_SPEED;
        direction = Direction.UP;
    } else if (keys.down) {
        dy = GAME_CONFIG.PLAYER_SPEED;
        direction = Direction.DOWN;
    }

    if (keys.left) {
        dx = -GAME_CONFIG.PLAYER_SPEED;
        direction = Direction.LEFT;
    } else if (keys.right) {
        dx = GAME_CONFIG.PLAYER_SPEED;
        direction = Direction.RIGHT;
    }

    isMoving = dx !== 0 || dy !== 0;
    action = isMoving ? PlayerAction.WALKING : PlayerAction.IDLE;

    // Apply movement with collision detection
    if (dx !== 0 || dy !== 0) {
        const newX = x + dx;
        const newY = y + dy;

        // Check collision at new position (check corners of player hitbox)
        const hitboxPadding = 2;
        const hitboxWidth = TILE_SIZE - hitboxPadding * 2;
        const hitboxHeight = TILE_SIZE - hitboxPadding * 2;

        // Check horizontal movement
        if (dx !== 0) {
            const checkX = dx > 0 ? newX + hitboxPadding + hitboxWidth : newX + hitboxPadding;
            const topTileY = Math.floor((y + hitboxPadding) / TILE_SIZE);
            const bottomTileY = Math.floor((y + hitboxPadding + hitboxHeight - 1) / TILE_SIZE);
            const checkTileX = Math.floor(checkX / TILE_SIZE);

            if (!isBlocked(mapData, checkTileX, topTileY) && !isBlocked(mapData, checkTileX, bottomTileY)) {
                x = newX;
            }
        }

        // Check vertical movement
        if (dy !== 0) {
            const checkY = dy > 0 ? newY + hitboxPadding + hitboxHeight : newY + hitboxPadding;
            const leftTileX = Math.floor((x + hitboxPadding) / TILE_SIZE);
            const rightTileX = Math.floor((x + hitboxPadding + hitboxWidth - 1) / TILE_SIZE);
            const checkTileY = Math.floor(checkY / TILE_SIZE);

            if (!isBlocked(mapData, leftTileX, checkTileY) && !isBlocked(mapData, rightTileX, checkTileY)) {
                y = newY;
            }
        }

        // Clamp to map bounds
        x = Math.max(0, Math.min(x, (mapData.width - 1) * TILE_SIZE));
        y = Math.max(0, Math.min(y, (mapData.height - 1) * TILE_SIZE));

        animFrame++;
    }

    return { x, y, direction, isMoving, animFrame, action, attackFrame, attackCooldown, invulnerableUntil };
}

/**
 * Check if a tile is blocked (collision)
 */
function isBlocked(mapData: MapData, tileX: number, tileY: number): boolean {
    if (tileY < 0 || tileY >= mapData.collisions.length) return true;
    if (tileX < 0 || tileX >= mapData.collisions[0].length) return true;
    return mapData.collisions[tileY][tileX];
}

/**
 * Check if player is on checkpoint tile
 */
export function isOnCheckpoint(player: PlayerState, mapData: MapData): boolean {
    const centerX = player.x + TILE_SIZE / 2;
    const centerY = player.y + TILE_SIZE / 2;
    const tileX = Math.floor(centerX / TILE_SIZE);
    const tileY = Math.floor(centerY / TILE_SIZE);

    if (tileY >= 0 && tileY < mapData.tiles.length && tileX >= 0 && tileX < mapData.tiles[0].length) {
        return mapData.tiles[tileY][tileX] === TileType.CHECKPOINT;
    }
    return false;
}
