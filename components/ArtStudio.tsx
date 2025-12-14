import React, { useState, useCallback, useRef } from 'react';
import { generateGameAsset, editGameTexture } from '../services/gemini';
import { ImageSize } from '../types';
import { UI_CONFIG } from '../constants';

interface Props {
  onClose: () => void;
  onApplyTexture: (url: string) => void;
}

const ArtStudio: React.FC<Props> = ({ onClose, onApplyTexture }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState<ImageSize>(ImageSize.S_1K);
  const [editInstruction, setEditInstruction] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');
  const [error, setError] = useState<string | null>(null);

  // Ref to track abort state
  const abortRef = useRef(false);

  // Validation states
  const promptLength = prompt.length;
  const isPromptTooLong = promptLength > UI_CONFIG.MAX_PROMPT_LENGTH;
  const editLength = editInstruction.length;
  const isEditTooLong = editLength > UI_CONFIG.MAX_PROMPT_LENGTH;

  const handleGenerate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();

    // Validation
    if (!trimmedPrompt) {
      setError("Bitte beschreibe das gewünschte Motiv.");
      return;
    }

    if (isPromptTooLong) {
      setError(`Die Beschreibung ist zu lang (max. ${UI_CONFIG.MAX_PROMPT_LENGTH} Zeichen).`);
      return;
    }

    if (loading) return;

    setError(null);
    setLoading(true);
    abortRef.current = false;

    try {
      const result = await generateGameAsset(trimmedPrompt, size);

      if (abortRef.current) return;

      if (result) {
        setGeneratedImage(result);
      } else {
        setError("Das Bild konnte nicht erstellt werden. Bitte versuche es mit einer anderen Beschreibung.");
      }
    } catch (err) {
      if (!abortRef.current) {
        setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
        console.error("Generate error:", err);
      }
    } finally {
      if (!abortRef.current) {
        setLoading(false);
      }
    }
  }, [prompt, isPromptTooLong, loading, size]);

  const handleEdit = useCallback(async () => {
    const trimmedInstruction = editInstruction.trim();

    // Validation
    if (!generatedImage) {
      setError("Erstelle zuerst ein Bild, bevor du es bearbeiten kannst.");
      return;
    }

    if (!trimmedInstruction) {
      setError("Bitte beschreibe, wie das Bild verändert werden soll.");
      return;
    }

    if (isEditTooLong) {
      setError(`Die Anweisung ist zu lang (max. ${UI_CONFIG.MAX_PROMPT_LENGTH} Zeichen).`);
      return;
    }

    if (loading) return;

    setError(null);
    setLoading(true);
    abortRef.current = false;

    try {
      const result = await editGameTexture(generatedImage, trimmedInstruction);

      if (abortRef.current) return;

      if (result) {
        setGeneratedImage(result);
        setEditInstruction(''); // Clear instruction after successful edit
      } else {
        setError("Das Bild konnte nicht bearbeitet werden. Bitte versuche eine andere Anweisung.");
      }
    } catch (err) {
      if (!abortRef.current) {
        setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
        console.error("Edit error:", err);
      }
    } finally {
      if (!abortRef.current) {
        setLoading(false);
      }
    }
  }, [generatedImage, editInstruction, isEditTooLong, loading]);

  const handleApply = useCallback(() => {
    if (generatedImage) {
      onApplyTexture(generatedImage);
      onClose();
    }
  }, [generatedImage, onApplyTexture, onClose]);

  const handleClose = useCallback(() => {
    abortRef.current = true;
    onClose();
  }, [onClose]);

  // Handle Enter key for submission
  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  }, []);

  return (
    <div className="absolute inset-0 bg-black/90 z-30 flex items-center justify-center p-4">
      <div className="bg-white text-black p-6 rounded-lg max-w-4xl w-full flex flex-col md:flex-row gap-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Controls */}
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-2xl font-serif font-bold text-[#2c3e50]">Kirchen-Atelier</h2>
            <button
              onClick={handleClose}
              className="text-red-500 font-bold hover:text-red-700 transition-colors text-xl leading-none"
              aria-label="Schließen"
            >
              &times;
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4 mb-4">
            <button
              onClick={() => {
                setActiveTab('create');
                setError(null);
              }}
              className={`px-4 py-2 rounded transition-colors ${activeTab === 'create' ? 'bg-[#2c3e50] text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Erstellen
            </button>
            <button
              onClick={() => {
                setActiveTab('edit');
                setError(null);
              }}
              disabled={!generatedImage}
              className={`px-4 py-2 rounded transition-colors ${activeTab === 'edit' ? 'bg-[#2c3e50] text-white' : 'bg-gray-200 hover:bg-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
              title={!generatedImage ? "Erstelle zuerst ein Bild" : "Bild bearbeiten"}
            >
              Bearbeiten
            </button>
          </div>

          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-1">Motiv beschreiben (Gemini 3 Pro):</label>
                <div className="relative">
                  <textarea
                    className={`w-full border p-2 rounded resize-none ${isPromptTooLong ? 'border-red-500 border-2' : 'border-gray-300'}`}
                    rows={3}
                    placeholder="Ein Buntglasfenster mit Martin Luther..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleGenerate)}
                    disabled={loading}
                    maxLength={UI_CONFIG.MAX_PROMPT_LENGTH + 50}
                  />
                  <span className={`absolute bottom-2 right-2 text-xs ${isPromptTooLong ? 'text-red-500' : 'text-gray-500'}`}>
                    {promptLength}/{UI_CONFIG.MAX_PROMPT_LENGTH}
                  </span>
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Größe:</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as ImageSize)}
                  className="w-full border border-gray-300 p-2 rounded"
                  disabled={loading}
                >
                  <option value={ImageSize.S_1K}>1K (Standard)</option>
                  <option value={ImageSize.S_2K}>2K (High Res)</option>
                  <option value={ImageSize.S_4K}>4K (Ultra)</option>
                </select>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading || isPromptTooLong || !prompt.trim()}
                className="w-full bg-[#f1c40f] hover:bg-[#f39c12] text-[#2c3e50] font-bold py-3 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-[#2c3e50] border-t-transparent rounded-full"></span>
                    Bild wird generiert...
                  </span>
                ) : (
                  "Bild generieren"
                )}
              </button>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Nutze Gemini 2.5 Flash, um das Bild zu verändern.</p>
              <div>
                <label className="block font-bold mb-1">Anweisung:</label>
                <div className="relative">
                  <input
                    type="text"
                    className={`w-full border p-2 rounded ${isEditTooLong ? 'border-red-500 border-2' : 'border-gray-300'}`}
                    placeholder="Füge einen Heiligenschein hinzu..."
                    value={editInstruction}
                    onChange={(e) => setEditInstruction(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleEdit)}
                    disabled={loading}
                    maxLength={UI_CONFIG.MAX_PROMPT_LENGTH + 50}
                  />
                  <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${isEditTooLong ? 'text-red-500' : 'text-gray-500'}`}>
                    {editLength}/{UI_CONFIG.MAX_PROMPT_LENGTH}
                  </span>
                </div>
              </div>
              <button
                onClick={handleEdit}
                disabled={loading || isEditTooLong || !editInstruction.trim()}
                className="w-full bg-[#9b59b6] hover:bg-[#8e44ad] text-white font-bold py-3 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                    Bild wird bearbeitet...
                  </span>
                ) : (
                  "Bearbeiten"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="flex-1 bg-gray-100 flex flex-col items-center justify-center p-4 rounded border-2 border-dashed border-gray-300 min-h-[300px]">
          {loading && !generatedImage ? (
            <div className="text-center text-gray-500">
              <div className="animate-spin inline-block w-12 h-12 border-4 border-[#f1c40f] border-t-transparent rounded-full mb-4"></div>
              <p>Kunstwerk entsteht...</p>
            </div>
          ) : generatedImage ? (
            <div className="relative w-full h-full flex flex-col items-center">
              <div className="relative">
                <img
                  src={generatedImage}
                  alt="Generiertes Kunstwerk"
                  className="max-h-[400px] object-contain shadow-lg mb-4 rounded"
                />
                {loading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              <button
                onClick={handleApply}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Im Spiel verwenden
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <span className="text-6xl block mb-2">&#127912;</span>
              <p>Noch kein Kunstwerk erschaffen.</p>
              <p className="text-sm mt-2">Beschreibe ein Motiv und klicke auf "Bild generieren".</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ArtStudio;
