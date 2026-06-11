import React, { useState, useEffect } from "react";
import { collection, doc, deleteDoc, getDocs, onSnapshot, runTransaction } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import { ShieldCheck, UserPlus, Copy, Check, Trash2, RefreshCw, CheckCircle, Ticket, Phone, User, AlertTriangle, LogIn, Lock } from "lucide-react";
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

export default function AdminDesk() {
  const [user, setUser] = useState<any>(null);
  const [admins, setAdmins] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Monitor auth state and admins whitelist
  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndAdmins() {
      try {
        const res = await fetch("/api/admins");
        const data = await res.json();
        
        if (data.success && data.admins && isMounted) {
          const loadedAdmins = data.admins.map((e: string) => e.toLowerCase());
          setAdmins(loadedAdmins);

          onAuthStateChanged(auth, (currentUser) => {
            if (!isMounted) return;
            setUser(currentUser);
            if (currentUser?.email) {
              setIsAdmin(loadedAdmins.includes(currentUser.email.toLowerCase()));
            } else {
              setIsAdmin(false);
            }
            setLoading(false);
          });
        }
      } catch (err) {
        console.error("Auth config loaded failed:", err);
        setLoading(false);
      }
    }

    checkAuthAndAdmins();
    return () => {
      isMounted = false;
    };
  }, []);

  // Monitor tickets in real-time if validated as admin
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(collection(db, "tickets"), (snapshot) => {
      const list: TicketData[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as TicketData);
      });
      list.sort((a, b) => a.ticketNumber - b.ticketNumber);
      setTickets(list);
    });
    return () => unsub();
  }, [isAdmin]);

  const handleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Google Auth popup failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Assign fresh ticket entry using transactions to completely secure database concurrency
  const handleAssignTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !contactInfo.trim()) return;

    setIsSubmitting(true);
    try {
      // Execute firestore-backed transaction rules
      const chosenNumber = await runTransaction(db, async (transaction) => {
        const ticketColRef = collection(db, "tickets");
        const snapshot = await getDocs(ticketColRef);
        
        const occupied = new Set<number>();
        snapshot.forEach((docSnap) => {
          const num = docSnap.data().ticketNumber;
          if (typeof num === "number") {
            occupied.add(num);
          }
        });

        // Calculate unoccupied ranges between 0-400
        const available: number[] = [];
        for (let i = 0; i <= 400; i++) {
          if (!occupied.has(i)) {
            available.push(i);
          }
        }

        if (available.length === 0) {
          throw new Error("Raffle Registry Limit Reached: All 401 ticket seats on this pool are completely booked.");
        }

        // Standard random distribution index allocation
        const randomIndex = Math.floor(Math.random() * available.length);
        const chosen = available[randomIndex];

        // Safe commit reference
        const docRef = doc(db, "tickets", chosen.toString());
        transaction.set(docRef, {
          ticketNumber: chosen,
          name: fullName.trim(),
          contact: contactInfo.trim(),
          assignedAt: new Date().toISOString(),
          drawn: false,
          prizeTitle: ""
        });

        return chosen;
      });

      // Show success modal overlay
      setSuccessModal({
        isOpen: true,
        name: fullName,
        contact: contactInfo,
        ticketNumber: chosenNumber
      });

      // Wipe inputs
      setFullName("");
      setContactInfo("");

    } catch (err: any) {
      console.error("Concurrency protection triggered error:", err);
      alert(err.message || "Operation failed. Uniqueness locks were busy. Please retry registry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyConfirmation = () => {
    if (!successModal) return;
    const padNum = successModal.ticketNumber.toString().padStart(3, "0");
    const msg = `🎟️ COWRYWISE AMBASSADOR RAFFLE CONFIRMED! 🎟️\n\nHello ${successModal.name},\nYour registration is verified! You have been assigned unique drawing digit #${padNum} inside the LCC Hangout pool (0-400).\n\nKeep your savings locked on Cowrywise during the drawing to win compound interest! See you live! 🚀`;
    
    navigator.clipboard.writeText(msg);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleDeleteTicket = async (docId: string) => {
    if (!window.confirm("Are you sure you want to retract/delete this ticket registry entry? This operation is persistent!")) return;
    try {
      await deleteDoc(doc(db, "tickets", docId));
    } catch (err) {
      console.error(err);
      alert("Retract action failed on database restrictions.");
    }
  };

  const handlePreseedTickets = async () => {
    if (!window.confirm("Bootstrap 12 mock Cowrywise NOUN Ambassador ticket profiles for live draw testing?")) return;
    
    setIsSubmitting(true);
    try {
      const mockHolders = [
        { name: "Favour Nathaniel", contact: "@fav_noun_lead" },
        { name: "Amina Alabi", contact: "0814 888 2212" },
        { name: "Chinedu Chukwuma", contact: "@chinedu_savings" },
        { name: "Tunde Osinbajo", contact: "0902 444 7777" },
        { name: "Evelyn Williams", contact: "@evelyn_stash" },
        { name: "Suleiman Bello", contact: "0803 111 5555" },
        { name: "Gold Chioma", contact: "@chioma_gold" },
        { name: "Adeola Balogun", contact: "@adeola_noun" },
        { name: "Victory Blessing", contact: "0708 222 1133" },
        { name: "Samuel Isaac", contact: "@samuel_save" },
        { name: "Fatima Yusuf", contact: "@fatima_lcc" },
        { name: "Gideon Peters", contact: "0815 444 3322" }
      ];

      // Identify occupied slots
      const getFreshData = await getDocs(collection(db, "tickets"));
      const occupied = new Set<number>();
      getFreshData.forEach((d) => {
        const num = d.data().ticketNumber;
        if (typeof num === "number") occupied.add(num);
      });

      const availablePool = [];
      for (let i = 0; i <= 400; i++) {
        if (!occupied.has(i)) availablePool.push(i);
      }

      for (let j = 0; j < Math.min(mockHolders.length, availablePool.length); j++) {
        const chosenNum = availablePool[j];
        await setDoc(doc(db, "tickets", chosenNum.toString()), {
          ticketNumber: chosenNum,
          name: mockHolders[j].name,
          contact: mockHolders[j].contact,
          assignedAt: new Date().toISOString(),
          drawn: false,
          prizeTitle: ""
        });
      }
    } catch (e) {
      console.error("Preseeding failed:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetRegistry = async () => {
    if (!window.confirm("CRITICAL WARNING: Are you completely certain you want to wipeout the raffle registries? All active attendees will be deleted!")) return;
    setIsSubmitting(true);
    try {
      const qs = await getDocs(collection(db, "tickets"));
      const p = [];
      qs.forEach((d) => {
        p.push(deleteDoc(doc(db, "tickets", d.id)));
      });
      await Promise.all(p);
    } catch (e) {
      console.error(e);
      alert("Wipe failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Search
  const filteredTickets = tickets.filter((tk) => {
    const term = adminSearch.toLowerCase().trim();
    return (
      tk.name.toLowerCase().includes(term) ||
      tk.contact.toLowerCase().includes(term) ||
      tk.ticketNumber.toString() === term
    );
  });

  // Loading Gate state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-[#0066FF] animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Evaluating admin clearance...</p>
        </div>
      </div>
    );
  }

  // Denial / Access Login Screen Gate
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-between selection:bg-[#0066FF]/10 select-none">
        
        <Topbar />

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-slate-100 p-8 rounded-3xl shadow-[0_12px_44px_rgba(0,0,0,0.03)] text-center space-y-6">
            
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mx-auto">
              <Lock size={24} className="animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-heading font-black text-slate-900 uppercase">
                Admin Clearance Required
              </h1>
              <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
                Only whitelisted coordinators can registers ticket numbers and clear drawings. Please sign in with an authorized Google Account.
              </p>
            </div>

            <div className="py-2.5 px-4 bg-amber-50/50 rounded-xl border border-amber-100 text-[10px] text-amber-700 font-mono text-left space-y-1">
              <p className="font-bold uppercase tracking-widest flex items-center gap-1">
                <AlertTriangle size={10} /> ACCESS PROTOCOL DETAILS:
              </p>
              <p>Registered Emails whitelist includes event coordinators, ambassadors and test profiles (e.g. nathfavour02@gmail.com).</p>
            </div>

            {!user ? (
              <button
                onClick={handleLogin}
                className="w-full cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-heading font-black text-xs uppercase tracking-wider py-4 rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2 transition-all active:translate-y-px"
              >
                <LogIn size={14} />
                <span>Sign in with Google</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="text-[11px] font-mono text-slate-500 p-2 border border-slate-100 rounded-lg bg-slate-50 truncate">
                  Logged as: <span className="font-bold text-slate-900">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-heading font-black text-xs uppercase tracking-wider py-3.5 rounded-xl border border-slate-200 transition-all"
                >
                  Switch Google Account
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className="w-full text-center py-6 text-[10px] font-mono text-slate-400 select-none border-t border-slate-50">
          <p>© 2026 LAGOS LCC HANGOUT NOUN AMBASSADORS</p>
        </footer>
      </div>
    );
  }

  // Active Admin Console
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-800 flex flex-col justify-between selection:bg-[#0066FF]/10 select-none">
      
      {/* Dynamic Topbar Header with built-in Auth check */}
      <Topbar />

      <main className="max-w-6xl mx-auto w-full px-4 py-8 md:py-12 flex-1 space-y-8 z-10">
        
        {/* Desk Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#10B981] shadow-sm">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-slate-900 uppercase leading-none">
                Admin Entry Desk
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider mt-1 uppercase font-bold">
                COWRYWISE COZY MANAGER CONSOLE • LEVEL 1 SECURED
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-xs">
              Operator: <span className="text-slate-800 font-bold">{user.email}</span>
            </span>
            <button
              onClick={handleLogout}
              className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-mono text-[10px] px-4 py-1.5 rounded-full transition-all uppercase font-bold"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Workspace Layout Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Operations Form View (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-6">
            <div className="space-y-1">
              <h2 className="text-sm font-heading font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <UserPlus size={16} className="text-[#0066FF]" />
                Register Attendee Ticket
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Allocate a secure unique coupon bounded strictly between 0 and 400
              </p>
            </div>

            <form onSubmit={handleAssignTicket} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-450 font-black">
                  Attendee Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="First and last name..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0066FF] hover:border-slate-350 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-800 font-display focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0066FF]/5 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-450 font-black">
                  Contact Handle / Phone
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Phone size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. @username or phone..."
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0066FF] hover:border-slate-350 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-800 font-display focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0066FF]/5 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer bg-[#0066FF] hover:bg-[#0055DD] text-white font-heading font-black text-xs uppercase tracking-wider py-4 rounded-xl border border-[#0066FF] shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Generating atomic seat..." : "Assign Unique Ticket ID"}
              </button>
            </form>

            <div className="pt-5 border-t border-slate-100 space-y-2.5">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-black">
                Registry Workspace Controls
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handlePreseedTickets}
                  disabled={isSubmitting}
                  className="cursor-pointer bg-slate-50 border border-slate-200 hover:border-[#10B981]/40 text-slate-600 hover:text-slate-900 font-sans font-bold text-[10px] py-2 rounded-xl transition-all text-center"
                >
                  Seed Testing Data
                </button>
                <button
                  type="button"
                  onClick={handleResetRegistry}
                  disabled={isSubmitting}
                  className="cursor-pointer bg-red-50 border border-red-100 hover:border-red-300 text-red-500 hover:text-red-700 font-sans font-bold text-[10px] py-2 rounded-xl transition-all text-center"
                >
                  Wipe Registry
                </button>
              </div>
            </div>
          </div>

          {/* Ledger Listing (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-sm font-heading font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  <Ticket size={16} className="text-[#10B981]" />
                  Active Registry Ledger
                </h2>
                <p className="text-xs text-slate-400 font-medium font-sans">
                  {tickets.length} registered ticket holders in database
                </p>
              </div>

              {/* Ledger search */}
              <input
                type="text"
                placeholder="Search attendee registry..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-[#0066FF] rounded-full py-1.5 px-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Registry map */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((tk) => (
                  <div
                    key={tk.id}
                    className="bg-white border border-slate-100 p-3.5 rounded-xl flex items-center justify-between gap-4 hover:border-slate-200 hover:shadow-xs transition-all"
                  >
                    <div className="text-left overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-black text-[#0066FF] text-xs">
                          #{tk.ticketNumber.toString().padStart(3, "0")}
                        </span>
                        <h4 className="text-slate-900 text-xs font-heading font-black truncate">
                          {tk.name}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wide">
                        CONTACT: {tk.contact}
                      </p>
                      {tk.drawn && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#10B981] border border-emerald-100 text-[8px] font-mono font-bold px-2 py-0.2 rounded-full mt-1 uppercase">
                          🏆 WON: {tk.prizeTitle || "Awarded"}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteTicket(tk.id)}
                      className="cursor-pointer p-2 rounded-lg bg-red-50 border border-red-100 hover:border-red-300 text-red-500 hover:text-red-700 transition-colors"
                      title="De-register Attendee"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-400 space-y-1.5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No Active Registry Found</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Input information on the left form layout to populate registrations.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* Copy Successful modal overlay drawer */}
      {successModal && (
        <div className="fixed inset-0 bg-[#FAFAFA]/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white border-2 border-[#10B981] p-6 rounded-3xl shadow-[0_20px_48px_rgba(16,185,129,0.1)] relative overflow-hidden space-y-6 text-center animate-fade-in">
            
            <div className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-[#10B981]/15 border border-[#10B981]/20 flex items-center justify-center text-[#10B981] mx-auto animate-bounce">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-heading font-black text-slate-900 uppercase">
                Attendee Registered!
              </h3>
              <p className="text-[9px] text-[#10B981] font-mono font-black uppercase tracking-widest bg-emerald-50 py-1.5 rounded-lg border border-emerald-100">
                LCC SECURITY CONSOL TRANSACTION COMPLETE
              </p>
            </div>

            {/* Visual confirmation slot card */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-1 text-center">
              <p className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-black">
                TICKET HOLDER RECORD
              </p>
              <h4 className="text-slate-900 text-sm font-heading font-black truncate max-w-[240px] mx-auto pt-1">
                {successModal.name}
              </h4>
              <p className="text-[9px] text-slate-400 font-mono uppercase pb-3 truncate max-w-[240px] mx-auto">
                CONTACT: {successModal.contact}
              </p>

              <div className="border-t border-dashed border-slate-200 pt-3">
                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-black block">
                  ASSIGNED NUMBER ID
                </span>
                <p className="text-4xl font-display font-black text-[#10B981] mt-1 tracking-widest leading-none">
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
                    <Check size={14} /> COPIED!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy CONFIRMATION
                  </>
                )}
              </button>
              
              <button
                onClick={() => setSuccessModal(null)}
                className="cursor-pointer bg-slate-100 hover:bg-slate-205 text-slate-500 hover:text-slate-900 border border-slate-200 px-4 py-3.5 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="w-full text-center py-6 text-[10px] font-mono text-slate-400 select-none border-t border-slate-50 mt-auto">
        <p>LAGOS COWRYWISE AMBASSADORS WORKSPACE • SECURED MANAGEMENT</p>
        <p className="text-slate-350">© 2026 LAGOS LCC HANGOUT NOUN AMBASSADORS</p>
      </footer>
    </div>
  );
}
