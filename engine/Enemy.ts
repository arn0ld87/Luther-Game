// Enemy.ts - Gegner-System für Luther RPG
import { GAME_CONFIG } from '../constants';
import { Direction, Enemy, EnemyType, PlayerState, MapData, Point2D } from '../types';
import { COMBAT_CONFIG } from './Combat';

const TILE_SIZE = GAME_CONFIG.TILE_SIZE;

// Gegner-Konfiguration
export const ENEMY_CONFIG = {
    PATROL_SPEED: 1,
    CHASE_SPEED: 2,
    SIGHT_RANGE: 4 * TILE_SIZE,
    ATTACK_RANGE: TILE_SIZE,
    ATTACK_COOLDOWN: 60,
    HURT_DURATION: 20,
};

/**
 * Erstelle einen neuen Gegner
 */
export function createEnemy(
    id: number,
    x: number,
    y: number,
    type: EnemyType,
    patrolPoints?: Point2D[]
): Enemy {
    const healthByType = {
        [EnemyType.INDULGENCE_SELLER]: 2,
        [EnemyType.GUARD]: 4,
        [EnemyType.TETZEL]: 10,
    };

    const health = healthByType[type] || 2;

    return {
        id,
        x,
        y,
        type,
        health,
        maxHealth: health,
        direction: Direction.DOWN,
        isMoving: false,
        animFrame: 0,
        state: 'patrol',
        patrolPoints,
        patrolIndex: 0,
        lastAttackTime: 0,
        invulnerableUntil: 0,
    };
}

/**
 * Update alle Gegner
 */
export function updateEnemies(
    enemies: Enemy[],
    player: PlayerState,
    mapData: MapData,
    currentFrame: number
): Enemy[] {
    return enemies.map(enemy => updateEnemy(enemy, player, mapData, currentFrame));
}

/**
 * Update einzelnen Gegner
 */
function updateEnemy(
    enemy: Enemy,
    player: PlayerState,
    mapData: MapData,
    currentFrame: number
): Enemy {
    if (enemy.state === 'dead') {
        return enemy;
    }

    // Hurt-Status beenden
    if (enemy.state === 'hurt' && currentFrame >= enemy.invulnerableUntil - COMBAT_CONFIG.INVULNERABLE_DURATION + ENEMY_CONFIG.HURT_DURATION) {
        enemy = { ...enemy, state: 'patrol' };
    }

    if (enemy.state === 'hurt') {
        return enemy;
    }

    // Prüfe ob Spieler in Sichtweite
    const distToPlayer = getDistance(enemy.x, enemy.y, player.x, player.y);

    if (distToPlayer < ENEMY_CONFIG.ATTACK_RANGE) {
        // Nah genug zum Angreifen
        return updateAttackState(enemy, player, currentFrame);
    } else if (distToPlayer < ENEMY_CONFIG.SIGHT_RANGE) {
        // Spieler in Sicht - verfolgen
        return updateChaseState(enemy, player, mapData);
    } else {
        // Patrouillieren
        return updatePatrolState(enemy, mapData);
    }
}

/**
 * Patrouillieren zwischen Punkten
 */
function updatePatrolState(enemy: Enemy, mapData: MapData): Enemy {
    if (!enemy.patrolPoints || enemy.patrolPoints.length === 0) {
        // Kein Patrol-Pfad, stehen bleiben
        return { ...enemy, isMoving: false, state: 'patrol' };
    }

    const target = enemy.patrolPoints[enemy.patrolIndex || 0];
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 4) {
        // Ziel erreicht, nächster Punkt
        const nextIndex = ((enemy.patrolIndex || 0) + 1) % enemy.patrolPoints.length;
        return { ...enemy, patrolIndex: nextIndex, isMoving: false };
    }

    // Bewege zum Ziel
    const moveX = (dx / distance) * ENEMY_CONFIG.PATROL_SPEED;
    const moveY = (dy / distance) * ENEMY_CONFIG.PATROL_SPEED;

    const newX = enemy.x + moveX;
    const newY = enemy.y + moveY;

    // Richtung bestimmen
    let direction = enemy.direction;
    if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
        direction = dy > 0 ? Direction.DOWN : Direction.UP;
    }

    return {
        ...enemy,
        x: newX,
        y: newY,
        direction,
        isMoving: true,
        animFrame: enemy.animFrame + 1,
        state: 'patrol',
    };
}

/**
 * Spieler verfolgen
 */
function updateChaseState(enemy: Enemy, player: PlayerState, mapData: MapData): Enemy {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 1) {
        return { ...enemy, isMoving: false, state: 'chase' };
    }

    const moveX = (dx / distance) * ENEMY_CONFIG.CHASE_SPEED;
    const moveY = (dy / distance) * ENEMY_CONFIG.CHASE_SPEED;

    // Prüfe Kollision
    const newX = enemy.x + moveX;
    const newY = enemy.y + moveY;

    // Richtung bestimmen
    let direction = enemy.direction;
    if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
        direction = dy > 0 ? Direction.DOWN : Direction.UP;
    }

    return {
        ...enemy,
        x: newX,
        y: newY,
        direction,
        isMoving: true,
        animFrame: enemy.animFrame + 1,
        state: 'chase',
    };
}

/**
 * Angriffs-Status
 */
function updateAttackState(enemy: Enemy, player: PlayerState, currentFrame: number): Enemy {
    // Face the player
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;

    let direction = enemy.direction;
    if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
        direction = dy > 0 ? Direction.DOWN : Direction.UP;
    }

    return {
        ...enemy,
        direction,
        isMoving: false,
        state: 'attack',
        lastAttackTime: currentFrame,
    };
}

/**
 * Distanz zwischen zwei Punkten
 */
function getDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}
