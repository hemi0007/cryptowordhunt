import { Suspense, useState, useEffect, lazy } from "react";
import { useAudio } from "./lib/stores/useAudio";
import { useGame } from "./lib/stores/useGame";
import { loadSounds } from "./lib/soundEffects";

// Lazy load components for better performance
const LandingPage = lazy(() => import("./components/LandingPage"));
const GamePage = lazy(() => import("./components/GamePage"));
const MatrixBackground = lazy(() => import("./components/MatrixBackground"));

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { phase } = useGame();
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();

  // Load and setup game assets
  useEffect(() => {
    const initializeAssets = async () => {
      try {
        // Load sound effects
        const sounds = await loadSounds();
        setBackgroundMusic(sounds.backgroundMusic);
        setHitSound(sounds.hitSound);
        setSuccessSound(sounds.successSound);
      } catch (error) {
        console.error("Failed to load assets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAssets();
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <h2 className="mt-4 text-xl font-bold neon-text neon-green">Loading ChainWords...</h2>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden">
      <Suspense fallback={null}>
        <MatrixBackground />
      </Suspense>
      
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        {phase === "ready" && <LandingPage />}
        {(phase === "playing" || phase === "ended") && <GamePage />}
      </Suspense>
    </div>
  );
}

export default App;
