import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Sparkles, Image as ImageIcon, Loader2, Download, RefreshCw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STYLES = [
  {
    id: 'studio',
    name: 'Professional Studio',
    description: 'Clean lighting and neutral backdrop',
    prompt: 'Enhance this photo to look like a high-end professional studio portrait. Improve lighting, skin texture, and replace the background with a clean, neutral studio backdrop. Make it look sharp and professional.',
    icon: '👤'
  },
  {
    id: 'outdoor',
    name: 'Outdoor Bokeh',
    description: 'Natural light and blurred nature',
    prompt: 'Transform this photo to look like it was taken outdoors in a beautiful park during golden hour. Add a soft bokeh effect to the background and warm, natural lighting. Enhance the colors to be vibrant and warm.',
    icon: '🌳'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon lights and futuristic vibes',
    prompt: 'Give this photo a cyberpunk aesthetic. Add neon lights, futuristic city background, and high-contrast blue and magenta color grading. Make the subject look like they belong in a sci-fi movie.',
    icon: '🌆'
  },
  {
    id: 'painting',
    name: 'Oil Painting',
    description: 'Classic artistic masterpiece',
    prompt: 'Turn this photo into a classic oil painting masterpiece. Add visible brushstrokes, rich textures, and a timeless artistic feel. Maintain the likeness of the person but with an artistic painterly style.',
    icon: '🎨'
  },
  {
    id: 'sketch',
    name: 'Pencil Sketch',
    description: 'Hand-drawn artistic look',
    prompt: 'Convert this photo into a detailed pencil sketch. Use fine lines, shading, and cross-hatching to create a realistic hand-drawn look on textured paper.',
    icon: '✏️'
  },
  {
    id: 'custom',
    name: 'Custom Style',
    description: 'Define your own AI prompt',
    prompt: '',
    icon: '✨'
  }
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setProcessedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const enhanceImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Extract base64 data and mime type
      const mimeType = selectedImage.split(';')[0].split(':')[1];
      const base64Data = selectedImage.split(',')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: selectedStyle.id === 'custom' ? customPrompt : selectedStyle.prompt,
            },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setProcessedImage(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("No image was generated. Please try again.");
      }
    } catch (err: any) {
      console.error("Error enhancing image:", err);
      setError(err.message || "Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `enhanced-${selectedStyle.id}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">AI Portrait Studio</h1>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Powered by Gemini</p>
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="hidden md:flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-medium hover:bg-zinc-200 transition-colors"
          >
            <Upload size={18} />
            Upload Photo
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
          
          {/* Workspace */}
          <div className="space-y-8">
            <div className="relative aspect-[4/3] md:aspect-video bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden group">
              {!selectedImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <ImageIcon className="text-zinc-500 w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Start with a photo</h2>
                  <p className="text-zinc-500">Upload a selfie or portrait to begin</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col md:flex-row gap-4 p-4">
                  <div className="flex-1 relative rounded-2xl overflow-hidden bg-black">
                    <img 
                      src={selectedImage} 
                      alt="Original" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                      Original
                    </div>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {processedImage ? (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex-1 relative rounded-2xl overflow-hidden bg-black border border-emerald-500/30"
                      >
                        <img 
                          src={processedImage} 
                          alt="Processed" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4 bg-emerald-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          Enhanced
                        </div>
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          <button 
                            onClick={downloadImage}
                            className="bg-white text-black p-2.5 rounded-full hover:bg-zinc-200 transition-colors shadow-xl"
                            title="Download"
                          >
                            <Download size={20} />
                          </button>
                        </div>
                      </motion.div>
                    ) : isProcessing && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-800/50 flex flex-col items-center justify-center"
                      >
                        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                        <p className="text-emerald-500 font-medium animate-pulse">Applying {selectedStyle.name}...</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                {error}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-6">Select Style</h3>
              <div className="space-y-3">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group ${
                      selectedStyle.id === style.id 
                        ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50' 
                        : 'bg-zinc-900/50 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        selectedStyle.id === style.id ? 'bg-emerald-500 text-black' : 'bg-zinc-800 group-hover:bg-zinc-700'
                      }`}>
                        {style.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{style.name}</span>
                          {selectedStyle.id === style.id && <Check size={16} className="text-emerald-500" />}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{style.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {selectedStyle.id === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Custom Prompt</label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Describe how you want to transform the photo (e.g., 'Make it look like a 1920s vintage black and white photo with film grain')"
                      className="w-full h-32 bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all resize-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              disabled={!selectedImage || isProcessing || (selectedStyle.id === 'custom' && !customPrompt.trim())}
              onClick={enhanceImage}
              className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                !selectedImage || isProcessing
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-[0.98]'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles />
                  Enhance Photo
                </>
              )}
            </button>

            {processedImage && (
              <button
                onClick={() => {
                  setProcessedImage(null);
                  setSelectedImage(null);
                }}
                className="w-full py-4 rounded-2xl font-semibold text-zinc-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw size={18} />
                Start Over
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 text-center">
        <p className="text-zinc-600 text-sm">
          Transform your portraits with state-of-the-art AI. 
          <br />
          Upload a clear photo for the best results.
        </p>
      </footer>
    </div>
  );
}
