import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Search, Trophy, Ticket, Sparkles, Wifi } from "lucide-react";

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
      }
    );
    return () => unsubscribe();
  }, []);

  // Filter tickets dynamically as attendee types
  const filteredTickets = tickets.filter((tk) => {
    const term = searchQuery.toLowerCase();
    return (
      tk.name.toLowerCase().includes(term) ||
      tk.contact.toLowerCase().includes(term) ||
      tk.ticketNumber.toString() === term
    );
  });

  return (
    <div className="min-h-screen bg-[#000000] text-[#E2E8F0] px-4 py-8 md:py-12 flex flex-col justify-between selection:bg-[#0066FF]/30 selection:text-white">
      {/* Background Ornaments */}
      <div className="fixed top-1/4 left-1/4 w-72 h-72 bg-[#0066FF]/5 blur-3xl rounded-full pointer-events-none"></div>
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-[#10B981]/5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center space-y-6 z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#0A0908] border border-[#23211F] px-3.5 py-1.5 rounded-full shadow-tactile-sm">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="font-mono text-[10px] tracking-widest text-[#10B981] uppercase font-bold">
              PUBLIC LOOKUP PORTAL
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-white uppercase pt-1">
            Raffle Ticket Finder
          </h1>
          <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
            Verify your unique ticket registration or lookup your lucky seat numbers in real-time.
          </p>
        </div>

        {/* Live Telemetry Banner */}
        <div className="bg-[#0A0908] border border-[#23211F] p-4 rounded-xl shadow-tactile-md text-center group transition-colors hover:border-[#10B981]/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 font-mono text-[8px] text-[#10B981]/60 flex items-center gap-1">
            <Wifi size={10} className="animate-pulse" /> SYNCED
          </div>
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            Raffle Registry Pool Status
          </p>
          <p className="text-3xl font-display font-black text-white mt-1.5 tracking-tight">
            <span className="text-[#10B981] drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]">
              {tickets.length}
            </span>
            <span className="text-slate-600 font-normal"> / 401</span>{" "}
            <span className="text-xs font-sans text-slate-400 font-normal">Tickets Claimed</span>
          </p>
        </div>

        {/* Search Deck Card */}
        <div className="bg-[#141211] border border-[#23211F] p-5 md:p-6 rounded-2xl shadow-tactile-lg space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
              <Search size={18} />
            </span>
            <input
              type="text"
              id="lookup-search"
              placeholder="Enter your name or contact handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0908] border-2 border-[#23211F] focus:border-[#0066FF] hover:border-[#23211F]/80 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white font-display placeholder-slate-500 focus:outline-none transition-all"
            />
          </div>

          {/* Results State */}
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {searchQuery.trim() === "" ? (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <Ticket size={28} className="mx-auto text-slate-700 animate-float" />
                <p className="text-xs font-medium">Type to lookup your assigned ticket info</p>
              </div>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((tk) => (
                <div
                  key={tk.id}
                  id={`ticket-card-${tk.ticketNumber}`}
                  className="bg-[#0A0908] border-2 border-[#23211F] p-4 rounded-xl flex items-center justify-between gap-4 transition-all hover:bg-[#1E1B19] group hover:border-[#0066FF]/40 shadow-tactile-sm"
                >
                  <div className="text-left overflow-hidden">
                    <h3 className="text-[#E2E8F0] font-heading font-black text-sm group-hover:text-white transition-colors truncate">
                      {tk.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate uppercase">
                      {tk.contact}
                    </p>
                    {tk.drawn && (
                      <span className="inline-flex items-center gap-1.5 mt-2 bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        <Trophy size={10} /> Won: {tk.prizeTitle || "Raffle Prize"}
                      </span>
                    )}
                  </div>

                  {/* Lucky Ticket Badge (Strictly Bounded 0-400) */}
                  <div className="shrink-0 flex flex-col items-center justify-center border-l-2 border-[#23211F] pl-4 h-12">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none">
                      TICKET
                    </span>
                    <span className="text-2xl font-display font-black text-[#10B981] leading-none mt-1 animate-neon-glow px-2 rounded">
                      #{tk.ticketNumber.toString().padStart(3, "0")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 space-y-2">
                <p className="text-xs">No matching tickets found in pool.</p>
                <p className="text-[10px] text-slate-600 font-mono">Check spelling or ask the entry gatekeeper administrator.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <footer className="w-full text-center py-6 text-[10px] font-mono text-slate-600 select-none z-10 space-y-1">
        <p>OPENBRICKS 2.0 • HIGH-SECURITY DIGITAL SANCTUARY</p>
        <p className="text-slate-700">© 2026 EVENT CONCERT COWRYWISE AMBASSADORS</p>
      </footer>
    </div>
  );
}
