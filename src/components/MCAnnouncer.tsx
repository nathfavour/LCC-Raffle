import React, { useState, useEffect } from "react";
import { MCCharacter, Participant, Prize } from "../types";
import { MC_CHARACTERS, LOCAL_COMMENTARY_TEMPLATES } from "../data";
import { Sparkles, MessageCircle, Volume2, HelpCircle, Loader2 } from "lucide-react";

interface MCAnnouncerProps {
  lastWinner: Participant | null;
  lastPrize: Prize | null;
  selectedMc: MCCharacter;
  setSelectedMc: (mc: MCCharacter) => void;
  isDrawing: boolean;
  mcCommentary: string;
  setMcCommentary: (text: string) => void;
  isAiPowered: boolean;
  setIsAiPowered: (val: boolean) => void;
}

export default function MCAnnouncer({
  lastWinner,
  lastPrize,
  selectedMc,
  setSelectedMc,
  isDrawing,
  mcCommentary,
  setMcCommentary,
  isAiPowered,
  setIsAiPowered
}: MCAnnouncerProps) {
  const [loading, setLoading] = useState(false);

  // Trigger commentary fetch when last winner changes
  useEffect(() => {
    if (lastWinner && lastPrize) {
      generateHype(lastWinner.name, lastPrize.title, selectedMc);
    } else {
      setMcCommentary("Welcome to LCC Cowrywise NOUN Ambassadors Hangout draws! Select a prize on the right, and spin to get our first saving champion!");
      setIsAiPowered(false);
    }
  }, [lastWinner, lastPrize]);

  // Generate on MC swap if winner already present
  const handleMcChange = (mc: MCCharacter) => {
    setSelectedMc(mc);
    if (lastWinner && lastPrize) {
      generateHype(lastWinner.name, lastPrize.title, mc);
    }
  };

  const generateHype = async (winnerName: string, prizeTitle: string, mcChar: MCCharacter) => {
    setLoading(true);
    setMcCommentary("");
    
    try {
      // API request to the backend Gemini proxy route
      const response = await fetch("/api/mc-hype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerName: winnerName,
          prizeTitle: prizeTitle,
          characterName: mcChar.name,
          characterRole: mcChar.role
        })
      });

      const data = await response.json();
      
      if (data.success && data.commentary) {
        setMcCommentary(data.commentary);
        setIsAiPowered(true);
      } else {
        // Fallback locally
        offlineGenerate(winnerName, prizeTitle, mcChar.name);
      }
    } catch (e) {
      console.warn("Gemini server proxy missing/inactive. Falling back offline.", e);
      offlineGenerate(winnerName, prizeTitle, mcChar.name);
    } finally {
      setLoading(false);
    }
  };

  const offlineGenerate = (winnerName: string, prizeTitle: string, mcName: string) => {
    const templates = LOCAL_COMMENTARY_TEMPLATES[mcName] || LOCAL_COMMENTARY_TEMPLATES["MC Kaydee"];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    const text = randomTemplate
      .replaceAll("{winner}", winnerName)
      .replaceAll("{prize}", prizeTitle);
    
    setMcCommentary(text);
    setIsAiPowered(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-premium">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-brand-dark tracking-tight flex items-center gap-2">
            📢 MC Hype Crew Console
          </h2>
          <p className="text-xs text-brand-muted">Configure active mic announcer character for the event</p>
        </div>

        {/* Character select row */}
        <div className="flex items-center gap-2">
          {MC_CHARACTERS.map((char) => {
            const isSelected = selectedMc.name === char.name;
            return (
              <button
                key={char.name}
                onClick={() => handleMcChange(char)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "border-brand-blue bg-blue-50 text-brand-blue shadow-xs font-heading"
                    : "border-slate-100 bg-white hover:border-slate-200 text-slate-500 hover:text-slate-700"
                }`}
              >
                <span>{char.avatar}</span>
                <span>{char.name.split(" ")[1] || char.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main MC Speech Bubble Canvas */}
      <div className="relative bg-slate-50 rounded-2xl border border-slate-100 p-5 mt-4 flex items-start gap-4 shadow-inner">
        {/* Hype person avatar badge */}
        <div className={`w-14 h-14 rounded-2xl ${selectedMc.avatarBg} shadow-md flex flex-col items-center justify-center text-2xl font-bold shrink-0 animate-bounce cursor-default select-none`}>
          {selectedMc.avatar}
        </div>

        {/* Speech text frame */}
        <div className="flex-1 text-left relative">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-heading font-extrabold text-brand-dark leading-none">
              {selectedMc.name} <span className="text-[10px] font-medium text-brand-muted font-sans font-normal">({selectedMc.role})</span>
            </span>
            
            {/* AI Power Status */}
            {isAiPowered && !loading ? (
              <span className="text-[9px] bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-1 shadow-xs border border-indigo-400">
                <Sparkles size={8} className="fill-white" />
                Gemini AI Generated
              </span>
            ) : !loading ? (
              <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded border border-slate-200">
                Local Soundboard
              </span>
            ) : null}
          </div>

          {/* Comment contents */}
          <div className="text-sm text-slate-700 font-sans italic relative pr-2 leading-relaxed min-h-[40px]">
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="animate-spin text-brand-blue" size={16} />
                <span className="text-xs font-mono">Writing funny Nigerian commentary...</span>
              </div>
            ) : isDrawing ? (
              <div className="flex items-center gap-2 text-brand-blue font-bold">
                <Volume2 className="animate-pulse" size={16} />
                <span className="text-xs font-mono uppercase tracking-widest animate-bounce">
                  "ROLLING THE DRUM BEAT! PLS PRAY FOR YOUR STASH!"
                </span>
              </div>
            ) : (
              <p>"{mcCommentary}"</p>
            )}
          </div>
          
          {/* Audio cue info */}
          {!loading && !isDrawing && lastWinner && (
            <div className="mt-2.5 flex items-center gap-1">
              <span className="text-[9px] text-brand-muted font-medium uppercase tracking-wider">
                💡 EVENT HOST TIP: You can read this aloud with extreme energy into your microphone!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
