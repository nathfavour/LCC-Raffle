import React, { useState } from "react";
import { DrawHistory } from "../types";
import { Trophy, Calendar, Award, Share2, Clipboard, Download, Check, Sparkles, X, Heart, Landmark } from "lucide-react";

interface WinnersListProps {
  history: DrawHistory[];
  onClearHistory: () => void;
  isDrawing: boolean;
}

export default function WinnersList({ history, onClearHistory, isDrawing }: WinnersListProps) {
  const [selectedWinner, setSelectedWinner] = useState<DrawHistory | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const handleCopyShareText = (item: DrawHistory, index: number) => {
    const text = `🎉 Big congratulations to NOUN Cowrywise Ambassador ${item.winner.name} (${item.winner.username}) for winning the "${item.prize.title}" at our Lekki Hangout! 🚀💰 Savings locked on @cowrywise! #CowrywiseNOUN #LCCAmbassadors`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleCopyCertificateText = (item: DrawHistory) => {
    const text = `🏆 OFFICIAL SAVINGS HERO CERTIFICATE 🏆\nThis certifies that Cowrywise NOUN Ambassador ${item.winner.name} successfully claimed "${item.prize.title}" with a valuation of ₦${item.prize.cashValue.toLocaleString()} at the Lagos LCC Ambassadors Hangout on June 11, 2026. Keep saving, keep growing!`;
    navigator.clipboard.writeText(text);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-premium h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-brand-dark tracking-tight">
            🏆 Winners Hall of Fame
          </h2>
          <p className="text-xs text-brand-muted">Timeline of successful stashes won</p>
        </div>
        
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            disabled={isDrawing}
            className="text-[10px] font-heading font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer disabled:opacity-40"
          >
            Clear History
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-100 pr-1">
        {history.length > 0 ? (
          [...history].reverse().map((item, index) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 group">
              <div className="flex items-center gap-3.5 max-w-[70%]">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 select-none">
                  <Trophy size={18} className="stroke-[2.2] animate-pulse" />
                </div>
                
                <div className="text-left overflow-hidden">
                  <h4 className="font-heading font-extrabold text-xs text-brand-dark leading-tight group-hover:text-brand-blue transition-colors truncate">
                    {item.winner.name}
                  </h4>
                  <p className="text-[10px] text-brand-muted font-mono leading-none mt-1">
                    {item.winner.username}
                  </p>
                  
                  {/* Prize subtitle */}
                  <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    Won: {item.prize.title}
                  </span>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopyShareText(item, index)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-500 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
                  title="Copy share social status"
                >
                  {copiedIndex === index ? <Check size={14} className="text-brand-green" /> : <Share2 size={14} />}
                </button>
                
                <button
                  onClick={() => setSelectedWinner(item)}
                  className="px-3 py-2 text-[10px] font-heading font-extrabold text-brand-blue bg-blue-50 hover:bg-brand-blue hover:text-white rounded-xl active:scale-95 transition-all cursor-pointer border border-blue-10/20"
                >
                  Certificate
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center text-brand-muted flex flex-col items-center justify-center">
            <Award size={48} className="text-slate-200 stroke-[1.2] mb-3 animate-bounce" />
            <p className="text-xs font-bold text-brand-dark">No winners drawn yet!</p>
            <p className="text-[10px] text-brand-muted mt-1 max-w-xs mx-auto leading-relaxed">
              Select a prize and spin the drawer above to announce our first Cowrywise savings superstar.
            </p>
          </div>
        )}
      </div>

      {/* Modern share certificate display overlay */}
      {selectedWinner && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-gradient-to-tr from-[#f8fafc] to-[#f1f5f9] rounded-3xl border-2 border-[#123061]/10 max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-hidden">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedWinner(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/70 hover:bg-white text-slate-500 hover:text-slate-800 border border-slate-200 cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Certificate Header Decoration */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-blue via-brand-green to-amber-400"></div>

            {/* Certificate Core Frame */}
            <div className="bg-white border-8 border-slate-50 rounded-2xl p-6 text-center shadow-lg relative my-4">
              
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-brand-blue/30"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-brand-blue/30"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-brand-blue/30"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-brand-blue/30"></div>

              {/* Brand and Badge */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-black tracking-widest text-[#0c2340] border-2 border-[#0c2340] px-2 py-0.5 rounded font-display leading-none uppercase">
                  Cowrywise
                </span>
                <Landmark size={22} className="text-brand-blue" />
                <span className="text-xs font-black tracking-widest text-brand-green border-2 border-brand-green px-2 py-0.5 rounded font-display leading-none uppercase">
                  NOUN
                </span>
              </div>

              <div className="mb-4">
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-amber-200">
                  OFFICIAL WINNER CERTIFICATE
                </span>
              </div>

              <h3 className="text-xs font-display font-bold tracking-widest text-slate-400 uppercase mt-2">
                This is proudly presented to
              </h3>
              
              <h1 className="text-3xl font-heading font-extrabold text-[#0c2340] tracking-tight mt-2 italic capitalize underline decoration-brand-green decoration-2 underline-offset-4">
                {selectedWinner.winner.name}
              </h1>
              
              <p className="font-mono text-xs text-brand-blue font-bold mt-1">
                {selectedWinner.winner.username}
              </p>

              <div className="w-16 h-0.5 bg-slate-100 mx-auto my-4"></div>

              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                For outstanding financial discipline and winning the
              </p>

              <div className="my-3 bg-brand-light/35 border border-brand-blue/10 rounded-2xl p-3.5 max-w-xs mx-auto">
                <h4 className="font-heading font-extrabold text-sm text-[#0c2340]">
                  {selectedWinner.prize.title}
                </h4>
                <p className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">
                  EST. VALUATION: ₦{selectedWinner.prize.cashValue.toLocaleString()} STASH
                </p>
              </div>

              <p className="text-[9px] text-slate-400 max-w-sm mx-auto uppercase tracking-wider font-mono">
                Awarded at the Lagos LCC Ambassadors Hangout • June 2026
              </p>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-slate-50 select-none">
                <div>
                  <div className="font-serif italic text-sm text-slate-600 font-bold relative -rotate-3">
                    B. Favour <span className="text-[8px] tracking-tight block text-slate-300 font-sans">Coordinator</span>
                  </div>
                  <div className="w-24 h-0.5 bg-slate-200 mx-auto mt-1"></div>
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-mono">NOUN President</span>
                </div>
                <div>
                  <div className="font-serif italic text-sm text-[#0c2340] font-bold relative rotate-2">
                    Cowrywise <span className="text-[8px] tracking-tight block text-slate-300 font-sans">Official</span>
                  </div>
                  <div className="w-24 h-0.5 bg-slate-200 mx-auto mt-1"></div>
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-mono">Brand Coordinator</span>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 w-full justify-center mt-4">
              <button
                onClick={() => handleCopyCertificateText(selectedWinner)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                {copiedShareLink ? (
                  <>
                    <Check size={14} className="text-brand-green" />
                    <span>COPIED CLINCH!</span>
                  </>
                ) : (
                  <>
                    <Clipboard size={14} />
                    <span>COPY CERTIFICATE DETAILS</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-95 transition-all"
              >
                <Download size={14} />
                <span>PRINT / PDF CERTIFICATE</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
