import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, doc, setDoc, runTransaction, onSnapshot, query, where } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Ticket, Phone, User, CheckCircle, Download, Sparkles, Award, ShieldAlert } from "lucide-react";

interface TicketData {
  id: string;
  ticketNumber: number;
  name: string;
  contact: string;
  assignedAt: string;
  drawn: boolean;
  prizeTitle?: string;
  spotlight?: boolean;
}

export default function HomeGenerator() {
  const [whatsapp, setWhatsapp] = useState("");
  const [fullName, setFullName] = useState("");
  
  const [createdTicket, setCreatedTicket] = useState<TicketData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [isFresh, setIsFresh] = useState(false);

  // Administrative spotlight banner listener
  const [spotlightedWinners, setSpotlightedWinners] = useState<TicketData[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Listen for spotlighted winners pinned by administrators
  useEffect(() => {
    const q = query(collection(db, "tickets"), where("drawn", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: TicketData[] = [];
      snapshot.forEach((docRef) => {
        const data = docRef.data();
        if (data.spotlight === true) {
          list.push({ id: docRef.id, ...data } as TicketData);
        }
      });
      setSpotlightedWinners(list);
    }, (err) => {
      console.warn("Could not load spotlighted winners", err);
    });
    return () => unsubscribe();
  }, []);

  // Trigger canvas drawing once a ticket is loaded/generated
  useEffect(() => {
    if (createdTicket && canvasRef.current) {
      drawTicket(createdTicket);
    }
  }, [createdTicket]);

  // Premium Canvas Drawings (Generates 1200x750 high resolution canvas for pristine PNG exports)
  const drawTicket = (tk: TicketData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions
    const width = 1000;
    const height = 620;
    canvas.width = width;
    canvas.height = height;

    // 1. Dark Velvet Background Gradient
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
    bgGrad.addColorStop(0, "#12100E"); // Warm obsidian mocha core
    bgGrad.addColorStop(1, "#000000"); // Infinite void
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Sophisticated Laser Mesh Background lines
    ctx.strokeStyle = "rgba(16, 185, 129, 0.04)"; // Neon Emerald tracer lines
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 200, height);
      ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(width, j + 100);
      ctx.stroke();
    }

    // 3. Perfect Volcanic Slate #23211F Outer Bevel
    ctx.strokeStyle = "#23211F";
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // 4. Emerald Neon Glow Accent Border (Apple Style precision hairlines)
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // 5. Tech Corner Bracket highlights
    ctx.fillStyle = "#10B981";
    const bLen = 24;
    const padding = 20;
    // Top Left Bracket
    ctx.fillRect(padding, padding, bLen, 4);
    ctx.fillRect(padding, padding, 4, bLen);
    // Top Right Bracket
    ctx.fillRect(width - padding - bLen, padding, bLen, 4);
    ctx.fillRect(width - padding - 4, padding, 4, bLen);
    // Bottom Left Bracket
    ctx.fillRect(padding, height - padding - 4, bLen, 4);
    ctx.fillRect(padding, height - padding - bLen, 4, bLen);
    // Bottom Right Bracket
    ctx.fillRect(width - padding - bLen, height - padding - 4, bLen, 4);
    ctx.fillRect(width - padding - 4, height - padding - bLen, 4, bLen);

    // 6. Glowing Circular Decals (Abstract Tech Core)
    ctx.fillStyle = "rgba(0, 102, 255, 0.08)"; // Deep Cowry Blue
    ctx.beginPath();
    ctx.arc(width - 150, height / 2 - 20, 180, 0, Math.PI * 2);
    ctx.fill();

    // 7. Metallic Hologram Chip (Skeuomorphic gold/silver security chip)
    ctx.fillStyle = "#1E1B19";
    ctx.strokeStyle = "#23211F";
    ctx.lineWidth = 2;
    const chipX = 80;
    const chipY = 80;
    const chipW = 80;
    const chipH = 60;
    // Chip body
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(chipX, chipY, chipW, chipH, 8) : ctx.rect(chipX, chipY, chipW, chipH);
    ctx.fill();
    ctx.stroke();

    // Chip Golden circuitry tracings
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(chipX + 20, chipY);
    ctx.lineTo(chipX + 20, chipY + chipH);
    ctx.moveTo(chipX + 40, chipY);
    ctx.lineTo(chipX + 40, chipY + chipH);
    ctx.moveTo(chipX + 60, chipY);
    ctx.lineTo(chipX + 60, chipY + chipH);
    ctx.moveTo(chipX, chipY + 30);
    ctx.lineTo(chipX + chipW, chipY + 30);
    ctx.stroke();

    // 8. Branding Header texts
    // Title
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 26px Outfit, 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("COWRYWISE NOUN AMBASSADOR", 190, 105);

    // Subtitle
    ctx.fillStyle = "#10B981";
    ctx.font = "bold 16px 'JetBrains Mono', monospace";
    ctx.fillText("LAGOS LCC HANGOUT 2026 • OFFICIAL ATTENDEE BADGE", 190, 135);

    // 9. Main Descriptive lines
    ctx.fillStyle = "#9B9691";
    ctx.font = "14px 'JetBrains Mono', monospace";
    ctx.fillText("STATUS: VERIFIED SECURE ADMIT ONE", 80, 220);

    // 10. Attendee Meta Information
    // Name Label
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText("HOLDER NAME", 80, 270);
    // Name Value
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 38px Outfit, 'Plus Jakarta Sans', sans-serif";
    const formatName = tk.name.toUpperCase();
    ctx.fillText(formatName, 80, 315);

    // Contact Label
    ctx.fillStyle = "#9B9691";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText("WHATSAPP HANDLE", 80, 380);
    // Contact Value
    ctx.fillStyle = "#10B981";
    ctx.font = "bold 22px 'Space Grotesk', sans-serif";
    ctx.fillText(tk.contact, 80, 415);

    // 11. Digital Fingerprint Barcode / Decal
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(80, 460, 450, 45);
    ctx.fillStyle = "#E2E8F0";
    ctx.font = "8px 'JetBrains Mono', monospace";
    // Mock SHA256 hashes
    const mockHash = `AUTH-SIG::SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}-LCC2026-FPRNT`;
    ctx.fillText(mockHash, 90, 485);

    // Draw simulated barcode lines on top
    ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
    ctx.lineWidth = 2;
    for (let c = 80; c < 480; c += Math.random() * 8 + 4) {
      ctx.beginPath();
      ctx.moveTo(c, 460);
      ctx.lineTo(c, 460 + 18);
      ctx.stroke();
    }

    // 12. Giant Hologram Raffle Seat Number (Main visual Anchor)
    // Box Framing
    ctx.fillStyle = "#141211";
    ctx.strokeStyle = "#23211F";
    ctx.lineWidth = 3;
    const boxX = 640;
    const boxY = 210;
    const boxW = 280;
    const boxH = 280;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(boxX, boxY, boxW, boxH, 20) : ctx.rect(boxX, boxY, boxW, boxH);
    ctx.fill();
    ctx.stroke();

    // Box Header Label
    ctx.fillStyle = "#9B9691";
    ctx.font = "semibold 12px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("LUCKY DRAW NUMBER", boxX + boxW / 2, boxY + 45);

    // Seat Number
    ctx.fillStyle = "#0066FF";
    ctx.font = "bold 96px 'Space Grotesk', sans-serif";
    const formattedSeat = `#${tk.ticketNumber.toString().padStart(3, "0")}`;
    ctx.fillText(formattedSeat, boxX + boxW / 2, boxY + 165);

    // Secondary Meta
    ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillText("COWRYWISE AMBASSADOR POOL", boxX + boxW / 2, boxY + 225);

    ctx.fillStyle = "#9B9691";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillText("GUARANTEED SPHERE ENTRY", boxX + boxW / 2, boxY + 250);

    // Reset text align
    ctx.textAlign = "left";

    // 13. Generated Timestamp
    ctx.fillStyle = "#23211F";
    ctx.fillRect(20, height - 45, width - 40, 1);
    ctx.fillStyle = "#9B9691";
    ctx.font = "10px 'JetBrains Mono', monospace";
    const dateStr = new Date(tk.assignedAt).toUTCString().toUpperCase();
    ctx.fillText(`TIMESTAMP: ${dateStr}`, 40, height - 25);
    ctx.textAlign = "right";
    ctx.fillText("VERIFICATION ENGINE HOSTED SECURELY ON CLOUD RUN", width - 40, height - 25);
    ctx.textAlign = "left";
  };

  // One click image downloader
  const handleDownloadImage = () => {
    if (!createdTicket || !canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      const normalizedName = createdTicket.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      link.download = `cowrywise_rffle_ticket_${normalizedName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Downloader failed", e);
      alert("A browser boundary blocked direct trigger download. Please long press/right click the card to save!");
    }
  };

  // Cleant up WhatsApp input
  const cleanFormatContact = (raw: string) => {
    // Strip empty spaces, brackets, hyphens
    return raw.replace(/[\s\(\)\-\+]/g, "").trim();
  };

  // Instant generation logic
  const handleGenerateRaffle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    const targetContact = cleanFormatContact(whatsapp);
    if (!targetContact) {
      setErrorText("A valid WhatsApp number is required to search or generate your ticket!");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Check if this WhatsApp number is already registered!
      // This allows them to retrieve their card instantly with zero friction.
      const freshPoolRef = collection(db, "tickets");
      const q = query(freshPoolRef, where("contact", "==", targetContact));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Matches! Load this existing record
        const docSnap = querySnapshot.docs[0];
        setCreatedTicket({ id: docSnap.id, ...docSnap.data() } as TicketData);
        setIsFresh(false);
        setIsSubmitting(false);
        return;
      }

      // 2. Not registered yet! We must proceed with a fresh secure allocation
      // First, get all occupied seats outside the transaction to minimize blocking
      const currentSnaps = await getDocs(freshPoolRef);
      const occupied = new Set<number>();
      
      currentSnaps.forEach((docSnap) => {
        const num = docSnap.data().ticketNumber;
        if (typeof num === "number") {
          occupied.add(num);
        }
      });

      // Calculate unoccupied pool 0-400
      const available: number[] = [];
      for (let i = 0; i <= 400; i++) {
        if (!occupied.has(i)) {
          available.push(i);
        }
      }

      if (available.length === 0) {
        throw new Error("Raffle Registry Limit Reached: All 401 coupon slots are completely booked!");
      }

      // Randomly allocate a seat digit
      const randomIndex = Math.floor(Math.random() * available.length);
      const chosenSeat = available[randomIndex];

      // Formulate display Name fallback
      const displayTitle = fullName.trim() !== "" ? fullName.trim() : `LCC Guest #${chosenSeat}`;

      // 3. Perform compliant write
      const targetDocId = chosenSeat.toString();
      const newRef = doc(db, "tickets", targetDocId);

      const ticketPayload = {
        ticketNumber: chosenSeat,
        name: displayTitle,
        contact: targetContact,
        assignedAt: new Date().toISOString(),
        drawn: false,
        prizeTitle: ""
      };

      await setDoc(newRef, ticketPayload);

      setCreatedTicket({ id: targetDocId, ...ticketPayload });
      setIsFresh(true);

    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Failed to generate entry. Please verify internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetGenerator = () => {
    setCreatedTicket(null);
    setWhatsapp("");
    setFullName("");
    setErrorText("");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-12 space-y-8 pb-24">
      
      {/* 1. Administrative spotlight alerts */}
      {spotlightedWinners.length > 0 && (
        <div className="bg-[#141211] border-2 border-[#10B981] rounded-3xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden animate-pulse">
          <div className="absolute top-0 right-0 p-3 text-xs font-mono text-[#10B981] tracking-widest flex items-center gap-1">
            <Sparkles size={11} className="animate-spin" /> LIVE BROADCAST
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#10B981]/10 flex items-center justify-center text-[#10B981] shrink-0 border border-[#10B981]/20">
              <Award size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-mono text-[#10B981] tracking-wider uppercase font-black">
                CONGRATULATIONS TO OUR SPECIAL HANGOUT WINNER!
              </h2>
              <p className="text-xl font-heading font-black text-white uppercase tracking-tight mt-1">
                {spotlightedWinners[0].name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Just bagged the prestigious <b className="text-[#10B981]">{spotlightedWinners[0].prizeTitle}</b>! Look at seat #{spotlightedWinners[0].ticketNumber.toString().padStart(3, "0")} shining!
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-[#0B0A09] border border-[#23211F] text-center shrink-0">
              <span className="text-[9px] font-mono text-slate-500 block uppercase">SEAT POOL</span>
              <span className="text-xl font-display font-black text-[#0066FF] leading-none block mt-0.5">
                #{spotlightedWinners[0].ticketNumber.toString().padStart(3, "0")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Visual Header Deck */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-[#0066FF]/10 border border-[#0066FF]/20 px-3.5 py-1.5 rounded-full shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
          <span className="font-mono text-[10px] tracking-widest text-[#0066FF] uppercase font-black">
            LAGOS LCC HANGOUT 2026
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-white uppercase leading-none">
          Ambassador Ticket Cabin
        </h1>
        <p className="text-xs md:text-sm text-[#9B9691] font-medium max-w-xl mx-auto leading-relaxed">
          Input your registered Whatsapp handle below to instantly claim your custom physical ticket badge and lock your admission slot into the live automated sphere.
        </p>
      </div>

      {/* 3. Screen States Toggle */}
      {!createdTicket ? (
        // --- ADMISSION FORM SCREEN ---
        <div className="max-w-xl mx-auto bg-[#141211] border-2 border-[#23211F] p-8 md:p-10 rounded-3xl shadow-tactile-lg space-y-6">
          
          <div className="border-b border-[#23211F] pb-4 text-left">
            <h3 className="text-sm font-heading font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Ticket size={16} className="text-[#10B981]" /> INSTANT REGISTRATION FORM
            </h3>
            <p className="text-[10px] text-slate-500 font-mono text-left uppercase mt-1">
              Guest access authorized • No passwords needed
            </p>
          </div>

          <form onSubmit={handleGenerateRaffle} className="space-y-5 text-left">
            <div>
              <label htmlFor="form-whatsapp" className="block text-[10px] font-mono text-[#9B9691] tracking-widest uppercase font-black mb-2">
                WhatsApp Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9B9691] pointer-events-none">
                  <Phone size={15} />
                </span>
                <input
                  type="text"
                  id="form-whatsapp"
                  required
                  placeholder="e.g. 2348012345678"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-[#0B0A09] border-2 border-[#23211F] focus:border-[#0066FF] hover:border-[#1E1B19] rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-700 font-display transition-all focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5 leading-normal">
                Strict single allocation verified. Entering an existing WhatsApp will instantly retrieve your verified seat!
              </p>
            </div>

            <div>
              <label htmlFor="form-fullname" className="block text-[10px] font-mono text-[#9B9691] tracking-widest uppercase font-black mb-2">
                Full Name <span className="text-slate-600 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9B9691] pointer-events-none">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  id="form-fullname"
                  placeholder="e.g. Favour Nathaniel"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#0B0A09] border-2 border-[#23211F] focus:border-[#0066FF] hover:border-[#1E1B19] rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-700 font-display transition-all focus:outline-none"
                />
              </div>
            </div>

            {errorText && (
              <div className="bg-red-950/20 border-2 border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-2 text-xs">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{errorText}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full cursor-pointer bg-[#0066FF] hover:bg-[#0055DD] text-white font-heading font-black text-xs uppercase tracking-widest py-4.5 rounded-2xl border-2 border-[#0066FF] shadow-tactile-md transition-all active:translate-y-0.5 disabled:opacity-40"
            >
              {isSubmitting ? "SYNCING LEDGER..." : "GENERATE MY BADGE"}
            </button>
          </form>

        </div>
      ) : (
        // --- SUCCESS GRAPHICS BADGE STAGE ---
        <div className="space-y-6 animate-fade-in text-center max-w-3xl mx-auto">
          
          <div className="inline-flex items-center gap-2 bg-[#10B981]/15 border border-[#10B981]/25 px-4 py-2 rounded-full animate-bounce">
            <CheckCircle size={15} className="text-[#10B981]" />
            <span className="font-mono text-[10px] tracking-widest text-[#10B981] uppercase font-black">
              {isFresh ? "BADGE REGISTRATION SECURED!" : "BADGE RETRIEVED SECURELY!"}
            </span>
          </div>

          {/* Canvas Wrapper */}
          <div className="bg-[#141211] border-2 border-[#23211F] p-4 sm:p-6 rounded-3xl shadow-tactile-lg max-w-full overflow-hidden flex flex-col items-center justify-center">
            {/* Visual HTML5 Canvas */}
            <canvas
              ref={canvasRef}
              className="max-w-full rounded-2xl w-full border border-slate-900 border-dashed"
              style={{ maxHeight: "420px", objectFit: "contain" }}
            />
          </div>

          {/* Action Tools */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleDownloadImage}
              className="w-full sm:w-auto cursor-pointer bg-[#10B981] hover:bg-[#0EA271] text-[#000000] font-heading font-black text-xs uppercase tracking-widest px-10 py-4 rounded-xl border-2 border-[#10B981] shadow-tactile-md active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Download size={14} strokeWidth={3} />
              DOWNLOAD HIGH-RES BADGE (.PNG)
            </button>

            <button
              onClick={handleResetGenerator}
              className="w-full sm:w-auto cursor-pointer bg-transparent hover:bg-[#1C1A18] text-[#9B9691] hover:text-white font-heading font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl border-2 border-[#23211F] transition-all"
            >
              SEARCH / GENERATE ANOTHER
            </button>
          </div>

          <p className="text-[10px] font-mono text-[#9B9691] max-w-md mx-auto leading-relaxed">
            Your drawing entry seat is locked into the automated wheel database. Keep this PNG safe to claim your physical loot box during live draws.
          </p>

        </div>
      )}

    </div>
  );
}
