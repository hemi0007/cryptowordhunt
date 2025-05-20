import { useEffect, useRef, memo } from "react";

// Minimal symbol set for better performance
const CRYPTO_SYMBOLS = "₿ΞÐΤΗ";

// Mobile-optimized Matrix background for better performance
const MatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    // Delayed start to avoid blocking initial page load
    const startDelay = setTimeout(() => {
      initCanvas();
    }, 200);
    
    return () => clearTimeout(startDelay);
  }, []);
  
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d", { 
      alpha: false, 
      desynchronized: true 
    });
    if (!ctx) return;
    
    // Flag to track component mount state
    let isMounted = true;
    
    // Detect mobile once at initialization
    const isMobile = window.innerWidth < 768;
    
    // Configure performance settings based on device
    const settings = {
      fontSize: isMobile ? 14 : 16,
      density: isMobile ? 0.12 : (window.innerWidth > 1200 ? 0.2 : 0.18),
      frameInterval: isMobile ? 150 : 80, // ms between frames (lower is faster)
      skipFrames: isMobile ? 2 : 1, // Process only every Nth column per frame
      fadeOpacity: isMobile ? 0.15 : 0.1,
    };
    
    // Setup canvas with proper dimensions
    const setupCanvas = () => {
      if (!canvas || !isMounted) return;
      
      // Use lower resolution for better performance
      const scaleFactor = isMobile ? 0.25 : (window.devicePixelRatio > 1 ? 0.4 : 0.6);
      
      const width = Math.floor(window.innerWidth * scaleFactor);
      const height = Math.floor(window.innerHeight * scaleFactor);
      
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
      }
    };
    
    // Initial setup
    setupCanvas();
    
    // Handle resizing
    let resizeTimer: number | null = null;
    const handleResize = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setupCanvas, 500);
    };
    window.addEventListener('resize', handleResize);
    
    // Setup matrix rain
    const columns = Math.ceil((canvas.width / settings.fontSize) * settings.density);
    const drops: number[] = Array(columns).fill(0);
    
    // Prepare symbols
    const symbols = CRYPTO_SYMBOLS.split('');
    
    // Animation state
    let lastTime = 0;
    
    // Optimized drawing function
    const draw = (timestamp: number) => {
      if (!isMounted) return;
      
      // Throttle frame rate
      if (timestamp - lastTime < settings.frameInterval) {
        requestAnimationFrame(draw);
        return;
      }
      
      lastTime = timestamp;
      
      // Clear with fade effect
      ctx.fillStyle = `rgba(0, 0, 0, ${settings.fadeOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set text properties once
      ctx.fillStyle = '#0f0';
      ctx.font = `${settings.fontSize}px monospace`;
      
      // Process subset of columns each frame
      for (let i = 0; i < columns; i += settings.skipFrames) {
        // Get random symbol
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        
        // Calculate position
        const x = i * settings.fontSize;
        const y = drops[i] * settings.fontSize;
        
        // Draw symbol if on screen
        if (y > 0 && y < canvas.height) {
          ctx.fillText(symbol, x, y);
        }
        
        // Update drop position with simplified logic
        if (Math.random() > 0.975 || y > canvas.height) {
          drops[i] = 0;
        } else {
          drops[i]++;
        }
      }
      
      requestAnimationFrame(draw);
    };
    
    // Start animation
    requestAnimationFrame(draw);
    
    // Cleanup
    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      if (resizeTimer) window.clearTimeout(resizeTimer);
    };
  };
  
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -10,
        opacity: 0.75,
      }}
    />
  );
};

export default memo(MatrixBackground);
