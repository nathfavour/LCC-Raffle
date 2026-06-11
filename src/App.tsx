import React, { useState, useEffect } from "react";
import { Participant, Prize, DrawHistory, MCCharacter } from "./types";
import { INITIAL_PARTICIPANTS, INITIAL_PRIZES, MC_CHARACTERS } from "./data";
import DashboardStats from "./components/DashboardStats";
import SlotSpinner from "./components/SlotSpinner";
import PrizeManager from "./components/PrizeManager";
import ParticipantManager from "./components/ParticipantManager";
import WinnersList from "./components/WinnersList";
import MCAnnouncer from "./components/MCAnnouncer";
import { Sparkles, Award, Wallet, Clock, RotateCcw, ShieldCheck, Heart, Leaf } from "lucide-react";

export default function App() {
  // --- Persistent States from LocalStorage ---
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem("cw_noun_participants");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return INITIAL_PARTICIPANTS;
  });

  const [prizes, setPrizes] = useState<Prize[]>(() => {
    const saved = localStorage.getItem("cw_noun_prizes");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return INITIAL_PRIZES;
  });

  const [history, setHistory] = useState<DrawHistory[]>(() => {
    const saved = localStorage.getItem("cw_noun_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [];
  });

  // Active configurations
  const [activePrize, setActivePrize] = useState<Prize | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedMc, setSelectedMc] = useState<MCCharacter>(MC_CHARACTERS[0]);
  
  // Custom states for the announcer speech syncing
  const [lastWinner, setLastWinner] = useState<Participant | null>(null);
  const [lastPrize, setLastPrize] = useState<Prize | null>(null);
  const [mcCommentary, setMcCommentary] = useState("Welcome to LCC Cowrywise NOUN Ambassadors Hangout draws! Select a prize on the right, and spin to get our first saving champion!");
  const [isAiPowered, setIsAiPowered] = useState(false);

  // Time tracker for event agenda
  const [currentTime, setCurrentTime] = useState("");

  // Save states to localStorage on changes
  useEffect(() => {
    localStorage.setItem("cw_noun_participants", JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem("cw_noun_prizes", JSON.stringify(prizes));
  }, [prizes]);

  useEffect(() => {
    localStorage.setItem("cw_noun_history", JSON.stringify(history));
  }, [history]);

  // Handle active class selection on initial load if none set
  useEffect(() => {
    if (!activePrize && prizes.length > 0) {
      const firstAvailable = prizes.find(p => p.remaining > 0);
      if (firstAvailable) {
        setActivePrize(firstAvailable);
      }
    }
  }, [prizes, activePrize]);

  // Real-time clock implementation for event coordinator
  useEffect(() => {
    const tick = () => {
      const date = new Date();
      setCurrentTime(date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Complete Draw logic ---
  const handleDrawComplete = (winner: Participant) => {
    if (!activePrize) return;

    // 1. Mark participant as having won
    setParticipants(prev =>
      prev.map(p => (p.id === winner.id ? { ...p, won: true, wonPrizeId: activePrize.id } : p))
    );

    // 2. Subtract quantity from active prize
    setPrizes(prev =>
      prev.map(p => (p.id === activePrize.id ? { ...p, remaining: Math.max(0, p.remaining - 1) } : p))
    );

    // 3. Update the temporary states for MC trigger update
    setLastWinner(winner);
    setLastPrize(activePrize);

    // 4. Record draw history
    const historyEntry: DrawHistory = {
      id: `draw-${Date.now()}`,
      timestamp: Date.now(),
      winner: { ...winner, won: true, wonPrizeId: activePrize.id },
      prize: { ...activePrize, remaining: activePrize.remaining - 1 },
      mcCommentary: mcCommentary
    };

    setHistory(prev => [...prev, historyEntry]);

    // 5. Update local activePrize selection state so it reflects the decremented value
    setActivePrize(prev => (prev && prev.id === activePrize.id ? { ...prev, remaining: Math.max(0, prev.remaining - 1) } : prev));
  };

  // --- Reset Entire Raffle Status ---
  const handleResetEntirePool = () => {
    if (isDrawing) return;
    const confirmReset = window.confirm("Are you sure you want to completely RESET the draw history? This will clear all winners, restore all prize stashes, and make everyone eligible again.");
    if (!confirmReset) return;

    // Reset won flags on participants
    setParticipants(prev => prev.map(p => ({ ...p, won: false, wonPrizeId: undefined })));
    
    // Restore prize stashes remaining limits to starting total
    setPrizes(prev => prev.map(p => ({ ...p, remaining: p.count })));
    
    // Clear history
    setHistory([]);

    // Clear announcer
    setLastWinner(null);
    setLastPrize(null);
    setMcCommentary("Welcome back! The raffle stashes has been completely restocked. Get ready to draw brand new winners!");
    setIsAiPowered(false);

    // Reset target prize selection
    const firstAvailable = INITIAL_PRIZES[0];
    if (firstAvailable) {
      setActivePrize(firstAvailable);
    }
  };

  const handleResetToDefaultPool = () => {
    if (isDrawing) return;
    const confirmReset = window.confirm("Do you want to reset our entire Ambassador list back to the default 20 pre-populated NOUN ambassadors? This clean overwrite any newly imported participants!");
    if (!confirmReset) return;

    setParticipants(INITIAL_PARTICIPANTS);
  };

  return (
    <div id="cowrywise-raffle-workspace" className="min-h-screen bg-[#f4f7fe] selection:bg-brand-blue/20 selection:text-brand-dark flex flex-col justify-between py-6 md:py-10">
      
      {/* Decorative floral or leafy geometric ornaments mimicking Lekki Conservation vibes (light theme friendly) */}
      <div className="fixed top-20 left-0 w-44 h-96 bg-brand-green/5 blur-3xl rounded-r-full pointer-events-none -ml-20"></div>
      <div className="fixed bottom-20 right-0 w-44 h-96 bg-brand-blue/5 blur-3xl rounded-l-full pointer-events-none -mr-20"></div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 space-y-6 flex-1">
        
        {/* UPPER MAIN HEADER CARD */}
        <header className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-premium flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle green savings plant watermark */}
          <div className="absolute right-0 bottom-0 w-48 h-48 bg-radial from-brand-green/10 to-transparent rounded-full translate-x-12 translate-y-12 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            {/* Dynamic Shield/Medal Logo */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-blue to-teal-400 p-0.5 shadow-md flex items-center justify-center animate-float shrink-0">
              <div className="w-full h-full bg-[#f4f7fe]/95 rounded-2xl flex flex-col items-center justify-center font-extrabold select-none">
                <span className="text-xl leading-none text-brand-blue font-heading -mb-1">C</span>
                <span className="text-[10px] leading-none text-brand-green font-display font-extrabold tracking-widest">W</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-[10px] font-mono font-bold bg-brand-green/15 text-emerald-800 border border-brand-green/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  LCC Lagos Hangout 2026
                </span>
                <span className="text-[10px] font-mono font-bold bg-brand-blue/10 text-brand-blue border border-brand-blue/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  NOUN Chapter
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-brand-dark tracking-tight mt-1.5 leading-tight">
                Cowrywise NOUN Ambassadors Raffle
              </h1>
              <p className="text-sm text-brand-muted mt-1 max-w-xl font-medium">
                The ultimate drawing portal for savings, hoodies, and premium stashes allocated to Cowrywise university delegates at the Lekki hangout.
              </p>
            </div>
          </div>

          {/* Clock stats widget */}
          <div className="flex items-center gap-4 bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl shrink-0">
            <div className="text-right">
              <span className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider font-mono">
                EVENT LOCAL TIME
              </span>
              <span className="text-lg font-display font-bold text-[#0c2340]">
                {currentTime || "00:00:00 AM"}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
              <Clock size={20} />
            </div>
          </div>
        </header>

        {/* METRICS STATS SUMMARY BAR */}
        <DashboardStats participants={participants} prizes={prizes} />

        {/* MIDDLE STAGE AREA (Grid layout) */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main draw column (Left, spanning 7 columns) */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            
            {/* The slot spinner core view */}
            <SlotSpinner
              participants={participants}
              activePrize={activePrize}
              onDrawComplete={handleDrawComplete}
              isDrawing={isDrawing}
              setIsDrawing={setIsDrawing}
            />

            {/* Interactive commentary hypesPerson announcer */}
            <MCAnnouncer
              lastWinner={lastWinner}
              lastPrize={lastPrize}
              selectedMc={selectedMc}
              setSelectedMc={setSelectedMc}
              isDrawing={isDrawing}
              mcCommentary={mcCommentary}
              setMcCommentary={setMcCommentary}
              isAiPowered={isAiPowered}
              setIsAiPowered={setIsAiPowered}
            />
            
          </section>

          {/* Configuration & lists column (Right, spanning 5 columns) */}
          <section className="lg:col-span-5 flex flex-col gap-6 h-full">
            
            {/* Prize list category selector */}
            <PrizeManager
              prizes={prizes}
              setPrizes={setPrizes}
              activePrize={activePrize}
              setActivePrize={setActivePrize}
              isDrawing={isDrawing}
            />

            {/* Ambassadors directory list and bulk inputs */}
            <ParticipantManager
              participants={participants}
              setParticipants={setParticipants}
              isDrawing={isDrawing}
              onResetToDefault={handleResetToDefaultPool}
            />

          </section>
        </main>

        {/* BOTTOM TIMELINE HISTORICAL ARCHIVE & CONTROL CHECKS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Winners timelines (full left span) */}
          <div className="lg:col-span-8">
            <WinnersList
              history={history}
              onClearHistory={handleResetEntirePool}
              isDrawing={isDrawing}
            />
          </div>

          {/* Quick controls disclaimer card (right span) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-150 p-6 shadow-sm flex flex-col justify-between h-full min-h-[220px]">
            <div>
              <h3 className="text-sm font-heading font-extrabold text-[#0c2340] flex items-center gap-2 mb-2">
                <ShieldCheck className="text-brand-green shrink-0" size={18} />
                Host Security Safeguards
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                All participant details, raffle inventory limits, and winner chronologies are automatically cached in your browser. Refreshing of browser tabs or live sharing will not loose drawn statistics.
              </p>
              
              <div className="mt-4 bg-[#f4f7fe]/50 border border-slate-100 rounded-xl p-3 text-[10px] text-brand-muted leading-normal">
                📍 <strong>LCC Hangout Rule:</strong> Drawn participants are automatically marked as "Won" and bypassed in successive slots to guarantee everybody gets equal reward chance!
              </div>
            </div>

            <button
              onClick={handleResetEntirePool}
              disabled={isDrawing || history.length === 0}
              className="w-full mt-5 py-3 text-xs font-heading font-extrabold bg-[#fcf8f8] hover:bg-rose-50/50 text-rose-500 hover:text-rose-600 border border-rose-100 disabled:opacity-40 rounded-xl cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} /> Full Restock & Reset Timeline
            </button>
          </div>

        </div>

      </div>

      {/* LOWER FOOTER */}
      <footer className="w-full text-center py-8 px-4 text-[11px] font-mono font-medium text-brand-muted border-t border-slate-100 mt-16 flex flex-col sm:flex-row items-center justify-center gap-3 select-none">
        <span className="flex items-center gap-1">
          Made with <Heart size={10} className="fill-rose-500 text-rose-500 animate-pulse" /> for NOUN Cowrywise Ambassadors
        </span>
        <span className="hidden sm:inline text-slate-300">|</span>
        <span className="flex items-center gap-1 text-[#0c2340]">
          <Leaf size={11} className="text-emerald-500" /> Lekki Conservation Centre Hangouts • Lekki Lagos, Nigeria
        </span>
      </footer>

    </div>
  );
}
