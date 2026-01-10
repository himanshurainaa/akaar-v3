import React, { useState, useEffect } from 'react';
import type { UploadedImage, FitOption } from './types';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import { generateVirtualTryOnImage, getStyleSuggestions } from './services/geminiService';
import Icon from './components/Icon';
import CustomChangesBox from './components/CustomChangesBox';
import Footer from './components/Footer';
import BackgroundChanger from './components/BackgroundChanger';
import { FIT_OPTIONS } from './constants';

// --- New Component: PoseSelector ---
interface PoseSelectorProps {
  poseOption: 'original' | 'replicate';
  onPoseChange: (pose: 'original' | 'replicate') => void;
}
const PoseSelector: React.FC<PoseSelectorProps> = ({ poseOption, onPoseChange }) => {
  return (
    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
      <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center">
        <Icon icon="person" className="w-5 h-5 mr-2 text-indigo-400" />
        3. Choose Pose
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onPoseChange('original')}
          className={`p-3 text-sm font-semibold rounded-lg border-2 transition-all duration-200 ${
            poseOption === 'original'
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
          }`}
        >
          Keep Original Pose
        </button>
        <button
          onClick={() => onPoseChange('replicate')}
          className={`p-3 text-sm font-semibold rounded-lg border-2 transition-all duration-200 ${
            poseOption === 'replicate'
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
          }`}
        >
          Use Outfit's Pose
        </button>
      </div>
    </div>
  );
};

// --- New Component: FitSelector ---
interface FitSelectorProps {
  fitOption: FitOption;
  onFitChange: (fit: FitOption) => void;
}

