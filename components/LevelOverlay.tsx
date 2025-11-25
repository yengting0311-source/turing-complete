import React, { useState } from 'react';
import { Level, SimulationStatus } from '../types';
import { getAIHint } from '../services/geminiService';

interface LevelOverlayProps {
  level: Level;
  status: SimulationStatus;
  onNextLevel: () => void;
  onRetry: () => void;
}

const LevelOverlay: React.FC<LevelOverlayProps> = ({ level, status, onNextLevel, onRetry }) => {
  const [hint, setHint] = useState<string>('');
  const [loadingHint, setLoadingHint] = useState(false);

  const handleAskAI = async () => {
    setLoadingHint(true);
    const result = await getAIHint(level, "I'm stuck, can you give me a hint on how to solve this level?");
    setHint(result);
    setLoadingHint(false);
  };

  if (status === 'success') {
    return (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-slate-800 border-2 border-green-500 p-8 rounded-lg max-w-md text-center shadow-[0_0_20px_rgba(74,222,128,0.3)]">
          <h2 className="text-3xl font-bold text-green-400 mb-4">Level Complete!</h2>
          <p className="text-gray-300 mb-6">Simulation verified successfully.</p>
          <button
            onClick={onNextLevel}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md transition-all transform hover:scale-105"
          >
            Next Level
          </button>
        </div>
      </div>
    );
  }

  // Only show help dialog if manually invoked or needed (for now, let's keep it simple inside a sidebar or top bar, 
  // but here we render a persistent instructions card if not success)
  
  return (
    <div className="absolute top-4 right-4 z-40 w-80">
        <div className="bg-slate-800/90 backdrop-blur border border-slate-600 p-4 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Mission: {level.name}</h3>
            <p className="text-sm text-gray-300 mb-3">{level.description}</p>
            <p className="text-xs text-yellow-400 mb-4">Goal: {level.goal}</p>
            
            {hint && (
                <div className="bg-slate-900 p-3 rounded mb-3 text-sm text-gray-200 border-l-2 border-purple-500">
                    <span className="font-bold text-purple-400">AI:</span> {hint}
                </div>
            )}

            <div className="flex gap-2">
                <button 
                    onClick={handleAskAI}
                    disabled={loadingHint}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs py-2 rounded text-white disabled:opacity-50"
                >
                    {loadingHint ? 'Consulting...' : 'Ask AI Hint'}
                </button>
                 <button 
                    onClick={onRetry}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-xs py-2 rounded text-white"
                >
                    Reset Board
                </button>
            </div>
        </div>
    </div>
  );
};

export default LevelOverlay;