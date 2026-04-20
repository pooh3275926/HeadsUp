import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Trophy, 
  RotateCcw, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Volume2,
  VolumeX,
  Palette,
  Home as HomeIcon
} from 'lucide-react';
import { WORD_BANK, Category } from './constants/wordBank';

type GameState = 'HOME' | 'SETUP' | 'COUNTDOWN' | 'GAME' | 'RESULT';

interface GameResult {
  word: string;
  isCorrect: boolean;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('HOME');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [gameDuration, setGameDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [results, setResults] = useState<GameResult[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [isLandscape, setIsLandscape] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'PASS' | null>(null);
  const [countdownValue, setCountdownValue] = useState(3);
  
  // Customization State
  const [userCategories, setUserCategories] = useState<Category[]>(WORD_BANK);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const MUSIC_PRESETS = [
    { name: 'Praise', url: 'https://pooh3275926.github.io/HeadsUp/public/Praise%20Elevation%20Worship.mp3' },
    { name: '火影忍者', url: 'https://pooh3275926.github.io/HeadsUp/public/Naruto%20Shippuden%20OP16.mp3' },
  ];

  // Check orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', checkOrientation);
    checkOrientation();
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Music Logic
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }
    
    const playMusic = async () => {
      if (!audioRef.current) return;
      
      let url = 'https://pooh3275926.github.io/HeadsUp/public/Praise%20Elevation%20Worship.mp3'; // Default menu music
      // Use category music ONLY during GAME, RESULT, and COUNTDOWN states
      if ((gameState === 'GAME' || gameState === 'RESULT' || gameState === 'COUNTDOWN') && selectedCategory?.musicUrl) {
        url = selectedCategory.musicUrl;
      }

      if (audioRef.current.src !== url) {
        audioRef.current.src = url;
        audioRef.current.load();
      }

      // Never interrupt music except for specific pause needs
      if (audioRef.current.paused) {
        try {
          await audioRef.current.play();
        } catch (e) {
          console.log("Autoplay blocked or interrupted");
        }
      }
    };

    playMusic();
  }, [gameState, selectedCategory]);

  const selectMusicPreset = (catId: string, url: string) => {
    setUserCategories(prev => prev.map(c => 
      c.id === catId ? { ...c, musicUrl: url } : c
    ));
    
    // Also update selectedCategory so SETUP screen reflects change immediately
    setSelectedCategory(prev => prev ? { ...prev, musicUrl: url } : null);
  };

  // Start game logic
  const startGame = useCallback((category: Category) => {
    const words = [...category.words].sort(() => Math.random() - 0.5);
    setShuffledWords(words);
    setCurrentWordIndex(0);
    setResults([]);
    setCountdownValue(3);
    setGameState('COUNTDOWN');
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'COUNTDOWN') {
      timer = setInterval(() => {
        setCountdownValue((prev) => {
          if (prev <= 1) {
            setGameState('GAME');
            setTimeLeft(gameDuration);
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, gameDuration]);

  // No-op for orientation logic as we use touch controls
  useEffect(() => {
    // Left empty per design
  }, []);

  // Sync game timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'GAME' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState('RESULT');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const triggerAnswer = (isCorrect: boolean) => {
    if (feedback) return; // Guard to prevent multi-tapping during animation
    
    setResults(prev => [...prev, { word: shuffledWords[currentWordIndex], isCorrect }]);
    setFeedback(isCorrect ? 'CORRECT' : 'PASS');
    
    setTimeout(() => {
      setFeedback(null);
      setCurrentWordIndex(prev => prev + 1);
      if (currentWordIndex + 1 >= shuffledWords.length) {
        setGameState('RESULT');
      }
    }, 250); // Faster feedback transition
  };

  const resetGame = () => {
    setGameState('HOME');
    setSelectedCategory(null);
    setResults([]);
  };

  const getDynamicFontSize = (word: string) => {
    if (!word) return 'text-[8vw]';
    const len = word.length;
    if (isLandscape) {
      if (len <= 2) return 'text-[22vw]';
      if (len <= 4) return 'text-[18vw]';
      if (len <= 6) return 'text-[14vw]';
      return 'text-[10vw]';
    } else {
      // Portrait mode - bigger fonts as requested
      if (len <= 2) return 'text-[32vw]';
      if (len <= 4) return 'text-[24vw]';
      if (len <= 6) return 'text-[18vw]';
      return 'text-[14vw]';
    }
  };

  return (
    <div className="min-h-screen text-morandi-text font-sans overflow-y-auto select-none relative transition-colors duration-1000 scroll-smooth">
      
      {/* Dynamic Background Image Overlay - Hidden on HOME screen */}
      <AnimatePresence>
        {gameState !== 'HOME' && selectedCategory?.bgImage && (
          <motion.div
            key={selectedCategory.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }} // Fixed 50% opacity
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-0 pointer-events-none"
          >
            <img 
              src={selectedCategory.bgImage} 
              alt="" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top controls container */}
      <div className="fixed top-6 right-6 z-[110] flex gap-2">
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'HOME' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            className={`p-6 max-w-6xl mx-auto min-h-screen flex flex-col relative z-10 ${isLandscape ? 'flex-row gap-12 pt-10' : ''}`}
          >
            {/* Portrait Header vs Landscape Sidebar */}
            <div className={`${isLandscape ? 'w-64 flex flex-col justify-center' : 'text-center mt-12 mb-12'}`}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-4"
              >
                <Palette className="mx-auto text-morandi-clay mb-4" size={40} />
                <h1 className="text-3xl font-serif italic font-extrabold tracking-tight mb-2 text-morandi-text">
                  Let’s play charades!
                </h1>
              </motion.div>
              
              {isLandscape && (
                <div className="mt-12 space-y-4">
                  <div className="text-[11px] uppercase tracking-[2px] font-bold opacity-70">遊戲指南</div>
                  <p className="text-sm leading-relaxed opacity-80">
                    選一個你感興趣的類別，將電話貼緊額頭，讓朋友用演技帶領你通關。
                  </p>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-end mb-6">
                <div className="text-[12px] uppercase tracking-[3px] opacity-70 font-bold">
                  題庫類別庫
                </div>
              </div>

              <div className={`grid gap-6 flex-1 overflow-y-auto pb-12 mask-fade scrollbar-hide ${isLandscape ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {userCategories.map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setGameState('SETUP');
                    }}
                    className="glass-card group overflow-hidden relative p-8 rounded-[32px] text-left flex flex-col justify-end min-h-[160px] transition-all hover:border-morandi-clay/50"
                  >
                    {cat.bgImage && (
                      <div className="absolute inset-0 z-0 opacity-50 group-hover:opacity-70 transition-opacity">
                         <img src={cat.bgImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <h3 className="font-serif italic text-2xl font-black relative z-10 text-morandi-text">{cat.name}</h3>
                    <div className="text-[10px] uppercase tracking-[2px] font-bold mt-2 opacity-70 relative z-10">
                      {cat.words.length} 題
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'SETUP' && selectedCategory && (
          <motion.div 
            key="setup"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="p-8 min-h-screen flex flex-col max-w-6xl mx-auto relative z-10 pb-20"
          >
            <div className="flex justify-between items-center mb-8 shrink-0">
              <button 
                onClick={() => setGameState('HOME')}
                className="w-12 h-12 rounded-full glass-button flex items-center justify-center shrink-0"
              >
                <ChevronLeft size={24} />
              </button>
            </div>

            <div className={`flex-1 flex flex-col ${isLandscape ? 'md:flex-row gap-16' : ''}`}>
               <div className={`mb-12 ${isLandscape ? 'md:w-80 flex flex-col' : ''}`}>
                  <h2 className="text-5xl font-serif italic font-extrabold mb-4 text-morandi-text">
                    {selectedCategory.name}
                  </h2>
                  <div className="h-1 w-20 bg-morandi-clay mb-8" />
                  
                  <div className="space-y-8">
                    <div>
                      <div className="grid grid-cols-2 gap-3">
                        {[60, 90, 120, 180].map((t) => (
                          <button
                            key={t}
                            onClick={() => setGameDuration(t)}
                            className={`py-4 rounded-2xl border transition-all font-bold text-sm ${
                              gameDuration === t 
                                ? 'bg-morandi-clay border-morandi-clay text-white shadow-lg' 
                                : 'glass-button hover:bg-white/10'
                            }`}
                          >
                            {t}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
               </div>

               <div className="flex-1 flex flex-col pt-8">
                  <div className="glass-card p-10 rounded-[40px] space-y-8 mb-10">
                     <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-morandi-clay flex items-center justify-center shrink-0 text-white font-bold shadow-sm">1</div>
                        <div>
                           <h4 className="font-bold text-lg mb-1">貼緊額頭</h4>
                           <p className="text-sm opacity-80">將手機屏幕朝外貼在額頭上，讓你的隊友看到文字。</p>
                        </div>
                     </div>
                     <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-morandi-clay flex items-center justify-center shrink-0 text-white font-bold shadow-sm">2</div>
                        <div>
                           <h4 className="font-bold text-lg mb-1">正確判定</h4>
                           <p className="text-sm opacity-80">
                             橫向：點擊螢幕 <span className="text-morandi-sage-green font-bold text-base">右側</span><br/>
                             直向：點擊螢幕 <span className="text-morandi-sage-green font-bold text-base">上方</span>
                           </p>
                        </div>
                     </div>
                     <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-morandi-clay flex items-center justify-center shrink-0 text-white font-bold shadow-sm">3</div>
                        <div>
                           <h4 className="font-bold text-lg mb-1">跳過/不確定</h4>
                           <p className="text-sm opacity-80">
                             橫向：點擊螢幕 <span className="text-morandi-dusty-rose font-bold text-base">左側</span><br/>
                             直向：點擊螢幕 <span className="text-morandi-dusty-rose font-bold text-base">下方</span>
                           </p>
                        </div>
                     </div>
                  </div>

                  <button
                    onClick={() => startGame(selectedCategory)}
                    className="w-full bg-morandi-clay text-white py-6 rounded-[32px] font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-2xl shadow-morandi-clay/40 shrink-0"
                  >
                    進入挑戰 <Play fill="currentColor" size={24} />
                  </button>
               </div>
            </div>
          </motion.div>
        )}

        {gameState === 'COUNTDOWN' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-morandi-background"
          >
            <motion.div
              key={countdownValue}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1, 1.2, 1], opacity: 1 }}
              className="text-[200px] font-serif font-black italic text-morandi-clay morandi-text-shadow"
            >
              {countdownValue}
            </motion.div>
            <div className="text-xs uppercase tracking-[15px] font-bold opacity-60 mt-12">
              Focus & Ready
            </div>
          </motion.div>
        )}

        {gameState === 'GAME' && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-500 bg-morandi-background`}
          >
            {/* Split Touch Controls */}
            <div className={`absolute inset-0 flex z-30 select-none ${isLandscape ? 'flex-row' : 'flex-col'}`}>
                {isLandscape ? (
                  <>
                    <div 
                      className="flex-1 cursor-pointer flex items-center justify-center active:bg-morandi-dusty-rose/10 transition-colors"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        triggerAnswer(false);
                      }}
                    />
                    <div 
                      className="flex-1 cursor-pointer flex items-center justify-center active:bg-morandi-sage-green/10 transition-colors"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        triggerAnswer(true);
                      }}
                    />
                  </>
                ) : (
                  <>
                    <div 
                      className="flex-1 cursor-pointer flex items-center justify-center active:bg-morandi-sage-green/10 transition-colors"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        triggerAnswer(true);
                      }}
                    />
                    <div 
                      className="flex-1 cursor-pointer flex items-center justify-center active:bg-morandi-dusty-rose/10 transition-colors"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        triggerAnswer(false);
                      }}
                    />
                  </>
                )}
            </div>

            <div className="absolute top-8 left-0 right-0 flex justify-between px-6 sm:px-12 items-center z-40">
              <div className="flex items-center gap-4">
                <button
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    resetGame();
                  }}
                  className="w-12 h-12 glass-button rounded-full flex items-center justify-center active:scale-95 transition-transform pointer-events-auto"
                >
                  <HomeIcon size={20} />
                </button>
                <div className="flex items-center gap-3 glass-card px-6 py-3 rounded-2xl border-morandi-clay/20 pointer-events-none">
                  <Clock size={18} className="text-morandi-clay" />
                  <span className="font-bold text-2xl text-morandi-text">{timeLeft}</span>
                </div>
              </div>
              
              <div className="hidden md:block text-morandi-clay/40 font-serif italic text-xl pointer-events-none">
                {selectedCategory?.name}
              </div>
              
              <div className="flex items-center gap-3 glass-card px-6 py-3 rounded-2xl border-morandi-clay/20 pointer-events-none">
                <CheckCircle2 size={18} className="text-morandi-sage-green" />
                <span className="font-bold text-2xl text-morandi-text">{results.filter(r => r.isCorrect).length}</span>
              </div>
            </div>

            <div className="text-center px-6 relative z-0 pointer-events-none w-full">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={currentWordIndex}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  className={`font-serif font-extrabold italic text-morandi-text leading-none break-words px-8 text-center w-full ${getDynamicFontSize(shuffledWords[currentWordIndex] || '')}`}
                >
                  {shuffledWords[currentWordIndex] || '...'}
                </motion.h1>
              </AnimatePresence>
            </div>

            {feedback && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, backgroundColor: feedback === 'CORRECT' ? 'rgba(164, 180, 148, 0.4)' : 'rgba(201, 159, 161, 0.4)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 backdrop-blur-sm"
              />
            )}

            {/* Visual labels for the split areas - Hidden as requested */}
            <div className={`absolute inset-0 flex justify-between px-12 text-[11px] font-bold tracking-[5px] uppercase opacity-20 z-10 pointer-events-none ${isLandscape ? 'items-end pb-8 hidden' : 'flex-col items-center py-24 hidden'}`}>
              {isLandscape ? (
                <>
                  <span>⬅️ Skip</span>
                  <span>Correct ➡️</span>
                </>
              ) : (
                <>
                  <span className="rotate-0">⬆️ Correct ⬆️</span>
                  <span className="rotate-0">⬇️ Skip ⬇️</span>
                </>
              )}
            </div>
          </motion.div>
        )}

        {gameState === 'RESULT' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-10 min-h-screen flex flex-col mx-auto relative z-10 pb-20 ${isLandscape ? 'max-w-6xl' : 'max-w-2xl'}`}
          >
            <div className={`flex flex-col flex-1 overflow-hidden ${isLandscape ? 'md:flex-row gap-16' : ''}`}>
               <div className={`${isLandscape ? 'md:w-80 pt-8 flex flex-col justify-center' : 'text-center mb-12 py-8'}`}>
                  <motion.div 
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-24 h-24 bg-morandi-clay rounded-full flex items-center justify-center mx-auto mb-8 text-white shadow-2xl shadow-morandi-clay/30"
                  >
                    <Trophy size={48} />
                  </motion.div>
                  <div className="text-center">
                    <h2 className="text-4xl font-serif italic font-extrabold mb-2 tracking-tight text-morandi-text">Magnificent!</h2>
                    <div className="text-[12px] uppercase tracking-[4px] opacity-70 font-bold mb-10">
                      Game Statistics
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 gap-4 ${isLandscape ? 'md:grid-cols-1' : ''}`}>
                    <div className="glass-card p-6 rounded-[32px] text-center">
                      <div className="text-morandi-sage-green font-serif italic font-black text-5xl mb-2">
                        {results.filter(r => r.isCorrect).length}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-morandi-text/40 tracking-widest">正確</div>
                    </div>
                    <div className="glass-card p-6 rounded-[32px] text-center">
                      <div className="text-morandi-dusty-rose font-serif italic font-black text-5xl mb-2">
                        {results.filter(r => !r.isCorrect).length}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-morandi-text/40 tracking-widest">跳過</div>
                    </div>
                  </div>
               </div>

               <div className="flex-1 flex flex-col overflow-hidden min-h-0 pt-8">
                  <div className="text-[12px] uppercase tracking-[3px] opacity-70 font-bold mb-6">
                    答題詳情
                  </div>
                  <div className="flex-1 overflow-y-auto mb-10 pr-4 custom-scrollbar">
                    <div className={`grid gap-4 ${isLandscape ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                      {results.map((res, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between glass-card p-5 rounded-[24px] border-morandi-clay/5"
                        >
                          <span className="font-bold text-lg truncate pr-4 text-morandi-text">{res.word}</span>
                          {res.isCorrect ? (
                            <CheckCircle2 className="text-morandi-sage-green shrink-0" size={22} />
                          ) : (
                            <XCircle className="text-morandi-dusty-rose shrink-0" size={22} />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex gap-4 py-8 mt-auto">
              <button
                onClick={resetGame}
                className="flex-1 glass-button py-6 rounded-[32px] font-bold active:scale-95 transition-transform"
              >
                返回
              </button>
              <button
                onClick={() => {
                  if (selectedCategory) startGame(selectedCategory);
                }}
                className="flex-[2] bg-morandi-clay text-white py-6 rounded-[32px] font-black italic text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-2xl shadow-morandi-clay/20"
              >
                再次挑戰 <RotateCcw size={22} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .mask-fade {
          mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}
