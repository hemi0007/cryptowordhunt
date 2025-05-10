import { useEffect, useRef } from "react";

const CRYPTO_SYMBOLS = "₿ΞÐΞΤΗ🚀💎🙌DOGE";

const MatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Matrix rain setup
    const fontSize = 16;
    const columns = Math.ceil(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    // Animation function
    const drawMatrix = () => {
      // Semi-transparent black to create trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set text properties
      ctx.fillStyle = "#00ff00";
      ctx.font = `${fontSize}px monospace`;

      // Draw each character
      for (let i = 0; i < drops.length; i++) {
        // Random character from our symbol set
        const symbol = CRYPTO_SYMBOLS.charAt(
          Math.floor(Math.random() * CRYPTO_SYMBOLS.length)
        );
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(symbol, x, y);

        // Reset to top or continue falling
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i]++;
        }
      }
    };

    // Start animation
    const animationId = setInterval(drawMatrix, 50);

    // Cleanup
    return () => {
      clearInterval(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="matrix-container"
      aria-hidden="true"
    />
  );
};

export default MatrixBackground;
