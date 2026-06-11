import React, { useState, useEffect } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { INITIAL_PRIZES } from "../data";
import { Trophy, Play, Volume2, Sparkles, Award } from "lucide-react";
import Topbar from "./Topbar";
import ParticleSphere3D from "./ParticleSphere3D";

interface TicketData {
  id: string;
  ticketNumber: number;
  name: string;
  contact: string;
  assignedAt: any;
  drawn: boolean;
  prizeTitle?: string;
}

interface PrizeData {
  id: string;
  title: string;
  count: number;
  remaining: number;
  cashValue: number;
}

export default function LiveDraw() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [prizes, setPrizes] = useState<PrizeData[]>(() => {
    return INITIAL_PRIZES.map((p) => ({
      id: p.id,
      title: p.title,
      count: p.count,
      remaining: p.remaining,
      cashValue: p.cashValue
    }));
  });

  const [selectedPrize, setSelectedPrize] = useState<PrizeData | null>(null);

  // Reel Rolling States
  const [isRolling, setIsRolling] = useState(false);
  const [currentDisplayNum, setCurrentDisplayNum] = useState(0);
  const [winnerTicket, setWinnerTicket] = useState<TicketData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Announcer commentary states
  const [mcCommentary, setMcCommentary] = useState(
    "CHAI! VIBE CHECK! Pick a massive prize category tier below, and hit SPIN to initiate the live virtual draw!"
  );
  const [isAiPowered, setIsAiPowered] = useState(false);
  const [commentaryLoading, setCommentaryLoading] = useState(false);

  // Read registered tickets in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tickets"), (snapshot) => {
      const ticketList: TicketData[] = [];
      snapshot.forEach((doc) => {
        ticketList.push({ id: doc.id, ...doc.data() } as TicketData);
      });
      setTickets(ticketList);
    });
    return () => unsubscribe();
  }, []);

  // Pre-select first prize if none set
  useEffect(() => {
    if (!selectedPrize && prizes.length > 0) {
      setSelectedPrize(prizes[0]);
    }
  }, [prizes, selectedPrize]);

  // Trigger Gemini Hype Commentary
  const fetchMcCommentary = async (winnerName: string, prizeTitle: string) => {
    setCommentaryLoading(true);
    setMcCommentary("");
    try {
      const response = await fetch("/api/mc-hype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerName: winnerName,
          prizeTitle: prizeTitle,
          characterName: "MC Kaydee",
          characterRole: "The Golden Voice & Hype Leader"
        })
      });
      const data = await response.json();
      if (data.success && data.commentary) {
        setMcCommentary(data.commentary);
        setIsAiPowered(true);
      } else {
        fallbackCommentary(winnerName, prizeTitle);
      }
    } catch (e) {
      console.warn("Proxy api offline, falling back locally.", e);
      fallbackCommentary(winnerName, prizeTitle);
    } finally {
      setCommentaryLoading(false);
    }
  };

  const fallbackCommentary = (winnerName: string, prizeTitle: string) => {
    const templates = [
      "Oya make some noise! {winner} has won the {prize}! Run and lock this stash in your Cowrywise app immediately, Lekki monkeys are watching!",
      "Mad o! Double congratulations to {winner} for bagging the {prize}! Your savings discipline is paying off already!",
      "Compound interest standard! {winner} is walking home with {prize}! Lock this stash now on Cowrywise!",
    ];
    const picked = templates[Math.floor(Math.random() * templates.length)];
    setMcCommentary(picked.replace("{winner}", winnerName).replace("{prize}", prizeTitle));
    setIsAiPowered(false);
  };

  // Live Draw Sequence
  const handleStartDraw = async () => {
    if (isRolling || !selectedPrize) return;

    // Filter available tickets (drawn: false)
    const eligibleTickets = tickets.filter((tk) => !tk.drawn);

    if (eligibleTickets.length === 0) {
      alert("⚠️ RULING ERROR: There are no eligible, undrawn tickets in the active pool database!");
      return;
    }

    setIsRolling(true);
    setShowCelebration(false);
    setWinnerTicket(null);
    setMcCommentary("HOLD YOUR BREATH! DRUMROLL COMMENCING... PLS PRAY FOR YOUR STASH!");

    // 1. Select target winner immediately in background
    const randomIndex = Math.floor(Math.random() * eligibleTickets.length);
    const targetWinner = eligibleTickets[randomIndex];

    // 2. Cinematic spin variables
    const duration = 3500; // total duration: 3.5 seconds
    const startTime = Date.now();
    const initialDelay = 15; // fast start velocity
    let sequentialCycleNum = 0;

    const runReel = async () => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= duration) {
        // --- STOPPING REEL: Land precisely on the target winner ---
        setCurrentDisplayNum(targetWinner.ticketNumber);
        setWinnerTicket(targetWinner);
        setIsRolling(false);
        setShowCelebration(true);

        // 3. Mark winner as drawn in Firestore
        try {
          const docRef = doc(db, "tickets", targetWinner.id);
          await updateDoc(docRef, {
            drawn: true,
            drawnAt: new Date().toISOString(),
            prizeTitle: selectedPrize.title
          });

          // Decrement current local prizes stock
          setPrizes((prev) =>
            prev.map((p) =>
              p.id === selectedPrize.id ? { ...p, remaining: Math.max(0, p.remaining - 1) } : p
            )
          );
        } catch (e) {
          console.error("Firestore update failed:", e);
        }

        // 4. Fetch MC Commentary shouts
        await fetchMcCommentary(targetWinner.name, selectedPrize.title);

      } else {
        // --- ROLLING: calculate visual exponential decay progress ---
        const progress = elapsed / duration;
        const currentDelay = initialDelay + Math.pow(progress, 3) * 550;

        // Sequence cycle sequential numbers (0 to 400)
        sequentialCycleNum = (sequentialCycleNum + 7) % 401; // offsets of 7 cycle rapidly
        setCurrentDisplayNum(sequentialCycleNum);

        setTimeout(runReel, currentDelay);
      }
    };

    // Begin recursion loop
    runReel();
  };

  const handleResetPrizesStock = () => {
    if (!window.confirm("Do you want to restock all prize quantities?")) return;
    setPrizes(
      INITIAL_PRIZES.map((p) => ({
        id: p.id,
        title: p.title,
        count: p.count,
        remaining: p.remaining,
        cashValue: p.cashValue
      }))
    );
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#E2E8F0] flex flex-col justify-between select-none">
      
      {/* Dynamic Topbar Header with built-in Auth check */}
      <Topbar />

      {/* Primary Cinematic Content Stage */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 py-8 md:py-12 max-w-4xl mx-auto w-full space-y-8 z-10">
        
        {/* Active Target Prize Banner card */}
        {selectedPrize && (
          <div className="inline-flex flex-col items-center space-y-1.5 animate-fade-in">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#9B9691] font-black">
              ACTIVE RAFFLE STASH
            </span>
            <div className="bg-[#141211] border border-[#23211F] rounded-2xl shadow-tactile-md px-6 py-3 flex items-center gap-3 animate-neon-glow">
              <Trophy size={16} className="text-[#10B981] fill-[#10B981]" />
              <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                {selectedPrize.title}
              </h3>
            </div>
          </div>
        )}

        {/* Cinematic 3D Particle Spinning Sphere */}
        <div className="relative flex items-center justify-center w-full">
          {/* Edge Ambient shadow glowing aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#0066FF]/8 blur-[70px] rounded-full pointer-events-none"></div>

          <ParticleSphere3D
            isRolling={isRolling}
            currentDisplayNum={currentDisplayNum}
            winnerTicketNumber={winnerTicket ? winnerTicket.ticketNumber : null}
          />
        </div>

        {/* Large Spin Execution Trigger Button */}
        <div className="w-full text-center">
          <button
            onClick={handleStartDraw}
            disabled={isRolling || !selectedPrize}
            className="group cursor-pointer bg-[#0066FF] hover:bg-[#0055DD] text-white font-heading font-black text-xs uppercase tracking-widest px-14 py-4.5 rounded-2xl border-2 border-[#0066FF] shadow-tactile-lg active:translate-y-0.5 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            {isRolling ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                POOLED GENERATION...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <Play size={14} fill="white" /> SPIN DECISION WHEEL
              </span>
            )}
          </button>
        </div>

      </main>

      {/* MC Commentary Ambient Tip Bar (Dark Mode) */}
      <div className="px-4 pb-6 w-full">
        <footer className="bg-[#141211] border border-[#23211F] p-4 rounded-2xl max-w-2xl mx-auto w-full flex items-center gap-4 shadow-tactile-md">
          <div className="w-10 h-10 rounded-xl bg-[#0B0A09] border border-[#23211F] flex items-center justify-center text-[#10B981] shrink-0">
            <Volume2 size={18} className="animate-pulse" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-mono tracking-widest text-[#10B981] uppercase font-bold">
                MC STAGE MICROPHONE
              </span>
              {isAiPowered && (
                <span className="text-[8px] bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 px-2 py-0.2 rounded uppercase font-mono font-bold">
                  ✨ Gemini AI
                </span>
              )}
            </div>
            <p className="text-xs text-[#E2E8F0] font-sans italic truncate">
              "{mcCommentary}"
            </p>
          </div>
        </footer>
      </div>

      {/* Available prizes grid selector shelves */}
      <div className="w-full max-w-4xl mx-auto border-t border-[#23211F] bg-[#141211]/90 backdrop-blur-md py-5 flex flex-wrap items-center justify-center gap-2.5 px-4 z-10 shadow-sm">
        <div className="w-full flex items-center justify-between px-3 mb-2">
          <span className="text-[10px] font-mono text-[#9B9691] uppercase tracking-widest font-black">
            SELECT DRAW TARGET CATEGORY
          </span>
        </div>
        
        {prizes.map((p) => {
          const isSelected = selectedPrize?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => !isRolling && setSelectedPrize(p)}
              disabled={isRolling}
              className={`cursor-pointer px-4 py-2 rounded-xl border text-[11px] font-bold tracking-wider transition-all uppercase ${
                isSelected
                  ? "border-[#0066FF] bg-[#0066FF]/15 text-[#0066FF] shadow-sm font-black"
                  : "border-[#23211F] bg-[#0B0A09] text-[#9B9691] hover:border-[#1E1B19] hover:text-[#FFFFFF]"
              }`}
            >
              {p.title}
            </button>
          );
        })}
      </div>

      {/* Cinematic Full-screen Victory Celebration Overlay */}
      {showCelebration && winnerTicket && (
        <div className="fixed inset-0 bg-[#000000]/96 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-6 animate-fade-in selection:bg-[#0066FF]/20">
          
          {/* Soft background ambient gradients */}
          <div className="fixed top-20 left-20 w-80 h-80 bg-[#10B981]/10 blur-[100px] rounded-full animate-pulse"></div>
          <div className="fixed bottom-20 right-20 w-80 h-80 bg-[#0066FF]/10 blur-[100px] rounded-full animate-pulse"></div>

          <div className="w-full max-w-2xl text-center space-y-10 z-10">
            
            {/* Victory Badge */}
            <div className="inline-flex items-center gap-2 bg-[#10B981]/15 border border-[#10B981]/20 px-4 py-2 rounded-full animate-bounce">
              <Trophy size={16} className="text-[#10B981] animate-spin" />
              <span className="font-mono text-xs tracking-widest text-[#10B981] uppercase font-black">
                WE HAVE A WINNER!
              </span>
            </div>

            {/* Winner Spotlight Card (Dark Base with Success Glow) */}
            <div className="bg-[#141211] border-2 border-[#10B981] p-10 md:p-12 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] max-w-xl mx-auto space-y-6 transform scale-105 duration-300">
              
              <div className="space-y-1">
                <span className="text-xs font-mono text-[#9B9691] uppercase tracking-widest">
                  LUCKY WINNER DECLARED
                </span>
                <h1 className="text-4xl md:text-5xl font-heading font-black text-[#10B981] tracking-tight uppercase leading-none pt-2">
                  {winnerTicket.name}
                </h1>
                <p className="text-xs font-mono text-white/70 uppercase tracking-widest pt-1">
                  CONTACT: {winnerTicket.contact}
                </p>
              </div>

              <div className="border-t border-[#23211F] pt-6 flex justify-around items-center gap-4 text-left">
                
                <div>
                  <span className="text-[10px] font-mono text-[#9B9691] uppercase tracking-wider block">
                    DRAWN PRIZE
                  </span>
                  <span className="text-sm font-heading font-semibold text-white uppercase tracking-wide">
                    {selectedPrize?.title}
                  </span>
                </div>

                <div className="border-l border-[#23211F] pl-6 text-right">
                  <span className="text-[10px] font-mono text-[#9B9691] uppercase tracking-wider block">
                    TICKET POOL ID
                  </span>
                  <span className="text-4xl font-display font-black text-white tracking-widest leading-none block pt-1">
                    #{winnerTicket.ticketNumber.toString().padStart(3, "0")}
                  </span>
                </div>

              </div>

            </div>

            {/* Soundboard commentary line highlighting (Dark Card) */}
            <div className="bg-[#141211] border border-[#23211F] p-6 rounded-2xl max-w-lg mx-auto text-center space-y-2 shadow-tactile-md">
              <p className="text-[9px] font-mono text-[#10B981] tracking-widest uppercase font-bold">
                📢 MC COMMENTARY SHOUTOUT
              </p>
              {commentaryLoading ? (
                <p className="text-xs text-[#9B9691] font-mono italic animate-pulse">Generating hilarious hype line...</p>
              ) : (
                <p className="text-sm text-white/90 font-sans font-medium italic">
                  "{mcCommentary}"
                </p>
              )}
            </div>

            {/* Dismissal Action button */}
            <div className="pt-2">
              <button
                onClick={() => setShowCelebration(false)}
                className="cursor-pointer bg-[#0066FF] hover:bg-[#0055DD] text-white font-heading font-black text-xs uppercase tracking-widest px-10 py-4.5 rounded-xl border-2 border-[#0066FF] shadow-tactile-lg transition-all"
              >
                RETURN TO PREVIEW STAGE
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
