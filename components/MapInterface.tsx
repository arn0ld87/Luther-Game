import React from 'react';
import { useGame } from '../context/GameContext';
import { GameState } from '../types';

const MAP_LOCATIONS = [
  { id: 'wittenberg', name: 'Wittenberg', x: 200, y: 150, unlocked: true },
  { id: 'worms', name: 'Worms', x: 400, y: 300, unlocked: false }, // Needs impact score?
  { id: 'wartburg', name: 'Wartburg', x: 300, y: 400, unlocked: false },
  { id: 'augsburg', name: 'Augsburg', x: 500, y: 500, unlocked: false },
];

const MapInterface: React.FC = () => {
    const { state, dispatch } = useGame();

    const handleTravel = (locationId: string) => {
        // Logic to travel, maybe set level or specific question set
        // For now, just close map or start a level
        // Ideally, different locations have different questions.
        // We can simulate this by logging it or setting a "currentLocation" in state (if we added it).
        console.log("Traveling to", locationId);
        dispatch({ type: 'SET_GAME_STATE', payload: GameState.MENU });
    };

    return (
        <div className="absolute inset-0 z-20 bg-[#f4ecd8] flex items-center justify-center p-8">
            <div className="relative w-full h-full max-w-4xl border-4 border-[#8b4513] rounded-lg bg-[#e8e0c5] overflow-hidden shadow-2xl">
                 <h2 className="absolute top-4 left-4 text-3xl font-serif font-bold text-[#8b4513] z-10">Karte des Reiches</h2>
                 <button
                    onClick={() => dispatch({ type: 'SET_GAME_STATE', payload: GameState.MENU })}
                    className="absolute top-4 right-4 bg-[#c0392b] text-white px-4 py-2 rounded z-10"
                 >
                    Schließen
                 </button>

                 {/* Simple SVG Map Placeholder */}
                 <svg width="100%" height="100%" viewBox="0 0 800 600" className="opacity-50 absolute inset-0">
                    <path d="M100,100 Q250,50 400,100 T700,100" stroke="#d6cba8" strokeWidth="5" fill="none" />
                    {/* Rivers, borders... */}
                 </svg>

                 {/* Locations */}
                 {MAP_LOCATIONS.map(loc => (
                     <div
                        key={loc.id}
                        className={`absolute flex flex-col items-center cursor-pointer transition-transform hover:scale-110 ${!loc.unlocked ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                        style={{ left: loc.x, top: loc.y }}
                        onClick={() => handleTravel(loc.id)}
                     >
                         <div className={`w-6 h-6 rounded-full border-2 ${loc.unlocked ? 'bg-[#e74c3c] border-white' : 'bg-gray-500 border-gray-300'}`} />
                         <span className="mt-1 font-serif font-bold text-[#2c3e50] bg-white/80 px-2 rounded shadow">{loc.name}</span>
                     </div>
                 ))}

                 {/* Stats */}
                 <div className="absolute bottom-4 left-4 bg-white/90 p-4 rounded shadow border border-[#8b4513]">
                     <div className="font-bold">Impact Score: {state.impactScore}</div>
                     <div className="text-sm text-gray-600">Reise zu neuen Städten, um deine Thesen zu verbreiten.</div>
                 </div>
            </div>
        </div>
    );
};

export default MapInterface;
