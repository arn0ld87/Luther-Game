import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateGameAsset, editGameTexture } from '../services/gemini';
import { ImageSize } from '../types';
import { UI_CONFIG } from '../constants';
import { useCanvasDrawing } from '../hooks/useCanvasDrawing';
import { useGame } from '../context/GameContext';

interface Props {
  onClose: () => void;
  onApplyTexture: (url: string) => void;
}

const ArtStudio: React.FC<Props> = ({ onClose, onApplyTexture }) => {
  const { dispatch } = useGame();
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState<ImageSize>("512x512");
  const [editInstruction, setEditInstruction] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'edit' | 'draw'>('create');
  const [error, setError] = useState<string | null>(null);

  // Drawing state
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { startDrawing, stopDrawing, draw } = useCanvasDrawing(canvasRef, { color: brushColor, size: brushSize });

  // Ref to track abort state
  const abortRef = useRef(false);

  // Validation states
  const promptLength = prompt.length;
  const isPromptTooLong = promptLength > UI_CONFIG.MAX_PROMPT_LENGTH;
  const editLength = editInstruction.length;
  const isEditTooLong = editLength > UI_CONFIG.MAX_PROMPT_LENGTH;

  // Initialize canvas with image if exists
  useEffect(() => {
    if (activeTab === 'draw' && generatedImage && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
            };
            img.src = generatedImage;
        }
    } else if (activeTab === 'draw' && !generatedImage && canvasRef.current) {
         // White background
         const ctx = canvasRef.current.getContext('2d');
         if (ctx) {
             ctx.fillStyle = '#ffffff';
             ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
         }
    }
  }, [activeTab, generatedImage]);

  const handleGenerate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return setError("Bitte beschreibe das gewünschte Motiv.");
    if (isPromptTooLong) return setError(`Die Beschreibung ist zu lang.`);
    if (loading) return;

    setError(null);
    setLoading(true);
    abortRef.current = false;

    try {
      const result = await generateGameAsset(trimmedPrompt, size);
      if (!abortRef.current) {
          if (result) setGeneratedImage(result);
          else setError("Das Bild konnte nicht erstellt werden.");
      }
    } catch (err) {
      if (!abortRef.current) setError("Ein Fehler ist aufgetreten.");
    } finally {
      if (!abortRef.current) setLoading(false);
    }
  }, [prompt, isPromptTooLong, loading, size]);

  const handleEdit = useCallback(async () => {
    const trimmedInstruction = editInstruction.trim();
    if (!generatedImage) return setError("Erstelle zuerst ein Bild.");
    if (!trimmedInstruction) return setError("Bitte beschreibe die Änderung.");
    if (isEditTooLong) return setError(`Die Anweisung ist zu lang.`);
    if (loading) return;

    setError(null);
    setLoading(true);
    abortRef.current = false;

    try {
      const result = await editGameTexture(generatedImage, trimmedInstruction);
      if (!abortRef.current) {
          if (result) {
              setGeneratedImage(result);
              setEditInstruction('');
          } else setError("Bearbeitung fehlgeschlagen.");
      }
    } catch (err) {
      if (!abortRef.current) setError("Ein Fehler ist aufgetreten.");
    } finally {
      if (!abortRef.current) setLoading(false);
    }
  }, [generatedImage, editInstruction, isEditTooLong, loading]);

  const handleSaveDrawing = () => {
      if (canvasRef.current) {
          const url = canvasRef.current.toDataURL('image/png');
          setGeneratedImage(url);
          setActiveTab('create'); // Go back to preview/create
      }
  };

  const handleApply = useCallback(() => {
    if (generatedImage) {
      onApplyTexture(generatedImage);
      onClose();
    }
  }, [generatedImage, onApplyTexture, onClose]);

  const handlePrint = useCallback(() => {
      if (!generatedImage) return;
      // Calculate random impact score (simulation)
      const impact = Math.floor(Math.random() * 50) + 10;
      dispatch({ type: 'ADD_IMPACT', payload: impact });
      dispatch({ type: 'SPEND_RESOURCE', payload: { type: 'ink', amount: 20 } });
      alert(`Flugblatt gedruckt! Impact Score: +${impact} (Kosten: 20 Tinte)`);
  }, [generatedImage, dispatch]);

  const handleClose = useCallback(() => {
    abortRef.current = true;
    onClose();
  }, [onClose]);

  return (
    <div className="absolute inset-0 bg-black/90 z-30 flex items-center justify-center p-4">
      <div className="bg-white text-black p-6 rounded-lg max-w-6xl w-full flex flex-col md:flex-row gap-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Controls */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-2xl font-serif font-bold text-[#2c3e50]">Kirchen-Atelier</h2>
            <button onClick={handleClose} className="text-red-500 font-bold text-xl">&times;</button>
          </div>

          {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded">{error}</div>}

          <div className="flex gap-2 mb-4">
            <button onClick={() => setActiveTab('create')} className={`flex-1 py-2 rounded ${activeTab === 'create' ? 'bg-[#2c3e50] text-white' : 'bg-gray-200'}`}>Generieren</button>
            <button onClick={() => setActiveTab('edit')} className={`flex-1 py-2 rounded ${activeTab === 'edit' ? 'bg-[#2c3e50] text-white' : 'bg-gray-200'}`} disabled={!generatedImage}>Bearbeiten</button>
            <button onClick={() => setActiveTab('draw')} className={`flex-1 py-2 rounded ${activeTab === 'draw' ? 'bg-[#2c3e50] text-white' : 'bg-gray-200'}`}>Zeichnen</button>
          </div>

          {activeTab === 'create' && (
            <div className="space-y-4">
              <textarea
                className="w-full border p-2 rounded" rows={3}
                placeholder="Motiv beschreiben..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button onClick={handleGenerate} disabled={loading} className="w-full bg-[#f1c40f] py-3 rounded font-bold">
                {loading ? 'Generiere...' : 'Bild generieren'}
              </button>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="space-y-4">
              <input
                type="text" className="w-full border p-2 rounded"
                placeholder="Anweisung..."
                value={editInstruction}
                onChange={(e) => setEditInstruction(e.target.value)}
              />
              <button onClick={handleEdit} disabled={loading} className="w-full bg-[#9b59b6] text-white py-3 rounded font-bold">
                {loading ? 'Bearbeite...' : 'Bearbeiten'}
              </button>
            </div>
          )}

          {activeTab === 'draw' && (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm">Farbe</label>
                    <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)} className="w-full h-10"/>
                </div>
                <div>
                    <label className="block text-sm">Größe: {brushSize}px</label>
                    <input type="range" min="1" max="50" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full"/>
                </div>
                <button onClick={handleSaveDrawing} className="w-full bg-green-600 text-white py-3 rounded font-bold">Zeichnung Speichern</button>
            </div>
          )}
        </div>

        {/* Preview / Canvas */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center p-4 rounded min-h-[400px]">
          {activeTab === 'draw' ? (
              <div className="relative shadow-lg cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    width={512}
                    height={512}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseMove={draw}
                    className="bg-white"
                  />
              </div>
          ) : (
            generatedImage ? (
                <div className="flex flex-col items-center">
                    <img src={generatedImage} alt="Art" className="max-h-[500px] shadow-lg mb-4" />
                    <div className="flex gap-4">
                        <button onClick={handleApply} className="bg-green-600 text-white px-6 py-2 rounded font-bold">Im Spiel verwenden</button>
                        <button onClick={handlePrint} className="bg-blue-800 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">🖨️ Drucken</button>
                    </div>
                </div>
            ) : (
                <div className="text-gray-400 text-center">
                    <span className="text-6xl block mb-2">&#127912;</span>
                    <p>Kein Bild vorhanden.</p>
                </div>
            )
          )}
        </div>

      </div>
    </div>
  );
};

export default ArtStudio;
