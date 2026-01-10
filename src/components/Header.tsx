import React from 'react';

// Base64 encoded logo for inline use, preventing the need for an extra file request.
const logoSrc = 'https://brandlogos.net/wp-content/uploads/2025/03/gemini_icon-logo_brandlogos.net_bqzeu-768x768.png';

const Header: React.FC = () => {
  return (
    <header className="text-center mb-8 md:mb-12">
      <div className="flex justify-center items-center">
        <img src={logoSrc} alt="ΛkaaR Logo" className="w-12 h-12 sm:w-16 sm:h-16 mr-3 animate-fade-in-slow" />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 tracking-tight">
          ΛkaaR
        </h1>
      </div>
      <p className="mt-10 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
        Virtual try-on powered by <strong>google technologies</strong>. Experience high-fidelity fashion visualization.
      </p>
    </header>
  );
};

export default Header;