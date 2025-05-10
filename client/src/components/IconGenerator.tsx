import { useEffect, useRef } from "react";

interface IconGeneratorProps {
  iconType: "cryptoBro" | "lambo" | "rocket";
  width?: number;
  height?: number;
  className?: string;
}

const IconGenerator: React.FC<IconGeneratorProps> = ({ 
  iconType, 
  width = 200, 
  height = 200, 
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw based on icon type
    switch (iconType) {
      case "cryptoBro":
        drawCryptoBro(ctx, width, height);
        break;
      case "lambo":
        drawLambo(ctx, width, height);
        break;
      case "rocket":
        drawRocket(ctx, width, height);
        break;
    }
  }, [iconType, width, height]);

  return (
    <canvas 
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
};

// Drawing functions for each icon type
function drawCryptoBro(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Constants
  const centerX = width / 2;
  const headRadius = width * 0.25;
  
  // Head
  ctx.fillStyle = "#FFD700"; // Gold color
  ctx.beginPath();
  ctx.arc(centerX, height * 0.35, headRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Sunglasses
  ctx.fillStyle = "#000000";
  ctx.fillRect(centerX - headRadius * 0.8, height * 0.33, headRadius * 1.6, headRadius * 0.4);
  
  // Smile
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = width * 0.01;
  ctx.beginPath();
  ctx.arc(centerX, height * 0.43, headRadius * 0.6, 0, Math.PI);
  ctx.stroke();
  
  // Body
  ctx.fillStyle = "#222222";
  ctx.fillRect(centerX - width * 0.2, height * 0.5, width * 0.4, height * 0.3);
  
  // Arms
  ctx.fillStyle = "#222222";
  ctx.fillRect(centerX - width * 0.35, height * 0.55, width * 0.15, height * 0.2);
  ctx.fillRect(centerX + width * 0.2, height * 0.55, width * 0.15, height * 0.2);
  
  // Bitcoin logo on shirt
  ctx.fillStyle = "#F7931A";
  ctx.beginPath();
  ctx.arc(centerX, height * 0.6, width * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${width * 0.1}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("₿", centerX, height * 0.6);
  
  // Diamond hands
  ctx.fillStyle = "#00FFFF";
  ctx.beginPath();
  ctx.moveTo(centerX - width * 0.3, height * 0.75);
  ctx.lineTo(centerX - width * 0.2, height * 0.7);
  ctx.lineTo(centerX - width * 0.25, height * 0.8);
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(centerX + width * 0.3, height * 0.75);
  ctx.lineTo(centerX + width * 0.2, height * 0.7);
  ctx.lineTo(centerX + width * 0.25, height * 0.8);
  ctx.fill();
}

function drawLambo(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Car body
  ctx.fillStyle = "#FF9900"; // Lamborghini orange
  
  // Main body
  ctx.beginPath();
  ctx.moveTo(width * 0.1, height * 0.65);
  ctx.lineTo(width * 0.1, height * 0.6);
  ctx.lineTo(width * 0.3, height * 0.55);
  ctx.lineTo(width * 0.7, height * 0.55);
  ctx.lineTo(width * 0.9, height * 0.6);
  ctx.lineTo(width * 0.9, height * 0.65);
  ctx.closePath();
  ctx.fill();
  
  // Roof
  ctx.beginPath();
  ctx.moveTo(width * 0.3, height * 0.55);
  ctx.lineTo(width * 0.4, height * 0.45);
  ctx.lineTo(width * 0.6, height * 0.45);
  ctx.lineTo(width * 0.7, height * 0.55);
  ctx.closePath();
  ctx.fill();
  
  // Windows
  ctx.fillStyle = "#AADDFF";
  ctx.beginPath();
  ctx.moveTo(width * 0.32, height * 0.54);
  ctx.lineTo(width * 0.41, height * 0.46);
  ctx.lineTo(width * 0.59, height * 0.46);
  ctx.lineTo(width * 0.68, height * 0.54);
  ctx.closePath();
  ctx.fill();
  
  // Wheels
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(width * 0.25, height * 0.65, width * 0.08, 0, Math.PI * 2);
  ctx.arc(width * 0.75, height * 0.65, width * 0.08, 0, Math.PI * 2);
  ctx.fill();
  
  // Wheel rims
  ctx.fillStyle = "#CCCCCC";
  ctx.beginPath();
  ctx.arc(width * 0.25, height * 0.65, width * 0.04, 0, Math.PI * 2);
  ctx.arc(width * 0.75, height * 0.65, width * 0.04, 0, Math.PI * 2);
  ctx.fill();
  
  // Ground/shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height * 0.7, width * 0.4, height * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawRocket(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Rocket body
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(width * 0.5, height * 0.2);
  ctx.lineTo(width * 0.35, height * 0.6);
  ctx.lineTo(width * 0.65, height * 0.6);
  ctx.closePath();
  ctx.fill();
  
  // Rocket windows
  ctx.fillStyle = "#AADDFF";
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.4, width * 0.05, 0, Math.PI * 2);
  ctx.fill();
  
  // Fins
  ctx.fillStyle = "#FF3333";
  
  // Left fin
  ctx.beginPath();
  ctx.moveTo(width * 0.35, height * 0.6);
  ctx.lineTo(width * 0.25, height * 0.7);
  ctx.lineTo(width * 0.35, height * 0.7);
  ctx.closePath();
  ctx.fill();
  
  // Right fin
  ctx.beginPath();
  ctx.moveTo(width * 0.65, height * 0.6);
  ctx.lineTo(width * 0.75, height * 0.7);
  ctx.lineTo(width * 0.65, height * 0.7);
  ctx.closePath();
  ctx.fill();
  
  // Bottom
  ctx.fillStyle = "#FF3333";
  ctx.beginPath();
  ctx.moveTo(width * 0.35, height * 0.6);
  ctx.lineTo(width * 0.5, height * 0.65);
  ctx.lineTo(width * 0.65, height * 0.6);
  ctx.closePath();
  ctx.fill();
  
  // Exhaust flames
  const gradient = ctx.createLinearGradient(width * 0.5, height * 0.65, width * 0.5, height * 0.9);
  gradient.addColorStop(0, "#FF9900");
  gradient.addColorStop(0.5, "#FF3300");
  gradient.addColorStop(1, "rgba(255, 30, 0, 0)");
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(width * 0.4, height * 0.65);
  ctx.quadraticCurveTo(width * 0.5, height * 0.9, width * 0.6, height * 0.65);
  ctx.closePath();
  ctx.fill();
  
  // Moon in background
  ctx.fillStyle = "#DDDDDD";
  ctx.beginPath();
  ctx.arc(width * 0.8, height * 0.3, width * 0.1, 0, Math.PI * 2);
  ctx.fill();
  
  // Stars
  ctx.fillStyle = "#FFFFFF";
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.6;
    const size = Math.random() * width * 0.01 + width * 0.005;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default IconGenerator;
