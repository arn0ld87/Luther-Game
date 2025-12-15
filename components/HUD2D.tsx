// HUD2D - Zelda-style heads-up display
import React from 'react';
import { HUD2DProps } from '../types';
import { COLORS } from '../constants';

const HUD2D: React.FC<HUD2DProps> = ({
    score,
    health,
    maxHealth,
    currentStage,
    totalStages,
}) => {
    // Generate heart containers
    const hearts = [];
    const fullHearts = Math.floor(health / 2);
    const halfHeart = health % 2 === 1;
    const emptyHearts = Math.floor((maxHealth - health) / 2);

    for (let i = 0; i < fullHearts; i++) {
        hearts.push(<Heart key={`full-${i}`} type="full" />);
    }
    if (halfHeart) {
        hearts.push(<Heart key="half" type="half" />);
    }
    for (let i = 0; i < emptyHearts; i++) {
        hearts.push(<Heart key={`empty-${i}`} type="empty" />);
    }

    return (
        <div
            className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
            style={{
                fontFamily: '"Press Start 2P", monospace',
                imageRendering: 'pixelated',
            }}
        >
            {/* Top HUD Bar */}
            <div
                className="flex justify-between items-start p-3"
                style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                }}
            >
                {/* Left side - Hearts */}
                <div className="flex flex-col gap-1">
                    <span
                        className="text-xs uppercase tracking-wider mb-1"
                        style={{ color: COLORS.heartFull, fontSize: '10px' }}
                    >
                        Leben
                    </span>
                    <div className="flex gap-1">
                        {hearts}
                    </div>
                </div>

                {/* Center - Stage indicator */}
                <div className="flex flex-col items-center">
                    <span
                        className="text-xs uppercase tracking-wider"
                        style={{ color: COLORS.textGold, fontSize: '10px' }}
                    >
                        Etappe
                    </span>
                    <span
                        className="text-lg font-bold"
                        style={{ color: '#ffffff', fontSize: '14px' }}
                    >
                        {currentStage} / {totalStages}
                    </span>
                </div>

                {/* Right side - Score */}
                <div className="flex flex-col items-end gap-1">
                    <span
                        className="text-xs uppercase tracking-wider"
                        style={{ color: COLORS.textGold, fontSize: '10px' }}
                    >
                        Gnade
                    </span>
                    <div className="flex items-center gap-2">
                        <RupeeIcon />
                        <span
                            className="font-bold"
                            style={{ color: '#ffffff', fontSize: '14px' }}
                        >
                            {String(score).padStart(4, '0')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Heart component (pixel art style)
const Heart: React.FC<{ type: 'full' | 'half' | 'empty' }> = ({ type }) => {
    const color = type === 'empty' ? COLORS.heartEmpty : COLORS.heartFull;
    const halfMask = type === 'half';

    return (
        <div
            className="relative"
            style={{ width: '20px', height: '18px' }}
        >
            <svg
                width="20"
                height="18"
                viewBox="0 0 10 9"
                style={{ imageRendering: 'pixelated' }}
            >
                {/* Heart shape (pixel art) */}
                <rect x="1" y="0" width="2" height="1" fill={color} />
                <rect x="4" y="0" width="2" height="1" fill={halfMask ? COLORS.heartEmpty : color} />
                <rect x="7" y="0" width="2" height="1" fill={COLORS.heartEmpty} />

                <rect x="0" y="1" width="4" height="1" fill={color} />
                <rect x="4" y="1" width="2" height="1" fill={halfMask ? COLORS.heartEmpty : color} />
                <rect x="6" y="1" width="4" height="1" fill={COLORS.heartEmpty} />

                <rect x="0" y="2" width="5" height="1" fill={color} />
                <rect x="5" y="2" width="5" height="1" fill={halfMask ? COLORS.heartEmpty : color} />

                <rect x="0" y="3" width="5" height="1" fill={color} />
                <rect x="5" y="3" width="5" height="1" fill={halfMask ? COLORS.heartEmpty : color} />

                <rect x="1" y="4" width="4" height="1" fill={color} />
                <rect x="5" y="4" width="4" height="1" fill={halfMask ? COLORS.heartEmpty : color} />

                <rect x="2" y="5" width="3" height="1" fill={color} />
                <rect x="5" y="5" width="3" height="1" fill={halfMask ? COLORS.heartEmpty : color} />

                <rect x="3" y="6" width="2" height="1" fill={color} />
                <rect x="5" y="6" width="2" height="1" fill={halfMask ? COLORS.heartEmpty : color} />

                <rect x="4" y="7" width="1" height="1" fill={color} />
                <rect x="5" y="7" width="1" height="1" fill={halfMask ? COLORS.heartEmpty : color} />
            </svg>
        </div>
    );
};

// Rupee/Grace icon (Zelda-style)
const RupeeIcon: React.FC = () => {
    return (
        <svg
            width="12"
            height="20"
            viewBox="0 0 6 10"
            style={{ imageRendering: 'pixelated' }}
        >
            <rect x="2" y="0" width="2" height="1" fill={COLORS.graceItem} />
            <rect x="1" y="1" width="4" height="1" fill={COLORS.graceItem} />
            <rect x="0" y="2" width="6" height="1" fill={COLORS.graceItem} />
            <rect x="0" y="3" width="6" height="1" fill={COLORS.graceItem} />
            <rect x="0" y="4" width="6" height="1" fill={COLORS.graceItem} />
            <rect x="1" y="5" width="4" height="1" fill={COLORS.graceItem} />
            <rect x="1" y="6" width="4" height="1" fill={COLORS.graceItem} />
            <rect x="2" y="7" width="2" height="1" fill={COLORS.graceItem} />
            <rect x="2" y="8" width="2" height="1" fill={COLORS.graceItem} />
            {/* Highlight */}
            <rect x="1" y="2" width="1" height="3" fill="#fffacd" />
        </svg>
    );
};

export default HUD2D;
