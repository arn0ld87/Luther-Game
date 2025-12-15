// TileRenderer - Renders tiles to canvas with SNES Zelda style
import { COLORS, GAME_CONFIG } from '../constants';
import { TileType } from '../types';

const TILE_SIZE = GAME_CONFIG.TILE_SIZE;

/**
 * Draw a single tile to the canvas context
 */
export function drawTile(
    ctx: CanvasRenderingContext2D,
    tileType: TileType,
    x: number,
    y: number
): void {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    switch (tileType) {
        case TileType.GRASS:
            drawGrassTile(ctx, px, py);
            break;
        case TileType.PATH:
            drawPathTile(ctx, px, py);
            break;
        case TileType.WALL:
            drawWallTile(ctx, px, py);
            break;
        case TileType.WATER:
            drawWaterTile(ctx, px, py);
            break;
        case TileType.TREE:
            drawTreeTile(ctx, px, py);
            break;
        case TileType.BUILDING:
            drawBuildingTile(ctx, px, py);
            break;
        case TileType.DOOR:
            drawDoorTile(ctx, px, py);
            break;
        case TileType.CHECKPOINT:
            drawCheckpointTile(ctx, px, py);
            break;
        default:
            // Fallback - pink for unknown tiles
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    }
}

/**
 * Draw grass tile with subtle texture
 */
function drawGrassTile(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    // Base grass
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Add subtle grass texture (darker pixels)
    ctx.fillStyle = COLORS.grassDark;
    // Random-looking but deterministic pattern based on position
    const seed = (px * 7 + py * 13) % 16;
    if (seed < 3) {
        ctx.fillRect(px + 3, py + 5, 2, 2);
        ctx.fillRect(px + 10, py + 11, 2, 2);
    } else if (seed < 6) {
        ctx.fillRect(px + 7, py + 3, 2, 2);
        ctx.fillRect(px + 2, py + 12, 2, 2);
    } else if (seed < 9) {
        ctx.fillRect(px + 11, py + 7, 2, 2);
        ctx.fillRect(px + 5, py + 9, 2, 2);
    }
}

/**
 * Draw path/dirt tile
 */
function drawPathTile(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    ctx.fillStyle = COLORS.path;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Add subtle texture
    ctx.fillStyle = COLORS.pathDark;
    const seed = (px * 11 + py * 17) % 8;
    if (seed < 2) {
        ctx.fillRect(px + 4, py + 8, 3, 2);
    } else if (seed < 4) {
        ctx.fillRect(px + 9, py + 4, 2, 3);
    }
}

/**
 * Draw stone wall tile
 */
function drawWallTile(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Stone brick pattern
    ctx.fillStyle = COLORS.wallDark;
    ctx.fillRect(px, py + 7, TILE_SIZE, 1);
    ctx.fillRect(px + 8, py, 1, 7);
    ctx.fillRect(px, py + 8, 1, 8);
}

/**
 * Draw water tile with wave effect
 */
function drawWaterTile(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    ctx.fillStyle = COLORS.water;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Wave highlights
    ctx.fillStyle = COLORS.waterDark;
    ctx.fillRect(px + 2, py + 4, 4, 2);
    ctx.fillRect(px + 10, py + 10, 4, 2);
}

/**
 * Draw tree tile (top-down view)
 */
function drawTreeTile(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    // Ground beneath
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Tree trunk center
    ctx.fillStyle = COLORS.treeTrunk;
    ctx.fillRect(px + 6, py + 6, 4, 4);

    // Foliage (circular-ish)
    ctx.fillStyle = COLORS.tree;
    // Top
    ctx.fillRect(px + 4, py + 1, 8, 4);
    // Middle wider
    ctx.fillRect(px + 2, py + 4, 12, 5);
    // Bottom
    ctx.fillRect(px + 4, py + 9, 8, 4);
    // Very top
    ctx.fillRect(px + 6, py, 4, 2);
    // Sides
    ctx.fillRect(px + 1, py + 5, 2, 3);
    ctx.fillRect(px + 13, py + 5, 2, 3);
}

/**
 * Draw building tile (walls)
 */
function drawBuildingTile(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    ctx.fillStyle = COLORS.building;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Roof top section
    ctx.fillStyle = COLORS.buildingRoof;
    ctx.fillRect(px, py, TILE_SIZE, 4);

    // Window
    ctx.fillStyle = '#4a90d9';
    ctx.fillRect(px + 5, py + 7, 6, 6);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(px + 7, py + 7, 2, 6);
    ctx.fillRect(px + 5, py + 9, 6, 2);
}

/**
 * Draw door tile
 */
function drawDoorTile(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    // Building wall behind
    ctx.fillStyle = COLORS.building;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Door frame
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(px + 3, py + 4, 10, 12);

    // Door
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(px + 4, py + 5, 8, 11);

    // Handle
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(px + 10, py + 10, 2, 2);
}

/**
 * Draw checkpoint tile (church entrance / debate trigger)
 */
function drawCheckpointTile(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    // Path base
    ctx.fillStyle = COLORS.path;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Golden cross marker
    ctx.fillStyle = COLORS.graceItem;
    // Vertical beam
    ctx.fillRect(px + 7, py + 2, 2, 12);
    // Horizontal beam
    ctx.fillRect(px + 4, py + 5, 8, 2);
}

/**
 * Render the entire visible tile map
 */
export function renderTileMap(
    ctx: CanvasRenderingContext2D,
    tiles: number[][],
    cameraX: number = 0,
    cameraY: number = 0
): void {
    const startTileX = Math.floor(cameraX / TILE_SIZE);
    const startTileY = Math.floor(cameraY / TILE_SIZE);
    const tilesX = Math.ceil(GAME_CONFIG.CANVAS_WIDTH / TILE_SIZE) + 1;
    const tilesY = Math.ceil(GAME_CONFIG.CANVAS_HEIGHT / TILE_SIZE) + 1;

    for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
            const tileX = startTileX + x;
            const tileY = startTileY + y;

            if (tileY >= 0 && tileY < tiles.length && tileX >= 0 && tileX < tiles[0].length) {
                const screenX = x * TILE_SIZE - (cameraX % TILE_SIZE);
                const screenY = y * TILE_SIZE - (cameraY % TILE_SIZE);

                // Temporarily offset for drawing
                ctx.save();
                ctx.translate(screenX - x * TILE_SIZE, screenY - y * TILE_SIZE);
                drawTile(ctx, tiles[tileY][tileX], x, y);
                ctx.restore();
            }
        }
    }
}
