import React, { useRef, useEffect } from "react";

interface Point3D {
  x: number;
  y: number;
  z: number;
  ox: number; // original base position
  oy: number;
  oz: number;
  color: string;
  size: number;
  ticketLabel?: string;
}

interface ParticleSphere3DProps {
  isRolling: boolean;
  currentDisplayNum: number;
  winnerTicketNumber: number | null;
}

export default function ParticleSphere3D({
  isRolling,
  currentDisplayNum,
  winnerTicketNumber
}: ParticleSphere3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const pointsRef = useRef<Point3D[]>([]);

  // Spin control physics
  const velocityY = useRef(0.005);
  const velocityX = useRef(0.003);
  const explosionProgress = useRef(0);
  const isExploding = useRef(false);

  // Initialize unified 3D point cloud
  useEffect(() => {
    const numPoints = 180;
    const tempPoints: Point3D[] = [];
    const radius = 115;

    for (let i = 0; i < numPoints; i++) {
      // Fibonacci spiral distribution on a sphere
      const phi = Math.acos(-1 + (2 * i) / numPoints);
      const theta = Math.sqrt(numPoints * Math.PI) * phi;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      // Neon-enriched palette: Cowrywise blue, emerald green, and pure white highlights
      const colorRand = Math.random();
      const color =
        colorRand < 0.45
          ? "#0066FF" // Cowrywise Core Blue
          : colorRand < 0.85
          ? "#10B981" // Rich Success Green
          : "#FFFFFF"; // Specular Starlight

      const size = Math.random() * 2.2 + 1.2;

      // Add a few floating coupon reference tags at random indexes
      const ticketLabel =
        i % 14 === 0
          ? `#${Math.floor(Math.random() * 401)
              .toString()
              .padStart(3, "0")}`
          : undefined;

      tempPoints.push({
        x,
        y,
        z,
        ox: x,
        oy: y,
        oz: z,
        color,
        size,
        ticketLabel
      });
    }

    pointsRef.current = tempPoints;
  }, []);

  // Monitor roll state to trigger expand/contract shockwaves
  useEffect(() => {
    if (isRolling) {
      isExploding.current = false;
      explosionProgress.current = 0;
    } else if (winnerTicketNumber !== null) {
      isExploding.current = true;
      explosionProgress.current = 1.0;
    }
  }, [isRolling, winnerTicketNumber]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const size = Math.min(parent.clientWidth, 420);
        canvas.width = size;
        canvas.height = size;
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    let rotationAngleY = 0;
    let rotationAngleX = 0;

    const renderLoop = () => {
      if (!ctx || !canvas) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const perspective = 300;

      // Draw premium dark metallic radial ambient background inside the sphere
      ctx.clearRect(0, 0, width, height);
      
      const radialBg = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        width / 2
      );
      // Beautiful dark navy/carbon ambient space (Cowry Blue shade)
      radialBg.addColorStop(0, "#080C14"); 
      radialBg.addColorStop(0.6, "#040508");
      radialBg.addColorStop(1, "#000000");
      ctx.fillStyle = radialBg;
      ctx.beginPath();
      ctx.arc(centerX, centerY, width / 2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Kinetic physics calculations
      if (isRolling) {
        velocityY.current = velocityY.current * 0.9 + 0.14 * 0.1;
        velocityX.current = velocityX.current * 0.9 + 0.08 * 0.1;
      } else {
        velocityY.current = velocityY.current * 0.95 + 0.005 * 0.05;
        velocityX.current = velocityX.current * 0.95 + 0.003 * 0.05;
      }

      rotationAngleY += velocityY.current;
      rotationAngleX += velocityX.current;

      const sinY = Math.sin(rotationAngleY);
      const cosY = Math.cos(rotationAngleY);
      const sinX = Math.sin(rotationAngleX);
      const cosX = Math.cos(rotationAngleX);

      // Decay explosion recoil
      if (isExploding.current) {
        explosionProgress.current *= 0.92;
        if (explosionProgress.current < 0.002) {
          explosionProgress.current = 0;
          isExploding.current = false;
        }
      }

      // Draw neat HUD perimeter orbits
      ctx.beginPath();
      ctx.arc(centerX, centerY, width * 0.46, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(35, 33, 31, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dual Interlocking Neon 3D Coordinate Rings (Perfect brand loop details)
      // Ring 1: Dynamic Horizontal saving loops (Cowrywise Blue)
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.06) {
        const rx = 120 * Math.cos(a);
        const ry = 12 * Math.sin(a); // slight vertical offset wave
        const rz = 120 * Math.sin(a);

        // Rotate horizontal ring with key speed
        const x1 = rx * cosY - rz * sinY;
        const z1 = rx * sinY + rz * cosY;
        const y2 = ry * cosX - z1 * sinX;
        const z2 = ry * sinX + z1 * cosX;

        const proj = perspective / (perspective + z2);
        const px = centerX + x1 * proj;
        const py = centerY + y2 * proj;

        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = isRolling ? "rgba(0, 102, 255, 0.35)" : "rgba(0, 102, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ring 2: Vertical growth loops (Emerald Green)
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.06) {
        const rx = 8 * Math.sin(a);
        const ry = 120 * Math.cos(a);
        const rz = 120 * Math.sin(a);

        const x1 = rx * cosY - rz * sinY;
        const z1 = rx * sinY + rz * cosY;
        const y2 = ry * cosX - z1 * sinX;
        const z2 = ry * sinX + z1 * cosX;

        const proj = perspective / (perspective + z2);
        const px = centerX + x1 * proj;
        const py = centerY + y2 * proj;

        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = isRolling ? "rgba(16, 185, 129, 0.35)" : "rgba(16, 185, 129, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      const points = pointsRef.current;
      const projected: { px: number; py: number; pz: number; pt: Point3D }[] = [];

      // Calculate translation
      for (const pt of points) {
        // Rotate points
        let x1 = pt.ox * cosY - pt.oz * sinY;
        let z1 = pt.ox * sinY + pt.oz * cosY;
        let y2 = pt.oy * cosX - z1 * sinX;
        let z2 = pt.oy * sinX + z1 * cosX;

        // Apply explosion shockwave physics
        const multiplier = 1.0 + explosionProgress.current * 1.6;
        const finalX = x1 * multiplier;
        const finalY = y2 * multiplier;
        const finalZ = z2;

        const proj = perspective / (perspective + finalZ);
        const px = centerX + finalX * proj;
        const py = centerY + finalY * proj;

        projected.push({ px, py, pz: finalZ, pt });
      }

      // Sort coordinates for genuine 3D clipping depth buffer
      projected.sort((a, b) => b.pz - a.pz);

      // Draw constellation filaments for foreground nodes only (high-tech aesthetic)
      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        if (p1.pz > 15) continue; // skip deep background elements

        let linesDrew = 0;
        for (let j = i + 1; j < projected.length; j++) {
          if (linesDrew >= 2) break; // keep lines sparse and elegant
          const p2 = projected[j];
          if (p2.pz > 15) continue;

          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const distanceSq = dx * dx + dy * dy;

          // Connect if close
          if (distanceSq < 1300) { // approx 36 pixels apart
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.strokeStyle = p1.pt.color === p2.pt.color && p1.pt.color !== "#FFFFFF"
              ? p1.pt.color === "#0066FF" ? "rgba(0, 102, 255, 0.18)" : "rgba(16, 185, 129, 0.18)"
              : "rgba(0, 102, 255, 0.08)";
            ctx.lineWidth = 0.8;
            ctx.stroke();
            linesDrew++;
          }
        }
      }

      // Render actual sphere node points
      for (const p of projected) {
        const { px, py, pz, pt } = p;

        // Depth scale alpha opacity
        const depthAlpha = Math.max(0.12, Math.min(1.0, (280 - pz) / 380));
        ctx.globalAlpha = depthAlpha;

        const isForeground = pz < -40;

        if (pt.ticketLabel && isForeground && !isRolling) {
          ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
          ctx.font = "bold 8px var(--font-mono, monospace)";
          ctx.fillText(pt.ticketLabel, px + 6, py - 3);

          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = "#0066FF";
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(px, py, pt.size * (isForeground ? 1.4 : 0.85), 0, Math.PI * 2);
          ctx.fillStyle = pt.color;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1.0;

      // Draw beautiful central futuristic HUD viewfinder target box
      ctx.strokeStyle = isRolling ? "rgba(0,102,255,0.4)" : "rgba(16,185,129,0.3)";
      ctx.lineWidth = 1;
      // Top-Left bracket
      ctx.beginPath();
      ctx.moveTo(centerX - 90, centerY - 45);
      ctx.lineTo(centerX - 90, centerY - 60);
      ctx.lineTo(centerX - 75, centerY - 60);
      ctx.stroke();
      // Bottom-Left bracket
      ctx.beginPath();
      ctx.moveTo(centerX - 90, centerY + 45);
      ctx.lineTo(centerX - 90, centerY + 60);
      ctx.lineTo(centerX - 75, centerY + 60);
      ctx.stroke();
      // Top-Right bracket
      ctx.beginPath();
      ctx.moveTo(centerX + 90, centerY - 45);
      ctx.lineTo(centerX + 90, centerY - 60);
      ctx.lineTo(centerX + 75, centerY - 60);
      ctx.stroke();
      // Bottom-Right bracket
      ctx.beginPath();
      ctx.moveTo(centerX + 90, centerY + 45);
      ctx.lineTo(centerX + 90, centerY + 60);
      ctx.lineTo(centerX + 75, centerY + 60);
      ctx.stroke();

      // Display dynamic central values
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (isRolling) {
        ctx.fillStyle = "#0066FF";
        ctx.font = "800 11px var(--font-display, monospace)";
        ctx.fillText("LIVE ROLLING STATE", centerX, centerY - 32);

        // Cyberpunk display text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 68px var(--font-heading, sans-serif)";
        ctx.fillText(`#${currentDisplayNum.toString().padStart(3, "0")}`, centerX, centerY + 10);
      } else if (winnerTicketNumber !== null) {
        ctx.fillStyle = "#10B981";
        ctx.font = "800 11px var(--font-display, monospace)";
        ctx.fillText("DRAW SUCCESS", centerX, centerY - 32);

        // Winning design has glowing dynamic shadow drop
        ctx.fillStyle = "#10B981";
        ctx.font = "900 78px var(--font-heading, sans-serif)";
        ctx.shadowColor = "#10B981";
        ctx.shadowBlur = 18;
        ctx.fillText(`#${winnerTicketNumber.toString().padStart(3, "0")}`, centerX, centerY + 10);
        ctx.shadowBlur = 0; // reset
      } else {
        ctx.fillStyle = "#9B9691";
        ctx.font = "800 11px var(--font-display, monospace)";
        ctx.fillText("STANDBY IDLE", centerX, centerY - 32);

        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "900 68px var(--font-heading, sans-serif)";
        ctx.fillText("#000", centerX, centerY + 10);
      }

      animationRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRolling, currentDisplayNum, winnerTicketNumber]);

  return (
    <div className="w-full flex items-center justify-center py-2 relative aspect-square max-w-[380px] md:max-w-[420px] mx-auto select-none">
      <canvas
        ref={canvasRef}
        className="block bg-[#000000] rounded-full border-2 border-[#23211F] z-10 transition-all duration-300"
      />
    </div>
  );
}
