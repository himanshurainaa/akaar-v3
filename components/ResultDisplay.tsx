import React from 'react';
import Loader from './Loader';
import Icon from './Icon';

interface ResultDisplayProps {
  isLoading: boolean;
  error: string | null;
  generatedImage: string | null;
  onDownload: () => void;
  loadingMessage: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ isLoading, error, generatedImage, onDownload, loadingMessage }) => {
  return (
    <div className="relative w-full h-full min-h-[500px] aspect-[3/4] bg-slate-900 border-2 border-slate-800 rounded-2xl flex items-center justify-center p-4 overflow-hidden">
      {/* Base content: Image or Placeholder */}
      {generatedImage ? (
        <img
          src={generatedImage}
          alt="Virtual Try-On Result"
          className={`object-contain h-full w-full rounded-lg transition-all duration-500 ${isLoading ? 'opacity-30 blur-md' : 'opacity-100 blur-0'}`}
        />
      ) : (
        !isLoading && !error && (
          <div className="text-center text-slate-500 flex flex-col items-center justify-center h-full">
            <Icon icon="sparkle" className="w-16 h-16 mb-4 text-slate-700 animate-pulse-slow" />
            <h3 className="text-xl font-bold text-slate-300">Your New Look Awaits</h3>
            <p className="mt-2 max-w-xs text-slate-400">Upload your photo and outfit(s) to see the magic happen here.</p>
          </div>
        )
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in-scale">
          <Loader message={loadingMessage} />
        </div>
      )}

      {/* Error Overlay */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 p-4">
          <div className="text-center text-red-400 px-4 animate-fade-in-scale">
            <h3 className="text-xl font-bold mb-2">An Error Occurred</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Download Button */}
      {!isLoading && generatedImage && (
        <button
          onClick={onDownload}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-6 rounded-full hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 animate-fade-in-up"
          aria-label="Download image"
        >
          <Icon icon="download" className="w-5 h-5"/>
          <span>Download</span>
        </button>
      )}
    </div>
  );
};

export default ResultDisplay;