import React from 'react';
import Icon from './Icon';
import { BACKGROUND_SUGGESTIONS } from '../constants';

interface BackgroundChangerProps {
  backgroundPrompt: string;
  onPromptChange: (prompt: string) => void;
}

const BackgroundChanger: React.FC<BackgroundChangerProps> = ({
  backgroundPrompt,
  onPromptChange,
}) => {
  const handleSuggestionClick = (suggestion: string) => {
    onPromptChange(suggestion);
  };

  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 animate-fade-in-up">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center">
          <Icon icon="background" className="w-5 h-5 mr-2 text-indigo-400" />
          Change Background (Optional)
        </h3>
      </div>
      <textarea
        value={backgroundPrompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="e.g., a beach at sunset, a studio..."
        className="w-full h-24 p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-200 placeholder:text-slate-500"
      />
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
            {BACKGROUND_SUGGESTIONS.map((suggestion, index) => (
            <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-full hover:bg-indigo-600 hover:text-white transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
                {suggestion}
            </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default BackgroundChanger;