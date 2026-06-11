import React, { useState } from "react";
import { Prize } from "../types";
import { Coins, Wallet, Shirt, CupSoda, BookOpen, Notebook, Zap, Plus, Minus, KeyRound, Sparkles } from "lucide-react";

interface PrizeManagerProps {
  prizes: Prize[];
  setPrizes: React.Dispatch<React.SetStateAction<Prize[]>>;
  activePrize: Prize | null;
  setActivePrize: (prize: Prize) => void;
  isDrawing: boolean;
}

const IconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Coins: Coins,
  Wallet: Wallet,
  Shirt: Shirt,
  CupSoda: CupSoda,
  Notebook: Notebook,
  Zap: Zap
};

export default function PrizeManager({
  prizes,
  setPrizes,
  activePrize,
  setActivePrize,
  isDrawing
}: PrizeManagerProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCashValue, setNewCashValue] = useState(5000);
  const [newCount, setNewCount] = useState(3);
  const [newIcon, setNewIcon] = useState("Coins");

  const handleAdjustStock = (id: string, delta: number) => {
    if (isDrawing) return;
    setPrizes(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newRemaining = Math.max(0, Math.min(p.count, p.remaining + delta));
          return { ...p, remaining: newRemaining };
        }
        return p;
      })
    );
  };

  const handleAddCustomPrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newPrize: Prize = {
      id: `custom-${Date.now()}`,
      title: newTitle,
      description: newDesc || "Custom sponsor reward",
      count: newCount,
      remaining: newCount,
      icon: newIcon,
      color: "from-purple-500 to-indigo-700 text-indigo-800",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
      cashValue: Number(newCashValue) || 1000
    };

    setPrizes(prev => [...prev, newPrize]);
    if (!activePrize) {
      setActivePrize(newPrize);
    }
    setShowCustomModal(false);
    
    // Reset forms
    setNewTitle("");
    setNewDesc("");
    setNewCashValue(5000);
    setNewCount(3);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-premium">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-brand-dark tracking-tight">
            🎁 Select Active Prize
          </h2>
          <p className="text-xs text-brand-muted">Select what prize to raffle next</p>
        </div>
        <button
          onClick={() => setShowCustomModal(true)}
          className="text-xs font-heading font-bold text-brand-blue bg-blue-50 border border-blue-100 hover:border-brand-blue px-3 py-2 rounded-xl active:scale-95 transition-all cursor-pointer"
        >
          + Custom Prize
        </button>
      </div>

      <div className="space-y-3.5">
        {prizes.map((prize) => {
          const IconComponent = IconMap[prize.icon] || Coins;
          const isActive = activePrize?.id === prize.id;
          const isOut = prize.remaining <= 0;

          return (
            <div
              key={prize.id}
              onClick={() => {
                if (!isDrawing && !isOut) {
                  setActivePrize(prize);
                }
              }}
              className={`group flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                isOut
                  ? "border-slate-100 bg-slate-50/50 opacity-60"
                  : isActive
                  ? "border-brand-blue bg-brand-blue/5 shadow"
                  : "border-slate-150 bg-white hover:border-brand-blue hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-4 max-w-[70%]">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${prize.color.includes("from-") ? prize.color : "from-slate-200 to-slate-300"} flex items-center justify-center font-bold text-lg text-white shadow-sm shrink-0`}>
                  <IconComponent size={20} className="stroke-[2.2]" />
                </div>
                
                <div className="text-left overflow-hidden">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-heading font-extrabold text-sm text-brand-dark leading-tight group-hover:text-brand-blue transition-colors">
                      {prize.title}
                    </h4>
                    {isActive && (
                      <span className="text-[9px] bg-brand-green/20 text-emerald-800 px-1.5 py-0.5 rounded font-display font-medium tracking-wider animate-pulse border border-brand-green/30">
                        ACTIVE TARGET
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-muted mt-0.5 truncate max-w-sm">
                    {prize.description}
                  </p>
                </div>
              </div>

              {/* Controls for Event Host */}
              <div className="flex items-center gap-3.5" onClick={e => e.stopPropagation()}>
                {/* Stock tracker badges */}
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-brand-dark">
                    {prize.remaining} / {prize.count} LEFT
                  </div>
                  <div className="text-[10px] font-mono text-brand-muted">
                    ₦{prize.cashValue.toLocaleString()} val
                  </div>
                </div>

                {/* Adjustments buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleAdjustStock(prize.id, 1)}
                    disabled={isDrawing || prize.remaining >= prize.count}
                    className="p-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Increment remaining stock"
                  >
                    <Plus size={10} />
                  </button>
                  <button
                    onClick={() => handleAdjustStock(prize.id, -1)}
                    disabled={isDrawing || prize.remaining <= 0}
                    className="p-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Decrement remaining stock"
                  >
                    <Minus size={10} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Overlay Slide modal for custom prize addition */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-brand-dark/20 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-heading font-extrabold text-brand-dark mb-4 flex items-center gap-2">
              <Sparkles className="text-brand-green" size={20} /> Add Custom Raffle Prize
            </h3>
            
            <form onSubmit={handleAddCustomPrize} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase tracking-wider font-mono">
                  Prize Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. customized Cowrywise T-Shirt"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-blue focus:outline-hidden font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase tracking-wider font-mono">
                  Description
                </label>
                <textarea
                  placeholder="What's included in this reward bundle?"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full h-20 px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-brand-blue focus:outline-hidden font-sans resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase tracking-wider font-mono">
                    Naira Value (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newCashValue}
                    onChange={e => setNewCashValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-blue focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase tracking-wider font-mono">
                    Total Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    maxLength={3}
                    value={newCount}
                    onChange={e => setNewCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-blue focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase tracking-wider font-mono">
                  Icon Category
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {Object.keys(IconMap).map((iconKey) => {
                    const PreviewIcon = IconMap[iconKey];
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setNewIcon(iconKey)}
                        className={`p-2.5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                          newIcon === iconKey
                            ? "border-brand-blue bg-blue-50 text-brand-blue"
                            : "border-slate-100 hover:border-slate-300 text-slate-600"
                        }`}
                      >
                        <PreviewIcon size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-55 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-blue text-white hover:bg-blue-600 text-xs font-semibold shadow-lg hover:shadow-xl cursor-pointer"
                >
                  Import Prize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
