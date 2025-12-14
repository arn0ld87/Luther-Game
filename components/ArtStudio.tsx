import React, { useState } from 'react';
import { generateGameAsset, editGameTexture } from '../services/gemini';
import { ImageSize } from '../types';

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

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    const result = await generateGameAsset(prompt, size);
    if (result) {
      setGeneratedImage(result);
    }
    setLoading(false);
  };

  const handleEdit = async () => {
    if (!generatedImage || !editInstruction) return;
    setLoading(true);
    const result = await editGameTexture(generatedImage, editInstruction);
    if (result) {
      setGeneratedImage(result);
    }
    setLoading(false);
  };

  return (
    <div className="absolute inset-0 bg-black/90 z-30 flex items-center justify-center p-4">
      <div className="bg-white text-black p-6 rounded-lg max-w-4xl w-full flex flex-col md:flex-row gap-6 shadow-2xl">
        
        {/* Controls */}
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
             <h2 className="text-2xl font-serif font-bold text-[#2c3e50]">Kirchen-Atelier</h2>
             <button onClick={onClose} className="text-red-500 font-bold hover:text-red-700">X</button>
          </div>

          <div className="flex gap-4 mb-4">
            <button 
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded ${activeTab === 'create' ? 'bg-[#2c3e50] text-white' : 'bg-gray-200'}`}
            >
                Erstellen
            </button>
            <button 
                onClick={() => setActiveTab('edit')}
                disabled={!generatedImage}
                className={`px-4 py-2 rounded ${activeTab === 'edit' ? 'bg-[#2c3e50] text-white' : 'bg-gray-200 disabled:opacity-50'}`}
            >
                Bearbeiten
            </button>
          </div>

          {activeTab === 'create' && (
              <div className="space-y-4">
                  <div>
                    <label className="block font-bold mb-1">Motiv beschreiben (Gemini 3 Pro):</label>
                    <textarea 
                        className="w-full border p-2 rounded" 
                        rows={3}
                        placeholder="Ein Buntglasfenster mit Martin Luther..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Größe:</label>
                    <select 
                        value={size} 
                        onChange={(e) => setSize(e.target.value as ImageSize)}
                        className="w-full border p-2 rounded"
                    >
                        <option value={ImageSize.S_1K}>1K (Standard)</option>
                        <option value={ImageSize.S_2K}>2K (High Res)</option>
                        <option value={ImageSize.S_4K}>4K (Ultra)</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-[#f1c40f] hover:bg-[#f39c12] text-[#2c3e50] font-bold py-3 rounded transition-all"
                  >
                    {loading ? "Maler malen..." : "Bild generieren"}
                  </button>
              </div>
          )}

          {activeTab === 'edit' && (
              <div className="space-y-4">
                  <p className="text-sm text-gray-600">Nutze Gemini 2.5 Flash, um das Bild zu verändern.</p>
                  <div>
                      <label className="block font-bold mb-1">Anweisung:</label>
                      <input 
                        type="text" 
                        className="w-full border p-2 rounded"
                        placeholder="Füge einen Heiligenschein hinzu..."
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                      />
                  </div>
                  <button 
                    onClick={handleEdit}
                    disabled={loading}
                    className="w-full bg-[#9b59b6] hover:bg-[#8e44ad] text-white font-bold py-3 rounded transition-all"
                  >
                    {loading ? "Verändere..." : "Bearbeiten"}
                  </button>
              </div>
          )}
        </div>

        {/* Preview */}
        <div className="flex-1 bg-gray-100 flex flex-col items-center justify-center p-4 rounded border-2 border-dashed border-gray-300 min-h-[300px]">
          {generatedImage ? (
            <div className="relative w-full h-full flex flex-col items-center">
                <img src={generatedImage} alt="Generated Asset" className="max-h-[400px] object-contain shadow-lg mb-4" />
                <button 
                    onClick={() => {
                        onApplyTexture(generatedImage);
                        onClose();
                    }}
                    className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700"
                >
                    In Spiel verwenden
                </button>
            </div>
          ) : (
            <div className="text-center text-gray-400">
                <span className="material-icons text-6xl">palette</span>
                <p>Noch kein Kunstwerk erschaffen.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ArtStudio;
