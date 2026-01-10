import React from 'react';
import Icon from './Icon';
import SuggestionBox from './SuggestionBox';
import { SURPRISE_PROMPTS } from '../constants';

interface CustomChangesBoxProps {
  title: string;
  customPrompt: string;
  onPromptChange: (prompt: string) => void;
  suggestions: string[];
  isGeneratingSuggestions: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

const CustomChangesBox: React.FC<CustomChangesBoxProps> = ({
  title,
  customPrompt,
  onPromptChange,
  suggestions,
  isGeneratingSuggestions,
  onSuggestionClick,
}) => {
  const handleSurpriseMe = () => {
    const randomPrompt = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
    onPromptChange(randomPrompt);
  };

  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 animate-fade-in-up">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center">
          <Icon icon="edit" className="w-5 h-5 mr-2 text-indigo-400" />
          {title}
        </h3>
        <button
          onClick={handleSurpriseMe}
          className="p-1.5 rounded-full text-slate-400 hover:bg-slate-700 hover:text-indigo-400 transition-all duration-200 transform active:scale-90"
          title="Surprise Me!"
          aria-label="Generate a random custom change prompt"
        >
          <Icon icon="sparkle" className="w-5 h-5" />
        </button>
      </div>
      <textarea
        value={customPrompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="e.g., change hairstyle, add a hat..."
        className="w-full h-24 p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-200 placeholder:text-slate-500"
      />
      <SuggestionBox
        suggestions={suggestions}
        isLoading={isGeneratingSuggestions}
        onSuggestionClick={onSuggestionClick}
      />
    </div>
  );
};

export default CustomChangesBox;