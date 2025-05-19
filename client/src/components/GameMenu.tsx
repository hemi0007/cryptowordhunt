
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "../lib/stores/useAudio";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Slider } from "./ui/slider";

const GameMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isMuted, volume, toggleMute, setVolume, backgroundMusic, hitSound, successSound } = useAudio();
  const [localVolume, setLocalVolume] = useState(volume * 100);

  // Sync local volume with store volume
  useEffect(() => {
    setLocalVolume(volume * 100);
  }, [volume]);
  
  // Helper function to properly toggle mute state
  const handleToggleMute = () => {
    try {
      toggleMute();
      console.log("Mute toggled:", !isMuted);
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };
  
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="relative z-50">
      {/* Menu button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-50 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Menu content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", bounce: 0.1 }}
            className="fixed top-0 right-0 h-screen w-full max-w-xs sm:max-w-sm md:max-w-md"
          >
            <Card className="h-full border-l border-r border-t-0 border-b-0 rounded-none bg-background shadow-2xl overflow-auto brightness-110">
              <CardHeader className="border-b">
                <CardTitle className="text-xl neon-text">Game Menu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* How to Play */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold neon-text">How to Play</h3>
                  <div className="text-sm text-foreground space-y-2 font-medium">
                    <p>1. Find crypto-related words in the grid.</p>
                    <p>2. Drag to select words horizontally, vertically, or diagonally.</p>
                    <p>3. Use power-ups to help you find words faster:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-semibold">Boost</span> - Reveals part of a word</li>
                      <li><span className="font-semibold">Diamond Vision</span> - Briefly reveals all words</li>
                      <li><span className="font-semibold">Mining Boost</span> - Doubles points for 30 seconds</li>
                      <li><span className="font-semibold">FUD Shield</span> - Adds 40 seconds to the timer</li>
                    </ul>
                    <p>4. Find all words before time runs out to advance to the next round.</p>
                    <p>5. Each round gets progressively harder with more words and larger grids.</p>
                  </div>
                </div>

                {/* Sound Controls */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold neon-text">Sound Settings</h3>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleToggleMute}
                      className="min-w-20"
                    >
                      {isMuted ? "Unmute 🔇" : "Mute 🔊"}
                    </Button>
                    <Slider
                      disabled={isMuted}
                      defaultValue={[localVolume]}
                      max={100}
                      step={1}
                      className={`w-full ${isMuted ? "opacity-50" : ""}`}
                      onValueCommit={(value) => {
                        try {
                          const newVolume = value[0] / 100;
                          setLocalVolume(value[0]);
                          setVolume(newVolume);
                          console.log(`Volume changed to: ${newVolume}`);
                        } catch (error) {
                          console.error("Error changing volume:", error);
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Backdrop when menu is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMenu}
            className="fixed inset-0 bg-background/30 z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameMenu;
