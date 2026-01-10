import React from 'react';
import Icon from './Icon';

interface FooterProps {
    onDisconnect?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onDisconnect }) => {
  return (
    <footer className="mt-12 mb-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex justify-center items-center gap-4">
            <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 tracking-wide">
            TEAM LIQUID
            </p>
            <a 
            href="https://www.instagram.com/_himanshurainaa/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-transform duration-300 transform hover:scale-110"
            aria-label="Instagram profile"
            >
            <Icon icon="instagram" className="w-6 h-6" />
            </a>
        </div>
        
        {onDisconnect && (
             <button 
                onClick={onDisconnect}
                className="text-xs text-slate-600 hover:text-red-400 transition-colors underline"
             >
                Disconnect API Key
             </button>
        )}
      </div>
    </footer>
  );
};

export default Footer;