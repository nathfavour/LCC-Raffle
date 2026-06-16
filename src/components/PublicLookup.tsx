import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Search, Trophy, Ticket, Wifi, ArrowLeft, User, MoreVertical, Trash2, AlertTriangle, Loader2 } from "lucide-react";
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

  // Administrative Check States
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Administrative Drawer Interactive Controls
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerTicket, setDrawerTicket] = useState<TicketData | null>(null);
  const [activeTab, setActiveTab] = useState<"inspect" | "delete">("inspect");
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmedDel, setIsConfirmedDel] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Showcase state for full-screen ticket layout
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  // Fetch administrator lookup status
  useEffect(() => {
    let isMounted = true;
    async function checkAdminStatus() {
      try {
        const res = await fetch("/api/admins");
        const data = await res.json();
        if (data.success && data.admins && isMounted) {
          const loadedAdmins = data.admins.map((e: string) => e.toLowerCase());
          
          onAuthStateChanged(auth, (currentUser) => {
            if (!isMounted) return;
            setUser(currentUser);
            if (currentUser?.email) {
              const matched = loadedAdmins.includes(currentUser.email.toLowerCase());
              setIsAdmin(matched);
            } else {
              setIsAdmin(false);
            }
          });
        }
      } catch (err) {
        console.error("Could not load admins config on discovery:", err);
      }
    }
    checkAdminStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle immediate administrative delete action execution
  const handleExecuteDelete = async () => {
    if (!drawerTicket) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "tickets", drawerTicket.id));
      setShowDrawer(false);
      setIsConfirmedDel(false);
      setDeleteConfirmInput("");
    } catch (err) {
      console.error("Failed to revoke/delete ticket allocation:", err);
      handleFirestoreError(err, OperationType.DELETE, `tickets/${drawerTicket.id}`);
    } finally {
      setIsDeleting(false);
    }
  };

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

  // Reset to first page whenever search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Clean up and normalize WhatsApp number to standard 11 digits (0 + last 10 digits)
  const cleanFormatContact = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 10) {
      return "0" + digits.slice(-10);
    }
    return raw.trim();
  };

  // Filter tickets dynamically as attendee types
  const filteredTickets = tickets.filter((tk) => {
    const term = searchQuery.toLowerCase().trim();
    if (term === "") return true; // Natural list display (all tickets match when no search is typed)
    
    // Check standard matches first
    const matchStandard = (
      tk.name.toLowerCase().includes(term) ||
      tk.contact.toLowerCase().includes(term) ||
      tk.ticketNumber.toString().includes(term)
    );

    if (matchStandard) return true;

    // Check fallback for phone number variants (e.g. searching 2349019775509 matches 09019775509)
    const hasDigits = /\d/.test(searchQuery);
    if (hasDigits) {
      const normalizedQuery = cleanFormatContact(searchQuery);
      const normalizedTkContact = cleanFormatContact(tk.contact || "");
      if (normalizedTkContact.includes(normalizedQuery) || normalizedQuery.includes(normalizedTkContact)) {
        return true;
      }
    }

    return false;
  });

  // Pagination calculation
  const totalItems = filteredTickets.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const isSearching = searchQuery.trim() !== "";

  return (
    <div className="min-h-screen bg-[#000000] text-[#E2E8F0] flex flex-col justify-between selection:bg-[#0066FF]/20 select-none animate-fade-in relative">
      
      {/* Dynamic Topbar Header with built-in Auth check */}
      <Topbar />

      <div className="max-w-xl mx-auto w-full px-4 py-8 md:py-12 flex-1 flex flex-col justify-center space-y-6 z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#0066FF]/10 border border-[#0066FF]/25 px-3.5 py-1.5 rounded-full shadow-sm">
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

          {/* Registry Title Label */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-mono text-[#9B9691] uppercase tracking-wider font-bold">
              {isSearching ? `Matched ticket search results` : `Browse Ticket Pool Catalog (${startIndex + 1} - ${Math.min(startIndex + ITEMS_PER_PAGE, totalItems)})`}
            </span>
            <span className="text-[10px] font-mono text-[#9B9691]">
              {totalItems} FOUND
            </span>
          </div>

          {/* Results list panel */}
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((tk) => (
                <div
                  key={tk.id}
                  id={`ticket-card-${tk.ticketNumber}`}
                  onClick={() => setSelectedTicket(tk)}
                  className="bg-[#0B0A09] border border-[#23211F] hover:border-[#0066FF] p-4 rounded-xl flex items-center justify-between gap-4 transition-all hover:scale-[1.01] group cursor-pointer text-left"
                >
                  <div className="text-left overflow-hidden flex-1">
                    <h3 className="text-white font-heading font-black text-sm transition-colors truncate">
                      {tk.name}
                    </h3>
                    <p className="text-[10px] text-[#9B9691] font-mono mt-0.5 truncate uppercase">
                      {tk.contact}
                    </p>
                    {tk.drawn && (
                      <span className="inline-flex items-center gap-1.5 mt-2 bg-emerald-950/20 border border-emerald-500/25 text-[#10B981] text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        <Trophy size={10} /> Won: {tk.prizeTitle || "Raffle Prize"}
                      </span>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    {/* Admin Options Icon Trigger for interactive Bottom Drawer */}
                    {isAdmin && (
                      <button
                        id={`ticket-options-btn-${tk.ticketNumber}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDrawerTicket(tk);
                          setActiveTab("inspect");
                          setDeleteConfirmInput("");
                          setIsConfirmedDel(false);
                          setShowDrawer(true);
                        }}
                        className="p-2.5 text-[#9B9691] hover:text-white hover:bg-[#1E1B19] border border-[#23211F] hover:border-[#0066FF] rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                        title="Admin Controls"
                      >
                        <MoreVertical size={14} />
                      </button>
                    )}

                    {/* Lucky Ticket Badge (Strictly Bounded 0-400) */}
                    <div className="shrink-0 flex flex-col items-center justify-center border-l border-[#23211F] pl-4 h-12 min-w-[70px]">
                      <span className="text-[8px] font-mono text-[#9B9691] uppercase tracking-widest leading-none font-black">
                        TICKET ID
                      </span>
                      <span className="text-2xl font-display font-black text-[#0066FF] leading-none mt-1 group-hover:text-white transition-colors">
                        #{tk.ticketNumber.toString().padStart(3, "0")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-[#9B9691] space-y-1.5 border border-dashed border-[#23211F] rounded-xl bg-[#0B0A09]">
                <p className="text-xs font-bold text-white/90">NO RECORD FOUND</p>
                <p className="text-[10px] text-[#9B9691] max-w-[280px] mx-auto leading-relaxed">
                  We couldn't locate any ticket corresponding to "{searchQuery}". Please reach out to the gate administrators!
                </p>
              </div>
            )}
          </div>

          {/* Sleek Pagination Deck */}
          {!isSearching && totalPages > 1 && (
            <div className="pt-4 border-t border-[#23211F] flex items-center justify-between">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="cursor-pointer px-4 py-2.5 rounded-xl border border-[#23211F] bg-[#030302] text-[10px] font-mono text-[#9B9691] hover:text-white disabled:opacity-35 disabled:hover:text-[#9B9691] transition-all disabled:cursor-not-allowed"
              >
                PREVIOUS
              </button>
              <span className="text-[10px] font-mono text-[#9B9691] uppercase tracking-wider">
                PAGE <b className="text-white font-black font-mono">{currentPage}</b> OF <b className="text-white font-black font-mono">{totalPages}</b>
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="cursor-pointer px-4 py-2.5 rounded-xl border border-[#23211F] bg-[#030302] text-[10px] font-mono text-[#9B9691] hover:text-white disabled:opacity-35 disabled:hover:text-[#9B9691] transition-all disabled:cursor-not-allowed"
              >
                NEXT
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Full-Screen Decoupled Single-Ticket Overlay View (Renders on top with pure blackout background) */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-[#000000] z-[100] flex flex-col items-center justify-center p-6 overflow-y-auto select-none animate-fade-in">
          
          {/* Pitch-Dark background abstract light filters */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#0066FF]/10 blur-[130px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#10B981]/10 blur-[130px] rounded-full pointer-events-none"></div>

          <div className="w-full max-w-md relative z-10 space-y-10 flex flex-col items-center justify-center">
            
            {/* Logo Brand Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0066FF]/10 border border-[#0066FF]/30 flex items-center justify-center text-[#0066FF]">
                <Ticket size={14} />
              </div>
              <div className="text-left">
                <h2 className="text-xs font-heading font-black text-white uppercase tracking-tight leading-none">
                  COWRY LOUNGE
                </h2>
                <span className="text-[8px] font-mono font-bold text-[#10B981] uppercase tracking-widest block pt-0.5 leading-none">
                  LCC HANGOUT 2026
                </span>
              </div>
            </div>

            {/* Custom Skeuomorphic Ticket Machine Frame */}
            <div className="w-full bg-[#141211] border-2 border-[#23211F] rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.1),1px_1px_0px_#23211F,2px_2px_0px_#1E1B19,3px_3px_0px_#161412,4px_4px_0px_#0A0908,5px_5px_0px_#000000] transition-all duration-300">
              
              {/* Ticket Top Ribbon */}
              <div className="bg-[#0B0A09] px-6 py-5 border-b border-[#23211F] flex items-center justify-between">
                <span className="text-[9px] font-mono tracking-widest text-[#9B9691] uppercase font-bold">
                  VALID ENTRY PASSPORT
                </span>
                <div className="bg-[#10B981]/15 border border-[#10B981]/25 text-[#10B981] text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-lg uppercase">
                  VERIFIED POOL
                </div>
              </div>

              {/* Ticket Main Chamber Body */}
              <div className="p-8 relative space-y-6 text-left">
                
                {/* Physical ticket punch holes */}
                <div className="absolute -left-3.5 top-1/2 -mt-3.5 w-7 h-7 rounded-full bg-[#000000] border-r-2 border-[#23211F] z-10"></div>
                <div className="absolute -right-3.5 top-1/2 -mt-3.5 w-7 h-7 rounded-full bg-[#000000] border-l-2 border-[#23211F] z-10"></div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-[#9B9691] uppercase tracking-widest block font-black">
                    CANDIDATE HOLDER
                  </span>
                  <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight leading-none pt-1 font-black">
                    {selectedTicket.name}
                  </h1>
                  <p className="text-[10px] font-mono text-[#9B9691] uppercase tracking-widest pt-1">
                    Contact Id: <span className="text-white font-bold">{selectedTicket.contact}</span>
                  </p>
                </div>

                {/* Ticket separation line */}
                <div className="py-2">
                  <div className="border-t border-dashed border-[#23211F]"></div>
                </div>

                <div className="flex justify-between items-end gap-4">
                  
                  <div className="space-y-1 flex-1">
                    <span className="text-[9px] font-mono text-[#9B9691] uppercase tracking-widest block font-black">
                      SECTOR LOCATION
                    </span>
                    <span className="text-xs font-heading font-black text-white uppercase tracking-wider block">
                      Lagos Cohort (LCC)
                    </span>
                    <span className="text-[8px] font-mono text-slate-500 block uppercase pt-0.5">
                      {selectedTicket.assignedAt ? `Assigned At: ${new Date(selectedTicket.assignedAt).toLocaleDateString()}` : "Active Status Seat"}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-mono text-[#9B9691] uppercase tracking-widest block leading-none pb-1">
                      ASSIGNED ID
                    </span>
                    <span className="text-5xl font-display font-black text-[#0066FF] leading-none tracking-tight">
                      #{selectedTicket.ticketNumber.toString().padStart(3, "0")}
                    </span>
                  </div>

                </div>

                {/* Drawn Gift Trophy Showcase */}
                {selectedTicket.drawn && (
                  <div className="bg-emerald-950/15 border border-emerald-500/20 p-4.5 rounded-2xl flex items-center gap-3 mt-4">
                    <div className="w-8.5 h-8.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/35 flex items-center justify-center text-[#10B981] shrink-0">
                      <Trophy size={14} className="animate-bounce" />
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] font-mono text-[#10B981] uppercase tracking-widest font-black leading-none">
                        CROWNED WINNER
                      </p>
                      <p className="text-sm font-heading font-black text-white uppercase tracking-tight mt-1 leading-none">
                        {selectedTicket.prizeTitle || "COMMUNITY PRIZE"}
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Ticket Footer hash ID */}
              <div className="bg-[#0B0A09] px-6 py-4.5 border-t border-[#23211F] text-center">
                <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-none">
                  SECURE VERIFIER ID STATUS : {selectedTicket.id}
                </p>
              </div>

            </div>

            {/* Cancel/Dismiss tactile control */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedTicket(null)}
                className="cursor-pointer border-2 border-[#23211F] bg-[#0B0A09] hover:bg-[#131110] text-[#9B9691] hover:text-white font-heading font-black text-xs uppercase tracking-widest px-11 py-4 rounded-2xl shadow-tactile-lg transition-all active:translate-y-0.5 flex items-center gap-2"
              >
                <ArrowLeft size={13} /> Cancel & return to lists
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Administrative Bottom Drawer */}
      {showDrawer && drawerTicket && (
        <div className="fixed inset-0 z-50 flex items-end justify-center select-none">
          {/* Backdrop */}
          <div 
            onClick={() => {
              if (!isDeleting) {
                setShowDrawer(false);
                setIsConfirmedDel(false);
                setDeleteConfirmInput("");
              }
            }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xs transition-opacity duration-300"
          ></div>
          
          {/* Main Bottom Drawer Shell (max 50% height) */}
          <div className="w-full max-w-xl bg-[#141211] border-t-2 border-l border-r border-[#23211F] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.9)] z-10 flex flex-col max-h-[50vh] transition-all duration-300 transform translate-y-0 relative">
            
            {/* Drawer Drag handle indicator */}
            <div className="w-12 h-1 bg-[#23211F] rounded-full mx-auto my-3 shrink-0"></div>

            {/* Header section */}
            <div className="px-6 pb-4 border-b border-[#23211F] flex items-center justify-between shrink-0">
              <div className="text-left">
                <span className="text-[9px] font-mono tracking-widest text-[#10B981] uppercase font-black">
                  ADMINISTRATIVE SUITE
                </span>
                <h3 className="text-sm font-heading font-black text-white uppercase tracking-tight">
                  Ticket Control • #{drawerTicket.ticketNumber.toString().padStart(3, "0")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDrawer(false);
                  setIsConfirmedDel(false);
                  setDeleteConfirmInput("");
                }}
                className="p-1 px-3.5 bg-[#0B0A09] hover:bg-[#1E1B19] border border-[#23211F] rounded-xl text-[#9B9691] hover:text-white text-xs font-mono tracking-wider transition-colors cursor-pointer"
              >
                CLOSE
              </button>
            </div>

            {/* Tabs for switching between Inspect and Delete */}
            <div className="flex bg-[#0B0A09] border-b border-[#23211F] text-xs font-mono shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("inspect");
                  setIsConfirmedDel(false);
                  setDeleteConfirmInput("");
                }}
                className={`flex-1 py-3 text-center border-b-2 font-black transition-all cursor-pointer ${
                  activeTab === "inspect"
                    ? "border-[#0066FF] text-white bg-[#141211]"
                    : "border-transparent text-[#9B9691] hover:text-white"
                }`}
              >
                INSPECT DETAILS
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("delete");
                }}
                className={`flex-1 py-3 text-center border-b-2 font-black transition-all cursor-pointer ${
                  activeTab === "delete"
                    ? "border-red-650 text-red-500 bg-[#141211]"
                    : "border-transparent text-[#9B9691] hover:text-red-400"
                }`}
              >
                REVOKE / DELETE
              </button>
            </div>

            {/* Scrollable area for content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-left">
              {activeTab === "inspect" ? (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-[#0B0A09] p-3 rounded-xl border border-[#23211F]">
                      <span className="text-[8px] font-mono text-[#9B9691] uppercase block">HOLDER NAME</span>
                      <span className="text-xs font-bold text-white block truncate">{drawerTicket.name}</span>
                    </div>
                    <div className="bg-[#0B0A09] p-3 rounded-xl border border-[#23211F]">
                      <span className="text-[8px] font-mono text-[#9B9691] uppercase block">CONTACT MOBILE</span>
                      <span className="text-xs font-mono text-white block truncate">{drawerTicket.contact}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-[#0B0A09] p-3 rounded-xl border border-[#23211F]">
                      <span className="text-[8px] font-mono text-[#9B9691] uppercase block">ASSIGNED TICKET ID</span>
                      <span className="text-sm font-display font-black text-[#0066FF] block">
                        #{drawerTicket.ticketNumber.toString().padStart(3, "0")}
                      </span>
                    </div>
                    <div className="bg-[#0B0A09] p-3 rounded-xl border border-[#23211F]">
                      <span className="text-[8px] font-mono text-[#9B9691] uppercase block">DATABASE REF ID</span>
                      <span className="text-[9px] font-mono text-white block truncate select-text">{drawerTicket.id}</span>
                    </div>
                  </div>

                  <div className="bg-[#0B0A09] p-3 rounded-xl border border-[#23211F] space-y-1">
                    <span className="text-[8px] font-mono text-[#9B9691] uppercase block">METADATA AUDIT LOG</span>
                    <p className="text-[10px] font-mono text-slate-400">
                      <b>Drawn Status:</b> {drawerTicket.drawn ? `🏆 WON (${drawerTicket.prizeTitle || "Raffle Gift"})` : "🎟️ Pending live spin"}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      <b>Registration Stamp:</b> {drawerTicket.assignedAt ? new Date(drawerTicket.assignedAt).toLocaleString() : "System Preseed"}
                    </p>
                  </div>
                </div>
              ) : (
                /* Delete operations flow */
                <div className="space-y-4">
                  {!isConfirmedDel ? (
                    <div className="bg-red-950/15 border border-red-500/20 p-4.5 rounded-2xl space-y-3">
                      <div className="flex gap-2.5 text-red-400">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-red-500">
                            WARNING: INITIATING TICKET REVOCATION
                          </h4>
                          <p className="text-[10px] opacity-85 mt-1 font-sans leading-relaxed">
                            Deleting ticket <b className="text-white">#{drawerTicket.ticketNumber.toString().padStart(3, "0")}</b> belonging to <b className="text-white">{drawerTicket.name}</b> will immediately and permanently erase this allocation from the database. This action is irreversible.
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setIsConfirmedDel(true)}
                          className="w-full cursor-pointer bg-red-650 hover:bg-red-700 text-white font-heading font-black text-xs uppercase tracking-widest py-3 rounded-xl border border-red-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={13} /> CONFIRM TO PROCEED WITH DELETION
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Final step: Type "DELETE" string matching to execute */
                    <div className="space-y-3">
                      <p className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                        FINAL STAGE SECURITY PIN-LOCK
                      </p>
                      <p className="text-xs text-slate-300 font-medium">
                        To enforce strict alignment and prevent accidental deletion, type the word <b className="text-[#0066FF] font-black tracking-widest bg-[#0B0A09] px-2 py-0.5 rounded border border-[#23211F]">DELETE</b> below:
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmInput}
                        onChange={(e) => setDeleteConfirmInput(e.target.value)}
                        placeholder="Type DELETE to authenticate..."
                        className="w-full bg-[#0B0A09] border border-[#23211F] focus:border-red-650 rounded-xl py-3.5 px-4 text-xs text-white placeholder-slate-700 font-mono focus:outline-none"
                      />
                      <div className="pt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsConfirmedDel(false);
                            setDeleteConfirmInput("");
                          }}
                          className="flex-1 bg-[#0B0A09] hover:bg-[#1E1B19] border border-[#23211F] py-3 rounded-xl text-xs font-mono font-black text-[#9B9691] hover:text-white transition-all cursor-pointer text-center"
                        >
                          CANCEL
                        </button>
                        <button
                          type="button"
                          disabled={deleteConfirmInput !== "DELETE" || isDeleting}
                          onClick={handleExecuteDelete}
                          className="flex-1 cursor-pointer bg-red-600 hover:bg-red-750 disabled:bg-red-950/20 disabled:text-red-900 disabled:border-transparent text-white font-heading font-black text-xs uppercase tracking-widest py-3 rounded-xl border border-red-650 transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 size={12} className="animate-spin" /> EXECUTING...
                            </>
                          ) : (
                            "DELETE PERMANENTLY"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="w-full text-center py-8 text-[10px] font-mono text-[#9B9691] select-none z-10 space-y-1 mt-auto border-t border-[#23211F]">
        <p>COWRYWISE COZY PITCH-DARK WORKSPACE • SECURED SYSTEM</p>
        <p className="text-[#9B9691]/80">© 2026 LAGOS LCC HANGOUT NOUN AMBASSADORS</p>
      </footer>
    </div>
  );
}
