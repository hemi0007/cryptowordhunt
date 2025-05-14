import { useEffect, useRef, memo } from "react";

// Reduced symbol set for better performance
const CRYPTO_SYMBOLS = "₿ΞÐΞΤΗ🚀💎🙌";

// Performance optimized matrix background
const MatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false }); // Disable alpha for performance
    if (!ctx) return;

    // Track if component is mounted
    let isMounted = true;
    
    // Set canvas dimensions with a throttled resize handler
    const resizeCanvas = () => {
      if (!isMounted || !canvas) return;
      
      // Only set dimensions if they've actually changed
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    // Initial size
    resizeCanvas();
    
    // Throttled resize listener
    let resizeTimeout: number;
    const handleResize = () => {
      if (resizeTimeout) window.cancelAnimationFrame(resizeTimeout);
      resizeTimeout = window.requestAnimationFrame(resizeCanvas);
    };
    window.addEventListener("resize", handleResize);

    // Matrix rain setup - optimize by reducing number of columns
    const fontSize = 16;
    // Use fewer columns for better performance
    const density = window.innerWidth > 1200 ? 0.6 : 0.4; // Reduce density on smaller screens
    const columns = Math.ceil((canvas.width / fontSize) * density);
    const drops: number[] = Array(columns).fill(1);
    
    // Pre-generate random symbols for reuse
    const symbolCache = Array(20).fill(0).map(() => 
      CRYPTO_SYMBOLS.charAt(Math.floor(Math.random() * CRYPTO_SYMBOLS.length))
    );
    
    // Use requestAnimationFrame instead of setInterval for smoother animation
    let lastFrameTime = 0;
    const frameRate = 25; // Lower frame rate for better performance (was 20ms, now 40ms)
    
    // Animation function using RAF with time-based throttling
    const drawMatrix = (timestamp: number) => {
      if (!isMounted) return;
      
      // Skip frames for performance
      if (timestamp - lastFrameTime < frameRate) {
        requestAnimationFrame(drawMatrix);
        return;
      }
      
      lastFrameTime = timestamp;
      
      // Semi-transparent black to create trail effect - with improved opacity value
      ctx.fillStyle = "rgba(0, 0, 0, 0.075)"; // Slightly more transparent for better performance
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set text properties
      ctx.fillStyle = "#00ff00";
      ctx.font = `${fontSize}px monospace`;

      // Draw each character - batch operations when possible
      for (let i = 0; i < drops.length; i++) {
        // Use cached symbols for better performance
        const symbol = symbolCache[Math.floor(Math.random() * symbolCache.length)];
        const x = i * (fontSize / density);
        const y = drops[i] * fontSize;

        // Only draw if on screen
        if (y > 0 && y < canvas.height) {
          ctx.fillText(symbol, x, y);
        }

        // Reset to top or continue falling - with optimized random check
        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        } else {
          drops[i]++;
        }
      }
      
      requestAnimationFrame(drawMatrix);
    };

    // Start animation
    requestAnimationFrame(drawMatrix);

    // Cleanup
    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
        zIndex: -10 
      }}
    />
  );
};

// Memoize component to prevent re-renders
export default memo(MatrixBackground);
