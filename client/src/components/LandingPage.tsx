import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Slider } from "./ui/slider";
import { useAudio } from "../lib/stores/useAudio";
import { useGame } from "../lib/stores/useGame";
import IconGenerator from "./IconGenerator";
import { SupabaseTest } from "./SupabaseTest";

const LandingPage = () => {
  const { start } = useGame();
  const { backgroundMusic, toggleMute, isMuted, setVolume } = useAudio();
  const [activeTab, setActiveTab] = useState<"howToPlay" | "soundSettings" | null>(null);
  const [volume, setVolumeState] = useState(useAudio.getState().volume);
  
  // Function to handle volume changes
  const handleVolumeChange = (newVolume: number) => {
    setVolumeState(newVolume);
    setVolume(newVolume);
  };
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number }[]>([]);

  // Load any saved leaderboard data from localStorage
  useEffect(() => {
    const savedLeaderboard = localStorage.getItem("chainwords_leaderboard");
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    } else {
      // Default leaderboard
      setLeaderboard([
        { name: "DiamondHodler", score: 420 },
        { name: "MoonLad", score: 369 },
        { name: "LamboKing", score: 300 },
        { name: "BitcoinBarry", score: 276 },
        { name: "CryptoK1ng", score: 248 }
      ]);
    }
  }, []);

  // Start background music when component mounts
  useEffect(() => {
    if (backgroundMusic) {
      backgroundMusic.loop = true;
      backgroundMusic.volume = 0.3;
      
      // Try to play music (may be blocked by browser autoplay policy)
      backgroundMusic.play().catch(err => {
        console.log("Autoplay prevented:", err);
      });
    }

    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, [backgroundMusic]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center"
    >
      {/* Header Section */}
      <header className="w-full text-center mb-8">
        <motion.h1 
          className="text-4xl md:text-6xl font-bold mb-4 neon-text neon-green"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          ChainWords
        </motion.h1>
        <motion.p 
          className="text-xl md:text-2xl mb-8 neon-text neon-blue"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Hunt hidden gems and uncover your next crypto moonshot!
        </motion.p>
      </header>

      {/* Main Content */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* Left column - Call to action */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4 neon-text">
              Enter The Matrix, Beat The Puzzle
            </h2>
            <p className="mb-6">
              Prove your diamond hands 💎🙌 by finding all the crypto words before the timer runs out!
            </p>
            
            <motion.button
              className="animated-gradient py-4 px-8 text-2xl font-bold rounded-lg neon-border"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={start}
            >
              PLAY NOW 🚀
            </motion.button>
            
            <div className="mt-6">
              <div className="flex gap-4 justify-center">
                <motion.button
                  className="py-2 px-4 text-sm font-medium rounded-lg bg-primary/20 hover:bg-primary/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(activeTab === "howToPlay" ? null : "howToPlay")}
                >
                  How to Play
                </motion.button>
                
                <motion.button
                  className="py-2 px-4 text-sm font-medium rounded-lg bg-primary/20 hover:bg-primary/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(activeTab === "soundSettings" ? null : "soundSettings")}
                >
                  Sound Settings
                </motion.button>
              </div>
              
              {activeTab === "howToPlay" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border rounded-md mt-2 bg-card/50"
                >
                  <h3 className="font-bold text-sm mb-2 text-primary">Game Instructions:</h3>
                  <ol className="text-sm space-y-2 list-decimal pl-5">
                    <li>Find crypto-themed words in the grid</li>
                    <li>Drag to select letters horizontally, vertically, or diagonally</li>
                    <li>Use power-ups to help you find all words before time runs out</li>
                    <li>⛏️ Mining Boost: 2x score for 30 seconds</li>
                    <li>🛡️ FUD Shield: Pauses timer for 10 seconds</li>
                  </ol>
                </motion.div>
              )}
              
              {activeTab === "soundSettings" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border rounded-md mt-2 bg-card/50 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Game Sound:</span>
                    <button 
                      onClick={toggleMute} 
                      className="text-sm px-3 py-1 bg-secondary rounded-md"
                    >
                      {isMuted ? "🔇 Unmute" : "🔊 Mute"}
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Volume:</span>
                      <span className="text-xs">{Math.round(volume * 100)}%</span>
                    </div>
                    <Slider 
                      defaultValue={[volume * 100]} 
                      max={100} 
                      step={10}
                      disabled={isMuted}
                      onValueChange={(value) => handleVolumeChange(value[0] / 100)}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex gap-8 justify-center">
            <img src="/images/bitcoin.png" alt="Bitcoin" width={120} height={120} className="object-contain" />
            <img src="/images/rocket.png" alt="Rocket" width={120} height={120} className="object-contain" />
          </div>
        </div>
        
        {/* Right column - Leaderboard */}
        <div className="bg-secondary rounded-xl p-6 neon-border">
          <h3 className="text-xl font-bold mb-4 text-center neon-text">
            🏆 Top Degens This Week
          </h3>
          
          <div className="mb-6">
            <ul className="space-y-4">
              {leaderboard.map((entry, index) => (
                <motion.li 
                  key={index}
                  className="flex justify-between items-center border-b border-muted py-2"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🔹"}</span>
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-mono neon-green">{entry.score} pts</span>
                </motion.li>
              ))}
            </ul>
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="italic text-center text-sm">
              "YOLOed my way through that puzzle—feeling like a giga-chad!" - @CryptoBro
            </p>
          </div>
        </div>
      </motion.div>
      
      
      {/* Admin Tools (for debugging) */}
      <div className="w-full max-w-5xl mt-8">
        <div className="bg-secondary/50 rounded-lg overflow-hidden">
          <details>
            <summary className="p-2 cursor-pointer font-mono text-xs">Developer Tools</summary>
            <div className="p-4">
              <SupabaseTest />
            </div>
          </details>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-auto py-4 text-center w-full text-muted-foreground text-sm">
        <p>Not financial advice. Just pixelated fun.</p>
      </footer>
    </motion.div>
  );
};

export default LandingPage;
