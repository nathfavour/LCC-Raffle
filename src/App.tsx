import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import PublicLookup from "./components/PublicLookup";
import AdminDesk from "./components/AdminDesk";
import LiveDraw from "./components/LiveDraw";
import { Menu, X, Landmark, ShieldCheck, HelpCircle } from "lucide-react";

// Minimalist quick navigation component overlay
function FloatingNavHub() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* Menu Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 rounded-full bg-[#141211] border-2 border-[#23211F] hover:border-[#0066FF] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer shadow-tactile-sm transition-all focus:outline-none"
        title="View System Route Menu"
      >
        {isOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Expanded Quick Options */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 bg-[#141211] border-2 border-[#23211F] p-4 rounded-2xl w-56 space-y-3 shadow-tactile-lg animate-fade-in text-left">
          <p className="text-[9px] font-mono tracking-widest text-[#10B981] uppercase font-bold border-b border-[#23211F] pb-1.5">
            System Workspace Menu
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to="/raffle"
              onClick={() => setIsOpen(false)}
              className="text-xs font-heading font-black text-slate-400 hover:text-[#10B981] transition-colors py-1 block uppercase"
            >
              🎟️ Public Lookup Portal
            </Link>
            <Link
              to="/raffle/admin"
              onClick={() => setIsOpen(false)}
              className="text-xs font-heading font-black text-slate-400 hover:text-[#0066FF] transition-colors py-1 block uppercase"
            >
              ⚙️ Admin Ticket Desk
            </Link>
            <Link
              to="/raffle/draw"
              onClick={() => setIsOpen(false)}
              className="text-xs font-heading font-black text-slate-400 hover:text-[#0066FF] transition-colors py-1 block uppercase"
            >
              🎬 Live Draw View
            </Link>
          </div>
          <div className="text-[8px] font-mono text-slate-600 uppercase tracking-tight pt-1.5 border-t border-[#23211F] flex items-center gap-1">
            <ShieldCheck size={10} className="text-[#10B981]" /> Offline Caches Enabled
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Route map bindings */}
      <Routes>
        <Route path="/" element={<Navigate to="/raffle/draw" replace />} />
        <Route path="/raffle" element={<PublicLookup />} />
        <Route path="/raffle/admin" element={<AdminDesk />} />
        <Route path="/raffle/draw" element={<LiveDraw />} />
        
        {/* Wildcard redirect to Live Draw as the cinematic default */}
        <Route path="*" element={<Navigate to="/raffle/draw" replace />} />
      </Routes>

      {/* Floating global router navigation hub */}
      <FloatingNavHub />
    </BrowserRouter>
  );
}
