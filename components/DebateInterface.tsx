import React, { useState } from 'react';
import { Question } from '../types';
import { checkTheologicalArgument, askLutherDeepDive } from '../services/gemini';

interface Props {
  question: Question;
  onComplete: (success: boolean) => void;
}

const DebateInterface: React.FC<Props> = ({ question, onComplete }) => {
  const [mode, setMode] = useState<'choice' | 'chat'>('choice');
  const [customArg, setCustomArg] = useState('');
  const [feedback, setFeedback] = useState<{isLutheran: boolean, text: string} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [askLutherQuery, setAskLutherQuery] = useState('');
  const [lutherResponse, setLutherResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleOptionClick = (isLuther: boolean) => {
    if (isLuther) {
      setFeedback({ isLutheran: true, text: "Richtig! Das entspricht dem Sola Gratia." });
      setTimeout(() => onComplete(true), 2000);
    } else {
      setFeedback({ isLutheran: false, text: "Vorsicht! Das klingt eher nach Erasmus und Werkgerechtigkeit." });
    }
  };

  const handleCustomSubmit = async () => {
    if (!customArg.trim()) return;
    setIsAnalyzing(true);
    const result = await checkTheologicalArgument(customArg, question.text);
    setFeedback({ isLutheran: result.isLutheran, text: result.feedback });
    setIsAnalyzing(false);
    if (result.isLutheran) {
      setTimeout(() => onComplete(true), 3000);
    }
  };

  const handleAskLuther = async () => {
    if (!askLutherQuery.trim()) return;
    setIsThinking(true);
    const answer = await askLutherDeepDive(askLutherQuery);
    setLutherResponse(answer || "Luther schweigt...");
    setIsThinking(false);
  };

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 p-4">
      <div className="bg-[#2c3e50] border-2 border-[#f1c40f] p-8 max-w-2xl w-full rounded-lg shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
            <h2 className="text-3xl text-[#f1c40f] font-serif mb-2">Disputatio</h2>
            <button onClick={() => setMode(mode === 'choice' ? 'chat' : 'choice')} className="text-xs underline text-gray-400">
                {mode === 'choice' ? 'Freie Eingabe' : 'Multiple Choice'}
            </button>
        </div>
        
        <div className="mb-6 p-4 bg-[#34495e] rounded border-l-4 border-red-500">
          <h3 className="text-xl font-bold text-red-400 mb-2">Erasmus wendet ein:</h3>
          <p className="italic">"{question.erasmusArgument}"</p>
        </div>

        <p className="mb-6 text-lg">{question.text}</p>

        {mode === 'choice' ? (
          <div className="space-y-3">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionClick(opt.isLuther)}
                className="w-full text-left p-4 rounded bg-[#ecf0f1] text-[#2c3e50] hover:bg-[#bdc3c7] transition-colors font-serif"
              >
                {opt.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
             <textarea
                className="w-full p-3 rounded text-black"
                rows={3}
                placeholder="Formuliere deine Antwort im Sinne Luthers..."
                value={customArg}
                onChange={(e) => setCustomArg(e.target.value)}
             />
             <button 
                onClick={handleCustomSubmit}
                disabled={isAnalyzing}
                className="bg-[#f1c40f] text-[#2c3e50] px-6 py-2 rounded font-bold hover:bg-[#f39c12] disabled:opacity-50"
             >
                {isAnalyzing ? "Analysiere Theologie..." : "Antworten"}
             </button>
          </div>
        )}

        {feedback && (
          <div className={`mt-6 p-4 rounded ${feedback.isLutheran ? 'bg-green-600' : 'bg-red-600'}`}>
            <p className="font-bold">{feedback.isLutheran ? 'Bene!' : 'Anathema!'}</p>
            <p>{feedback.text}</p>
          </div>
        )}

        <hr className="my-8 border-gray-600"/>

        {/* Deep Dive Section */}
        <div className="bg-[#1a252f] p-4 rounded">
            <h4 className="text-[#f1c40f] mb-2 font-serif flex items-center gap-2">
                <span className="material-icons">help</span> Frag Professorin Zwarg (Luther-Modus)
            </h4>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={askLutherQuery}
                    onChange={(e) => setAskLutherQuery(e.target.value)}
                    placeholder="Warum ist der Wille unfrei?"
                    className="flex-1 p-2 rounded text-black text-sm"
                />
                <button 
                    onClick={handleAskLuther}
                    disabled={isThinking}
                    className="bg-[#3498db] px-4 py-2 rounded text-sm hover:bg-[#2980b9] disabled:opacity-50"
                >
                    {isThinking ? "Denke nach..." : "Fragen"}
                </button>
            </div>
            {lutherResponse && (
                <div className="mt-4 text-sm text-gray-300 italic bg-black/20 p-3 rounded">
                    {lutherResponse}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DebateInterface;
