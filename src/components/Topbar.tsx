import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { ShieldCheck, LogIn, LogOut, Ticket, Play, Award, Loader2 } from "lucide-react";

export default function Topbar() {
  const [user, setUser] = useState<any>(null);
  const [admins, setAdmins] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Load admins and set auth listener
  useEffect(() => {
    let isMounted = true;

    async function loadAdminsAndAuth() {
      try {
        // Fetch admins from server
        const res = await fetch("/api/admins");
        const data = await res.json();
        
        if (data.success && data.admins && isMounted) {
          const loadedAdmins = data.admins.map((e: string) => e.toLowerCase());
          setAdmins(loadedAdmins);

          // Monitor firebase auth status
          onAuthStateChanged(auth, async (currentUser) => {
            if (!isMounted) return;
            setUser(currentUser);
            
            if (currentUser?.email) {
              const emailLower = currentUser.email.toLowerCase();
              const matched = loadedAdmins.includes(emailLower);
              setIsAdmin(matched);

              // Auto-bootstrap/synchronize Firestore config/auth if admin
              if (matched) {
                try {
                  await setDoc(doc(db, "config", "auth"), {
                    allowed_admins: loadedAdmins
                  }, { merge: true });
                } catch (e) {
                  console.warn("Auto-rule bootstrap bypassed/declined on database permission boundaries.", e);
                }
              }
            } else {
              setIsAdmin(false);
            }
            setLoading(false);
          });
        }
      } catch (err) {
        console.error("Could not load admins config on topbar:", err);
        setLoading(false);
      }
    }

    loadAdminsAndAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Google login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_12px_rgba(0,102,255,0.02)] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        
        {/* Brand logo framing (LCC Hangout) */}
        <Link to="/raffle" className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#0066FF] flex items-center justify-center text-white shadow-[0_4px_14px_rgba(0,102,255,0.3)] transform hover:rotate-6 transition-transform">
            <span className="font-heading font-black text-lg">C</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-heading font-black text-slate-900 tracking-tight uppercase">
                COWRYWISE NOUN
              </span>
              <span className="bg-[#10B981]/10 text-[#10B981] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded">
                LCC 2026
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase leading-none">
              Ambassadors Hangout Raffle
            </p>
          </div>
        </Link>

        {/* Desktop Nav Shelves */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/raffle"
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
              location.pathname === "/raffle"
                ? "bg-[#0066FF]/5 text-[#0066FF]"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-2">
              <Ticket size={13} /> Lookup Portal
            </span>
          </Link>
          <Link
            to="/raffle/draw"
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
              location.pathname === "/raffle/draw"
                ? "bg-[#0066FF]/5 text-[#0066FF]"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-2">
              <Play size={13} fill="currentColor" /> Cinematic Draw
            </span>
          </Link>
          {isAdmin && (
            <Link
              to="/raffle/admin"
              className={`px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                location.pathname === "/raffle/admin"
                  ? "bg-[#10B981]/5 text-[#10B981]"
                  : "text-slate-500 hover:text-[#10B981] hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2 animate-pulse">
                <ShieldCheck size={14} className="text-[#10B981]" /> Admin Desk
              </span>
            </Link>
          )}
        </nav>

        {/* Right Corner: User profile and Auth status */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Loader2 size={14} className="text-[#0066FF] animate-spin" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100/80 p-1.5 rounded-full pr-4">
              <img
                src={user.photoURL || "https://lh3.googleusercontent.com/a/default-user=s80"}
                alt={user.displayName || "Ambassador User"}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full border border-[#0066FF]/20 object-cover"
              />
              <div className="text-left hidden sm:block max-w-[124px]">
                <h4 className="text-[11px] font-heading font-black text-slate-800 leading-none truncate">
                  {user.displayName || "Ambassador"}
                </h4>
                <p className="text-[9px] font-mono text-slate-400 truncate mt-0.5 max-w-[120px]">
                  {isAdmin ? "🛡️ Administrator" : "🎟️ Registered"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out of Portal"
                className="ml-2 w-7 h-7 rounded-full bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center border border-slate-200 cursor-pointer transition-colors"
              >
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="group cursor-pointer bg-slate-900 hover:bg-slate-850 text-white font-heading font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl border border-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center gap-2 transition-all active:translate-y-0.5"
            >
              <LogIn size={13} className="group-hover:translate-x-0.5 transition-transform" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