const FitSelector: React.FC<FitSelectorProps> = ({ fitOption, onFitChange }) => {
  return (
    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
      <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center">
        <Icon icon="outfit" className="w-5 h-5 mr-2 text-indigo-400" />
        4. Select Fit
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {FIT_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onFitChange(id)}
            className={`p-3 text-sm font-semibold rounded-lg border-2 transition-all duration-200 ${
              fitOption === id
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

const dataUrlToUploadedImage = async (dataUrl: string, fileName = "generated-image.png"): Promise<UploadedImage> => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: blob.type });

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve({
                file,
                previewUrl: result,
                base64,
                mimeType: file.type,
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


const App: React.FC = () => {
  // Input images
  const [personImage, setPersonImage] = useState<UploadedImage | null>(null);
  const [outfitImage, setOutfitImage] = useState<UploadedImage | null>(null);
  const [bottomWearImage, setBottomWearImage] = useState<UploadedImage | null>(null);
  const [shoesImage, setShoesImage] = useState<UploadedImage | null>(null);

  // Generation options
  const [poseOption, setPoseOption] = useState<'original' | 'replicate'>('original');
  const [fitOption, setFitOption] = useState<FitOption>('regular');
  
  // Refinement & Output
  const [baseImageForGeneration, setBaseImageForGeneration] = useState<UploadedImage | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [backgroundPrompt, setBackgroundPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  // Suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState<boolean>(false);
  
  // API Key State
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState<boolean>(false);
  const [isIdxEnv, setIsIdxEnv] = useState<boolean>(false);
  
  // Persisted Key Check
  useEffect(() => {
    const checkKey = async () => {
      try {
        const win = window as any;
        // 1. Check IDX environment
        if (win.aistudio && win.aistudio.hasSelectedApiKey) {
          setIsIdxEnv(true);
          const selected = await win.aistudio.hasSelectedApiKey();
          if (selected) {
             setHasApiKey(true);
             setIsCheckingKey(false);
             return;
          }
        } 
        
        // 2. Check process.env (for local dev with .env)
        if (process.env.API_KEY) {
            setHasApiKey(true);
            setIsCheckingKey(false);
            return;
        }

        // 3. Check Local Storage (for deployed apps)
        const storedKey = localStorage.getItem('akaar_gemini_key');
        if (storedKey) {
            setUserApiKey(storedKey);
            setHasApiKey(true);
            setIsCheckingKey(false);
            return;
        }

        // 4. No key found
        setHasApiKey(false);
        setIsIdxEnv(false);
      } catch (e) {
        console.error("Error checking API key:", e);
        setHasApiKey(false);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
      setLoginError(null); 
      setIsPermissionError(false);
      const win = window as any;
      if (win.aistudio && win.aistudio.openSelectKey) {
          try {
            await win.aistudio.openSelectKey();
            setHasApiKey(true); 
          } catch (e) {
            console.error("Error selecting key:", e);
          }
      }
  };
  
  const handleManualKeySubmit = () => {
      if(userApiKey.trim().length > 20 && userApiKey.startsWith('AIza')) {
          localStorage.setItem('akaar_gemini_key', userApiKey);
          setHasApiKey(true);
          setLoginError(null);
      } else {
          setLoginError("Invalid API Key format. It should start with 'AIza'.");
      }
  }

  const handleDisconnect = () => {
      localStorage.removeItem('akaar_gemini_key');
      setUserApiKey('');
      setHasApiKey(false);
      setGeneratedImage(null);
      setPersonImage(null);
  }


  const isRefinement = !!generatedImage;
  const clothingItems = { top: outfitImage, bottom: bottomWearImage, shoes: shoesImage };
  const hasClothing = Object.values(clothingItems).some(item => item !== null);
  
  const canTryOn = baseImageForGeneration && !isLoading && (
    isRefinement
      ? (customPrompt.trim() !== '' || backgroundPrompt.trim() !== '')
      : (hasClothing || customPrompt.trim() !== '')
  );

  const getButtonText = () => {
    if (isLoading) return 'Generating...';
    if (!personImage) return 'Upload Your Photo to Start';
    if (!hasClothing && customPrompt.trim() === '' && !generatedImage) return 'Add Clothing or Custom Change';
    if (generatedImage) return "Generate Again";
    return 'Try It On!';
  };

  const handleStartOver = () => {
    setGeneratedImage(null);
    setError(null);
    setSuggestions([]);
    setCustomPrompt('');
    setBackgroundPrompt('');
    setBaseImageForGeneration(personImage);
  }

  const resetForNewGeneration = () => {
      if(generatedImage) {
          handleStartOver();
      } else {
         setGeneratedImage(null);
         setError(null);
         setSuggestions([]);
      }
  }

  const handleSetPersonImage = (images: UploadedImage[] | null) => {
    const newPersonImage = images ? images[0] : null;
    setPersonImage(newPersonImage);
    setBaseImageForGeneration(newPersonImage); 
    setGeneratedImage(null); 
    setError(null);
    setSuggestions([]);
    setCustomPrompt('');
    setBackgroundPrompt('');
  }
  
  const handleTryOn = async () => {
    if (!canTryOn || !baseImageForGeneration) return;

    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setIsGeneratingSuggestions(false);
    
    // Priority: User Manual Key > Env Key
    const activeKey = userApiKey || process.env.API_KEY || '';

    if (!activeKey) {
        setHasApiKey(false);
        setLoginError("API Key is missing. Please connect again.");
        setIsLoading(false);
        return;
    }
    
    const itemsForThisGeneration = generatedImage ? {} : clothingItems;

    try {
      const imageUrl = await generateVirtualTryOnImage(
        activeKey,
        baseImageForGeneration, 
        itemsForThisGeneration,
        poseOption,
        fitOption,
        customPrompt,
        backgroundPrompt,
        (message) => setLoadingMessage(message)
      );
      setGeneratedImage(imageUrl);
      
      const newBaseImage = await dataUrlToUploadedImage(imageUrl);
      setBaseImageForGeneration(newBaseImage);

      if (hasClothing && !generatedImage) {
        setIsGeneratingSuggestions(true);
        const newSuggestions = await getStyleSuggestions(activeKey, baseImageForGeneration, clothingItems);
        setSuggestions(newSuggestions);
      }
    } catch (e) {
      if (e instanceof Error) {
        const errorMessage = e.message;
        
        // Critical Quota/Auth Errors
        const isQuotaError = errorMessage.includes("Quota exceeded") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429");
        const isLimitZero = errorMessage.includes("limit: 0");
        const is403 = errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("403");
        const isAuthError = errorMessage.includes("Requested entity was not found") || errorMessage.includes("API_KEY") || errorMessage.includes("INVALID_ARGUMENT");

        if (isQuotaError) {
             // DO NOT reset hasApiKey on quota errors, just show the error in the UI. 
             // This prevents the login loop.
             if (isLimitZero) {
                 setError("Free Tier Limit Reached (Limit: 0). You need a Paid Tier key (Pay-as-you-go) for this model.");
             } else {
                 setError("Server is busy (Quota Exceeded). Please wait 30 seconds and try again.");
             }
        } else if (isAuthError) {
             // Reset only if the key is definitely wrong
             setHasApiKey(false);
             setLoginError("API Key is invalid or expired. Please enter a valid key.");
        } else if (is403) {
             // 403 often means API is not enabled, but key is 'valid' format. 
             // Don't logout, just show instruction.
             setError("Permission Denied (403). Please enable 'Generative Language API' in your Google Cloud Console.");
        } else {
            setError(errorMessage);
        }
      }
      else setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      setIsGeneratingSuggestions(false);
      setLoadingMessage('');
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const extension = generatedImage.substring(generatedImage.indexOf('/') + 1, generatedImage.indexOf(';'));
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ΛkaaR-try-on.${extension || 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isCheckingKey) {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
            <Icon icon="sparkle" className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
            <p className="text-slate-400">Initializing...</p>
        </div>
    );
  }

  if (!hasApiKey) {
    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white text-center">
             <div className="flex justify-center items-center mb-8">
                 <img src="https://brandlogos.net/wp-content/uploads/2025/03/gemini_icon-logo_brandlogos.net_bqzeu-768x768.png" alt="ΛkaaR Logo" className="w-12 h-12 mr-3" />
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 tracking-tight">
                    ΛkaaR
                </h1>
            </div>
            
            <div className="max-w-md w-full bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl animate-fade-in-up">
                <Icon icon="sparkle" className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-4">Welcome to ΛkaaR</h2>
                <p className="text-slate-400 mb-6 leading-relaxed">
                    To start your virtual try-on experience, please provide your Google Cloud API Key.
                </p>

                {loginError && (
                    <div className="mb-6 p-4 bg-red-900/30 border border-red-800/50 rounded-xl text-red-200 text-sm text-left flex flex-col gap-2">
                        <div className="flex gap-3">
                            <div className="shrink-0 pt-0.5"><Icon icon="close" className="w-4 h-4 text-red-400"/></div>
                            <p>{loginError}</p>
                        </div>
                        {isPermissionError && (
                             <a 
                                href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="ml-7 text-indigo-300 hover:text-white underline text-xs"
                             >
                                 → Click here to Enable Generative Language API
                             </a>
                        )}
                    </div>
                )}

                {isIdxEnv ? (
                     <button
                        onClick={handleSelectKey}
                        className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                    >
                        <span>Connect Google Cloud Project</span>
                    </button>
                ) : (
                    <div className="flex flex-col gap-3">
                        <input 
                            type="password" 
                            placeholder="Paste your API Key here (starts with AIza...)" 
                            value={userApiKey}
                            onChange={(e) => setUserApiKey(e.target.value)}
                            className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                         <button
                            onClick={handleManualKeySubmit}
                            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                        >
                            <span>Start Experience</span>
                        </button>
                        <p className="text-xs text-slate-500 mt-2">
                            A <strong>Tier 1 (Paid/Pay-as-you-go)</strong> project is required for the Pro model.
                            <br/>Running on GitHub Pages? Manual entry is required.
                        </p>
                    </div>
                )}

                <div className="mt-6 text-xs text-slate-500 space-y-2">
                    <p>
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline">Learn more about billing</a>
                    </p>
                </div>
            </div>
            <Footer />
        </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-screen-xl mx-auto">
        <Header />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-start animate-fade-in-up">
          
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-800">
              <ImageUploader
                title="1. Your Photo"
                icon="person"
                onImageUpload={handleSetPersonImage}
                imagePreviewUrl={personImage?.previewUrl || null}
              />
            </div>

            <div className="bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center">
                    <Icon icon="outfit" className="w-5 h-5 mr-2 text-indigo-400" />
                    2. The Outfit
                </h3>
                <div className="flex flex-col gap-4">
                    <ImageUploader
                        title="Outfit Reference (AI detects items)"
                        icon="outfit"
                        onImageUpload={(img) => { setOutfitImage(img ? img[0] : null); resetForNewGeneration(); }}
                        imagePreviewUrl={outfitImage?.previewUrl || null}
                    />
                    <p className="text-xs text-slate-500 text-center -my-1">Or add specific items to override the reference.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <ImageUploader title="Bottoms (Optional)" icon="bottoms" onImageUpload={(img) => { setBottomWearImage(img ? img[0] : null); resetForNewGeneration(); }} imagePreviewUrl={bottomWearImage?.previewUrl || null} />
                        <ImageUploader title="Shoes (Optional)" icon="shoes" onImageUpload={(img) => { setShoesImage(img ? img[0] : null); resetForNewGeneration(); }} imagePreviewUrl={shoesImage?.previewUrl || null} />
                    </div>
                </div>
            </div>


            <PoseSelector poseOption={poseOption} onPoseChange={setPoseOption} />
            <FitSelector fitOption={fitOption} onFitChange={setFitOption} />

            {!generatedImage && (
              <>
                <CustomChangesBox
                  title="5. Add Custom Changes (Optional)"
                  customPrompt={customPrompt} onPromptChange={setCustomPrompt} suggestions={suggestions} isGeneratingSuggestions={isGeneratingSuggestions}
                  onSuggestionClick={(suggestion) => setCustomPrompt(prev => `${prev} ${suggestion}`.trim())}
                />
                 <button onClick={handleTryOn} disabled={!canTryOn} className="w-full py-3 px-5 md:py-4 md:px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-base md:text-lg hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95">
                    {getButtonText()}
                </button>
              </>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:sticky lg:top-8 flex flex-col gap-6">
            <ResultDisplay
              isLoading={isLoading} error={error} generatedImage={generatedImage} onDownload={handleDownload} loadingMessage={loadingMessage}
            />
            {generatedImage && (
              <>
                <CustomChangesBox
                  title="Refine with Custom Changes"
                  customPrompt={customPrompt} onPromptChange={setCustomPrompt} suggestions={suggestions} isGeneratingSuggestions={isGeneratingSuggestions}
                  onSuggestionClick={(suggestion) => setCustomPrompt(suggestion)}
                />
                <BackgroundChanger
                  backgroundPrompt={backgroundPrompt}
                  onPromptChange={setBackgroundPrompt}
                />
                <div className="flex items-center gap-4">
                    <button onClick={handleStartOver} className="flex items-center justify-center gap-2 w-auto py-3 px-5 border-2 border-slate-600 text-slate-300 font-bold rounded-xl text-base hover:bg-slate-800 hover:border-slate-500 transition-all duration-300 active:scale-95" title="Start Over">
                        <Icon icon="reset" className="w-5 h-5"/>
                        <span>Start Over</span>
                    </button>
                    <button onClick={handleTryOn} disabled={!canTryOn} className="w-full py-3 px-5 md:py-4 md:px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-base md:text-lg hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95">
                        {getButtonText()}
                    </button>
                </div>
              </>
            )}
          </div>
        </div>
        <Footer onDisconnect={handleDisconnect} />
      </div>
    </main>
  );
};

export default App;