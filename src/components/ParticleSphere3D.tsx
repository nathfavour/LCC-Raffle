import React, { useRef, useEffect, useState } from "react";

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
  angleSpeedOffset: number; // custom orbit variance
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

  // Spin velocity variables
  const velocityY = useRef(0.005);
  const velocityX = useRef(0.003);
  const explosionProgress = useRef(0); // 0 (normal) to 1 (max explosion expansion)
  const isExploding = useRef(false);

  // Initialize unified 3D point cloud
  useEffect(() => {
    const numPoints = 160;
    const tempPoints: Point3D[] = [];
    const radius = 110;

    for (let i = 0; i < numPoints; i++) {
      // Fibonacci Grid distribution on a sphere surface
      const phi = Math.acos(-1 + (2 * i) / numPoints);
      const theta = Math.sqrt(numPoints * Math.PI) * phi;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      // Aesthetic color allocation: Cowrywise blue, emerald green, and slate highlights
      const colorRand = Math.random();
      const color =
        colorRand < 0.4
          ? "#0066FF" // Cowrywise Core Blue
          : colorRand < 0.8
          ? "#10B981" // Cowrywise Success Green
          : "#E2E8F0"; // Specular Slate White

      const size = Math.random() * 2 + 1.2;
      const angleSpeedOffset = Math.random() * 0.2 + 0.9;

      // Map small numeric floating handles inside
      const ticketLabel =
        i % 12 === 0
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
        ticketLabel,
        angleSpeedOffset
      });
    }

    pointsRef.current = tempPoints;
  }, []);

  // Monitor roll transitions to activate explosions
  useEffect(() => {
    if (isRolling) {
      isExploding.current = false;
      explosionProgress.current = 0;
    } else if (winnerTicketNumber !== null) {
      // Trigger instant explosion and snap back elasticity
      isExploding.current = true;
      explosionProgress.current = 1.0;
    }
  }, [isRolling, winnerTicketNumber]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle responsive sizing
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

      // Smooth clear
      ctx.clearRect(0, 0, width, height);

      // 1. Calculate dynamic angular velocities
      if (isRolling) {
        // High-velocity kinetic spin
        velocityY.current = velocityY.current * 0.9 + 0.12 * 0.1;
        velocityX.current = velocityX.current * 0.9 + 0.08 * 0.1;
      } else {
        // Cozily decelerate to base orbital rotation
        velocityY.current = velocityY.current * 0.95 + 0.005 * 0.05;
        velocityX.current = velocityX.current * 0.95 + 0.003 * 0.05;
      }

      rotationAngleY += velocityY.current;
      rotationAngleX += velocityX.current;

      const sinY = Math.sin(rotationAngleY);
      const cosY = Math.cos(rotationAngleY);
      const sinX = Math.sin(rotationAngleX);
      const cosX = Math.cos(rotationAngleX);

      // Handle explosion decay back to bedrock
      if (isExploding.current) {
        explosionProgress.current *= 0.93; // Elastic recovery damping
        if (explosionProgress.current < 0.001) {
          explosionProgress.current = 0;
          isExploding.current = false;
        }
      }

      // Draw background ambient bounds
      ctx.beginPath();
      ctx.arc(centerX, centerY, width * 0.46, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(35, 33, 31, 0.2)"; // perfect carbon outline shadow
      ctx.lineWidth = 1;
      ctx.stroke();

      // Deep space orbital guides
      ctx.beginPath();
      ctx.arc(centerX, centerY, width * 0.35, 0, Math.PI * 2);
      ctx.strokeStyle = isRolling ? "rgba(0, 102, 255, 0.15)" : "rgba(35, 33, 31, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      const points = pointsRef.current;
      const projected: { px: number; py: number; pz: number; pt: Point3D }[] = [];

      // Translate, rotate, explode, and project coordinates
      for (const pt of points) {
        // 3D rotation steps
        // Rotate around Y Axis
        let x1 = pt.ox * cosY - pt.oz * sinY;
        let z1 = pt.ox * sinY + pt.oz * cosY;

        // Rotate around X Axis
        let y2 = pt.oy * cosX - z1 * sinX;
        let z2 = pt.oy * sinX + z1 * cosX;

        // Apply physical recoil expansion (Explosive burst)
        const explodeScale = 1.0 + explosionProgress.current * 1.5;
        const finalX = x1 * explodeScale;
        const finalY = y2 * explodeScale;
        const finalZ = z2;

        // Perspective Projection calculation
        const projectionFactor = perspective / (perspective + finalZ);
        const px = centerX + finalX * projectionFactor;
        const py = centerY + finalY * projectionFactor;

        projected.push({ px, py, pz: finalZ, pt });
      }

      // Sort points by Z index (depth buffering) for genuine skeuomorphic 3D rendering
      projected.sort((a, b) => b.pz - a.pz);

      // Render projected points with visual styling
      for (const p of projected) {
        const { px, py, pz, pt } = p;

        // Solid depth opacity scaling
        const depthOpacity = Math.max(0.12, Math.min(1.0, (300 - pz) / 400));
        ctx.globalAlpha = depthOpacity;

        // Highlight center depth
        const isForeground = pz < -30;

        if (pt.ticketLabel && isForeground && !isRolling) {
          // Floating ticket numbers orbit
          ctx.fillStyle = "rgba(16, 185, 129, 0.85)";
          ctx.font = "bold 8px var(--font-mono, monospace)";
          ctx.fillText(pt.ticketLabel, px + 5, py - 3);

          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 102, 255, 0.85)";
          ctx.fill();
        } else {
          // Normal point drawing
          ctx.beginPath();
          ctx.arc(px, py, pt.size * (isForeground ? 1.4 : 0.8), 0, Math.PI * 2);
          ctx.fillStyle = pt.color;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1.0;

      // Draw active center status text / ticket pool indicators
      ctx.fillStyle = "#E2E8F0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (isRolling) {
        // Fast flashing countdown
        ctx.fillStyle = "#0066FF";
        ctx.font = "900 12px var(--font-display, monospace)";
        ctx.fillText("ROLLING POOL", centerX, centerY - 28);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 64px var(--font-heading, sans-serif)";
        ctx.fillText(`#${currentDisplayNum.toString().padStart(3, "0")}`, centerX, centerY + 8);
      } else if (winnerTicketNumber !== null) {
        // Winning static display
        ctx.fillStyle = "#10B981";
        ctx.font = "bold 10px var(--font-mono, monospace)";
        ctx.fillText("WINNING ID", centerX, centerY - 28);

        ctx.fillStyle = "#10B981";
        ctx.font = "900 72px var(--font-heading, sans-serif)";
        // Dynamic drop glow aura
        ctx.shadowColor = "#10B981";
        ctx.shadowBlur = 15;
        ctx.fillText(`#${winnerTicketNumber.toString().padStart(3, "0")}`, centerX, centerY + 10);
        ctx.shadowBlur = 0; // reset shadow
      } else {
        // Standby display
        ctx.fillStyle = "#55524E";
        ctx.font = "bold 10px var(--font-mono, monospace)";
        ctx.fillText("STANDBY READY", centerX, centerY - 28);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 64px var(--font-heading, sans-serif)";
        ctx.fillText("#000", centerX, centerY + 8);
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
      {/* Carbon hairline absolute background frame border anchor */}
      <canvas
        ref={canvasRef}
        className="block bg-[#0A0908] rounded-full border-2 border-[#23211F] z-10 transition-all duration-300"
      />
    </div>
  );
}
