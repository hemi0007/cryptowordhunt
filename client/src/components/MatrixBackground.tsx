import { useEffect, useRef, memo } from "react";

// Balanced matrix background with moderate animation
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
    
    // More balanced matrix setup - moderate column count
    const fontSize = 16;
    // Use around 35% of the columns for balanced look
    const columns = Math.floor((canvas.width / fontSize) * 0.35);
    const drops = Array(columns).fill(0);
    
    // Crypto symbols with a bit more variety
    const symbols = ["₿", "$", "Ξ", "Ð", "₮"];
    
    // Animation function with balanced speed
    function draw() {
      if (!isMounted || !ctx || !canvas) return;
      
      // Balanced fade for smooth animation
      ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Slightly more vibrant green with partial transparency
      ctx.fillStyle = "rgba(0, 200, 0, 0.65)";
      ctx.font = `${fontSize}px monospace`;
      
      // Process more columns for better coverage
      for (let i = 0; i < drops.length; i++) {
        // Get a random symbol from our list
        const text = symbols[Math.floor(Math.random() * symbols.length)];
        
        // Slightly more balanced spacing
        const x = i * fontSize * 3;
        const y = drops[i] * fontSize;
        
        // Draw the character if it would be visible
        if (y > 0 && y < canvas.height) {
          ctx.fillText(text, x, y);
        }
        
        // Balanced chance of resetting drops
        if (drops[i] * fontSize > canvas.height || Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i]++;
        }
      }
      
      // Moderate animation rate
      setTimeout(() => requestAnimationFrame(draw), 100);
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
      style={{ opacity: 0.65 }}
    />
  );
};

export default memo(MatrixBackground);
