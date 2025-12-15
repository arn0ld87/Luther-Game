// Combat.ts - Kampfsystem für Luther RPG
import { GAME_CONFIG } from '../constants';
import { Direction, PlayerState, Enemy, PlayerAction, Point2D } from '../types';

const TILE_SIZE = GAME_CONFIG.TILE_SIZE;

// Kampf-Konfiguration
export const COMBAT_CONFIG = {
    ATTACK_DURATION: 16,        // Frames für Angriffs-Animation
    ATTACK_COOLDOWN: 20,        // Frames zwischen Angriffen
    ATTACK_RANGE: 20,           // Pixel Reichweite
    ATTACK_WIDTH: 24,           // Breite der Hitbox
    PLAYER_DAMAGE: 2,           // Schaden an Gegnern
    ENEMY_DAMAGE: 1,            // Schaden an Spieler
    INVULNERABLE_DURATION: 60,  // Frames Unverwundbarkeit nach Treffer
    KNOCKBACK_DISTANCE: 8,      // Pixel Rückstoß
};

/**
 * Starte einen Angriff (Bibel/Thesen werfen)
 */
export function startAttack(player: PlayerState, currentFrame: number): PlayerState {
    if (player.action === PlayerAction.ATTACKING) {
        return player; // Bereits am Angreifen
    }

    if (currentFrame < player.attackCooldown) {
        return player; // Noch im Cooldown
    }

    return {
        ...player,
        action: PlayerAction.ATTACKING,
        attackFrame: 0,
        isMoving: false,
    };
}

/**
 * Update Angriffs-Animation
 */
export function updateAttack(player: PlayerState, currentFrame: number): PlayerState {
    if (player.action !== PlayerAction.ATTACKING) {
        return player;
    }

    const newAttackFrame = player.attackFrame + 1;

    if (newAttackFrame >= COMBAT_CONFIG.ATTACK_DURATION) {
        // Angriff beendet
        return {
            ...player,
            action: PlayerAction.IDLE,
            attackFrame: 0,
            attackCooldown: currentFrame + COMBAT_CONFIG.ATTACK_COOLDOWN,
        };
    }

    return {
        ...player,
        attackFrame: newAttackFrame,
    };
}

/**
 * Berechne Angriffs-Hitbox basierend auf Blickrichtung
 */
export function getAttackHitbox(player: PlayerState): { x: number; y: number; width: number; height: number } {
    const centerX = player.x + TILE_SIZE / 2;
    const centerY = player.y + TILE_SIZE / 2;

    switch (player.direction) {
        case Direction.UP:
            return {
                x: centerX - COMBAT_CONFIG.ATTACK_WIDTH / 2,
                y: centerY - COMBAT_CONFIG.ATTACK_RANGE - TILE_SIZE / 2,
                width: COMBAT_CONFIG.ATTACK_WIDTH,
                height: COMBAT_CONFIG.ATTACK_RANGE,
            };
        case Direction.DOWN:
            return {
                x: centerX - COMBAT_CONFIG.ATTACK_WIDTH / 2,
                y: centerY + TILE_SIZE / 2,
                width: COMBAT_CONFIG.ATTACK_WIDTH,
                height: COMBAT_CONFIG.ATTACK_RANGE,
            };
        case Direction.LEFT:
            return {
                x: centerX - COMBAT_CONFIG.ATTACK_RANGE - TILE_SIZE / 2,
                y: centerY - COMBAT_CONFIG.ATTACK_WIDTH / 2,
                width: COMBAT_CONFIG.ATTACK_RANGE,
                height: COMBAT_CONFIG.ATTACK_WIDTH,
            };
        case Direction.RIGHT:
            return {
                x: centerX + TILE_SIZE / 2,
                y: centerY - COMBAT_CONFIG.ATTACK_WIDTH / 2,
                width: COMBAT_CONFIG.ATTACK_RANGE,
                height: COMBAT_CONFIG.ATTACK_WIDTH,
            };
    }
}

/**
 * Prüfe ob Hitbox einen Gegner trifft
 */
export function checkHitEnemy(
    hitbox: { x: number; y: number; width: number; height: number },
    enemy: Enemy,
    currentFrame: number
): boolean {
    if (enemy.state === 'dead' || enemy.state === 'hurt') {
        return false;
    }

    if (currentFrame < enemy.invulnerableUntil) {
        return false;
    }

    const enemyCenterX = enemy.x + TILE_SIZE / 2;
    const enemyCenterY = enemy.y + TILE_SIZE / 2;
    const enemyRadius = TILE_SIZE / 2;

    // Einfache Rechteck-Kollision
    return (
        hitbox.x < enemyCenterX + enemyRadius &&
        hitbox.x + hitbox.width > enemyCenterX - enemyRadius &&
        hitbox.y < enemyCenterY + enemyRadius &&
        hitbox.y + hitbox.height > enemyCenterY - enemyRadius
    );
}

/**
 * Wende Schaden auf Gegner an
 */
export function damageEnemy(enemy: Enemy, damage: number, currentFrame: number): Enemy {
    const newHealth = enemy.health - damage;

    if (newHealth <= 0) {
        return {
            ...enemy,
            health: 0,
            state: 'dead',
        };
    }

    return {
        ...enemy,
        health: newHealth,
        state: 'hurt',
        invulnerableUntil: currentFrame + COMBAT_CONFIG.INVULNERABLE_DURATION,
    };
}

/**
 * Prüfe ob Gegner den Spieler trifft
 */
export function checkEnemyHitsPlayer(
    enemy: Enemy,
    player: PlayerState,
    currentFrame: number
): boolean {
    if (enemy.state === 'dead') {
        return false;
    }

    if (currentFrame < player.invulnerableUntil) {
        return false;
    }

    const playerCenterX = player.x + TILE_SIZE / 2;
    const playerCenterY = player.y + TILE_SIZE / 2;
    const enemyCenterX = enemy.x + TILE_SIZE / 2;
    const enemyCenterY = enemy.y + TILE_SIZE / 2;

    const dx = Math.abs(playerCenterX - enemyCenterX);
    const dy = Math.abs(playerCenterY - enemyCenterY);

    // Kollision bei ~1 Tile Abstand
    return dx < TILE_SIZE * 0.8 && dy < TILE_SIZE * 0.8;
}

/**
 * Spieler nimmt Schaden
 */
export function damagePlayer(player: PlayerState, currentFrame: number): PlayerState {
    return {
        ...player,
        action: PlayerAction.HURT,
        invulnerableUntil: currentFrame + COMBAT_CONFIG.INVULNERABLE_DURATION,
    };
}

/**
 * Berechne Rückstoß-Richtung
 */
export function getKnockbackDirection(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
): Point2D {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
        return { x: 0, y: 0 };
    }

    return {
        x: (dx / length) * COMBAT_CONFIG.KNOCKBACK_DISTANCE,
        y: (dy / length) * COMBAT_CONFIG.KNOCKBACK_DISTANCE,
    };
}
