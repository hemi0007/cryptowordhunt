import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { useGame } from "../lib/stores/useGame";
import IconGenerator from "./IconGenerator";

interface EndGameModalProps {
  score: number;
  foundWords: number;
  totalWords: number;
}

const EndGameModal: React.FC<EndGameModalProps> = ({ score, foundWords, totalWords }) => {
  const { restart } = useGame();
  const [isSuccess, setIsSuccess] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Determine if game result is a success
  useEffect(() => {
    // Consider it a success if the player found at least 50% of words
    setIsSuccess(foundWords >= Math.ceil(totalWords / 2));

    // Update confetti window size on resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [foundWords, totalWords]);

  // Save score to leaderboard
  const saveScore = () => {
    if (!playerName.trim()) return;
    
    const leaderboardData = localStorage.getItem("chainwords_leaderboard");
    let leaderboard = leaderboardData ? JSON.parse(leaderboardData) : [];
    
    // Add new score
    leaderboard.push({
      name: playerName.trim(),
      score: score
    });
    
    // Sort by score (descending)
    leaderboard.sort((a: any, b: any) => b.score - a.score);
    
    // Keep only top 10
    leaderboard = leaderboard.slice(0, 10);
    
    // Save to localStorage
    localStorage.setItem("chainwords_leaderboard", JSON.stringify(leaderboard));
    
    // Restart game
    restart();
  };

  // Share result on social media
  const shareResult = () => {
    // Prepare share text with hashtags for better visibility
    const shareText = `I just scored ${score} points finding ${foundWords}/${totalWords} crypto words in ChainWords! Can you beat my score? #ChainWords #CryptoBros`;
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: "ChainWords - Crypto Puzzle",
        text: shareText,
        url: window.location.href,
      }).catch((error) => console.log("Sharing failed:", error));
    } else {
      // X (formerly Twitter) share URL
      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`, "_blank");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {isSuccess && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            colors={["#00ff00", "#00ffcc", "#ffcc00", "#ff00cc"]}
            recycle={false}
            numberOfPieces={200}
            gravity={0.1}
          />
        )}
        
        <motion.div
          className="bg-card mx-4 md:mx-0 rounded-xl p-6 w-full max-w-md neon-border"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <div className="text-center mb-6">
            <h2 className={`text-3xl font-bold mb-2 ${isSuccess ? "neon-text neon-green" : "text-red-500"}`}>
              {isSuccess ? "You Did It, Degen!" : "Not Enough Gains!"}
            </h2>
            <p className="text-lg">
              You found <span className="font-bold neon-green">{foundWords}</span> out of <span className="font-bold">{totalWords}</span> words
            </p>
          </div>
          
          <div className="flex justify-center mb-6">
            <IconGenerator 
              iconType={isSuccess ? "cryptoBro" : "lambo"} 
              width={120} 
              height={120} 
            />
          </div>
          
          <div className="mb-6 text-center">
            <p className="text-2xl font-bold neon-text">
              Your Score: <span className="neon-green">{score}</span>
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="playerName" className="block mb-2 text-sm font-medium">
              Enter Your Name To Save Score
            </label>
            <input
              type="text"
              id="playerName"
              className="w-full px-4 py-2 bg-secondary border border-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="CryptoBro123"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
            />
          </div>
          
          <div className="flex flex-col space-y-3">
            <motion.button
              className="bg-primary text-primary-foreground py-3 px-4 rounded-md font-bold"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={saveScore}
            >
              Save Score & Play Again
            </motion.button>
            
            <motion.button
              className="bg-blue-600 text-white py-3 px-4 rounded-md font-bold flex items-center justify-center gap-2"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={shareResult}
            >
              <i className="fas fa-share-alt"></i> Flex On X
            </motion.button>
            
            <motion.button
              className="bg-secondary text-foreground py-2 px-4 rounded-md"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={restart}
            >
              Play Again (Without Saving)
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EndGameModal;
