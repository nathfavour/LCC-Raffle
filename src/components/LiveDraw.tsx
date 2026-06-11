import React, { useState, useEffect } from "react";
import { collection, doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { INITIAL_PRIZES } from "../data";
import { Trophy, Play, RefreshCw, Zap, Volume2, Award, Sparkles, AlertCircle, Sparkle } from "lucide-react";

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
    // Load default prizes or fetch from localStorage/Firebase if we want
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

  // Announcer commentary
  const [mcCommentary, setMcCommentary] = useState("VIBE CHECK! Select a prize tier below, and trigger the wheel to announce our next winner!");
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
      "Oya make some noise! {winner} has won the {prize}! Please hold your stashes tightly, Lekki monkeys are watching!",
      "Mad o! Double congratulations to {winner} for bagging the {prize}! Your savings on Cowrywise is paying off already!",
      "No caps! {winner} is walking home with {prize}! Lock this stashes on the Cowrywise app immediately and win compound interest!",
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
      alert(" RULING ERROR: There are no eligible, undrawn tickets in the active pool database!");
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
        // Delay grows exponentially based on progress cubic formula
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
    <div className="h-screen bg-[#000000] text-[#E2E8F0] overflow-hidden flex flex-col justify-between p-6 md:p-8 select-none relative">
      {/* Cinematic Background Atmosphere */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0066FF]/5 blur-3xl pointer-events-none rounded-full"></div>

      {/* Top Bar Branding Info */}
      <header className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#0066FF] animate-ping"></span>
          <div>
            <h1 className="text-sm font-heading font-black tracking-widest text-white uppercase">
              COWRYWISE PRESENTATION SCREEN
            </h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              Lagos LCC Canopy Hangout Draws 2026
            </p>
          </div>
        </div>

        <button
          onClick={handleResetPrizesStock}
          className="cursor-pointer font-mono text-[9px] text-slate-500 hover:text-white bg-[#0A0908] hover:bg-[#1E1B19] border border-[#23211F] px-3.5 py-1.5 rounded-full transition-all"
        >
          RESTOCK PRIZES
        </button>
      </header>

      {/* Center Cinematic Stage Panel */}
      <main className="flex-1 flex flex-col items-center justify-center py-6 z-10 max-w-4xl mx-auto w-full">
        
        <div className="w-full text-center space-y-10">
          
          {/* Active Target Prize Card Banner */}
          {selectedPrize && (
            <div className="inline-flex flex-col items-center space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                CURRENT DRAW PRIZE CATEGORY
              </span>
              <div className="bg-[#141211] border-2 border-[#23211F] px-6 py-2.5 rounded-2xl shadow-tactile-md flex items-center gap-3">
                <Trophy size={16} className="text-amber-400" />
                <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                  {selectedPrize.title}
                </h3>
                <span className="text-[10px] bg-[#0A0908] border border-[#23211F] px-2.5 py-0.5 rounded-full font-mono text-[#10B981] font-bold">
                  {selectedPrize.remaining} remain
                </span>
              </div>
            </div>
          )}

          {/* Cinematic Rapid Reel Component */}
          <div className="relative flex items-center justify-center">
            
            {/* Massive Tech Digital Outer Plate */}
            <div className={`w-72 h-72 rounded-full border-4 ${isRolling ? "border-[#0066FF] animate-neon-glow" : "border-[#23211F]"} bg-[#0A0908] flex flex-col items-center justify-center shadow-tactile-lg relative overflow-hidden transition-all duration-300`}>
              
              {/* Internal radar lines */}
              <div className="absolute inset-x-0 h-0.5 bg-[#23211F] top-1/2 -translate-y-1/2"></div>
              <div className="absolute inset-y-0 w-0.5 bg-[#23211F] left-1/2 -translate-x-1/2"></div>

              <div className="text-center z-10">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-none mb-3">
                  {isRolling ? "DECAYING..." : "POOL DIGIT"}
                </p>
                
                {/* Rolling Number */}
                <h2 className="text-7xl font-display font-black text-white tracking-wider leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  #{currentDisplayNum.toString().padStart(3, "0")}
                </h2>
              </div>

              {/* Edge Specular Highlights */}
              <div className="absolute top-2 w-36 h-0.5 bg-[#0066FF]/30 blur-xs rounded"></div>
            </div>

            {/* Glowing Orbit Rings */}
            <div className="absolute -inset-8 rounded-full border border-dashed border-[#23211F] animate-spin [animation-duration:45s] pointer-events-none"></div>
          </div>

          {/* Core Central Trigger Activation Button */}
          <div>
            <button
              onClick={handleStartDraw}
              disabled={isRolling || !selectedPrize}
              className="group cursor-pointer bg-[#0066FF] hover:bg-[#0055DD] text-white font-heading font-black text-sm uppercase tracking-widest px-14 py-5 rounded-2xl border-2 border-[#0066FF] shadow-tactile-lg active:translate-y-0.5 active:shadow-tactile-sm transition-all disabled:opacity-40"
            >
              {isRolling ? (
                <span className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                  Rolling Pool...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Play size={16} fill="white" /> SPIN CINEMATIC DRAW
                </span>
              )}
            </button>
          </div>

        </div>

      </main>

      {/* Lower Interactive Hype Commentary Audio Tip Bar */}
      <footer className="z-10 bg-[#0A0908] border-2 border-[#23211F] p-5 rounded-2xl max-w-2xl mx-auto w-full flex items-center gap-4 shadow-tactile-sm transition-all duration-300">
        <div className="w-10 h-10 rounded-xl bg-[#1E1B19] border border-[#23211F] flex items-center justify-center text-[#10B981] shrink-0">
          <Volume2 size={18} className="animate-pulse" />
        </div>
        <div className="text-left flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono tracking-widest text-[#10B981] uppercase font-bold">
              MC STAGE SOUNDBOARD
            </span>
            {isAiPowered && (
              <span className="text-[8px] bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 px-2 py-0.2 rounded uppercase font-mono font-bold font-sans">
                ✨ Gemini AI
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 font-sans italic truncate max-w-[500px]">
            "{mcCommentary}"
          </p>
        </div>
      </footer>

      {/* Available prizes grid selector shelves */}
      <div className="w-full max-w-4xl mx-auto mt-6 border-t-2 border-[#23211F] pt-4 flex flex-wrap items-center justify-center gap-3 pb-2 z-10">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest w-full text-center mb-1">
          Draw Prize Category Shelves
        </span>
        {prizes.map((p) => {
          const isSelected = selectedPrize?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => !isRolling && setSelectedPrize(p)}
              disabled={isRolling}
              className={`cursor-pointer px-4 py-2 rounded-xl border-2 text-[11px] font-bold transition-all ${
                isSelected
                  ? "border-[#0066FF] bg-[#141211] text-white"
                  : "border-[#23211F] bg-[#0A0908] text-slate-400 hover:border-[#23211F]/80 hover:text-white"
              }`}
            >
              {p.title} ({p.remaining} left)
            </button>
          );
        })}
      </div>

      {/* Cinematic Full-screen Victory Celebration Overlay */}
      {showCelebration && winnerTicket && (
        <div className="fixed inset-0 bg-[#000000] flex flex-col items-center justify-center z-50 p-6 animate-fade-in relative">
          
          {/* Confetti flashing effects */}
          <div className="fixed top-20 left-20 w-80 h-80 bg-[#10B981]/15 blur-[100px] rounded-full animate-pulse"></div>
          <div className="fixed bottom-20 right-20 w-80 h-80 bg-[#0066FF]/15 blur-[100px] rounded-full animate-pulse"></div>

          <div className="w-full max-w-2xl text-center space-y-12 z-10">
            
            {/* Victory Badge */}
            <div className="inline-flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/30 px-4 py-2 rounded-full animate-bounce">
              <Trophy size={16} className="text-[#10B981] animate-spin" />
              <span className="font-mono text-xs tracking-widest text-[#10B981] uppercase font-black">
                WE HAVE A WINNER!
              </span>
            </div>

            {/* Winner Spotlight Card */}
            <div className="bg-[#141211] border-4 border-[#10B981] p-10 md:p-14 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] max-w-xl mx-auto space-y-6 transform scale-105 duration-300">
              
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                  LUCKY WINNER CLAIMED
                </span>
                <h1 className="text-4xl md:text-5xl font-heading font-black text-[#10B981] tracking-tight uppercase leading-none pt-2 animate-pulse">
                  {winnerTicket.name}
                </h1>
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest pt-1">
                  CONTACT: {winnerTicket.contact}
                </p>
              </div>

              <div className="border-t-2 border-[#23211F] pt-6 flex justify-around items-center gap-4">
                
                <div className="text-left">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                    DRAWN PRIZE
                  </span>
                  <span className="text-sm font-heading font-black text-white uppercase tracking-wide">
                    {selectedPrize?.title}
                  </span>
                </div>

                <div className="text-right border-l-2 border-[#23211F] pl-6">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                    TICKET POOL ID
                  </span>
                  <span className="text-4xl font-display font-black text-white tracking-widest leading-none block pt-1">
                    #{winnerTicket.ticketNumber.toString().padStart(3, "0")}
                  </span>
                </div>

              </div>

            </div>

            {/* Soundboard commentary line highlighting */}
            <div className="bg-[#0A0908] border-2 border-[#23211F] p-6 rounded-2xl max-w-lg mx-auto text-center space-y-2 relative">
              <p className="text-[9px] font-mono text-[#10B981] tracking-widest uppercase font-bold">
                📢 MC COMMENTARY SHOUTOUT
              </p>
              {commentaryLoading ? (
                <p className="text-xs text-slate-500 font-mono italic animate-pulse">Generating hilarious hype line...</p>
              ) : (
                <p className="text-sm text-slate-200 font-sans font-medium italic select-all">
                  "{mcCommentary}"
                </p>
              )}
            </div>

            {/* Dismissal Action button */}
            <div className="pt-2">
              <button
                onClick={() => setShowCelebration(false)}
                className="cursor-pointer bg-[#0A0908] hover:bg-[#1E1B19] text-slate-300 hover:text-white font-heading font-bold text-xs uppercase tracking-widest px-10 py-4 rounded-xl border-2 border-[#23211F] transition-all shadow-tactile-sm"
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
