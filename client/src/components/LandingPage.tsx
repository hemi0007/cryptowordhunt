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

        {/* Crypto Coins Image */}
        <motion.div
          className="w-full flex justify-center my-8"
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
            className="w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 max-w-2xl drop-shadow-2xl"
          />
        </motion.div>

        {/* Spacer to push content apart */}
        <div className="flex-grow"></div>
        
        {/* Play button - moved even further down */}
        <motion.div
          className="mb-4 text-center mt-16" 
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
