import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Slider } from "./ui/slider";
import { useAudio } from "../lib/stores/useAudio";
import { useGame } from "../lib/stores/useGame";
import IconGenerator from "./IconGenerator";

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
      style={{
        backgroundImage: `url('/images/mainmenu.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay to improve text visibility */}
      <div className="absolute inset-0 bg-black/50 z-0"></div>
      
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
            ChainWords
          </motion.h1>
        </header>

        {/* Spacer to push content apart */}
        <div className="flex-grow"></div>
        
        {/* Play button */}
        <motion.div
          className="mb-14 text-center"
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
