export interface Participant {
  id: string;
  name: string;
  username: string; // social media / cowrywise tag
  active: boolean;  // whether present / included in next draw
  won: boolean;     // whether they have won a prize already
  wonPrizeId?: string; // which prize they won, if any
}

export interface Prize {
  id: string;
  title: string;
  description: string;
  count: number;
  remaining: number;
  icon: string; // name of Lucide icon to use
  color: string; // tailwind color classes/theme
  badgeColor: string; // text and background classes
  cashValue: number; // For statistics (e.g., in Naira like 10000)
}

export interface DrawHistory {
  id: string;
  timestamp: number;
  winner: Participant;
  prize: Prize;
  mcCommentary: string;
}

export interface MCCharacter {
  name: string;
  role: string;
  avatar: string;
  avatarBg: string;
}
