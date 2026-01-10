import React from 'react';

interface SuggestionBoxProps {
  suggestions: string[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

const SuggestionBox: React.FC<SuggestionBoxProps> = ({ suggestions, isLoading, onSuggestionClick }) => {
  if (isLoading) {
    return (
      <div className="mt-4 text-sm text-slate-400 animate-pulse">
        Getting style ideas...
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Style Suggestions</h4>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-full hover:bg-indigo-600 hover:text-white transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionBox;