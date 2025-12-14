import React, { useState, useRef, useCallback } from 'react';
import { Question } from '../types';
import { checkTheologicalArgument, askLutherDeepDive } from '../services/gemini';
import { GAME_CONFIG, UI_CONFIG } from '../constants';

interface Props {
  question: Question;
  onComplete: (success: boolean) => void;
}

/**
 * Simple debounce hook to prevent rapid API calls
 */
const useDebounce = () => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCallRef = useRef<number>(0);

  const debounce = useCallback((fn: () => void, delay: number = UI_CONFIG.DEBOUNCE_DELAY): boolean => {
    const now = Date.now();
    if (now - lastCallRef.current < delay) {
      return false; // Call rejected (too soon)
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    lastCallRef.current = now;
    fn();
    return true;
  }, []);

  return debounce;
};

const DebateInterface: React.FC<Props> = ({ question, onComplete }) => {
  const [mode, setMode] = useState<'choice' | 'chat'>('choice');
  const [customArg, setCustomArg] = useState('');
  const [feedback, setFeedback] = useState<{ isLutheran: boolean; text: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [askLutherQuery, setAskLutherQuery] = useState('');
  const [lutherResponse, setLutherResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to track pending operations and prevent race conditions
  const analysisAbortRef = useRef(false);
  const lutherAbortRef = useRef(false);

  const debounce = useDebounce();

  // Character count for validation feedback
  const customArgLength = customArg.length;
  const isCustomArgTooLong = customArgLength > UI_CONFIG.MAX_ARGUMENT_LENGTH;
  const queryLength = askLutherQuery.length;
  const isQueryTooLong = queryLength > UI_CONFIG.MAX_QUESTION_LENGTH;

  const handleOptionClick = useCallback((isLuther: boolean) => {
    setError(null);
    if (isLuther) {
      setFeedback({ isLutheran: true, text: "Richtig! Das entspricht dem Sola Gratia." });
      setTimeout(() => onComplete(true), GAME_CONFIG.FEEDBACK_DELAY_CORRECT);
    } else {
      setFeedback({ isLutheran: false, text: "Vorsicht! Das klingt eher nach Erasmus und Werkgerechtigkeit." });
    }
  }, [onComplete]);

  const handleCustomSubmit = useCallback(async () => {
    const trimmedArg = customArg.trim();

    // Validation
    if (!trimmedArg) {
      setError("Bitte gib eine Antwort ein.");
      return;
    }

    if (isCustomArgTooLong) {
      setError(`Deine Antwort ist zu lang (max. ${UI_CONFIG.MAX_ARGUMENT_LENGTH} Zeichen).`);
      return;
    }

    // Prevent concurrent requests
    if (isAnalyzing) return;

    // Debounce rapid submissions
    const shouldProceed = debounce(() => {}, UI_CONFIG.DEBOUNCE_DELAY);
    if (!shouldProceed) return;

    setError(null);
    setIsAnalyzing(true);
    analysisAbortRef.current = false;

    try {
      const result = await checkTheologicalArgument(trimmedArg, question.text);

      // Check if request was aborted
      if (analysisAbortRef.current) return;

      setFeedback({ isLutheran: result.isLutheran, text: result.feedback });

      if (result.isLutheran) {
        setTimeout(() => {
          if (!analysisAbortRef.current) {
            onComplete(true);
          }
        }, GAME_CONFIG.FEEDBACK_DELAY_CUSTOM);
      }
    } catch (err) {
      if (!analysisAbortRef.current) {
        setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
        console.error("Custom submit error:", err);
      }
    } finally {
      if (!analysisAbortRef.current) {
        setIsAnalyzing(false);
      }
    }
  }, [customArg, isCustomArgTooLong, isAnalyzing, debounce, question.text, onComplete]);

  const handleAskLuther = useCallback(async () => {
    const trimmedQuery = askLutherQuery.trim();

    // Validation
    if (!trimmedQuery) {
      setError("Bitte stelle eine Frage.");
      return;
    }

    if (isQueryTooLong) {
      setError(`Deine Frage ist zu lang (max. ${UI_CONFIG.MAX_QUESTION_LENGTH} Zeichen).`);
      return;
    }

    // Prevent concurrent requests
    if (isThinking) return;

    // Debounce rapid submissions
    const shouldProceed = debounce(() => {}, UI_CONFIG.DEBOUNCE_DELAY);
    if (!shouldProceed) return;

    setError(null);
    setIsThinking(true);
    lutherAbortRef.current = false;

    try {
      const answer = await askLutherDeepDive(trimmedQuery);

      if (!lutherAbortRef.current) {
        setLutherResponse(answer || "Luther schweigt...");
      }
    } catch (err) {
      if (!lutherAbortRef.current) {
        setError("Luther konnte nicht antworten. Bitte versuche es erneut.");
        console.error("Ask Luther error:", err);
      }
    } finally {
      if (!lutherAbortRef.current) {
        setIsThinking(false);
      }
    }
  }, [askLutherQuery, isQueryTooLong, isThinking, debounce]);

  // Handle Enter key for submission
  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  }, []);

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 p-4">
      <div className="bg-[#2c3e50] border-2 border-[#f1c40f] p-8 max-w-2xl w-full rounded-lg shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-3xl text-[#f1c40f] font-serif mb-2">Disputatio</h2>
          <button
            onClick={() => {
              setMode(mode === 'choice' ? 'chat' : 'choice');
              setError(null);
            }}
            className="text-xs underline text-gray-400 hover:text-white transition-colors"
          >
            {mode === 'choice' ? 'Freie Eingabe' : 'Multiple Choice'}
          </button>
        </div>

        <div className="mb-6 p-4 bg-[#34495e] rounded border-l-4 border-red-500">
          <h3 className="text-xl font-bold text-red-400 mb-2">Erasmus wendet ein:</h3>
          <p className="italic">"{question.erasmusArgument}"</p>
        </div>

        <p className="mb-6 text-lg">{question.text}</p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-600/20 border border-red-500 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        {mode === 'choice' ? (
          <div className="space-y-3">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionClick(opt.isLuther)}
                disabled={isAnalyzing}
                className="w-full text-left p-4 rounded bg-[#ecf0f1] text-[#2c3e50] hover:bg-[#bdc3c7] transition-colors font-serif disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {opt.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                className={`w-full p-3 rounded text-black resize-none ${isCustomArgTooLong ? 'border-2 border-red-500' : ''}`}
                rows={3}
                placeholder="Formuliere deine Antwort im Sinne Luthers..."
                value={customArg}
                onChange={(e) => setCustomArg(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleCustomSubmit)}
                disabled={isAnalyzing}
                maxLength={UI_CONFIG.MAX_ARGUMENT_LENGTH + 100}
              />
              <span className={`absolute bottom-2 right-2 text-xs ${isCustomArgTooLong ? 'text-red-500' : 'text-gray-500'}`}>
                {customArgLength}/{UI_CONFIG.MAX_ARGUMENT_LENGTH}
              </span>
            </div>
            <button
              onClick={handleCustomSubmit}
              disabled={isAnalyzing || isCustomArgTooLong || !customArg.trim()}
              className="bg-[#f1c40f] text-[#2c3e50] px-6 py-2 rounded font-bold hover:bg-[#f39c12] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-[#2c3e50] border-t-transparent rounded-full"></span>
                  Analysiere Theologie...
                </span>
              ) : (
                "Antworten"
              )}
            </button>
          </div>
        )}

        {feedback && (
          <div className={`mt-6 p-4 rounded transition-all ${feedback.isLutheran ? 'bg-green-600' : 'bg-red-600'}`}>
            <p className="font-bold">{feedback.isLutheran ? 'Bene!' : 'Anathema!'}</p>
            <p>{feedback.text}</p>
          </div>
        )}

        <hr className="my-8 border-gray-600" />

        {/* Deep Dive Section */}
        <div className="bg-[#1a252f] p-4 rounded">
          <h4 className="text-[#f1c40f] mb-2 font-serif flex items-center gap-2">
            <span>?</span> Frag Professorin Zwarg (Luther-Modus)
          </h4>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={askLutherQuery}
                onChange={(e) => setAskLutherQuery(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleAskLuther)}
                placeholder="Warum ist der Wille unfrei?"
                className={`w-full p-2 rounded text-black text-sm pr-16 ${isQueryTooLong ? 'border-2 border-red-500' : ''}`}
                disabled={isThinking}
                maxLength={UI_CONFIG.MAX_QUESTION_LENGTH + 50}
              />
              <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${isQueryTooLong ? 'text-red-500' : 'text-gray-500'}`}>
                {queryLength}/{UI_CONFIG.MAX_QUESTION_LENGTH}
              </span>
            </div>
            <button
              onClick={handleAskLuther}
              disabled={isThinking || isQueryTooLong || !askLutherQuery.trim()}
              className="bg-[#3498db] px-4 py-2 rounded text-sm hover:bg-[#2980b9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {isThinking ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                  Denke...
                </span>
              ) : (
                "Fragen"
              )}
            </button>
          </div>
          {lutherResponse && (
            <div className="mt-4 text-sm text-gray-300 italic bg-black/20 p-3 rounded max-h-48 overflow-y-auto">
              {lutherResponse}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebateInterface;
