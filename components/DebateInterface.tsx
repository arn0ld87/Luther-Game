import React, { useState } from 'react';
import { checkTheologicalArgument, askLutherDeepDive } from '../services/gemini';
import { Question } from '../types';
import { useGame } from '../context/GameContext';

interface DebateInterfaceProps {
  question: Question;
  onComplete: (success: boolean) => void;
}

const DebateInterface: React.FC<DebateInterfaceProps> = ({ question, onComplete }) => {
  const { state, dispatch } = useGame();
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deepDive, setDeepDive] = useState<string | null>(null);

  // New: Persuasion meter (0-100)
  const [persuasion, setPersuasion] = useState(30); // Start with some credibility

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;

    setIsLoading(true);
    setFeedback(null);

    // Call Gemini API
    const result = await checkTheologicalArgument(userAnswer, question.context);

    setIsLoading(false);
    setFeedback(result.feedback);

    if (result.isLutheran) {
      // Increase persuasion significantly
      setPersuasion(p => Math.min(100, p + 40));
      playSound('win'); // Optional: Add specific sound
    } else {
      // Decrease persuasion
      setPersuasion(p => Math.max(0, p - 20));
      playSound('hit');
    }

    // Check win condition
    // If persuasion > 80 -> Win immediately? Or just wait for the feedback and then decide?
    // The original logic was "isLutheran -> Win".
    // New logic: Check if persuasion is high enough or if the *current* answer was "Perfect".
    // Let's stick to the result.isLutheran for "Winning this round" but maybe accumulate persuasion for a "Grand Debate"?
    // For now, let's keep it simple: specific threshold or just strict pass.
    // The user suggested "Persuasions-Messung ... bestimmen den Erfolg".

    if (result.isLutheran && persuasion + 40 >= 80) { // If total is good
       setTimeout(() => onComplete(true), 2500);
    } else if (persuasion - 20 <= 0) {
       // Lose
       setTimeout(() => onComplete(false), 2500);
    }
  };

  const handleDeepDive = async () => {
      setIsLoading(true);
      const explanation = await askLutherDeepDive(question.text);
      setDeepDive(explanation);
      setIsLoading(false);
      // Using a deep dive might cost "Scholarly Quotes" if we had them implemented fully,
      // or gives a bonus context but no immediate persuasion boost.
  };

  const useScholarlyQuote = () => {
      if (state.resources.scholarlyQuotes > 0) {
          dispatch({ type: 'SPEND_RESOURCE', payload: { type: 'scholarlyQuotes', amount: 1 } });
          setPersuasion(p => Math.min(100, p + 20)); // Boost
          // Add a visual cue
      }
  };

  // Helper for sound - ideally imported from audio service, but for now just mock or rely on prop
  const playSound = (type: string) => {
     // We can use the audio service directly or dispatch an action if we want
     import('../services/audio').then(mod => mod.playSound(type as any));
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 p-4">
      <div className="bg-[#f4ecd8] text-black max-w-4xl w-full p-8 rounded shadow-2xl overflow-y-auto max-h-[90vh] flex gap-6">

        {/* Main Interface */}
        <div className="flex-1">
            <h2 className="text-3xl font-serif font-bold mb-4 border-b-2 border-black pb-2">Disputatio</h2>

            <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Die Frage:</h3>
                <p className="text-lg italic">"{question.text}"</p>
                <p className="text-sm text-gray-600 mt-1">Kontext: {question.context}</p>
            </div>

            {/* Persuasion Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-sm font-bold mb-1">
                    <span>Überzeugungskraft</span>
                    <span>{persuasion}%</span>
                </div>
                <div className="w-full bg-gray-300 h-4 rounded-full overflow-hidden">
                    <div
                        className="h-full transition-all duration-500 ease-out"
                        style={{ width: `${persuasion}%`, backgroundColor: persuasion > 50 ? '#27ae60' : '#c0392b' }}
                    />
                </div>
            </div>

            <div className="space-y-4">
                <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Verteidige deine These..."
                    className="w-full h-32 p-3 border-2 border-gray-400 rounded focus:border-black outline-none font-serif text-lg"
                    disabled={isLoading}
                />

                <div className="flex gap-4">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !userAnswer}
                        className="flex-1 bg-black text-white font-bold py-3 px-6 rounded hover:bg-gray-800 disabled:opacity-50"
                    >
                        {isLoading ? 'Luther denkt nach...' : 'These anschlagen'}
                    </button>
                    <button
                        onClick={handleDeepDive}
                        disabled={isLoading}
                        className="bg-[#e67e22] text-white font-bold py-3 px-6 rounded hover:bg-[#d35400] disabled:opacity-50"
                    >
                        Erkläre es mir
                    </button>
                    <button
                        onClick={() => onComplete(false)}
                        className="px-4 py-2 text-gray-500 underline text-sm"
                    >
                        Aufgeben
                    </button>
                </div>
            </div>
        </div>

        {/* Sidebar / Tools */}
        <div className="w-64 bg-[#e8e0c5] p-4 rounded border border-[#d6cba8]">
             <h3 className="font-bold border-b border-black mb-4">Hilfsmittel</h3>

             <div className="mb-4">
                 <div className="text-sm">Gelehrten-Zitate: {state.resources.scholarlyQuotes}</div>
                 <button
                    onClick={useScholarlyQuote}
                    disabled={state.resources.scholarlyQuotes <= 0}
                    className="w-full mt-2 bg-[#8e44ad] text-white text-sm py-2 rounded disabled:opacity-50"
                 >
                    Zitat nutzen (+20%)
                 </button>
             </div>

             {/* Feedback Area */}
             <div className="flex-1 overflow-y-auto max-h-[400px]">
                {feedback && (
                    <div className="p-3 bg-white rounded border-l-4 border-black text-sm mb-4 animate-fadeIn">
                        <span className="font-bold block">Luther:</span>
                        {feedback}
                    </div>
                )}
                 {deepDive && (
                    <div className="p-3 bg-white rounded border-l-4 border-[#1abc9c] text-sm animate-fadeIn whitespace-pre-line">
                        <span className="font-bold block text-[#16a085]">Prof. Zwarg:</span>
                        {deepDive}
                    </div>
                )}
             </div>
        </div>

      </div>
    </div>
  );
};

export default DebateInterface;
