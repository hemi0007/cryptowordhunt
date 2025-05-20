import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Slider } from "./ui/slider";
import { useAudio } from "../lib/stores/useAudio";
import { useGame } from "../lib/stores/useGame";
import IconGenerator from "./IconGenerator";
import MatrixBackground from "./MatrixBackground";

const LandingPage = () => {
  const { start } = useGame();
  const { backgroundMusic, toggleMute, isMuted, setVolume } = useAudio();
  const [activeTab, setActiveTab] = useState<"howToPlay" | "soundSettings" | null>(null);
  const [volume, setVolumeState] = useState(useAudio.getState().volume);
  const [titleText, setTitleText] = useState("ChainWords");
  const originalTitle = "ChainWords";
  
  // Word search animation for title
  useEffect(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let iteration = 0;
    let interval: NodeJS.Timeout | null = null;
    
    const animateTitle = () => {
      interval = setInterval(() => {
        setTitleText(
          originalTitle.split("")
            .map((letter, index) => {
              if (index < iteration) {
                return originalTitle[index];
              }
              return letters[Math.floor(Math.random() * 26)];
            })
            .join("")
        );
        
        if (iteration >= originalTitle.length) {
          clearInterval(interval!);
        }
        
        iteration += 1/3;
      }, 50);
    };
    
    // Start animation after a small delay
    const timeout = setTimeout(() => {
      animateTitle();
    }, 1000);
    
    // Set up repeating animation
    const repeatInterval = setInterval(() => {
      iteration = 0;
      animateTitle();
    }, 10000); // Repeat every 10 seconds
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval!);
      clearInterval(repeatInterval);
    };
  }, []);
  
  // Function to handle volume changes
  const handleVolumeChange = (newVolume: number) => {
    setVolumeState(newVolume);
    setVolume(newVolume);
  };

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
      className="min-h-screen flex flex-col items-center justify-between relative overflow-hidden"
    >
      {/* Animated Matrix Background */}
      <MatrixBackground />
      
      {/* Content container - sits above the background */}
      <div className="container mx-auto px-4 py-8 z-10 flex flex-col items-center justify-between min-h-screen">
        {/* Header Section */}
        <header className="w-full text-center mb-8 mt-2">
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-2 neon-text neon-green drop-shadow-xl"
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            {titleText}
          </motion.h1>
        </header>

        {/* Spacer to push content down from title */}
        <div className="flex-grow"></div>

        {/* Crypto Coins Image - Centered */}
        <motion.div
          className="w-full flex justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.3
          }}
        >
          <img 
            src="/images/coins.png" 
            alt="Cryptocurrency coins" 
            className="w-4/5 md:w-3/5 lg:w-1/2 xl:w-2/5 max-w-3xl drop-shadow-2xl"
          />
        </motion.div>

        {/* Menu options between coins and play button */}
        <motion.div
          className="w-full max-w-md mx-auto mt-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={() => setActiveTab(activeTab === "howToPlay" ? null : "howToPlay")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "howToPlay" 
                  ? "bg-primary text-primary-foreground neon-border" 
                  : "bg-background/50 backdrop-blur-sm hover:bg-background/80"
              }`}
            >
              How To Play
            </button>
            <button
              onClick={() => setActiveTab(activeTab === "soundSettings" ? null : "soundSettings")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "soundSettings" 
                  ? "bg-primary text-primary-foreground neon-border" 
                  : "bg-background/50 backdrop-blur-sm hover:bg-background/80"
              }`}
            >
              Sound Settings
            </button>
          </div>
          
          {/* Content area for selected tab */}
          {activeTab && (
            <div className="bg-background/50 backdrop-blur-md p-4 rounded-lg neon-border">
              {activeTab === "howToPlay" && (
                <div className="space-y-2 text-white">
                  <h3 className="text-lg font-bold">How To Play:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Find crypto words in the grid</li>
                    <li>Click and drag to select words</li>
                    <li>Use power-ups to help find words</li>
                    <li>Complete 3 rounds of increasing difficulty</li>
                    <li>Find all words before time runs out!</li>
                  </ul>
                </div>
              )}
              
              {activeTab === "soundSettings" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Sound Settings:</h3>
                    <button 
                      className="px-3 py-1 rounded bg-background/70 hover:bg-background"
                      onClick={toggleMute}
                    >
                      {isMuted ? "Unmute 🔊" : "Mute 🔇"}
                    </button>
                  </div>
                  
                  {/* Volume Controls */}
                  <div className="flex flex-col gap-1">
                    <div className="text-sm">Volume: {Math.round(volume * 100)}%</div>
                    <div className="flex items-center gap-2">
                      <button 
                        className="px-2 py-1 rounded bg-background/70 hover:bg-background disabled:opacity-50"
                        disabled={isMuted || volume <= 0}
                        onClick={() => {
                          const newVolume = Math.max(0, volume - 0.1);
                          setVolumeState(newVolume);
                          setVolume(newVolume);
                        }}
                      >
                        -
                      </button>
                      <div className="h-2 bg-gray-700 rounded-full flex-1 overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${volume * 100}%` }}
                        ></div>
                      </div>
                      <button 
                        className="px-2 py-1 rounded bg-background/70 hover:bg-background disabled:opacity-50"
                        disabled={isMuted || volume >= 1}
                        onClick={() => {
                          const newVolume = Math.min(1, volume + 0.1);
                          setVolumeState(newVolume);
                          setVolume(newVolume);
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
        
        {/* Play button */}
        <motion.div
          className="mb-8 text-center" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <motion.button
            className="animated-gradient py-4 px-12 text-3xl font-bold rounded-lg neon-border shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={start}
          >
            PLAY NOW 🚀
          </motion.button>
        </motion.div>
        
        {/* Spacer for bottom margin */}
        <div className="mb-8"></div>
      </div>
    </motion.div>
  );
};

export default LandingPage;
