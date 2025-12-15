import React, { useCallback, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import DebateInterface from './components/DebateInterface';
import ArtStudio from './components/ArtStudio';
import MapInterface from './components/MapInterface';
import ErrorBoundary from './components/ErrorBoundary';
import { GameState } from './types';
import { QUESTIONS, GAME_CONFIG, COLORS } from './constants';
import { playSound, disposeAudio } from './services/audio';
import { useGame } from './context/GameContext';

const GameApp: React.FC = () => {
  const { state, dispatch } = useGame();
  const { gameState, currentQuestionIndex, score, customTexture, flash } = state;

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      disposeAudio();
    };
  }, []);

  const startGame = useCallback(() => {
    playSound('ui');
    dispatch({ type: 'START_GAME' });
  }, [dispatch]);

  const handleCheckpoint = useCallback(() => {
    dispatch({ type: 'SET_GAME_STATE', payload: GameState.DEBATE });
  }, [dispatch]);

  const handleCollect = useCallback(() => {
    dispatch({ type: 'COLLECT_GRACE' });
    playSound('collect');
    setTimeout(() => dispatch({ type: 'CLEAR_FLASH' }), GAME_CONFIG.FLASH_DURATION);
  }, [dispatch]);

  const handleHit = useCallback(() => {
    dispatch({ type: 'TAKE_DAMAGE' });
    playSound('hit');
    setTimeout(() => dispatch({ type: 'CLEAR_FLASH' }), GAME_CONFIG.FLASH_DURATION);
  }, [dispatch]);

  const handleDebateComplete = useCallback((success: boolean) => {
    if (success) {
      playSound('win');
      dispatch({ type: 'DEBATE_WIN' });
      dispatch({ type: 'NEXT_LEVEL' });
    } else {
      playSound('hit');
      dispatch({ type: 'DEBATE_LOSE' });
    }
  }, [dispatch]);

  const handleApplyTexture = useCallback((url: string) => {
    dispatch({ type: 'SET_CUSTOM_TEXTURE', payload: url });
  }, [dispatch]);

  const handleOpenArtStudio = useCallback(() => {
    dispatch({ type: 'SET_GAME_STATE', payload: GameState.ART_STUDIO });
  }, [dispatch]);

  const handleCloseArtStudio = useCallback(() => {
    dispatch({ type: 'SET_GAME_STATE', payload: GameState.MENU });
  }, [dispatch]);

  const handleOpenMap = useCallback(() => {
    dispatch({ type: 'SET_GAME_STATE', payload: GameState.MAP });
  }, [dispatch]);

  const handleBackToMenu = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <div className="relative w-full h-screen overflow-hidden bg-black text-white font-sans">
        {/* 3D Layer with key to reset scene on each level */}
        <div className="absolute inset-0 z-0">
          <ErrorBoundary fallback={<div className="w-full h-full bg-[#2c3e50] flex items-center justify-center text-white">3D-Szene konnte nicht geladen werden.</div>}>
            <GameCanvas
              key={currentQuestionIndex + (gameState === GameState.PLAYING ? 'play' : 'pause')}
              gameState={gameState}
              onReachCheckpoint={handleCheckpoint}
              customTexture={customTexture}
              onCollect={handleCollect}
              onHit={handleHit}
            />
          </ErrorBoundary>
        </div>

        {/* Screen Flash FX */}
        {flash && (
          <div
            className={`absolute inset-0 z-10 pointer-events-none opacity-30 ${
              flash === 'green' ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
        )}

        {/* UI Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold font-serif drop-shadow-md" style={{ color: COLORS.primary }}>
              Sola Fide
            </h1>
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
              <p className="text-lg animate-pulse font-serif mb-2" style={{ color: COLORS.primary }}>
                Lauf zur Kirche! (Pfeiltasten zum Lenken)
              </p>
              <div className="flex justify-center gap-8 text-sm opacity-80">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />= Gnade (+{GAME_CONFIG.SCORE_COLLECT})
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full" />= Ablass (-{GAME_CONFIG.SCORE_HIT_PENALTY})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Menus & Modals (pointer-events-auto) */}

        {gameState === GameState.MENU && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div
              className="text-center space-y-8 max-w-lg p-8 border-4 rounded-lg"
              style={{ borderColor: COLORS.primary, backgroundColor: COLORS.secondary }}
            >
              <h1 className="text-5xl font-serif mb-4" style={{ color: COLORS.primary }}>
                Der Luther Lauf
              </h1>
              <p className="text-gray-300 text-lg">
                <b>Spielanleitung:</b>
                <br />
                1. Weiche den Ablassbriefen (Rot) aus.
                <br />
                2. Sammle die Gnaden-Punkte (Gold).
                <br />
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
                  onClick={handleOpenArtStudio}
                  className="bg-[#3498db] hover:bg-[#2980b9] text-white font-bold py-2 px-6 rounded shadow transition-colors"
                >
                  Atelier (KI-Tools)
                </button>
                <button
                  onClick={handleOpenMap}
                  className="bg-[#27ae60] hover:bg-[#2ecc71] text-white font-bold py-2 px-6 rounded shadow transition-colors"
                >
                  Reichskarte
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === GameState.MAP && (
          <ErrorBoundary fallback={<div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 text-white">Karte konnte nicht geladen werden.</div>}>
            <MapInterface />
          </ErrorBoundary>
        )}

        {gameState === GameState.DEBATE && (
          <ErrorBoundary fallback={<div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 text-white">Debatte konnte nicht geladen werden.</div>}>
            <DebateInterface question={QUESTIONS[currentQuestionIndex]} onComplete={handleDebateComplete} />
          </ErrorBoundary>
        )}

        {gameState === GameState.VICTORY && (
          <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ backgroundColor: `${COLORS.primary}e6` }}>
            <div className="text-center p-10 bg-white rounded-lg shadow-2xl max-w-xl" style={{ color: COLORS.secondary }}>
              <h2 className="text-4xl font-serif font-bold mb-4">Sola Gratia!</h2>
              <p className="text-xl mb-6">
                Du hast den Lauf vollendet!
                <br />
                Endstand: <b>{score}</b> Glaubenspunkte.
              </p>
              <button
                onClick={handleBackToMenu}
                className="text-white px-8 py-3 rounded font-bold hover:bg-black transition-colors"
                style={{ backgroundColor: COLORS.secondary }}
              >
                Zurück zum Menü
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.ART_STUDIO && (
          <ErrorBoundary fallback={<div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 text-white">Atelier konnte nicht geladen werden.</div>}>
            <ArtStudio onClose={handleCloseArtStudio} onApplyTexture={handleApplyTexture} />
          </ErrorBoundary>
        )}

        {/* Footer Info */}
        <div className="absolute bottom-2 right-2 z-10 text-xs text-gray-500 pointer-events-none">
          Prof. Jana Zwarg | Klasse 12 | Theologie & Informatik
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default GameApp;
