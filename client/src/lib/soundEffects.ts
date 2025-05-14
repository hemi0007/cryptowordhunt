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
      // Create audio elements with optimized settings
      const backgroundMusic = new Audio();
      backgroundMusic.src = '/sounds/background.mp3';
      backgroundMusic.loop = true;
      backgroundMusic.volume = 0.3;
      backgroundMusic.preload = 'none'; // Only load when explicitly requested
      
      // Hit sound - small sound, can be loaded on demand
      const hitSound = new Audio();
      hitSound.volume = 0.5;
      hitSound.preload = 'none';
      
      // Success sound - load on demand
      const successSound = new Audio();
      successSound.volume = 0.5;
      successSound.preload = 'none';

      // Create a simplified loading process
      const loadSound = (sound: HTMLAudioElement, src: string) => {
        return new Promise<void>((res, rej) => {
          const onLoaded = () => {
            sound.removeEventListener('canplaythrough', onLoaded);
            sound.removeEventListener('error', onError);
            res();
          };
          
          const onError = (e: ErrorEvent) => {
            sound.removeEventListener('canplaythrough', onLoaded);
            sound.removeEventListener('error', onError);
            rej(new Error(`Failed to load sound: ${src}`));
          };
          
          sound.addEventListener('canplaythrough', onLoaded, { once: true });
          sound.addEventListener('error', onError, { once: true });
          sound.src = src;
          sound.load();
        });
      };
      
      // Start with just loading essential sounds
      // Background music will be lazy-loaded when play is called
      Promise.all([
        loadSound(hitSound, '/sounds/hit.mp3'),
        loadSound(successSound, '/sounds/success.mp3')
      ])
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
          resolve({
            backgroundMusic: new Audio(),
            hitSound: new Audio(),
            successSound: new Audio()
          }); // Resolve with empty sounds to prevent app from crashing
        });
    } catch (error) {
      console.error('Error setting up sound effects:', error);
      // Don't reject - provide fallback audio instead
      resolve({
        backgroundMusic: new Audio(),
        hitSound: new Audio(),
        successSound: new Audio()
      });
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
