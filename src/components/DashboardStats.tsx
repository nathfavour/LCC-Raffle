import React from "react";
import { Participant, Prize } from "../types";
import { Users, Coins, Gift, Percent } from "lucide-react";

interface DashboardStatsProps {
  participants: Participant[];
  prizes: Prize[];
}

export default function DashboardStats({ participants, prizes }: DashboardStatsProps) {
  const activeCount = participants.filter(p => p.active && !p.won).length;
  const wonCount = participants.filter(p => p.won).length;
  
  // Calculate total cash stashes value distributed
  const totalPrizeDistributedValue = prizes.reduce((acc, prize) => {
    const itemsDistributed = prize.count - prize.remaining;
    return acc + (itemsDistributed * prize.cashValue);
  }, 0);

  // Total cash stashes left to win
  const totalPrizeRemainingValue = prizes.reduce((acc, prize) => {
    return acc + (prize.remaining * prize.cashValue);
  }, 0);

  const totalPossible = participants.length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-8">
      {/* Stat 1: Pool size */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4 hover:border-slate-200 transition-all">
        <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
          <Users size={24} />
        </div>
        <div>
          <span className="block text-xs font-medium text-brand-muted uppercase tracking-wider">
            Active Pool
          </span>
          <span className="text-2xl font-heading font-extrabold text-brand-dark">
            {activeCount} <span className="text-xs font-normal text-brand-muted">/ {totalPossible}</span>
          </span>
        </div>
      </div>

      {/* Stat 2: Total Cash Granted */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4 hover:border-slate-200 transition-all">
        <div className="w-12 h-12 rounded-xl bg-brand-green/15 flex items-center justify-center text-emerald-600">
          <Coins size={24} />
        </div>
        <div>
          <span className="block text-xs font-medium text-brand-muted uppercase tracking-wider">
            Cash Granted
          </span>
          <span className="text-2xl font-heading font-extrabold text-[#0c2340]">
            ₦{totalPrizeDistributedValue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Stat 3: Total Prizes Left */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4 hover:border-slate-200 transition-all">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
          <Gift size={24} />
        </div>
        <div>
          <span className="block text-xs font-medium text-brand-muted uppercase tracking-wider">
            Stock Left
          </span>
          <span className="text-2xl font-heading font-extrabold text-brand-dark">
            {prizes.reduce((sum, p) => sum + p.remaining, 0)} <span className="text-xs font-normal text-brand-muted">items</span>
          </span>
        </div>
      </div>

      {/* Stat 4: Crowd Win Ratio */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4 hover:border-slate-200 transition-all">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
          <Percent size={24} />
        </div>
        <div>
          <span className="block text-xs font-medium text-brand-muted uppercase tracking-wider">
            Ambassador Wins
          </span>
          <span className="text-2xl font-heading font-extrabold text-brand-dark font-display">
            {totalPossible > 0 ? Math.round((wonCount / totalPossible) * 100) : 0}%
          </span>
        </div>
      </div>
    </div>
  );
}
