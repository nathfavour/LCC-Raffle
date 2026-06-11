import React, { useState } from "react";
import { Participant } from "../types";
import { Users, UserPlus, FileText, ToggleLeft, ToggleRight, Trash2, RotateCcw, Search, Sparkles } from "lucide-react";

interface ParticipantManagerProps {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  isDrawing: boolean;
  onResetToDefault: () => void;
}

export default function ParticipantManager({
  participants,
  setParticipants,
  isDrawing,
  onResetToDefault
}: ParticipantManagerProps) {
  const [singleName, setSingleName] = useState("");
  const [singleUsername, setSingleUsername] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "bulk">("list");

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;

    // Standardized username tags if missing
    const formattedUsername = singleUsername.trim()
      ? (singleUsername.startsWith("@") ? singleUsername.trim() : `@${singleUsername.trim()}`)
      : `@${singleName.trim().toLowerCase().replaceAll(" ", "_")}_save`;

    const newDelegate: Participant = {
      id: `delegate-${Date.now()}`,
      name: singleName.trim(),
      username: formattedUsername,
      active: true,
      won: false
    };

    setParticipants(prev => [newDelegate, ...prev]);
    setSingleName("");
    setSingleUsername("");
  };

  const handleAddBulk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    // Splits on commas or line breaks
    const rawLines = bulkText.split(/[\n,]+/);
    const parsedDelegates: Participant[] = [];

    rawLines.forEach((line, idx) => {
      const clean = line.trim();
      if (!clean) return;

      // Detect if there's username or email separated by space or parentheses
      // format: "Favour Nathaniel (@nath)" or "Favour Nathaniel"
      let name = clean;
      let username = "";
      
      const regexMatch = clean.match(/^([^(]+)\s*(?:\(([^)]+)\)|@(\w+))?$/);
      if (regexMatch) {
        name = regexMatch[1].trim();
        const detectedUser = regexMatch[2] || regexMatch[3];
        if (detectedUser) {
          username = detectedUser.startsWith("@") ? detectedUser.trim() : `@${detectedUser.trim()}`;
        }
      }

      if (!username) {
        username = `@${name.toLowerCase().replaceAll(" ", "_")}_saves`;
      }

      parsedDelegates.push({
        id: `bulk-${Date.now()}-${idx}`,
        name: name,
        username: username,
        active: true,
        won: false
      });
    });

    if (parsedDelegates.length > 0) {
      setParticipants(prev => [...parsedDelegates, ...prev]);
      setBulkText("");
      alert(`Imported ${parsedDelegates.length} ambassadors successfully!`);
    }
  };

  const handleToggleActive = (id: string) => {
    if (isDrawing) return;
    setParticipants(prev =>
      prev.map(p => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const handleDelete = (id: string) => {
    if (isDrawing) return;
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  // Filter based on search query
  const filtered = participants.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-premium h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-brand-dark tracking-tight">
            👥 Ambassador Directory
          </h2>
          <p className="text-xs text-brand-muted">
            Total registered list: {participants.length} • Eligible: {participants.filter(p => p.active && !p.won).length}
          </p>
        </div>
        <button
          onClick={onResetToDefault}
          disabled={isDrawing}
          className="text-[10px] font-heading font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
          title="Reset back to standard preset pool"
        >
          <RotateCcw size={12} />
          Reset Preset
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mb-5 text-sm">
        <button
          onClick={() => setActiveTab("list")}
          className={`pb-2.5 border-b-2 font-display font-semibold transition-all px-4 cursor-pointer flex items-center gap-1.5 ${
            activeTab === "list"
              ? "border-brand-blue text-brand-blue"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Users size={15} />
          Manage & Add ({filtered.length})
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={`pb-2.5 border-b-2 font-display font-semibold transition-all px-4 cursor-pointer flex items-center gap-1.5 ${
            activeTab === "bulk"
              ? "border-brand-blue text-brand-blue"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <FileText size={15} />
          Bulk CSV Import
        </button>
      </div>

      {activeTab === "list" ? (
        <div className="space-y-4 flex flex-col flex-1">
          {/* Quick Add Form Section */}
          <form onSubmit={handleAddSingle} className="bg-brand-light/40 border border-slate-100 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-bold text-brand-muted tracking-wider uppercase font-mono block">
              Quick Recruit Ambassador
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                placeholder="Ambassador Full Name"
                value={singleName}
                onChange={e => setSingleName(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-brand-blue focus:outline-hidden font-sans bg-white"
              />
              <input
                type="text"
                placeholder="Twitter / Instagram Tag"
                value={singleUsername}
                onChange={e => setSingleUsername(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-brand-blue focus:outline-hidden font-mono bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={isDrawing || !singleName.trim()}
              className="w-full py-2 bg-brand-blue hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-display font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <UserPlus size={14} /> Add Ambassador Entry
            </button>
          </form>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by name or @handle..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-hidden focus:border-brand-blue focus:bg-white"
            />
          </div>

          {/* Directory Scroll List */}
          <div className="overflow-y-auto max-h-[300px] border border-slate-50 rounded-2xl divide-y divide-slate-100 pr-1 flex-1">
            {filtered.length > 0 ? (
              filtered.map((delegate) => (
                <div
                  key={delegate.id}
                  className={`flex items-center justify-between py-2.5 px-3 hover:bg-slate-50/50 transition-colors ${
                    delegate.won ? "bg-emerald-50/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-[50%]">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-heading ${
                      delegate.won 
                        ? "bg-emerald-100 text-emerald-800" 
                        : "bg-blue-50 text-brand-blue"
                    }`}>
                      {delegate.name.slice(0, 1)}
                    </div>
                    <div className="text-left overflow-hidden">
                      <div className="flex items-center gap-1">
                        <span className="font-heading font-bold text-xs text-brand-dark leading-tight truncate">
                          {delegate.name}
                        </span>
                        {delegate.won && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded-sm shrink-0">
                            Won
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-brand-muted truncate block">
                        {delegate.username}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleActive(delegate.id)}
                      disabled={isDrawing || delegate.won}
                      className={`p-1.5 rounded-lg active:scale-95 transition-all cursor-pointer ${
                        delegate.won
                          ? "text-slate-300 cursor-not-allowed"
                          : delegate.active
                          ? "text-brand-green hover:bg-emerald-50"
                          : "text-slate-300 hover:bg-slate-100"
                      }`}
                      title={delegate.active ? "Exclude from next draw (mark absent)" : "Include in next draw (mark present)"}
                    >
                      {delegate.active ? <ToggleRight size={22} className="text-brand-green" /> : <ToggleLeft size={22} className="text-slate-300" />}
                    </button>

                    <button
                      onClick={() => handleDelete(delegate.id)}
                      disabled={isDrawing}
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg active:scale-95 transition-all cursor-pointer"
                      title="Remove delegate"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-brand-muted">
                No matching ambassadors found.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          <form onSubmit={handleAddBulk} className="flex flex-col flex-1 justify-between gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase tracking-wider font-mono">
                Paste CSV names / Line-separated list
              </label>
              <textarea
                placeholder="Favour Nathaniel, Chinedu Okafor (@chinedu), Amina Yusuf, Tunde Balogun..."
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                className="w-full h-44 p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-blue focus:outline-hidden rounded-xl text-xs font-mono resize-none leading-relaxed"
              />
              <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">
                * Input format can be plain names or contain social media handles in parenthesis like: <code className="bg-slate-100 px-1 py-0.5 rounded">Favour (@fave)</code>. Commas, semicolons, and line breaks are supported.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isDrawing || !bulkText.trim()}
              className="w-full py-3 bg-[#0c2340] hover:bg-brand-dark disabled:bg-slate-100 disabled:text-slate-400 text-white font-display font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              <Sparkles size={14} className="text-brand-green" /> Import Bulk Ambassadors
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
