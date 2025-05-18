import { useEffect, useRef, memo } from "react";

// Further reduced symbol set for better performance
const CRYPTO_SYMBOLS = "₿ΞÐΤΗ🚀";

// Hyper-optimized matrix background for faster loading and rendering
const MatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    // Delayed animation start - don't block initial page load
    const initDelay = setTimeout(() => {
      startMatrixAnimation();
    }, 100);
    
    return () => clearTimeout(initDelay);
  }, []);
  
  // Separate function for animation to reduce initial load time
  const startMatrixAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { 
      alpha: false,
      desynchronized: true, // Hint for possible performance improvements
    });
    if (!ctx) return;

    // Track if component is mounted
    let isMounted = true;
    
    // Set canvas dimensions at a lower resolution for better performance
    const resizeCanvas = () => {
      if (!isMounted || !canvas) return;
      
      // Use 80% of the actual resolution for better performance
      // This gives a slight blur but dramatically improves performance
      const scaleFactor = window.devicePixelRatio > 1 ? 0.5 : 0.8;
      const width = Math.floor(window.innerWidth * scaleFactor);
      const height = Math.floor(window.innerHeight * scaleFactor);
      
      // Only resize if needed
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
      }
    };

    // Initial size
    resizeCanvas();
    
    // Ultra-throttled resize listener - only respond every 500ms max
    let resizeTimeout: number | null = null;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resizeCanvas, 500);
    };
    window.addEventListener("resize", handleResize);

    // Matrix rain setup - drastically reduce number of columns
    const fontSize = 16;
    // Use very low density for much better performance
    const density = window.innerWidth > 1200 ? 0.3 : 0.2;
    const columns = Math.ceil((canvas.width / fontSize) * density);
    const drops: number[] = Array(columns).fill(1);
    
    // Pre-generate all random symbols just once
    const symbolCache = CRYPTO_SYMBOLS.split('');
    
    // Use much lower frame rate (60fps -> 15fps)
    let lastFrameTime = 0;
    const frameRate = 70; // Render at ~14fps for much better performance
    
    // Ultra optimized animation function
    const drawMatrix = (timestamp: number) => {
      if (!isMounted) return;
      
      // Skip frames aggressively
      if (timestamp - lastFrameTime < frameRate) {
        requestAnimationFrame(drawMatrix);
        return;
      }
      
      lastFrameTime = timestamp;
      
      // More transparent fade for better performance
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set text properties once
      ctx.fillStyle = "#00ff00";
      ctx.font = `${fontSize}px monospace`;

      // Draw only 50% of characters each frame for better performance
      for (let i = 0; i < drops.length; i += 2) {
        // Get a random symbol from our tiny cache
        const symbol = symbolCache[Math.floor(Math.random() * symbolCache.length)];
        const x = i * (fontSize / density);
        const y = drops[i] * fontSize;

        // Only draw if fully on screen (stricter check)
        if (y > fontSize && y < canvas.height - fontSize) {
          ctx.fillText(symbol, x, y);
        }

        // Simplified physics with less randomness
        if (y > canvas.height) {
          drops[i] = 0;
        } else {
          drops[i]++;
        }
      }
      
      requestAnimationFrame(drawMatrix);
    };

    // Start animation with a slight delay
    requestAnimationFrame(drawMatrix);

    // Cleanup
    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  };

  // Use React.memo to prevent unnecessary re-renders
  return (
    <canvas
      ref={canvasRef}
      className="matrix-container fixed top-0 left-0 w-full h-full -z-10"
      aria-hidden="true"
      style={{ 
        position: 'fixed',
        top: 0, 
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -10,
        opacity: 0.8 // Slightly transparent for better performance
      }}
    />
  );
};

// Memoize component to prevent re-renders
export default memo(MatrixBackground);
