import React, { useCallback, useEffect } from 'react';
import Game2DCanvas from './components/Game2DCanvas';
import HUD2D from './components/HUD2D';
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
  const {
    gameState,
    currentQuestionIndex,
    score,
    health,
    maxHealth,
    flash
  } = state;

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
      <div
        className="relative w-full h-screen overflow-hidden"
        style={{
          backgroundColor: '#000000',
          fontFamily: '"Press Start 2P", system-ui, sans-serif',
        }}
      >
        {/* 2D Game Canvas */}
        <div className="absolute inset-0 z-0">
          <ErrorBoundary fallback={
            <div className="w-full h-full bg-[#2c3e50] flex items-center justify-center text-white">
              2D-Szene konnte nicht geladen werden.
            </div>
          }>
            <Game2DCanvas
              key={currentQuestionIndex + (gameState === GameState.PLAYING ? 'play' : 'pause')}
              gameState={gameState}
              onReachCheckpoint={handleCheckpoint}
              onCollect={handleCollect}
              onHit={handleHit}
            />
          </ErrorBoundary>
        </div>

        {/* HUD Overlay (only during gameplay) */}
        {(gameState === GameState.PLAYING || gameState === GameState.DEBATE) && (
          <HUD2D
            score={score}
            health={health}
            maxHealth={maxHealth}
            currentStage={currentQuestionIndex + 1}
            totalStages={QUESTIONS.length}
          />
        )}

        {/* Screen Flash FX */}
        {flash && (
          <div
            className={`absolute inset-0 z-30 pointer-events-none opacity-30 ${flash === 'green' ? 'bg-green-500' : 'bg-red-500'
              }`}
          />
        )}

        {/* Menus & Modals */}

        {gameState === GameState.MENU && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90">
            <div
              className="text-center space-y-6 max-w-lg p-8 border-4 rounded-lg"
              style={{
                borderColor: COLORS.primary,
                backgroundColor: '#1a1a2e',
                boxShadow: `0 0 20px ${COLORS.primary}40`,
              }}
            >
              <h1
                className="text-3xl mb-4 leading-relaxed"
                style={{
                  color: COLORS.primary,
                  textShadow: `2px 2px 0 ${COLORS.secondary}`,
                }}
              >
                Sola Fide
              </h1>
              <p
                className="text-sm leading-relaxed"
                style={{ color: '#a0a0a0' }}
              >
                <span className="text-white">Der Luther Lauf</span>
                <br /><br />
                ▸ Sammle Gnadenpunkte (Gold)<br />
                ▸ Meide die Ablassbriefe (Rot)<br />
                ▸ Erreiche das Kreuz für die Debatte
              </p>
              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={startGame}
                  className="bg-[#e74c3c] hover:bg-[#c0392b] text-white py-3 px-6 rounded text-sm transition-all hover:scale-105"
                  style={{
                    boxShadow: '0 4px 0 #7f1d1d',
                    textShadow: '1px 1px 0 #000',
                  }}
                >
                  ▶ SPIEL STARTEN
                </button>
                <button
                  onClick={handleOpenArtStudio}
                  className="bg-[#3498db] hover:bg-[#2980b9] text-white py-2 px-4 rounded text-xs transition-colors"
                >
                  Atelier
                </button>
                <button
                  onClick={handleOpenMap}
                  className="bg-[#27ae60] hover:bg-[#2ecc71] text-white py-2 px-4 rounded text-xs transition-colors"
                >
                  Reichskarte
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === GameState.PLAYING && (
          <div className="absolute bottom-4 left-0 right-0 z-10 text-center pointer-events-none">
            <p
              className="text-xs animate-pulse"
              style={{ color: COLORS.primary }}
            >
              Pfeiltasten oder WASD zum Bewegen
            </p>
          </div>
        )}

        {gameState === GameState.MAP && (
          <ErrorBoundary fallback={
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 text-white">
              Karte konnte nicht geladen werden.
            </div>
          }>
            <MapInterface />
          </ErrorBoundary>
        )}

        {gameState === GameState.DEBATE && (
          <ErrorBoundary fallback={
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 text-white">
              Debatte konnte nicht geladen werden.
            </div>
          }>
            <DebateInterface
              question={QUESTIONS[currentQuestionIndex]}
              onComplete={handleDebateComplete}
            />
          </ErrorBoundary>
        )}

        {gameState === GameState.VICTORY && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.primary}e6` }}
          >
            <div
              className="text-center p-10 rounded-lg shadow-2xl max-w-xl"
              style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}
            >
              <h2 className="text-2xl mb-4" style={{ color: COLORS.textGold }}>
                ✨ Sola Gratia! ✨
              </h2>
              <p className="text-sm mb-6">
                Du hast den Lauf vollendet!
                <br /><br />
                Endstand: <span style={{ color: COLORS.textGold }}>{score}</span> Gnadenpunkte
              </p>
              <button
                onClick={handleBackToMenu}
                className="text-white px-8 py-3 rounded text-sm hover:opacity-80 transition-opacity"
                style={{ backgroundColor: COLORS.secondary }}
              >
                Zurück zum Menü
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90">
            <div
              className="text-center p-10 rounded-lg shadow-2xl max-w-xl"
              style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}
            >
              <h2 className="text-2xl mb-4" style={{ color: COLORS.indulgenceItem }}>
                💀 Niederlage 💀
              </h2>
              <p className="text-sm mb-6">
                Die Ablassbriefe haben dich übermannt.
                <br />
                Versuche es erneut!
              </p>
              <button
                onClick={handleBackToMenu}
                className="text-white px-8 py-3 rounded text-sm hover:opacity-80 transition-opacity"
                style={{ backgroundColor: COLORS.primary }}
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.ART_STUDIO && (
          <ErrorBoundary fallback={
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 text-white">
              Atelier konnte nicht geladen werden.
            </div>
          }>
            <ArtStudio onClose={handleCloseArtStudio} onApplyTexture={handleApplyTexture} />
          </ErrorBoundary>
        )}

        {/* Footer Info */}
        <div className="absolute bottom-2 right-2 z-10 text-xs text-gray-600 pointer-events-none">
          Prof. Jana Zwarg | Klasse 12 | Theologie & Informatik
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default GameApp;
