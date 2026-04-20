import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Settings2, 
  Trophy, 
  RotateCcw, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  ScreenShare
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
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'PASS' | null>(null);
  const [countdownValue, setCountdownValue] = useState(3);
  
  const lastTiltRef = useRef<'NONE' | 'DOWN' | 'UP'>('NONE');

  // Check orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', checkOrientation);
    checkOrientation();
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Permission for orientation (iOS)
  const requestPermission = async () => {
    // Check if DeviceOrientationEvent exists
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionGranted(true);
          return true;
        }
      } catch (e) {
        console.error('Error requesting orientation permission:', e);
      }
      // On error, let's still try to start, manually triggering if needed
      setPermissionGranted(true);
      return true;
    } else {
      setPermissionGranted(true);
      return true;
    }
  };

  // Start game logic
  const startGame = useCallback((category: Category) => {
    const words = [...category.words].sort(() => Math.random() - 0.5);
    setShuffledWords(words);
    setCurrentWordIndex(0);
    setResults([]);
    setCountdownValue(3);
    setGameState('COUNTDOWN');
    lastTiltRef.current = 'NONE';
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

  // Handle tilt
  useEffect(() => {
    // Orientation detection disabled per user request to use touch zones instead
  }, [gameState, permissionGranted, isLandscape]);

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
    }, 600); // Slightly faster feedback
  };

  const resetGame = () => {
    setGameState('HOME');
    setSelectedCategory(null);
    setResults([]);
  };

  return (
    <div className="min-h-screen text-white font-sans overflow-hidden select-none relative">
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[25px] bg-black rounded-b-[15px] z-[100] ${isLandscape ? 'hidden' : 'hidden sm:block'}`} />
      <AnimatePresence mode="wait">
        {gameState === 'HOME' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className={`p-6 max-w-4xl mx-auto h-screen flex flex-col ${isLandscape ? 'md:pt-10' : ''}`}
          >
            <div className={`text-center mb-8 ${isLandscape ? 'mt-0 flex items-center justify-center gap-6' : 'mt-12'}`}>
              <div>
                <h1 className="text-2xl font-extrabold tracking-[1px] mb-2 uppercase">
                  比手畫腳 ⚡️
                </h1>
                <p className="text-[13px] opacity-80 font-medium tracking-wide">
                  放於額頭 • 全民同樂
                </p>
              </div>
            </div>

            <div className="text-[12px] uppercase tracking-[2px] mb-4 ml-1 opacity-70 font-bold">
              選擇題庫類別
            </div>
            <div className={`grid gap-4 flex-1 overflow-y-auto pb-8 mask-fade scrollbar-hide ${isLandscape ? 'grid-cols-3 lg:grid-cols-4' : 'grid-cols-2'}`}>
              {WORD_BANK.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setGameState('SETUP');
                  }}
                  className="glass-button p-6 rounded-[24px] flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  <span className="text-4xl">{cat.icon}</span>
                  <span className="font-bold text-lg">{cat.name}</span>
                </button>
              ))}
            </div>
            
            <div className="text-center py-4 text-gray-500 text-xs flex items-center justify-center gap-2">
              <Settings2 size={12} /> 手機橫放額頭，準備開始
            </div>
          </motion.div>
        )}

        {gameState === 'SETUP' && selectedCategory && (
          <motion.div 
            key="setup"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="p-8 h-screen flex flex-col max-w-4xl mx-auto"
          >
            <button 
              onClick={() => setGameState('HOME')}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-8 shrink-0"
            >
              <ChevronLeft size={20} />
            </button>

            <div className={`flex-1 flex flex-col ${isLandscape ? 'md:flex-row gap-12' : ''}`}>
              <div className={`flex items-center gap-4 mb-8 ${isLandscape ? 'md:flex-col md:w-48 text-center' : ''}`}>
                <span className="text-6xl drop-shadow-lg">{selectedCategory.icon}</span>
                <div>
                  <h2 className="text-2xl font-extrabold uppercase tracking-wide whitespace-nowrap">{selectedCategory.name}</h2>
                  <div className="text-[12px] uppercase tracking-[2px] opacity-70 font-bold mt-1">
                    遊玩時間
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className={`grid gap-4 mb-8 ${isLandscape ? 'grid-cols-4' : 'grid-cols-2'}`}>
                  {[60, 90, 120, 180].map((t) => (
                    <button
                      key={t}
                      onClick={() => setGameDuration(t)}
                      className={`p-5 rounded-2xl border transition-all ${
                        gameDuration === t 
                          ? 'bg-accent border-accent text-[#333] font-black' 
                          : 'glass-button text-white'
                      }`}
                    >
                      {t} 秒
                    </button>
                  ))}
                </div>

                <div className="text-[12px] uppercase tracking-[2px] mb-4 ml-1 opacity-70 font-bold">
                  遊戲規則
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-8 backdrop-blur-sm">
                  <ul className="text-sm text-white/80 space-y-2 leading-relaxed">
                    <li className="flex gap-2"><span>1.</span> 把手機橫放放在額頭上測試</li>
                    <li className="flex gap-2">
                       <span>2.</span> 答對時：
                       <span className="font-bold underline decoration-green-400">橫向點右側</span> / 
                       <span className="font-bold underline decoration-green-400">直向點上方</span>
                    </li>
                    <li className="flex gap-2">
                       <span>3.</span> 跳過時：
                       <span className="font-bold underline decoration-orange-400">橫向點左側</span> / 
                       <span className="font-bold underline decoration-orange-400">直向點下方</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                const ok = await requestPermission();
                if (ok) startGame(selectedCategory);
              }}
              className="w-full bg-white text-purple-accent py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl shrink-0 mt-auto"
            >
              立刻開始 <Play fill="currentColor" size={20} />
            </button>
          </motion.div>
        )}

        {gameState === 'COUNTDOWN' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-3xl"
          >
            <motion.div
              key={countdownValue}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.2, 1], opacity: 1 }}
              className="text-[180px] font-black italic drop-shadow-2xl text-accent"
            >
              {countdownValue}
            </motion.div>
            <div className="text-2xl uppercase tracking-[10px] font-black opacity-50 mt-8">
              READY?
            </div>
          </motion.div>
        )}

        {gameState === 'GAME' && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 ${
              feedback === 'CORRECT' ? 'bg-green-500' : feedback === 'PASS' ? 'bg-orange-500' : 'bg-blue-600'
            }`}
          >
            {/* Split Touch Controls */}
            <div className={`absolute inset-0 flex z-30 select-none ${isLandscape ? 'flex-row' : 'flex-col'}`}>
                {isLandscape ? (
                  <>
                    <div 
                      className="flex-1 cursor-pointer flex items-center justify-center active:bg-orange-500/20 transition-colors"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        triggerAnswer(false);
                      }}
                    >
                      <span className="text-white font-black text-2xl opacity-0">跳過</span>
                    </div>
                    <div 
                      className="flex-1 cursor-pointer flex items-center justify-center active:bg-green-500/20 transition-colors"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        triggerAnswer(true);
                      }}
                    >
                      <span className="text-white font-black text-2xl opacity-0">正確</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div 
                      className="flex-1 cursor-pointer flex items-center justify-center active:bg-green-500/20 transition-colors"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        triggerAnswer(true);
                      }}
                    >
                      <span className="text-white font-black text-2xl opacity-0">正確</span>
                    </div>
                    <div 
                      className="flex-1 cursor-pointer flex items-center justify-center active:bg-orange-500/20 transition-colors"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        triggerAnswer(false);
                      }}
                    >
                      <span className="text-white font-black text-2xl opacity-0">跳過</span>
                    </div>
                  </>
                )}
            </div>

            <div className="absolute top-6 left-0 right-0 flex justify-between px-10 items-center z-10 pointer-events-none">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-5 py-2 rounded-full border border-white/20">
                <Clock size={16} className="text-accent" />
                <span className="font-mono font-bold text-2xl">{timeLeft}</span>
              </div>
              <div className="hidden sm:block text-white/80 font-black uppercase tracking-[0.2em] text-sm bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                {selectedCategory?.name}
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-5 py-2 rounded-full border border-white/20">
                <CheckCircle2 size={16} className="text-green-400" />
                <span className="font-bold text-2xl">{results.filter(r => r.isCorrect).length}</span>
              </div>
            </div>

            <div className="text-center px-10 relative z-0 pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={currentWordIndex}
                  initial={{ y: 80, opacity: 0, rotateX: 45 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0 }}
                  exit={{ y: -80, opacity: 0, rotateX: -45 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 12 }}
                  className="text-7xl sm:text-9xl font-black tracking-tight drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] leading-tight"
                >
                  {shuffledWords[currentWordIndex] || '結束了！'}
                </motion.h1>
              </AnimatePresence>
            </div>

            {feedback && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 2, opacity: 1 }}
                exit={{ scale: 3, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
              >
                <div className={`px-10 py-4 rounded-3xl font-black text-4xl shadow-2xl ${
                  feedback === 'CORRECT' ? 'bg-white text-green-600' : 'bg-white text-orange-600'
                }`}>
                  {feedback === 'CORRECT' ? '正確！' : '跳過'}
                </div>
              </motion.div>
            )}

            {/* Visual labels for the split areas (subtle) */}
            <div className={`absolute inset-0 flex justify-between px-10 text-[10px] font-bold tracking-[3px] uppercase opacity-30 z-10 pointer-events-none ${isLandscape ? 'items-end pb-4' : 'flex-col items-center py-20'}`}>
              {isLandscape ? (
                <>
                  <span>⬅️ 點擊左側跳過</span>
                  <span>點擊右側答對 ➡️</span>
                </>
              ) : (
                <>
                  <span className="rotate-0">⬆️ 點擊上方答對</span>
                  <span className="rotate-0">⬇️ 點擊下方跳過</span>
                </>
              )}
            </div>
          </motion.div>
        )}

        {gameState === 'RESULT' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-8 h-screen flex flex-col mx-auto ${isLandscape ? 'max-w-4xl' : 'max-w-lg'}`}
          >
            <div className={`flex flex-col flex-1 overflow-hidden ${isLandscape ? 'md:flex-row gap-8' : ''}`}>
               <div className={`${isLandscape ? 'md:w-64 pt-4' : 'text-center mb-10 pt-8'}`}>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-yellow-400 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-6 text-black shadow-xl shadow-yellow-400/20"
                  >
                    <Trophy size={48} />
                  </motion.div>
                  <div className="text-center">
                    <h2 className="text-3xl font-extrabold mb-2 italic tracking-tighter shadow-sm uppercase">AWESOME!</h2>
                    <div className="text-[12px] uppercase tracking-[2px] opacity-70 font-bold mb-6">
                      遊戲戰報
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 gap-4 ${isLandscape ? 'md:grid-cols-1' : ''}`}>
                    <div className="bg-black/20 border border-white/10 p-4 rounded-3xl text-center">
                      <div className="text-green-400 font-black text-4xl mb-1">
                        {results.filter(r => r.isCorrect).length}
                      </div>
                      <div className="text-[10px] uppercase font-black text-white/60 tracking-widest">答對</div>
                    </div>
                    <div className="bg-black/20 border border-white/10 p-4 rounded-3xl text-center">
                      <div className="text-orange-400 font-black text-4xl mb-1">
                        {results.filter(r => !r.isCorrect).length}
                      </div>
                      <div className="text-[10px] uppercase font-black text-white/60 tracking-widest">跳過</div>
                    </div>
                  </div>
               </div>

               <div className="flex-1 flex flex-col overflow-hidden min-h-0 pt-6">
                  <div className="text-[12px] uppercase tracking-[2px] mb-4 ml-1 opacity-70 font-bold">
                    詳情清單
                  </div>
                  <div className="flex-1 overflow-y-auto mb-8 pr-2 custom-scrollbar">
                    <div className={`grid gap-3 ${isLandscape ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {results.map((res, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5"
                        >
                          <span className="font-bold text-lg truncate pr-2">{res.word}</span>
                          {res.isCorrect ? (
                            <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                          ) : (
                            <XCircle className="text-orange-500 shrink-0" size={20} />
                          )}
                        </motion.div>
                      ))}
                      {results.length === 0 && (
                        <div className="text-center py-12 text-gray-500 italic opacity-50 font-serif col-span-full">
                            一段傳奇尚未開始...
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex gap-4 py-6 mt-auto">
              <button
                onClick={resetGame}
                className="flex-1 glass-button text-white py-5 rounded-3xl font-bold active:scale-95 transition-transform"
              >
                主頁
              </button>
              <button
                onClick={() => {
                  if (selectedCategory) startGame(selectedCategory);
                }}
                className="flex-[2] bg-white text-purple-accent py-5 rounded-3xl font-black flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl"
              >
                再玩一次 <RotateCcw size={20} />
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
