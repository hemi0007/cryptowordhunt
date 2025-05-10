import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAudio } from "../lib/stores/useAudio";
import { useGame } from "../lib/stores/useGame";
import IconGenerator from "./IconGenerator";

const LandingPage = () => {
  const { start } = useGame();
  const { backgroundMusic, toggleMute, isMuted } = useAudio();
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
          Find the next 100x coins in the puzzle grid!
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
            
            <div className="mt-4">
              <button 
                onClick={toggleMute} 
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {isMuted ? "🔇 Unmute" : "🔊 Mute"} Sound
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex gap-8">
            <IconGenerator iconType="lambo" width={120} height={120} />
            <IconGenerator iconType="rocket" width={120} height={120} />
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
      
      {/* Mascot */}
      <div className="mt-12 mb-4">
        <IconGenerator iconType="cryptoBro" width={180} height={180} />
      </div>
      
      {/* Footer */}
      <footer className="mt-auto py-4 text-center w-full text-muted-foreground text-sm">
        <p>Not financial advice. Just pixelated fun.</p>
      </footer>
    </motion.div>
  );
};

export default LandingPage;
