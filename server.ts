import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Google GenAI instantiation (lazy check)
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
    try {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini API successfully connected to server routing");
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI:", e);
    }
  } else {
    console.log("No Gemini API key detected. Running offline/fallback local commentary templates.");
  }

  // API Route: Return whitelisted admin emails parsed from the ADMINS environment variable
  app.get("/api/admins", (req, res) => {
    const rawAdmins = process.env.ADMINS || "";
    const adminsList = rawAdmins
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);
    return res.json({ success: true, admins: adminsList });
  });

  // API Route: Generate a hilarious, highly customized Nigerian hype commentator line
  app.post("/api/mc-hype", async (req, res) => {
    try {
      const { winnerName, prizeTitle, characterName, characterRole } = req.body;

      if (!winnerName || !prizeTitle) {
        return res.status(400).json({ error: "Missing required params: winnerName or prizeTitle" });
      }

      if (!ai) {
        // Return structured signal to let frontend know to use local high-quality templates
        return res.json({
          success: false,
          commentary: "",
          msg: "No API key configured. Client falling back to local pre-authored commentary list."
        });
      }

      // Prompt crafted to fit the exact humor requested (LCC Hangout, Cowrywise, NOUN Ambassadors)
      const prompt = `
You are an energetic, fun Nigerian master of ceremonies (MC) and Hype Man at a university tech-savings hangout.
Context: It is the "LCC Hangout of Cowrywise NOUN Ambassadors" (National Open University of Nigeria ambassadors having a social meetup).
Your character name is: "${characterName}" and your style/role is: "${characterRole}".

Generate a SINGLE-LINE, highly energetic, funny shoutout for the winner of our raffle draw.
Winner's Name: "${winnerName}"
Prize Won: "${prizeTitle}"

Instructions:
1. Use a gorgeous blend of standard English, light educational slang, tech-ambassador jokes, and mild friendly Nigerian pidgin (like 'Oya', 'Chai', 'Mad o', 'No cap').
2. Keep it centered on encouraging savings on Cowrywise, protecting the stashes, and poking fun at the hangout location (Lekki Conservation Centre canopy walk heights, Suya buying, Lekki monkeys stealing stashes, etc.).
3. Your output must be a single line of under 280 characters.
4. Do not include any meta-text, quotes, or JSON brackets—just output the direct speech of the MC.
5. Be warm, enthusiastic, and absolutely hilarious.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const commentary = response.text?.trim() || "";

      return res.json({
        success: true,
        commentary: commentary
      });

    } catch (err: any) {
      console.error("Error generating MC comment:", err);
      return res.json({
        success: false,
        commentary: "",
        error: err.message || "Unknown error"
      });
    }
  });

  // Vite middleware for development loading
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serves compiled build files in standalone production container
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cowrywise NOUN Raffle Server running on http://localhost:${PORT}`);
  });
}

startServer();
