import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  isMuted: boolean;
  volume: number;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  playHit: () => void;
  playSuccess: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  isMuted: false, // Start unmuted by default
  volume: 0.3, // Default volume
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  
  setVolume: (volume) => {
    const { backgroundMusic, hitSound, successSound, isMuted } = get();
    
    set({ volume });
    
    // Apply volume to all audio elements
    if (backgroundMusic) {
      backgroundMusic.volume = volume;
    }
    
    if (hitSound) {
      hitSound.volume = volume;
    }
    
    if (successSound) {
      successSound.volume = volume;
    }
    
    console.log(`Volume set to ${volume}`);
  },
  
  toggleMute: () => {
    const { isMuted, backgroundMusic, hitSound, successSound, volume } = get();
    const newMutedState = !isMuted;
    
    // Update the muted state
    set({ isMuted: newMutedState });
    
    // Apply to all audio elements
    if (backgroundMusic) {
      if (newMutedState) {
        backgroundMusic.pause();
      } else {
        backgroundMusic.volume = volume;
        // Try to play music if unmuting
        try {
          const playPromise = backgroundMusic.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.log("Autoplay prevented when unmuting:", err);
              // If autoplay is blocked, we'll need user interaction later
            });
          }
        } catch (err) {
          console.log("Error playing background music:", err);
        }
      }
    }
    
    // Update mute state for other sounds
    if (hitSound) {
      hitSound.muted = newMutedState;
    }
    
    if (successSound) {
      successSound.muted = newMutedState;
    }
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    const { hitSound, isMuted, volume } = get();
    if (hitSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Hit sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = volume;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted, volume } = get();
    if (successSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Success sound skipped (muted)");
        return;
      }
      
      successSound.currentTime = 0;
      successSound.volume = volume;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  }
}));
