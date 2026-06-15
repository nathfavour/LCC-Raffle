import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Search, Trophy, Ticket, Wifi } from "lucide-react";
import Topbar from "./Topbar";

interface TicketData {
  id: string;
  ticketNumber: number;
  name: string;
  contact: string;
  assignedAt: any;
  drawn: boolean;
  prizeTitle?: string;
}

export default function PublicLookup() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  // Read tickets in real-time from Firestore
  useEffect(() => {
    const q = query(collection(db, "tickets"), orderBy("ticketNumber", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ticketList: TicketData[] = [];
        snapshot.forEach((doc) => {
          ticketList.push({ id: doc.id, ...doc.data() } as TicketData);
        });
        setTickets(ticketList);
        setIsOnline(true);
      },
      (error) => {
        console.error("Firestore loading failed:", error);
        setIsOnline(false);
        handleFirestoreError(error, OperationType.GET, "tickets");
      }
    );
    return () => unsubscribe();
  }, []);

  // Filter tickets dynamically as attendee types
  const filteredTickets = tickets.filter((tk) => {
    const term = searchQuery.toLowerCase().trim();
    if (term === "") return false;
    return (
      tk.name.toLowerCase().includes(term) ||
      tk.contact.toLowerCase().includes(term) ||
      tk.ticketNumber.toString() === term
    );
  });

  return (
    <div className="min-h-screen bg-[#000000] text-[#E2E8F0] flex flex-col justify-between selection:bg-[#0066FF]/20 select-none animate-fade-in">
      
      {/* Dynamic Topbar Header with built-in Auth check */}
      <Topbar />

      <div className="max-w-xl mx-auto w-full px-4 py-8 md:py-12 flex-1 flex flex-col justify-center space-y-6 z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#0066FF]/10 border border-[#0066FF]/20 px-3.5 py-1.5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="font-mono text-[10px] tracking-widest text-[#0066FF] uppercase font-black">
              ATTENDEE LOOKUP PORTAL
            </span>
          </div>
          <h1 className="text-3xl font-heading font-black tracking-tight text-white uppercase pt-1">
            Raffle Ticket Finder
          </h1>
          <p className="text-xs text-[#9B9691] font-medium max-w-sm mx-auto leading-relaxed">
            Verify your unique ticket registration or lookup your lucky seat numbers in real-time.
          </p>
        </div>

        {/* Live Telemetry Banner (Cowrywise Palette) */}
        <div className="bg-[#141211] border border-[#23211F] p-5 rounded-2xl shadow-tactile-md relative overflow-hidden flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] font-mono tracking-wider text-[#9B9691] uppercase font-black">
              RAFFLE REGISTRY POOL STATUS
            </p>
            <p className="text-3xl font-display font-black text-white mt-1 tracking-tight">
              <span className="text-[#10B981]">
                {tickets.length}
              </span>
              <span className="text-[#23211F] font-normal"> / 401</span>{" "}
              <span className="text-xs font-sans text-[#9B9691] font-normal">Tickets Reserved</span>
            </p>
          </div>
          
          <div className="bg-emerald-950/20 text-[#10B981] border border-[#10B981]/25 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-mono text-[9px] font-black uppercase">
            <Wifi size={10} className="animate-pulse" /> SYNCED
          </div>
        </div>

        {/* Search Deck Card (Dark Chrome with Tactile Borders) */}
        <div className="bg-[#141211] border border-[#23211F] p-6 md:p-8 rounded-3xl shadow-tactile-lg space-y-5">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9B9691] pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              id="lookup-search"
              placeholder="Search by your name or contact handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B0A09] border border-[#23211F] focus:border-[#0066FF] hover:border-[#1E1B19] rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-[#9B9691] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/10 transition-all font-medium"
            />
          </div>

          {/* Results list panel */}
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {searchQuery.trim() === "" ? (
              <div className="text-center py-10 text-[#9B9691] space-y-2">
                <Ticket size={24} className="mx-auto text-[#0066FF]/80 animate-bounce" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#9B9691]">Awaiting Search Input</p>
                <p className="text-[10px] text-white/50 max-w-xs mx-auto">Type in your registered name to reveal your assigned digit.</p>
              </div>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((tk) => (
                <div
                  key={tk.id}
                  id={`ticket-card-${tk.ticketNumber}`}
                  className="bg-[#0B0A09] border border-[#23211F] hover:border-[#0066FF]/40 p-4 rounded-xl flex items-center justify-between gap-4 transition-all hover:scale-[1.01] group"
                >
                  <div className="text-left overflow-hidden">
                    <h3 className="text-white font-heading font-black text-sm transition-colors truncate">
                      {tk.name}
                    </h3>
                    <p className="text-[10px] text-[#9B9691] font-mono mt-0.5 truncate uppercase">
                      {tk.contact}
                    </p>
                    {tk.drawn && (
                      <span className="inline-flex items-center gap-1.5 mt-2 bg-emerald-950/20 border border-emerald-500/25 text-[#10B981] text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        <Trophy size={10} /> Won: {tk.prizeTitle || "Raffle Prize"}
                      </span>
                    )}
                  </div>

                  {/* Lucky Ticket Badge (Strictly Bounded 0-400) */}
                  <div className="shrink-0 flex flex-col items-center justify-center border-l border-[#23211F] pl-4 h-12 min-w-[70px]">
                    <span className="text-[8px] font-mono text-[#9B9691] uppercase tracking-widest leading-none font-black">
                      TICKET ID
                    </span>
                    <span className="text-2xl font-display font-black text-[#0066FF] leading-none mt-1">
                      #{tk.ticketNumber.toString().padStart(3, "0")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-[#9B9691] space-y-1.5 border border-dashed border-[#23211F] rounded-xl bg-[#0B0A09]">
                <p className="text-xs font-bold text-white/90">NO TICKET REGISTERED</p>
                <p className="text-[10px] text-[#9B9691] max-w-[280px] mx-auto leading-relaxed">
                  We couldn't locate any ticket linked to "{searchQuery}". Please reach out to the gate administrators at the LCC desk!
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <footer className="w-full text-center py-8 text-[10px] font-mono text-[#9B9691] select-none z-10 space-y-1 mt-auto border-t border-[#23211F]">
        <p>COWRYWISE COZY PITCH-DARK WORKSPACE • SECURED SYSTEM</p>
        <p className="text-[#9B9691]/80">© 2026 LAGOS LCC HANGOUT NOUN AMBASSADORS</p>
      </footer>
    </div>
  );
}
