import React, { useState, useEffect } from "react";
import { collection, doc, onSnapshot, setDoc, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
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

export default function LiveDraw() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [prizes, setPrizes] = useState<any[]>(INITIAL_PRIZES);
  const [selectedPrize, setSelectedPrize] = useState<any | null>(INITIAL_PRIZES[0]);

  // Cinematic state
  const [isRolling, setIsRolling] = useState(false);
  const [currentDisplayNum, setCurrentDisplayNum] = useState(0);
  const [winnerTicket, setWinnerTicket] = useState<TicketData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Authenticated state
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Sound effects commentary
  const [mcCommentary, setMcCommentary] = useState("COWRYWISE LCC DRAW ACTIVE. CHOOSE A PRIZE CATEGORY AND PREPARE!");
  const [commentaryLoading, setCommentaryLoading] = useState(false);
  const [isAiPowered, setIsAiPowered] = useState(false);

  // Real-time server variables
  const [lastSpinId, setLastSpinId] = useState<string | null>(null);

  // Load admins and evaluate Auth
  useEffect(() => {
    let isMounted = true;
    async function loadAuthAndAdmins() {
      try {
        const res = await fetch("/api/admins");
        const data = await res.json();
        if (data.success && data.admins && isMounted) {
          const loadedAdmins = data.admins.map((e: string) => e.toLowerCase());
          onAuthStateChanged(auth, (currentUser) => {
            if (!isMounted) return;
            setUser(currentUser);
            if (currentUser?.email) {
              setIsAdmin(loadedAdmins.includes(currentUser.email.toLowerCase()));
            } else {
              setIsAdmin(false);
            }
          });
        }
      } catch (err) {
        console.warn("Auth config failed in LiveDraw:", err);
      }
    }
    loadAuthAndAdmins();
    return () => { isMounted = false; };
  }, []);

  // Sync tickets list real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tickets"), (snapshot) => {
      const list: TicketData[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as TicketData);
      });
      setTickets(list);
    }, (error) => {
      console.error("Tickets listener fail:", error);
    });
    return () => unsub();
  }, []);

  // Real-time Shared Drawing Watcher
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "drawState"), async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const { activeSpinId, isRolling: serverIsRolling, winnerId, prizeTitle, prizeId } = data;

      if (serverIsRolling && activeSpinId && activeSpinId !== lastSpinId) {
        setLastSpinId(activeSpinId);

        // Map target prize locally
        const targetPrize = prizes.find(p => p.id === prizeId) || { id: prizeId, title: prizeTitle, remaining: 1 } as any;
        setSelectedPrize(targetPrize);

        // Run coordinate local deceleration simulation
        triggerLocalSpinSeq(winnerId, targetPrize, activeSpinId);
      }
    }, (error) => {
      console.warn("drawState observer subscription denied or restricted:", error);
    });
    return () => unsub();
  }, [prizes, lastSpinId, tickets, isAdmin]);

  const fallbackHype = (winnerName: string, prizeTitle: string) => {
    const templates = [
      "BOOM! {winner} just secured `{prize}`! LAGOS HANGOUT HAS ERUPTED!",
      "INCREDIBLE SCENE! `{prize}` crowned directly to {winner}! Double your hustle!",
      "GIVE THEM ROOM! {winner} is walking home with `{prize}` under their belt!",
      "HOLY MOUNT! Congratulate {winner}! The raffle gods have favored you today!"
    ];
    const picked = templates[Math.floor(Math.random() * templates.length)];
    setMcCommentary(picked.replace("{winner}", winnerName).replace("{prize}", prizeTitle));
    setIsAiPowered(false);
  };

  const fetchMcCommentary = async (winnerName: string, prizeTitle: string) => {
    setCommentaryLoading(true);
    try {
      const res = await fetch("/api/mc-hype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerName, prizeTitle })
      });
      const data = await res.json();
      if (data.success && data.hype) {
        setMcCommentary(data.hype);
        setIsAiPowered(true);
      } else {
        throw new Error();
      }
    } catch {
      fallbackHype(winnerName, prizeTitle);
    } finally {
      setCommentaryLoading(false);
    }
  };

  // Coordinated Local Spin Animation Execution
  const triggerLocalSpinSeq = async (winnerId: string, spPrize: any, spinId: string) => {
    setIsRolling(true);
    setShowCelebration(false);
    setWinnerTicket(null);
    setMcCommentary("HOLD YOUR BREATH! COORDINATED MOTION INITIALIZED... SECURING TARGET!");

    // Search target occupant ticket
    let targetWinner = tickets.find((tk) => tk.id === winnerId);

    // Dynamic fallback fetch straight from database in case indexing is behind
    if (!targetWinner) {
      try {
        const ticketSnap = await getDocs(collection(db, "tickets"));
        const tempTickets: TicketData[] = [];
        ticketSnap.forEach((d) => {
          tempTickets.push({ id: d.id, ...d.data() } as TicketData);
        });
        targetWinner = tempTickets.find((tk) => tk.id === winnerId);
      } catch (err) {
        console.warn("Direct query fallback failed:", err);
      }
    }

    if (!targetWinner) {
      targetWinner = {
        id: winnerId,
        ticketNumber: parseInt(winnerId.replace(/\D/g, "")) || Math.floor(Math.random() * 100),
        name: winnerId === "guest_sim_id" ? "Preseeded Holder" : "LCC Attendee Holder",
        contact: "Active Cohort Participant",
        assignedAt: new Date().toISOString(),
        drawn: true
      };
    }

    // Kinematic velocity loop properties
    const duration = 3500;
    const startTime = Date.now();
    const initialDelay = 15;
    let sequentialCycleNum = 0;

    const runReel = async () => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= duration) {
        // Halt on designated synchronized candidate
        setCurrentDisplayNum(targetWinner!.ticketNumber);
        setWinnerTicket(targetWinner!);
        setIsRolling(false);
        setShowCelebration(true);

        // Visually clear prize count
        setPrizes((prev) =>
          prev.map((p) =>
            p.id === spPrize.id ? { ...p, remaining: Math.max(0, p.remaining - 1) } : p
          )
        );

        // WRITE-BACK SEQUENCE: Only administrative clients commit state updates to Firestore to lock database concurrency!
        if (isAdmin) {
          try {
            // Update ticket drawn category
            await setDoc(doc(db, "tickets", targetWinner!.id), {
              drawn: true,
              drawnAt: new Date().toISOString(),
              prizeTitle: spPrize.title
            }, { merge: true });

            // Seed spin log audit entry
            await setDoc(doc(db, "spins", spinId), {
              timestamp: new Date().toISOString(),
              prizeTitle: spPrize.title,
              winnerTicketNumber: targetWinner!.ticketNumber,
              winnerName: targetWinner!.name,
              status: "valid"
            });

            // Re-set master draw state
            await setDoc(doc(db, "config", "drawState"), {
              isRolling: false
            }, { merge: true });

          } catch (writeErr) {
            console.error("Administrative logs write-back failed:", writeErr);
          }
        }

        // Generate commentary shouts
        await fetchMcCommentary(targetWinner!.name, spPrize.title);

      } else {
        const progress = elapsed / duration;
        const currentDelay = initialDelay + Math.pow(progress, 3) * 550;
        sequentialCycleNum = (sequentialCycleNum + 7) % 401;
        setCurrentDisplayNum(sequentialCycleNum);

        setTimeout(runReel, currentDelay);
      }
    };

    runReel();
  };

  // Administration-Only spin launcher
  const handleStartDraw = async () => {
    if (isRolling || !selectedPrize) return;

    if (!isAdmin) {
      alert("❌ SECURITY ACCESS RESTRICTED: Only authorized administrators can start standard spins.");
      return;
    }

    // Filter undrawn candidates
    const eligibleTickets = tickets.filter((tk) => !tk.drawn);

    if (eligibleTickets.length === 0) {
      alert("⚠️ DATA ERROR: Standard Registry is empty or has been entirely drawn! No valid candidates left.");
      return;
    }

    const randomIndex = Math.floor(Math.random() * eligibleTickets.length);
    const targetWinner = eligibleTickets[randomIndex];

    const activeSpinId = `SPIN-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().substring(8)}`;

    try {
      // Stream state block to database to trigger all spectator channels simultaneously
      await setDoc(doc(db, "config", "drawState"), {
        activeSpinId,
        isRolling: true,
        winnerId: targetWinner.id,
        prizeTitle: selectedPrize.title,
        prizeId: selectedPrize.id,
        timestamp: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Firestore coordination triggers rejected:", err);
      handleFirestoreError(err, OperationType.WRITE, "config/drawState");
    }
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
    <div className="min-h-screen bg-[#000000] text-[#E2E8F0] flex flex-col justify-between select-none pb-24 md:pb-6">
      
      {/* Dynamic Topbar */}
      <Topbar />

      {/* Main Cinematic Content Stage */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 py-8 md:py-12 max-w-4xl mx-auto w-full space-y-8 z-10">
        
        {/* Active Prize Tag */}
        {selectedPrize && (
          <div className="inline-flex flex-col items-center space-y-1.5 animate-fade-in text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#9B9691] font-black">
              ACTIVE RAFFLE STASH
            </span>
            <div className="bg-[#141211] border border-[#23211F] px-5 py-2.5 rounded-full flex items-center gap-2">
              <Award size={15} className="text-[#10B981]" />
              <p className="text-white text-xs font-heading font-black tracking-wide uppercase">
                {selectedPrize.title} ({selectedPrize.remaining} / {selectedPrize.count} LEFT)
              </p>
            </div>
          </div>
        )}

        {/* Cinematic Display Core Section */}
        <div className="relative w-full flex items-center justify-center min-h-[300px]">
          
          {/* Futuristic Glowing Backdrop Circle */}
          <div className="absolute w-72 h-72 rounded-full bg-emerald-500/5 blur-[80px] z-0 animate-pulse"></div>

          {/* Interactive Particle Sphere Canvas background */}
          <div className="absolute inset-0 flex items-center justify-center z-0 scale-75 overflow-hidden">
            <ParticleSphere3D
              isRolling={isRolling}
              currentDisplayNum={currentDisplayNum}
              winnerTicketNumber={winnerTicket ? winnerTicket.ticketNumber : null}
            />
          </div>

          {/* Real-time Rolling Number Ring */}
          <div className="relative z-10 flex flex-col items-center space-y-1 text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#9B9691] font-black tracking-[0.2em] animate-pulse">
              SECTOR REEL COWRYWISE
            </span>
            <h1 className="text-8xl md:text-9xl font-display font-black text-white tracking-widest tabular-nums select-none drop-shadow-2xl">
              {currentDisplayNum.toString().padStart(3, "0")}
            </h1>
            <p className="text-[10px] font-mono text-[#10B981] font-black uppercase tracking-widest">
              LAGOS AMBASSADORS CODE Registry
            </p>
          </div>

        </div>

        {/* Large Spin Execution Trigger Button */}
        <div className="w-full text-center space-y-2">
          <button
            onClick={handleStartDraw}
            disabled={isRolling || !selectedPrize}
            className={`group cursor-pointer font-heading font-black text-xs uppercase tracking-widest px-14 py-4.5 rounded-2xl border-2 shadow-tactile-lg active:translate-y-0.5 transition-all disabled:opacity-50 ${
              !isAdmin 
                ? "bg-[#0A0908] border-[#23211F] text-slate-500 hover:text-slate-400 cursor-not-allowed" 
                : "bg-[#0066FF] hover:bg-[#0055DD] text-white border-[#0066FF]"
            }`}
          >
            {isRolling ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping"></span>
                POOLED GENERATION...
              </span>
            ) : !isAdmin ? (
              <span className="flex items-center justify-center gap-2">
                🔒 ADMIN LOCK ACTIVE
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <Play size={14} fill="currentColor" /> SPIN DECISION WHEEL
              </span>
            )}
          </button>
          
          {!isAdmin && (
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Accessible view only. Spins are coordinated in real-time by administrators.
            </p>
          )}
        </div>

        {/* Prize Selector Deck */}
        <div className="w-full space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-[#23211F]">
            <p className="text-[10px] font-mono text-[#9B9691] uppercase tracking-widest font-black">
              Select target prize category:
            </p>
            {isAdmin && (
              <button
                onClick={handleResetPrizesStock}
                className="cursor-pointer text-[9px] font-mono text-slate-500 hover:text-red-400 uppercase transition-colors"
              >
                Reset Stock Count
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {prizes.map((p) => {
              const isSelected = selectedPrize?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => !isRolling && setSelectedPrize(p)}
                  disabled={isRolling}
                  className={`cursor-pointer px-4.5 py-4 rounded-xl border text-[10px] font-heading font-black tracking-wider transition-all uppercase text-center flex flex-col justify-between gap-1 ${
                    isSelected
                      ? "border-[#0066FF] bg-[#0066FF]/10 text-[#0066FF] font-black"
                      : "border-[#23211F] bg-[#0B0A09] text-[#9B9691] hover:border-[#23211F] hover:bg-[#141211] hover:text-white"
                  }`}
                >
                  <span className="truncate w-full">{p.title}</span>
                  <span className="text-[8px] font-mono text-slate-500 block uppercase">
                    {p.remaining} / {p.count} LEFT
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </main>

      {/* Cinematic Full-screen Victory Celebration Overlay */}
      {showCelebration && winnerTicket && (
        <div className="fixed inset-0 bg-[#000000]/96 backdrop-blur-2xl flex flex-col items-center justify-center z-50 p-6 animate-fade-in selection:bg-[#0066FF]/20">
          
          <div className="fixed top-20 left-20 w-80 h-80 bg-[#10B981]/10 blur-[100px] rounded-full animate-pulse"></div>
          <div className="fixed bottom-20 right-20 w-80 h-80 bg-[#0066FF]/10 blur-[100px] rounded-full animate-pulse"></div>

          <div className="w-full max-w-2xl text-center space-y-10 z-10">
            
            <div className="inline-flex items-center gap-2 bg-[#10B981]/15 border border-[#10B981]/20 px-4 py-2 rounded-full animate-bounce">
              <Trophy size={16} className="text-[#10B981] animate-spin" />
              <span className="font-mono text-xs tracking-widest text-[#10B981] uppercase font-black">
                WE HAVE A WINNER!
              </span>
            </div>

            {/* Winner Spotlight Card */}
            <div className="bg-[#141211] border-2 border-[#10B981] p-10 md:p-12 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] max-w-xl mx-auto space-y-6 transform scale-105 duration-300">
              
              <div className="space-y-1">
                <span className="text-xs font-mono text-[#9B9691] uppercase tracking-widest">
                  LUCKY WINNER DECLARED
                </span>
                <h1 className="text-4xl md:text-5xl font-heading font-black text-[#10B981] tracking-tight uppercase leading-none pt-2 font-black">
                  {winnerTicket.name}
                </h1>
                <p className="text-xs font-mono text-white/70 uppercase tracking-widest pt-1">
                  CONTACT: {winnerTicket.contact}
                </p>
              </div>

              <div className="border-t border-[#23211F] pt-6 flex justify-around items-center gap-4 text-left">
                
                <div className="max-w-[150px]">
                  <span className="text-[10px] font-mono text-[#9B9691] uppercase tracking-wider block">
                    DRAWN PRIZE
                  </span>
                  <span className="text-xs font-heading font-extrabold text-white uppercase tracking-wide">
                    {selectedPrize?.title}
                  </span>
                </div>

                <div className="border-l border-[#23211F] pl-6 text-right">
                  <span className="text-[10px] font-mono text-[#9B9691] uppercase tracking-wider block">
                    TICKET POOL ID
                  </span>
                  <span className="text-4xl font-display font-black text-white tracking-widest leading-none block pt-1 font-black">
                    #{winnerTicket.ticketNumber.toString().padStart(3, "0")}
                  </span>
                </div>

              </div>

            </div>

            {/* Soundboard commentary line */}
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

            {/* Dismissal button */}
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
