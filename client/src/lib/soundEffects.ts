// Sound effects manager for the game

/**
 * Loads all game sound effects with improved performance
 * @returns Promise with audio elements
 */
export async function loadSounds(): Promise<{
  backgroundMusic: HTMLAudioElement;
  hitSound: HTMLAudioElement;
  successSound: HTMLAudioElement;
}> {
  // Create audio elements with optimized settings
  const backgroundMusic = new Audio();
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.3;
  
  // Create empty sounds that will be loaded on demand
  const hitSound = new Audio();
  hitSound.volume = 0.5;
  
  const successSound = new Audio();
  successSound.volume = 0.5;

  // Set sources but don't load them yet - they'll load when needed
  backgroundMusic.src = '/sounds/background.mp3';
  hitSound.src = '/sounds/hit.mp3';
  successSound.src = '/sounds/success.mp3';
  
  // Skip the loading wait - we'll load sounds on demand instead of upfront
  console.log('Sound effects ready (will load when played)');
  
  return {
    backgroundMusic,
    hitSound,
    successSound
  };
}

/**
 * Creates a short beep sound
 * @param frequency - Sound frequency in Hz
 * @param duration - Sound duration in ms
 * @param volume - Sound volume (0-1)
 * @returns Audio context for the generated sound
 */
export function createBeepSound(
  frequency: number = 440,
  duration: number = 200,
  volume: number = 0.5
): AudioContext {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.value = volume;
    oscillator.start();
    
    // Stop the sound after duration
    setTimeout(() => {
      oscillator.stop();
    }, duration);
    
    return audioContext;
  } catch (error) {
    console.error('Failed to create beep sound:', error);
    // Return a dummy audio context if it fails
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  }
}
