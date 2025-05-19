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

      {/* Empty space between header and play button */}
      <motion.div 
        className="w-full max-w-5xl flex-grow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* No content here intentionally to keep the page clean */}
      </motion.div>
      
      {/* Play button moved to bottom */}
      <motion.div
        className="mt-10 mb-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <motion.button
          className="animated-gradient py-4 px-8 text-2xl font-bold rounded-lg neon-border"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={start}
        >
          PLAY NOW 🚀
        </motion.button>
      </motion.div>
      
      {/* Footer */}
      <footer className="mt-auto py-4 text-center w-full text-muted-foreground text-sm">
        <p>Not financial advice. Just pixelated fun.</p>
      </footer>
    </motion.div>
  );
};

export default LandingPage;
