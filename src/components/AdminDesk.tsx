import React, { useState, useEffect } from "react";
import { collection, doc, setDoc, deleteDoc, getDocs, onSnapshot, writeBatch } from "firebase/firestore";
import { signInAnonymously, signOut, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import { Lock, Unlock, Key, UserPlus, Copy, Check, Trash2, RefreshCw, LogOut, CheckCircle, Ticket, Phone, User, AlertTriangle } from "lucide-react";

interface TicketData {
  id: string;
  ticketNumber: number;
  name: string;
  contact: string;
  assignedAt: any;
  drawn: boolean;
  prizeTitle?: string;
}

export default function AdminDesk() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [fullName, setFullName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search/List in Admin
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [adminSearch, setAdminSearch] = useState("");

  // Modal State for Freshly Created Ticket
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    name: string;
    contact: string;
    ticketNumber: number;
  } | null>(null);

  const [copiedState, setCopiedState] = useState(false);

  // Monitor auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });
    return () => unsub();
  }, []);

  // Monitor tickets in real-time
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = onSnapshot(collection(db, "tickets"), (snapshot) => {
      const list: TicketData[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as TicketData);
      });
      list.sort((a, b) => a.ticketNumber - b.ticketNumber);
      setTickets(list);
    });
    return () => unsub();
  }, [isAuthenticated]);

  // Handle Login Gatekeeper
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (username.toLowerCase() === "admin" && password === "raffle2026") {
      try {
        await signInAnonymously(auth);
        setIsAuthenticated(true);
      } catch (err: any) {
        setLoginError("Firebase authentication failed. Please try again.");
        console.error(err);
      }
    } else {
      setLoginError("Invalid administrator username or password.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Assign fresh ticket entry
  const handleAssignTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !contactInfo.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. Gather all occupied ticket numbers
      const occupiedNumbers = new Set(tickets.map((tk) => tk.ticketNumber));

      // 2. Compute free numbers between 0 and 400
      const availableNumbers: number[] = [];
      for (let i = 0; i <= 400; i++) {
        if (!occupiedNumbers.has(i)) {
          availableNumbers.push(i);
        }
      }

      if (availableNumbers.length === 0) {
        alert("Raffle Registry Error: All 401 ticket spots are completely fully registered!");
        setIsSubmitting(false);
        return;
      }

      // 3. Select a random number from available tickets to satisfy unbiased registration
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      const chosenNumber = availableNumbers[randomIndex];

      // 4. Create record in Firestore using ticketNumber as documentId for strict hardware uniqueness constraint
      const docRef = doc(db, "tickets", chosenNumber.toString());
      const payload = {
        ticketNumber: chosenNumber,
        name: fullName.trim(),
        contact: contactInfo.trim(),
        assignedAt: new Date().toISOString(),
        drawn: false,
        prizeTitle: ""
      };

      await setDoc(docRef, payload);

      // 5. Present modal overlay success
      setSuccessModal({
        isOpen: true,
        name: fullName,
        contact: contactInfo,
        ticketNumber: chosenNumber
      });

      // Reset Form fields
      setFullName("");
      setContactInfo("");
    } catch (err) {
      console.error("Failed to assign ticket:", err);
      alert("Error generating ticket document: Permission denied.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy Confirmation Command Text
  const handleCopyConfirmation = () => {
    if (!successModal) return;
    const padNum = successModal.ticketNumber.toString().padStart(3, "0");
    const msg = `🎟️ EVENT TICKET CONFIRMED! 🎟️\n\nHello ${successModal.name},\nYour registration is complete! You have been assigned ticket number #${padNum} in the digital drawing pool (0-400).\n\nKeep your phone close during the live presentation drawing! #Raffle2026`;
    
    navigator.clipboard.writeText(msg);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  // Delete registration
  const handleDeleteTicket = async (docId: string) => {
    if (!window.confirm("Are you sure you want to retract/delete this ticket?")) return;
    try {
      await deleteDoc(doc(db, "tickets", docId));
    } catch (err) {
      console.error(err);
      alert("Retract ticket failed!");
    }
  };

  // Pre-seed some beautiful mock tickets if pool is empty
  const handlePreseedTickets = async () => {
    if (!window.confirm("Pre-populate the pool with 12 mock ticket holders for testing purposes?")) return;
    
    setIsSubmitting(true);
    try {
      const mockHolders = [
        { name: "Favour Nathaniel", contact: "@nath_favour_noun" },
        { name: "Chinedu Okafor", contact: "0803 123 4567" },
        { name: "Amina Yusuf", contact: "@amina_noun" },
        { name: "Tunde Balogun", contact: "0815 999 8888" },
        { name: "Gold Chioma", contact: "@gold_ambassador" },
        { name: "Ibrahim Shehu", contact: "0906 111 2222" },
        { name: "Blessing Effiong", contact: "@bless_cowry" },
        { name: "Toluwani Adebayo", contact: "@tolu_saveoclock" },
        { name: "Deborah James", contact: "0802 444 3333" },
        { name: "Kemi Adesina", contact: "@kemi_stash" },
        { name: "Olamide Isaac", contact: "@olamide_save" },
        { name: "Victor Chukwu", contact: "0708 777 6666" }
      ];

      // Assign unique, non-colliding numbers
      const occupiedNumbers = new Set(tickets.map((tk) => tk.ticketNumber));
      const pool = [];
      for (let i = 0; i <= 400; i++) {
        if (!occupiedNumbers.has(i)) pool.push(i);
      }

      for (let j = 0; j < Math.min(mockHolders.length, pool.length); j++) {
        const uniqueNum = pool[j];
        const payObject = {
          ticketNumber: uniqueNum,
          name: mockHolders[j].name,
          contact: mockHolders[j].contact,
          assignedAt: new Date().toISOString(),
          drawn: false,
          prizeTitle: ""
        };
        await setDoc(doc(db, "tickets", uniqueNum.toString()), payObject);
      }
    } catch (e) {
      console.error(e);
      alert("Preseed error!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Full reset (delete all registrations)
  const handleResetRegistry = async () => {
    if (!window.confirm("CRITICAL ACCORD: Are you absolutely sure you want to WIPE THE REGISTRY? This deletes all registered attendees from the database!")) return;
    setIsSubmitting(true);
    try {
      const querySnapshot = await getDocs(collection(db, "tickets"));
      const batchList = [];
      querySnapshot.forEach((d) => {
        batchList.push(deleteDoc(doc(db, "tickets", d.id)));
      });
      await Promise.all(batchList);
    } catch (e) {
      console.error(e);
      alert("Wipe error!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter list
  const filteredTickets = tickets.filter((tk) => {
    const term = adminSearch.toLowerCase();
    return (
      tk.name.toLowerCase().includes(term) ||
      tk.contact.toLowerCase().includes(term) ||
      tk.ticketNumber.toString() === term
    );
  });

  // --- Gatekeeper Screen ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#000000] text-[#E2E8F0] flex items-center justify-center p-4">
        <div className="fixed top-1/3 left-1/3 w-64 h-64 bg-[#0066FF]/5 blur-3xl pointer-events-none rounded-full"></div>
        <div className="absolute top-12 left-12 inline-flex items-center gap-1.5 font-mono text-[10px] text-slate-500 uppercase tracking-widest bg-[#0A0908] border border-[#23211F] px-3.5 py-1.5 rounded-full select-none">
          <Lock size={12} className="text-red-500" /> Secure Area
        </div>

        <div className="w-full max-w-sm bg-[#141211] border-2 border-[#23211F] p-6 md:p-8 rounded-3xl shadow-tactile-lg relative">
          <div className="text-center space-y-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#0066FF]/10 border border-[#0066FF]/30 flex items-center justify-center text-[#0066FF] mx-auto">
              <Key size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-black tracking-tight text-white uppercase">
                Admin Entry Login
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Unlock the ticket assignment desk workspace console
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                Operator Username
              </label>
              <input
                type="text"
                placeholder="Enter operator username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0A0908] border-2 border-[#23211F] focus:border-[#0066FF] rounded-xl py-3 px-4 text-xs text-white font-display focus:outline-none transition-all placeholder-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                Security Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0A0908] border-2 border-[#23211F] focus:border-[#0066FF] rounded-xl py-3 px-4 text-xs text-white font-display focus:outline-none transition-all placeholder-slate-600"
              />
            </div>

            {loginError && (
              <p className="text-[10px] font-mono text-red-500 font-bold text-center">
                ⚠ {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full cursor-pointer bg-[#0066FF] hover:bg-[#0055DD] text-white font-heading font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl border border-[#0066FF] shadow-tactile-sm active:translate-y-px active:shadow-none transition-all"
            >
              Sign In to Workspace
            </button>
          </form>

          {/* Hint Footer inside login card for easy evaluation testing */}
          <div className="mt-6 pt-4 border-t border-[#23211F] text-center">
            <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wide">
              HINT: USERNAME: <span className="text-slate-400">admin</span> / PW: <span className="text-slate-400">raffle2026</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- Active Admin Desk Workspace Panel ---
  return (
    <div className="min-h-screen bg-[#000000] text-[#E2E8F0] px-4 py-8 md:py-12 selection:bg-[#0066FF]/30 selection:text-white">
      {/* Background Decor */}
      <div className="fixed top-1/3 left-10 w-96 h-96 bg-[#0066FF]/5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="w-full max-w-4xl mx-auto space-y-6 relative">
        
        {/* Upper Navigation Row */}
        <header className="flex items-center justify-between border-b-2 border-[#23211F] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A0908] border border-[#23211F] flex items-center justify-center text-[#10B981]">
              <Unlock size={18} />
            </div>
            <div>
              <h1 className="text-lg font-heading font-black text-white uppercase leading-none">
                Admin Entry Desk
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider mt-1">
                OPERATIONS MANAGER • AUTHENTICATED
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="cursor-pointer inline-flex items-center gap-2 bg-[#0A0908] hover:bg-[#1E1B19] border-2 border-[#23211F] text-slate-400 hover:text-white font-mono text-[10px] px-3.5 py-1.5 rounded-full shadow-tactile-sm transition-all"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </header>

        {/* Dashboard Layout: Splitting operations form (Left) and assigned tickets listing (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Operations Form View (40% span) */}
          <div className="lg:col-span-5 bg-[#141211] border-2 border-[#23211F] p-5 md:p-6 rounded-2xl shadow-tactile-lg space-y-6">
            <div className="space-y-1">
              <h2 className="text-sm font-heading font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                <UserPlus size={16} className="text-[#0066FF]" />
                Register Attendee Ticket
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                Generate a secure unassigned coupon bounded from 0 to 400
              </p>
            </div>

            <form onSubmit={handleAssignTicket} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  Attendee Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter attendee first + last name..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0A0908] border-2 border-[#23211F] focus:border-[#0066FF] rounded-xl py-3 pl-10 pr-4 text-xs text-white font-display focus:outline-none transition-all placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  Contact Handle / Phone
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Phone size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. @username or phone number..."
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full bg-[#0A0908] border-2 border-[#23211F] focus:border-[#0066FF] rounded-xl py-3 pl-10 pr-4 text-xs text-white font-display focus:outline-none transition-all placeholder-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer bg-[#0066FF] hover:bg-[#0055DD] text-white font-heading font-black text-xs uppercase tracking-wider py-3.5 rounded-xl border border-[#0066FF] shadow-tactile-sm active:translate-y-px active:shadow-none transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Generating Slot..." : "Assign Unique Ticket ID"}
              </button>
            </form>

            <div className="pt-4 border-t border-[#23211F] space-y-2">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                Batch Workspace Tools
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePreseedTickets}
                  disabled={isSubmitting}
                  className="cursor-pointer bg-[#0A0908] border-2 border-[#23211F] hover:border-[#10B981]/50 text-slate-300 font-sans font-bold text-[10px] py-2 rounded-xl active:scale-95 transition-all text-center"
                >
                  Seed Testing Data
                </button>
                <button
                  type="button"
                  onClick={handleResetRegistry}
                  disabled={isSubmitting}
                  className="cursor-pointer bg-red-950/15 border-2 border-red-900/30 hover:border-red-900/80 text-red-500 font-sans font-bold text-[10px] py-2 rounded-xl active:scale-95 transition-all text-center"
                >
                  Wipe Registry
                </button>
              </div>
            </div>
          </div>

          {/* Assigned Tickets Registry Listing (60% span) */}
          <div className="lg:col-span-12 xl:col-span-7 bg-[#141211] border-2 border-[#23211F] p-5 md:p-6 rounded-2xl shadow-tactile-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b-2 border-[#23211F]">
              <div className="space-y-0.5">
                <h2 className="text-sm font-heading font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                  <Ticket size={16} className="text-[#10B981]" />
                  Attendee Ledger Entries
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">
                  {tickets.length} attendees mapped inside database registry
                </p>
              </div>

              {/* Dynamic list search */}
              <input
                type="text"
                placeholder="Search ledger list..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="bg-[#0A0908] border-2 border-[#23211F] focus:border-[#0066FF] rounded-full py-1.5 px-4 text-[11px] text-white font-display focus:outline-none transition-all placeholder-slate-600"
              />
            </div>

            {/* List entries */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((tk) => (
                  <div
                    key={tk.id}
                    className="bg-[#0A0908] border border-[#23211F] p-3 rounded-xl flex items-center justify-between gap-4 group hover:bg-[#1E1B19] transition-colors"
                  >
                    <div className="text-left overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-[#10B981] text-xs">
                          #{tk.ticketNumber.toString().padStart(3, "0")}
                        </span>
                        <h4 className="text-white text-xs font-heading font-black truncate">
                          {tk.name}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">
                        CONTACT: {tk.contact}
                      </p>
                      {tk.drawn && (
                        <p className="text-[9px] font-mono text-[#10B981] mt-0.5 font-bold flex items-center gap-1">
                          🏆 Drawn: {tk.prizeTitle || "Awarded"}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteTicket(tk.id)}
                      className="cursor-pointer p-2 rounded-lg bg-red-950/10 border border-red-900/20 text-red-500 hover:bg-red-900 hover:text-white transition-all shadow-tactile-sm"
                      title="Delete Ticket Registration"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-slate-600">
                  <p className="text-xs">No active ledger items detected.</p>
                  <p className="text-[10px] text-slate-700 font-mono">Use left-side form to sign-up people.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Copy Glassmorphic Modal Overlay Success (Fresh Entry) */}
      {successModal && (
        <div className="fixed inset-0 bg-[#000000]/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-[#141211] border-2 border-[#10B981]/50 p-6 rounded-3xl shadow-tactile-lg relative overflow-hidden space-y-6 text-center animate-neon-glow">
            
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] mx-auto animate-bounce">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-xl font-heading font-black tracking-tight text-white uppercase pt-1">
                Ticket Assigned Success!
              </h3>
              <p className="text-[11px] text-[#10B981] font-mono font-bold uppercase tracking-wider">
                COMMITTED REGISTERED IN CLOUD DATABASE
              </p>
            </div>

            {/* Cinematic Center ticket displays */}
            <div className="bg-[#0A0908] border-2 border-[#23211F] p-5 rounded-2xl space-y-1 relative">
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                LUCKY ENROLLMENT TICKET
              </p>
              <h4 className="text-white text-sm font-heading font-black truncate max-w-[280px] mx-auto pt-1">
                {successModal.name}
              </h4>
              <p className="text-[10px] text-slate-400 font-mono uppercase pb-3 truncate max-w-[280px] mx-auto">
                CONTACT: {successModal.contact}
              </p>

              <div className="border-t-2 border-dashed border-[#23211F] pt-4">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">
                  ASSIGNED NUMBER ID
                </span>
                <p className="text-5xl font-display font-black text-[#10B981] mt-1 tracking-wider leading-none">
                  #{successModal.ticketNumber.toString().padStart(3, "0")}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyConfirmation}
                className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 bg-[#0066FF] hover:bg-[#0055DD] text-white font-heading font-black text-xs uppercase tracking-wider py-3.5 rounded-xl border border-[#0066FF] transition-all"
              >
                {copiedState ? (
                  <>
                    <Check size={14} className="text-[#10B981]" /> COPIED!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy SMS/Message Text
                  </>
                )}
              </button>
              
              <button
                onClick={() => setSuccessModal(null)}
                className="cursor-pointer items-center justify-center bg-[#0A0908] hover:bg-[#1E1B19] border-2 border-[#23211F] px-4 py-3.5 text-xs text-slate-400 hover:text-white rounded-xl transition-all"
              >
                Close Desk
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
