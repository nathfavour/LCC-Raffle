import { Participant, Prize, MCCharacter } from "./types";

export const MC_CHARACTERS: MCCharacter[] = [
  {
    name: "MC Kaydee",
    role: "The Lekki Canopy Master & Hype King",
    avatar: "🎤",
    avatarBg: "bg-blue-600 text-white"
  },
  {
    name: "DJ Savings",
    role: "The Beat Maker & Compound Interest Controller",
    avatar: "🎧",
    avatarBg: "bg-emerald-500 text-black"
  },
  {
    name: "Mama Cowry",
    role: "The Savings Discipline Grandma & Suya Blocker",
    avatar: "👵🏾",
    avatarBg: "bg-amber-500 text-white"
  }
];

export const INITIAL_PRIZES: Prize[] = [
  {
    id: "grand-stash",
    title: "CN Grand Stash Booster",
    description: "The ultimate savings booster locked on Cowrywise for 3 months!",
    count: 1,
    remaining: 1,
    icon: "Coins",
    color: "from-amber-400 to-amber-600 text-amber-700",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    cashValue: 0
  },
  {
    id: "mini-stash",
    title: "Cowrywise Savings",
    description: "Instant investment fund credited directly to your Cowrywise account.",
    count: 5,
    remaining: 5,
    icon: "Wallet",
    color: "from-brand-blue to-blue-700 text-blue-700",
    badgeColor: "bg-blue-100 text-brand-blue border-blue-300",
    cashValue: 0
  },
  {
    id: "premium-hoodie",
    title: "Cowrywise Premium Hoodie",
    description: "Vibrant, super-comfy customized hoodie for elite ambassadors.",
    count: 6,
    remaining: 6,
    icon: "Shirt",
    color: "from-brand-green to-emerald-700 text-emerald-800",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    cashValue: 0
  },
  {
    id: "smart-bottle",
    title: "HydroSmart Vacuum Flask",
    description: "Thermal temperature-display water bottle to keep you refreshed.",
    count: 8,
    remaining: 8,
    icon: "CupSoda",
    color: "from-cyan-500 to-cyan-700 text-cyan-800",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300",
    cashValue: 0
  },
  {
    id: "save-journal",
    title: "Save O'Clock Leather Journal",
    description: "Elegant planner + premium pen to write your physical wealth plan.",
    count: 10,
    remaining: 10,
    icon: "Notebook",
    color: "from-purple-500 to-purple-700 text-purple-800",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    cashValue: 0
  },
  {
    id: "canopy-voucher",
    title: "LCC Canopy Airtime Bonus",
    description: "Supercharged mobile data/airtime voucher for live social sharing.",
    count: 15,
    remaining: 15,
    icon: "Zap",
    color: "from-orange-500 to-orange-700 text-orange-800",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-300",
    cashValue: 0
  }
];

export const INITIAL_PARTICIPANTS: Participant[] = [
  { id: "1", name: "Favour Nathaniel", username: "@nath_favour", active: true, won: false },
  { id: "2", name: "Chinedu Okafor", username: "@chinedu_saves", active: true, won: false },
  { id: "3", name: "Amina Yusuf", username: "@amina_noun", active: true, won: false },
  { id: "4", name: "Tunde Balogun", username: "@tunde_stash", active: true, won: false },
  { id: "5", name: "Gold Chioma", username: "@gold_ambassador", active: true, won: false },
  { id: "6", name: "Ibrahim Shehu", username: "@ibrahim_savings", active: true, won: false },
  { id: "7", name: "Blessing Effiong", username: "@bless_cowry", active: true, won: false },
  { id: "8", name: "Toluwani Adebayo", username: "@tolu_saveoclock", active: true, won: false },
  { id: "9", name: "Deborah James", username: "@debby_saves", active: true, won: false },
  { id: "10", name: "Ngozi Nwosu", username: "@ngozi_noun", active: true, won: false },
  { id: "11", name: "Abdulrahman Ali", username: "@abdul_finance", active: true, won: false },
  { id: "12", name: "Kemi Adesina", username: "@kemi_stash", active: true, won: false },
  { id: "13", name: "Olamide Isaac", username: "@olamide_save", active: true, won: false },
  { id: "14", name: "Gift Onyinye", username: "@gift_ounce", active: true, won: false },
  { id: "15", name: "David Christopher", username: "@dave_ambassador", active: true, won: false },
  { id: "16", name: "Tari Ekong", username: "@tari_bonds", active: true, won: false },
  { id: "17", name: "Victor Chukwu", username: "@victory_saves", active: true, won: false },
  { id: "18", name: "Joy Emmanuel", username: "@joy_invests", active: true, won: false },
  { id: "19", name: "Yusuf Babatunde", username: "@yusuf_noun_cw", active: true, won: false },
  { id: "20", name: "Evelyn Patrick", username: "@eve_stash", active: true, won: false }
];

export const LOCAL_COMMENTARY_TEMPLATES: Record<string, string[]> = {
  "MC Kaydee": [
    "Oya make noise! {winner} has just grabbed the {prize}! If you are near Lekki Canopy Walk, please hold {winner} tightly before they fly away with the money!",
    "Chai! Cowrywise has blessed you. {winner} has won {prize}! Do not spend this on cold drinks o; lock it instantly on Cowrywise so you can flex with double interest!",
    "Mad o! Double congratulations to {winner} on winning the {prize}! Your savings game is on full speed, and the NOUN ambassadors are proud!",
    "No caps! {winner} is leaving the hangout with {prize}! Go and activate your savings challenge on the Cowrywise app immediately, let's see some receipts!",
    "Pure vibes and money! {winner}, you are now the certified chief saver for the {prize}! Who is buying the Suya tonight at Lekki Conservation Centre?"
  ],
  "DJ Savings": [
    "Drop the beat! 🥁 {winner} is our newest winner for the {prize}! The compound interest of your life is scaling up nicely!",
    "DJ Savings representing the sound of money! {winner} has secured {prize}! Let's lock this reward and watch it grow like a beautiful Afrobeat rhythm!",
    "Vibe check! Pass the aux cord to {winner}, who just bagged {prize}! Turn up the savings volume on your Cowrywise dashboard!",
    "The rhythm of financial freedom is high! {winner}, your {prize} is here. Please, no frivolous transfers o, we are strict savers here!",
    "Bounce it for {winner}! A beautiful win of {prize}! Your Cowrywise circle is about to go crazy with savings notifications!"
  ],
  "Mama Cowry": [
    "God bless you my child! {winner} has won {prize}! I will personally watch you put this into high-yield savings. No unnecessary Shawarma!",
    "My child {winner}, congrats on the {prize}. But remember, a pocket with a hole cannot hold wealth. Take it to the Cowrywise lock box!",
    "Aha! {winner} won {prize}! Praise the savings gods! Let's ensure this seed is planted in a mutual fund or savings goal immediately. No excuses!",
    "Beautiful win for {winner}! The {prize} is yours! Discipline is the master key to wealth. Don't let your friends divert this for hangout drinks!",
    "I am proud of my child {winner}! You won {prize}! May your Cowrywise account overflow with interests, compound interest is the 8th wonder!"
  ]
};
