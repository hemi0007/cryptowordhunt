import { useEffect, useRef, memo } from "react";

// Simple crypto symbols that work reliably
const CRYPTO_SYMBOLS = "₿$¥€£";

// Simplified matrix background that works on all devices
const MatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Track if component is mounted
    let isMounted = true;
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Initial size
    resizeCanvas();
    
    // Add resize listener
    window.addEventListener("resize", resizeCanvas);
    
    // Matrix rain setup
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(0);
    
    // Animation function
    function draw() {
      if (!isMounted) return;
      
      // Create fade effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw characters
      ctx.fillStyle = "#0f0";
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        // Choose a random character
        const text = CRYPTO_SYMBOLS.charAt(Math.floor(Math.random() * CRYPTO_SYMBOLS.length));
        
        // Draw the character
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        // Reset when hitting the bottom or randomly for some columns
        if (drops[i] * fontSize > canvas.height || Math.random() > 0.98) {
          drops[i] = 0;
        }
        
        // Move drop down
        drops[i]++;
      }
      
      setTimeout(() => requestAnimationFrame(draw), 35);
    }
    
    // Start animation
    draw();
    
    // Cleanup
    return () => {
      isMounted = false;
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ opacity: 0.8 }}
    />
  );
};

export default memo(MatrixBackground);
