import { useEffect, useRef, memo } from "react";

// Subtle matrix background with minimal animation
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
    
    // Very minimal matrix setup - much fewer columns
    const fontSize = 18;
    // Use around 20% of the columns compared to full density
    const columns = Math.floor((canvas.width / fontSize) * 0.2);
    const drops = Array(columns).fill(0);
    
    // Animation function with longer delay
    function draw() {
      if (!isMounted) return;
      
      // Slower fade for softer animation
      ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Soft green for less intensity
      ctx.fillStyle = "rgba(0, 180, 0, 0.5)";
      ctx.font = `${fontSize}px monospace`;
      
      // Only process a subset of columns each frame
      for (let i = 0; i < drops.length; i += 2) {
        // Only a few crypto symbols
        const text = ["₿", "$"][Math.floor(Math.random() * 2)];
        
        // Draw the character
        ctx.fillText(text, i * fontSize * 5, drops[i] * fontSize);
        
        // Much higher chance of resetting drops to create a sparse effect
        if (drops[i] * fontSize > canvas.height || Math.random() > 0.95) {
          drops[i] = 0;
        } else {
          drops[i]++;
        }
      }
      
      // Much slower animation rate
      setTimeout(() => requestAnimationFrame(draw), 150);
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
      style={{ opacity: 0.6 }}
    />
  );
};

export default memo(MatrixBackground);
