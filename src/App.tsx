import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import HomeGenerator from "./components/HomeGenerator";
import PublicLookup from "./components/PublicLookup";
import LiveDraw from "./components/LiveDraw";
import AdminDesk from "./components/AdminDesk";
import { Ticket, Search, Trophy, Settings, Terminal, ShieldCheck } from "lucide-react";

function NavigationLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { label: "Home", path: "/", icon: Ticket, desc: "Claim Ticket Badge" },
    { label: "Discovery", path: "/discovery", icon: Search, desc: "Search Registered" },
    { label: "Raffle", path: "/raffle", icon: Trophy, desc: "Live Showcase Draw" },
    { label: "Admin Console", path: "/admin", icon: Settings, desc: "Secret Command Desk" }
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-[#E2E8F0] flex flex-col md:flex-row antialiased select-none">
      
      {/* 1. Desktop Left Sidebar container */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#0A0908] border-r border-[#23211F] z-30 justify-between py-6 px-4">
        <div className="space-y-8">
          
          {/* Logo Branding Header */}
          <div className="px-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0066FF]/10 border border-[#0066FF]/30 flex items-center justify-center text-[#0066FF] animate-pulse">
                <Terminal size={15} />
              </div>
              <div className="text-left">
                <h1 className="text-xs font-heading font-black text-white uppercase tracking-tight leading-none font-black">
                  COWRY LOUNGE
                </h1>
                <span className="text-[8px] font-mono font-bold text-[#10B981] uppercase tracking-widest block pt-1">
                  LCC HANGOUT 2026
                </span>
              </div>
            </div>
          </div>

          {/* Map Nav tab links */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all border text-left cursor-pointer group ${
                    isActive
                      ? "bg-[#141211] border-[#23211F] text-[#0066FF] shadow-tactile-sm"
                      : "bg-transparent border-transparent text-[#9B9691] hover:text-white hover:bg-[#141211]/40"
                  }`}
                >
                  <Icon
                    size={16}
                    className={`transition-colors shrink-0 ${
                      isActive ? "text-[#0066FF]" : "text-[#9B9691] group-hover:text-white"
                    }`}
                  />
                  <div>
                    <p className={`text-xs font-heading font-black tracking-wide uppercase leading-none ${isActive ? "text-white" : ""}`}>
                      {item.label}
                    </p>
                    <p className="text-[8px] font-mono text-[#9B9691] uppercase tracking-wider leading-none pt-1">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Info panel metadata */}
        <div className="px-3 space-y-2">
          <div className="flex items-center gap-2 bg-[#141211] border border-[#23211F] px-3 py-2.5 rounded-xl text-left">
            <ShieldCheck size={13} className="text-[#10B981]" />
            <div>
              <p className="text-[8px] font-mono text-[#9B9691] uppercase tracking-widest font-black leading-none">
                ENCRYPTED HOST
              </p>
              <span className="text-[8px] font-mono text-[#9B9691]/70 leading-none block pt-0.5">
                COWRY DATA LIVE
              </span>
            </div>
          </div>
          <p className="text-[8px] font-mono text-slate-600 uppercase text-center tracking-widest">
            LAGOS AMBASSADORS © 2026
          </p>
        </div>
      </aside>

      {/* 2. Responsive Mobile Bottom Navbar (pinned and sticky) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0908] border-t border-[#23211F] px-2 py-1 flex justify-around items-center z-40 shadow-2xl h-16">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all cursor-pointer ${
                isActive ? "text-[#0066FF]" : "text-[#9B9691]"
              }`}
            >
              <Icon size={16} className={isActive ? "text-[#0066FF]" : "text-[#9B9691]"} />
              <span className="text-[8px] font-heading font-black uppercase tracking-wider mt-1 leading-none">
                {item.label.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* 3. Primary Container body layout */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <div className="flex-1 w-full relative">
          {children}
        </div>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NavigationLayout>
        <Routes>
          {/* Main front facing landing page which is HomeGenerator */}
          <Route path="/" element={<HomeGenerator />} />
          <Route path="/discovery" element={<PublicLookup />} />
          <Route path="/raffle" element={<LiveDraw />} />
          <Route path="/admin" element={<AdminDesk />} />
          
          {/* Fallback wildcard routing direct to Home screen */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NavigationLayout>
    </BrowserRouter>
  );
}
