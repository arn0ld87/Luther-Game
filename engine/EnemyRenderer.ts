// EnemyRenderer.ts - Zeichnet Gegner mit Animation
import { COLORS, GAME_CONFIG } from '../constants';
import { Direction, Enemy, EnemyType } from '../types';

const TILE_SIZE = GAME_CONFIG.TILE_SIZE;

/**
 * Zeichne alle Gegner
 */
export function drawEnemies(
    ctx: CanvasRenderingContext2D,
    enemies: Enemy[],
    frameCount: number,
    cameraX: number = 0,
    cameraY: number = 0
): void {
    enemies.forEach(enemy => {
        if (enemy.state !== 'dead') {
            drawEnemy(ctx, enemy, frameCount, cameraX, cameraY);
        }
    });
}

/**
 * Zeichne einzelnen Gegner
 */
function drawEnemy(
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
    frameCount: number,
    cameraX: number,
    cameraY: number
): void {
    const screenX = enemy.x - cameraX;
    const screenY = enemy.y - cameraY;

    // Skip wenn außerhalb Bildschirm
    if (screenX < -TILE_SIZE || screenX > GAME_CONFIG.CANVAS_WIDTH ||
        screenY < -TILE_SIZE || screenY > GAME_CONFIG.CANVAS_HEIGHT) {
        return;
    }

    ctx.save();
    ctx.translate(screenX, screenY);

    // Blink-Effekt wenn verletzt
    if (enemy.state === 'hurt' && Math.floor(frameCount / 4) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    switch (enemy.type) {
        case EnemyType.INDULGENCE_SELLER:
            drawIndulgenceSeller(ctx, enemy, frameCount);
            break;
        case EnemyType.GUARD:
            drawGuard(ctx, enemy, frameCount);
            break;
        case EnemyType.TETZEL:
            drawTetzel(ctx, enemy, frameCount);
            break;
    }

    // Lebensbalken
    drawHealthBar(ctx, enemy);

    ctx.restore();
}

/**
 * Ablasshändler Sprite
 */
function drawIndulgenceSeller(
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
    frameCount: number
): void {
    const walkFrame = enemy.isMoving ? Math.floor(frameCount / 8) % 4 : 0;

    // Robe (Lila - Kirchenfarbe)
    const robeColor = '#6b3fa0';
    const skinColor = '#f5cba7';

    // Kopf
    ctx.fillStyle = skinColor;
    ctx.fillRect(5, 2, 6, 4);

    // Haare/Tonsur
    ctx.fillStyle = '#4a3520';
    ctx.fillRect(4, 1, 8, 2);
    ctx.fillRect(5, 3, 1, 1);
    ctx.fillRect(10, 3, 1, 1);

    // Körper (Kutte)
    ctx.fillStyle = robeColor;
    ctx.fillRect(3, 6, 10, 8);

    // Geldbeutel (charakteristisch)
    ctx.fillStyle = '#d4a43a';
    ctx.fillRect(10, 8, 4, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(11, 9, 2, 2);

    // Beine
    ctx.fillStyle = '#3d2817';
    const legOffset = walkFrame % 2;
    ctx.fillRect(5 - legOffset, 14, 2, 2);
    ctx.fillRect(9 + legOffset, 14, 2, 2);
}

/**
 * Wächter Sprite
 */
function drawGuard(
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
    frameCount: number
): void {
    const walkFrame = enemy.isMoving ? Math.floor(frameCount / 8) % 4 : 0;

    // Rüstung (Grau)
    const armorColor = '#7f8c8d';
    const armorDark = '#5d6d6e';
    const skinColor = '#f5cba7';

    // Helm
    ctx.fillStyle = armorColor;
    ctx.fillRect(4, 0, 8, 4);
    ctx.fillRect(3, 2, 10, 3);

    // Visier-Schlitz
    ctx.fillStyle = '#000000';
    ctx.fillRect(5, 3, 6, 1);

    // Körper (Brustpanzer)
    ctx.fillStyle = armorColor;
    ctx.fillRect(3, 5, 10, 8);

    // Schulterplatten
    ctx.fillStyle = armorDark;
    ctx.fillRect(1, 5, 3, 4);
    ctx.fillRect(12, 5, 3, 4);

    // Schwert
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(13, 7, 2, 8);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(13, 13, 2, 3);

    // Beine
    ctx.fillStyle = armorDark;
    const legOffset = walkFrame % 2;
    ctx.fillRect(5 - legOffset, 13, 2, 3);
    ctx.fillRect(9 + legOffset, 13, 2, 3);
}

/**
 * Tetzel Boss Sprite (größer)
 */
function drawTetzel(
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
    frameCount: number
): void {
    // Tetzel ist etwas größer dargestellt
    ctx.save();
    ctx.scale(1.2, 1.2);
    ctx.translate(-2, -3);

    const walkFrame = enemy.isMoving ? Math.floor(frameCount / 10) % 4 : 0;

    // Prächtige Robe (Rot und Gold)
    const robeColor = '#8b0000';
    const goldColor = '#ffd700';
    const skinColor = '#f5cba7';

    // Kopf
    ctx.fillStyle = skinColor;
    ctx.fillRect(5, 1, 6, 5);

    // Tonsur-Haare
    ctx.fillStyle = '#3d3d3d';
    ctx.fillRect(4, 0, 8, 2);

    // Böses Grinsen
    ctx.fillStyle = '#000000';
    ctx.fillRect(6, 4, 1, 1);
    ctx.fillRect(9, 4, 1, 1);
    ctx.fillRect(6, 6, 4, 1);

    // Körper (prächtige Kutte)
    ctx.fillStyle = robeColor;
    ctx.fillRect(2, 6, 12, 9);

    // Gold-Verzierungen
    ctx.fillStyle = goldColor;
    ctx.fillRect(7, 7, 2, 6);
    ctx.fillRect(4, 8, 8, 1);
    ctx.fillRect(4, 11, 8, 1);

    // Großer Geldsack
    ctx.fillStyle = goldColor;
    ctx.fillRect(11, 7, 5, 6);
    ctx.fillStyle = '#000000';
    ctx.fillRect(12, 8, 3, 4);

    // Beine
    ctx.fillStyle = '#1a1a1a';
    const legOffset = walkFrame % 2;
    ctx.fillRect(5 - legOffset, 15, 2, 2);
    ctx.fillRect(9 + legOffset, 15, 2, 2);

    ctx.restore();
}

/**
 * Lebensbalken über Gegner
 */
function drawHealthBar(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    const barWidth = TILE_SIZE;
    const barHeight = 3;
    const barY = -5;

    // Hintergrund
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, barY, barWidth, barHeight);

    // Lebensbalken
    const healthPercent = enemy.health / enemy.maxHealth;
    const healthColor = healthPercent > 0.5 ? '#2ecc71' : healthPercent > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = healthColor;
    ctx.fillRect(0, barY, barWidth * healthPercent, barHeight);

    // Rahmen
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, barY, barWidth, barHeight);
}

/**
 * Zeichne Todes-Animation/Effekt
 */
export function drawDeathEffect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    frameCount: number,
    deathFrame: number
): void {
    const progress = deathFrame / 20; // 20 Frames für Tod

    if (progress >= 1) return;

    ctx.save();
    ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);

    // Explosions-Sterne
    const numStars = 8;
    const radius = progress * TILE_SIZE;

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < numStars; i++) {
        const angle = (i / numStars) * Math.PI * 2;
        const starX = Math.cos(angle) * radius;
        const starY = Math.sin(angle) * radius;
        const size = (1 - progress) * 4;

        ctx.fillRect(starX - size / 2, starY - size / 2, size, size);
    }

    ctx.restore();
}
