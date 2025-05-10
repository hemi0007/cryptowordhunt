// Sound effects manager for the game

/**
 * Loads all game sound effects
 * @returns Promise with audio elements
 */
export async function loadSounds(): Promise<{
  backgroundMusic: HTMLAudioElement;
  hitSound: HTMLAudioElement;
  successSound: HTMLAudioElement;
}> {
  return new Promise((resolve, reject) => {
    try {
      // Load background music
      const backgroundMusic = new Audio('/sounds/background.mp3');
      backgroundMusic.loop = true;
      backgroundMusic.volume = 0.3;
      backgroundMusic.preload = 'auto';
      
      // Load hit sound effect
      const hitSound = new Audio('/sounds/hit.mp3');
      hitSound.preload = 'auto';
      hitSound.volume = 0.5;
      
      // Load success sound effect
      const successSound = new Audio('/sounds/success.mp3');
      successSound.preload = 'auto';
      successSound.volume = 0.5;
      
      // Create load promises
      const loadPromises = [
        new Promise<void>((res) => {
          backgroundMusic.addEventListener('canplaythrough', () => res());
          backgroundMusic.load();
        }),
        new Promise<void>((res) => {
          hitSound.addEventListener('canplaythrough', () => res());
          hitSound.load();
        }),
        new Promise<void>((res) => {
          successSound.addEventListener('canplaythrough', () => res());
          successSound.load();
        })
      ];
      
      // Wait for all sounds to load
      Promise.all(loadPromises)
        .then(() => {
          console.log('All sound effects loaded successfully');
          resolve({
            backgroundMusic,
            hitSound,
            successSound
          });
        })
        .catch((error) => {
          console.error('Failed to load sound effects:', error);
          reject(error);
        });
    } catch (error) {
      console.error('Error setting up sound effects:', error);
      reject(error);
    }
  });
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
