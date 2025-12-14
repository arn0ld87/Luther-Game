import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import DebateInterface from './components/DebateInterface';
import ArtStudio from './components/ArtStudio';
import { GameState, Question } from './types';
import { QUESTIONS } from './constants';
import { playSound } from './services/audio';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [customTexture, setCustomTexture] = useState<string | null>(null);
  const [flash, setFlash] = useState<'red' | 'green' | null>(null);

  const startGame = () => {
    playSound('ui');
    setGameState(GameState.PLAYING);
    setScore(0);
    setCurrentQuestionIndex(0);
  };

  const handleCheckpoint = () => {
    setGameState(GameState.DEBATE);
  };

  const handleCollect = () => {
      setScore(s => s + 5);
      playSound('collect');
      setFlash('green');
      setTimeout(() => setFlash(null), 200);
  };

  const handleHit = () => {
      setScore(s => Math.max(0, s - 5));
      playSound('hit');
      setFlash('red');
      setTimeout(() => setFlash(null), 200);
  };

  const handleDebateComplete = (success: boolean) => {
    if (success) {
      playSound('win');
      setScore(s => s + 50); // Big bonus for theological correctness
      if (currentQuestionIndex < QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setGameState(GameState.PLAYING);
      } else {
        setGameState(GameState.VICTORY);
      }
    } else {
      playSound('hit');
      setScore(s => Math.max(0, s - 10)); // Penalty for heresy
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-sans">
      {/* 3D Layer with key to reset scene on each level */}
      <div className="absolute inset-0 z-0">
        <GameCanvas 
            key={currentQuestionIndex + (gameState === GameState.PLAYING ? 'play' : 'pause')}
            gameState={gameState} 
            onReachCheckpoint={handleCheckpoint} 
            customTexture={customTexture}
            onCollect={handleCollect}
            onHit={handleHit}
        />
      </div>

      {/* Screen Flash FX */}
      {flash && (
          <div className={`absolute inset-0 z-10 pointer-events-none opacity-30 ${flash === 'green' ? 'bg-green-500' : 'bg-red-500'}`}></div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold font-serif text-[#f1c40f] drop-shadow-md">Sola Fide</h1>
            <div className="flex flex-col items-end">
                <div className="bg-black/50 px-4 py-2 rounded mb-2">
                    <span className="text-sm uppercase tracking-widest text-gray-400">Glaubenspunkte</span>
                    <div className="text-2xl font-bold text-white">{score}</div>
                </div>
                <div className="bg-black/50 px-2 py-1 rounded text-xs text-gray-400">
                    Etappe {currentQuestionIndex + 1} / {QUESTIONS.length}
                </div>
            </div>
        </div>

        {gameState === GameState.PLAYING && (
           <div className="text-center pb-10">
               <p className="text-lg animate-pulse font-serif text-[#f1c40f] mb-2">
                  Lauf zur Kirche! (Pfeiltasten zum Lenken)
               </p>
               <div className="flex justify-center gap-8 text-sm opacity-80">
                   <span className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded-full"></div> = Gnade (+5)</span>
                   <span className="flex items-center gap-2"><div className="w-3 h-3 bg-red-600 rounded-full"></div> = Ablass (-5)</span>
               </div>
           </div>
        )}
      </div>

      {/* Menus & Modals (pointer-events-auto) */}
      
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center space-y-8 max-w-lg p-8 border-4 border-[#f1c40f] rounded-lg bg-[#2c3e50]">
            <h1 className="text-5xl font-serif text-[#f1c40f] mb-4">Der Luther Lauf</h1>
            <p className="text-gray-300 text-lg">
              <b>Spielanleitung:</b><br/>
              1. Weiche den Ablassbriefen (Rot) aus.<br/>
              2. Sammle die Gnaden-Punkte (Gold).<br/>
              3. Erreiche die Pforte und gewinne die Debatte.
            </p>
            <div className="flex flex-col gap-4">
                <button 
                  onClick={startGame}
                  className="bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold py-3 px-8 rounded text-xl shadow-lg transition-transform hover:scale-105"
                >
                  Spiel starten
                </button>
                <button 
                   onClick={() => setGameState(GameState.ART_STUDIO)}
                   className="bg-[#3498db] hover:bg-[#2980b9] text-white font-bold py-2 px-6 rounded shadow transition-colors"
                >
                   Atelier (KI-Tools)
                </button>
            </div>
          </div>
        </div>
      )}

      {gameState === GameState.DEBATE && (
        <DebateInterface 
            question={QUESTIONS[currentQuestionIndex]}
            onComplete={handleDebateComplete}
        />
      )}

      {gameState === GameState.VICTORY && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#f1c40f]/90">
          <div className="text-center text-[#2c3e50] p-10 bg-white rounded-lg shadow-2xl max-w-xl">
             <h2 className="text-4xl font-serif font-bold mb-4">Sola Gratia!</h2>
             <p className="text-xl mb-6">
                Du hast den Lauf vollendet!
                <br/>
                Endstand: <b>{score}</b> Glaubenspunkte.
             </p>
             <button 
                onClick={() => setGameState(GameState.MENU)}
                className="bg-[#2c3e50] text-white px-8 py-3 rounded font-bold hover:bg-black transition-colors"
             >
                Zurück zum Menü
             </button>
          </div>
        </div>
      )}

      {gameState === GameState.ART_STUDIO && (
        <ArtStudio 
            onClose={() => setGameState(GameState.MENU)}
            onApplyTexture={(url) => setCustomTexture(url)}
        />
      )}
      
      {/* Footer Info */}
      <div className="absolute bottom-2 right-2 z-10 text-xs text-gray-500 pointer-events-none">
        Prof. Jana Zwarg | Klasse 12 | Theologie & Informatik
      </div>
    </div>
  );
};

export default App;
