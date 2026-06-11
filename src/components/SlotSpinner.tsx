import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useAnimate } from "motion/react";
import { Participant, Prize } from "../types";
import { audio } from "../utils/audio";
import { Trophy, Zap, RefreshCw, Volume2, VolumeX, Sparkles, AlertCircle } from "lucide-react";

interface SlotSpinnerProps {
  participants: Participant[];
  activePrize: Prize | null;
  onDrawComplete: (winner: Participant) => void;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
}

export default function SlotSpinner({
  participants,
  activePrize,
  onDrawComplete,
  isDrawing,
  setIsDrawing
}: SlotSpinnerProps) {
  const [winner, setWinner] = useState<Participant | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [muted, setMuted] = useState(audio.getMuted());
  
  // Create a massive list of names for the scroll reel to ensure seamless infinite look
  const [reelNames, setReelNames] = useState<Participant[]>([]);
  const [targetY, setTargetY] = useState(0);
  
  const tileHeight = 76; // Height of each name card in pixels (including margins)
  const containerRef = useRef<HTMLDivElement>(null);
  const [scope, animate] = useAnimate();
  const lastSoundIndexRef = useRef<number>(-1);

  // Filter only active, non-winning participants for the draw pool
  const validCandidates = participants.filter(p => p.active && !p.won);

  useEffect(() => {
    // Rebuild the reel names layout when candidates update
    if (validCandidates.length > 0) {
      // Repeat the candidates list 6 times to create a long scrollable tape
      const repeated: Participant[] = [];
      for (let i = 0; i < 6; i++) {
        repeated.push(...validCandidates.map(p => ({ ...p, id: `${p.id}-reel-${i}` })));
      }
      setReelNames(repeated);
    } else {
      setReelNames([]);
    }
  }, [participants]);

  const handleMuteToggle = () => {
    const isMuted = audio.toggleMute();
    setMuted(isMuted);
  };

  const triggerDraw = async () => {
    if (isDrawing || validCandidates.length === 0 || !activePrize) return;
    if (activePrize.remaining <= 0) {
      alert("No stashes left for this prize category! Please select another prize.");
      return;
    }

    setIsDrawing(true);
    setWinner(null);
    setShowCelebration(false);
    
    // Choose a random winner from the active, eligible pool
    const winnerIndexInPool = Math.floor(Math.random() * validCandidates.length);
    const chosenWinner = validCandidates[winnerIndexInPool];

    // Play a nice starter sound
    audio.playClick();

    // We want the reel to land on the winner in the 4th block of the repeated array
    // This gives a nice long spin sequence!
    const targetBlock = 4;
    const targetGlobalIndex = (targetBlock * validCandidates.length) + winnerIndexInPool;
    
    // Y translation target. Real viewport center is at offset.
    // Viewport height is h * 3 = 228px. Center card should be the selected card (2nd slot, indexes 1)
    // To align index 1 (the middle slot) with the winner, we translate by:
    // - (targetGlobalIndex - 1) * tileHeight
    const targetOffset = -(targetGlobalIndex - 1) * tileHeight;
    setTargetY(targetOffset);

    // Initial position reset
    await animate(scope.current, { y: 0 }, { duration: 0 });
    
    // Play sound ticker sync'd to progress
    lastSoundIndexRef.current = -1;

    // Start high fidelity animation with motion.
    // Custom bezier easing curve with highly satisfying slow-down deceleration
    await animate(scope.current, { y: targetOffset }, {
      duration: 5.5,
      ease: [0.12, 0.85, 0.22, 1],
      onUpdate: (latest) => {
        // Calculate which tile is currently aligned with the selector pointer
        const currentRelativeY = Math.abs(latest);
        const currentIndex = Math.round(currentRelativeY / tileHeight) + 1;
        
        if (currentIndex !== lastSoundIndexRef.current) {
          lastSoundIndexRef.current = currentIndex;
          // Dynamically increase pitch as it slows down to create an absolute heart-beat effect
          const pct = Math.min(1, currentRelativeY / Math.abs(targetOffset));
          const pitch = 300 + (300 * pct); // Pitch shifts from 300Hz to 600Hz as deceleration completes
          audio.playTick(pitch);
        }
      }
    });

    // Spin ended! Highlight winner!
    setWinner(chosenWinner);
    setIsDrawing(false);
    setShowCelebration(true);
    audio.playWin();

    // Notify parent state
    setTimeout(() => {
      onDrawComplete(chosenWinner);
    }, 1200);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-premium relative overflow-hidden flex flex-col items-center">
      
      {/* Decorative top badge */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-brand-blue/5 to-transparent rounded-full -mr-10 -mt-10 pointer-events-none"></div>
      
      {/* Sound Controller and Status */}
      <div className="w-full flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-green"></span>
          </span>
          <span className="text-xs font-mono font-medium text-brand-muted">
            POOL: {validCandidates.length} AMBASSADORS ELIGIBLE
          </span>
        </div>
        
        <button
          onClick={handleMuteToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-100 bg-slate-50 hover:bg-slate-100 text-brand-dark transition-all text-xs font-medium cursor-pointer"
          title={muted ? "Unmute sound" : "Mute sound"}
        >
          {muted ? (
            <>
              <VolumeX size={14} className="text-rose-500" />
              <span>MUTED</span>
            </>
          ) : (
            <>
              <Volume2 size={14} className="text-brand-blue" />
              <span>SOUND ON</span>
            </>
          )}
        </button>
      </div>

      {/* Target Prize Header */}
      <div className="w-full text-center mb-8 bg-brand-light/50 border border-brand-blue/10 rounded-2xl p-4">
        {activePrize ? (
          <div>
            <span className="text-[10px] bg-brand-blue/10 text-brand-blue px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border border-brand-blue/10">
              NEXT UP FOR DRAW
            </span>
            <h3 className="text-xl font-heading font-extrabold text-brand-dark mt-2 tracking-tight flex items-center justify-center gap-2">
              <span className="text-2xl">🎁</span> {activePrize.title}
            </h3>
            <p className="text-xs text-brand-muted mt-1 max-w-md mx-auto">
              {activePrize.description} • Value class (₦{activePrize.cashValue.toLocaleString()})
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2">
            <AlertCircle className="text-amber-500 mb-1" size={24} />
            <p className="text-sm font-medium text-brand-dark">No Active Prize Selected!</p>
            <p className="text-xs text-brand-muted mt-0.5">Please purchase/select a reward tier on the sidebar first.</p>
          </div>
        )}
      </div>

      {/* Core Slot Spin Window */}
      <div className="relative w-full max-w-md h-[228px] overflow-hidden rounded-2xl border-4 border-[#0c2340] bg-slate-50 shadow-inner my-2 flex flex-col justify-center select-none">
        
        {/* Horizontal laser focus indicator overlay */}
        <div className="absolute inset-y-0 left-0 right-0 h-[76px] my-auto border-y-2 border-brand-blue bg-brand-blue/5 pointer-events-none z-10 flex justify-between items-center px-4">
          <div className="w-3.5 h-7 bg-brand-blue rounded-r-full shadow-lg -ml-[18px]"></div>
          <div className="w-3.5 h-7 bg-brand-blue rounded-l-full shadow-lg -mr-[18px]"></div>
        </div>

        {/* Vertical Fade Offsets */}
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none z-15"></div>
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-15"></div>

        {/* Rolling Tape Cylinder */}
        {reelNames.length > 0 ? (
          <motion.div
            ref={scope}
            className="flex flex-col w-full px-8 py-[76px]"
            style={{ y: 0 }}
          >
            {reelNames.map((p, idx) => (
              <div
                key={p.id}
                className="h-[76px] flex items-center justify-center py-1.5"
              >
                <div className="w-full bg-white rounded-xl border border-slate-100 hover:border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-sm">
                      {p.name.slice(0, 1)}
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="font-heading font-bold text-sm text-brand-dark leading-none truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-brand-muted font-mono leading-none mt-1">
                        {p.username}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] bg-brand-light font-mono px-2 py-0.5 rounded border border-slate-100 text-brand-blue">
                      Ambassador
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center text-brand-muted py-12 z-20">
            <Trophy size={40} className="stroke-[1.5] text-slate-300 animate-pulse" />
            <p className="text-xs font-semibold mt-2">NO CANDIDATES AVAILABLE</p>
            <p className="text-[10px] mt-0.5">Please add more active delegates to spin!</p>
          </div>
        )}
      </div>

      {/* Controller Buttons */}
      <div className="w-full max-w-sm mt-8 flex flex-col gap-3">
        <button
          onClick={triggerDraw}
          disabled={isDrawing || validCandidates.length === 0 || !activePrize}
          className={`w-full py-4 px-6 rounded-2xl font-heading font-extrabold text-base flex items-center justify-center gap-3 transition-all transform shadow-lg hover:shadow-xl cursor-pointer ${
            isDrawing
              ? "bg-slate-100 text-slate-400 border border-slate-200"
              : validCandidates.length === 0 || !activePrize
              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              : "bg-brand-blue hover:bg-blue-600 text-white border-2 border-[#123061]/10 hover:-translate-y-0.5 active:translate-y-0"
          }`}
        >
          {isDrawing ? (
            <>
              <RefreshCw className="animate-spin text-slate-400" size={20} />
              <span className="font-display tracking-wider">DRAWING WINNER...</span>
            </>
          ) : (
            <>
              <Sparkles size={20} className="text-brand-green" />
              <span className="font-display tracking-wide uppercase">
                SPIN DRAWER (₦{activePrize ? activePrize.cashValue.toLocaleString() : 0})
              </span>
            </>
          )}
        </button>

        {showCelebration && winner && (
          <div className="bg-emerald-50 border border-brand-green/35 rounded-2xl p-4 text-center mt-2 relative animate-ticket-glow">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-black font-display font-black text-[10px] px-3 py-1 rounded-full uppercase shadow">
              🎉 WINNER DRAWN 🎉
            </span>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mt-2">
              CONGRATULATIONS
            </p>
            <h4 className="text-2xl font-heading font-extrabold text-brand-dark tracking-tight mt-1">
              {winner.name}
            </h4>
            <p className="font-mono text-xs text-brand-blue mt-0.5">{winner.username}</p>
            <p className="text-sm mt-2 text-slate-700 bg-white/70 border border-brand-green/10 rounded-xl px-2 py-1.5 font-bold">
              Won: <span className="text-brand-green">{activePrize?.title}</span>
            </p>
          </div>
        )}
      </div>
      
    </div>
  );
}
