import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
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
    <div className="min-h-screen bg-[#F9FAFB] text-slate-800 flex flex-col justify-between selection:bg-[#0066FF]/10 select-none">
      
      {/* Dynamic Topbar Header with built-in Auth check */}
      <Topbar />

      <div className="max-w-xl mx-auto w-full px-4 py-8 md:py-12 flex-1 flex flex-col justify-center space-y-6 z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#0066FF]/5 border border-[#0066FF]/10 px-3.5 py-1.5 rounded-full shadow-[0_2px_8px_rgba(0,102,255,0.02)]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="font-mono text-[10px] tracking-widest text-[#0066FF] uppercase font-black">
              ATTENDEE LOOKUP PORTAL
            </span>
          </div>
          <h1 className="text-3xl font-heading font-black tracking-tight text-slate-900 uppercase pt-1">
            Raffle Ticket Finder
          </h1>
          <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
            Verify your unique ticket registration or lookup your lucky seat numbers in real-time.
          </p>
        </div>

        {/* Live Telemetry Banner (Cowrywise Palette) */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] relative overflow-hidden flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-black">
              RAFFLE REGISTRY POOL STATUS
            </p>
            <p className="text-3xl font-display font-black text-slate-900 mt-1 tracking-tight">
              <span className="text-[#10B981]">
                {tickets.length}
              </span>
              <span className="text-slate-300 font-normal"> / 401</span>{" "}
              <span className="text-xs font-sans text-slate-400 font-normal">Tickets Reserved</span>
            </p>
          </div>
          
          <div className="bg-emerald-50 text-[#10B981] border border-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-mono text-[9px] font-black uppercase">
            <Wifi size={10} className="animate-pulse" /> SYNCED
          </div>
        </div>

        {/* Search Deck Card (White Canvas with Beautiful Shadow) */}
        <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-5">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              id="lookup-search"
              placeholder="Search by your name or contact handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#0066FF] hover:border-slate-300 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0066FF]/5 transition-all font-medium"
            />
          </div>

          {/* Results list panel */}
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {searchQuery.trim() === "" ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <Ticket size={24} className="mx-auto text-slate-300 animate-bounce" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-350">Awaiting Search Input</p>
                <p className="text-[10px] lowercase text-slate-400 max-w-xs mx-auto">Type in your registered name to reveal your assigned digit.</p>
              </div>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((tk) => (
                <div
                  key={tk.id}
                  id={`ticket-card-${tk.ticketNumber}`}
                  className="bg-white border border-slate-100 hover:border-[#0066FF]/30 p-4 rounded-xl flex items-center justify-between gap-4 transition-all hover:shadow-[0_4px_18px_rgba(0,102,255,0.03)] hover:scale-[1.01] group"
                >
                  <div className="text-left overflow-hidden">
                    <h3 className="text-slate-900 font-heading font-black text-sm transition-colors truncate">
                      {tk.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate uppercase">
                      {tk.contact}
                    </p>
                    {tk.drawn && (
                      <span className="inline-flex items-center gap-1.5 mt-2 bg-emerald-50 border border-emerald-105 text-[#10B981] text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        <Trophy size={10} /> Won: {tk.prizeTitle || "Raffle Prize"}
                      </span>
                    )}
                  </div>

                  {/* Lucky Ticket Badge (Strictly Bounded 0-400) */}
                  <div className="shrink-0 flex flex-col items-center justify-center border-l border-slate-100 pl-4 h-12 min-w-[70px]">
                    <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest leading-none font-black">
                      TICKET ID
                    </span>
                    <span className="text-2xl font-display font-black text-[#0066FF] leading-none mt-1">
                      #{tk.ticketNumber.toString().padStart(3, "0")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 space-y-1.5 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-xs font-bold text-slate-500">NO TICKET REGISTERED</p>
                <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                  We couldn't locate any ticket linked to "{searchQuery}". Please reach out to the gate administrators at the LCC desk!
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <footer className="w-full text-center py-6 text-[10px] font-mono text-slate-400 select-none z-10 space-y-1 mt-auto border-t border-slate-50">
        <p>COWRYWISE COZY LIGHT WORKSPACE • SECURED SYSTEM</p>
        <p className="text-slate-350">© 2026 LAGOS LCC HANGOUT NOUN AMBASSADORS</p>
      </footer>
    </div>
  );
}
