// ItemRenderer - Draws collectible items with animation
import { COLORS, GAME_CONFIG } from '../constants';
import { GameItem, ItemType } from '../types';

const TILE_SIZE = GAME_CONFIG.TILE_SIZE;

/**
 * Draw all items on the map
 */
export function drawItems(
    ctx: CanvasRenderingContext2D,
    items: GameItem[],
    frameCount: number,
    cameraX: number = 0,
    cameraY: number = 0
): void {
    items.forEach(item => {
        if (!item.collected) {
            drawItem(ctx, item, frameCount, cameraX, cameraY);
        }
    });
}

/**
 * Draw a single item with floating animation
 */
function drawItem(
    ctx: CanvasRenderingContext2D,
    item: GameItem,
    frameCount: number,
    cameraX: number,
    cameraY: number
): void {
    const screenX = item.x - cameraX;
    const screenY = item.y - cameraY;

    // Skip if off-screen
    if (screenX < -TILE_SIZE || screenX > GAME_CONFIG.CANVAS_WIDTH ||
        screenY < -TILE_SIZE || screenY > GAME_CONFIG.CANVAS_HEIGHT) {
        return;
    }

    // Floating animation (bob up and down)
    const floatOffset = Math.sin(frameCount * 0.1 + item.id) * 2;

    ctx.save();
    ctx.translate(screenX, screenY + floatOffset);

    switch (item.type) {
        case ItemType.GRACE:
            drawGraceItem(ctx, frameCount);
            break;
        case ItemType.INDULGENCE:
            drawIndulgenceItem(ctx, frameCount);
            break;
        case ItemType.SCROLL:
            drawScrollItem(ctx);
            break;
    }

    ctx.restore();
}

/**
 * Draw grace/gold item (like Zelda rupee)
 */
function drawGraceItem(ctx: CanvasRenderingContext2D, frameCount: number): void {
    // Sparkle effect
    const sparkle = Math.sin(frameCount * 0.2) > 0.5;

    // Diamond/rupee shape
    ctx.fillStyle = sparkle ? '#fffacd' : COLORS.graceItem;

    // Top point
    ctx.fillRect(7, 2, 2, 2);

    // Upper body
    ctx.fillRect(6, 4, 4, 2);
    ctx.fillRect(5, 6, 6, 2);

    // Middle (widest)
    ctx.fillRect(4, 8, 8, 2);

    // Lower body
    ctx.fillRect(5, 10, 6, 2);
    ctx.fillRect(6, 12, 4, 2);

    // Bottom point
    ctx.fillRect(7, 14, 2, 1);

    // Highlight
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 5, 1, 2);
    ctx.fillRect(5, 7, 1, 2);
}

/**
 * Draw indulgence item (red/evil looking)
 */
function drawIndulgenceItem(ctx: CanvasRenderingContext2D, frameCount: number): void {
    // Pulsing effect
    const pulse = Math.sin(frameCount * 0.15) * 0.3 + 0.7;

    // Skull-like shape to indicate danger
    ctx.fillStyle = COLORS.indulgenceItem;

    // Round skull
    ctx.fillRect(4, 3, 8, 6);
    ctx.fillRect(3, 4, 10, 4);
    ctx.fillRect(5, 2, 6, 2);

    // Eye sockets (dark)
    ctx.fillStyle = '#000000';
    ctx.fillRect(5, 5, 2, 2);
    ctx.fillRect(9, 5, 2, 2);

    // Nose
    ctx.fillRect(7, 7, 2, 1);

    // Jaw/teeth
    ctx.fillStyle = COLORS.indulgenceItem;
    ctx.fillRect(4, 9, 8, 3);
    ctx.fillRect(5, 12, 6, 2);

    // Teeth lines
    ctx.fillStyle = '#000000';
    ctx.fillRect(5, 10, 1, 2);
    ctx.fillRect(7, 10, 1, 2);
    ctx.fillRect(9, 10, 1, 2);
}

/**
 * Draw scroll item
 */
function drawScrollItem(ctx: CanvasRenderingContext2D): void {
    // Scroll body
    ctx.fillStyle = COLORS.scrollItem;
    ctx.fillRect(4, 4, 8, 10);

    // Scroll ends (rolled)
    ctx.fillStyle = '#d4c4a8';
    ctx.fillRect(3, 3, 10, 2);
    ctx.fillRect(3, 13, 10, 2);

    // Text lines (decoration)
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(5, 6, 6, 1);
    ctx.fillRect(5, 8, 5, 1);
    ctx.fillRect(5, 10, 6, 1);
}

/**
 * Check collision between player and items
 * Returns collected item or null
 */
export function checkItemCollision(
    playerX: number,
    playerY: number,
    items: GameItem[]
): GameItem | null {
    const playerCenterX = playerX + TILE_SIZE / 2;
    const playerCenterY = playerY + TILE_SIZE / 2;

    for (const item of items) {
        if (item.collected) continue;

        const itemCenterX = item.x + TILE_SIZE / 2;
        const itemCenterY = item.y + TILE_SIZE / 2;

        const dx = Math.abs(playerCenterX - itemCenterX);
        const dy = Math.abs(playerCenterY - itemCenterY);

        // Collision radius (half tile)
        if (dx < TILE_SIZE * 0.7 && dy < TILE_SIZE * 0.7) {
            return item;
        }
    }

    return null;
}
