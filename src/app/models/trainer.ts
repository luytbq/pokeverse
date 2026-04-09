export interface TrainerProfile {
  name: string;
  slogan?: string;
  favoriteRegion: string;
  favoriteType: string;
  avatarUrl?: string;
  twitter?: string;
  github?: string;
  bio?: string;
}

export interface CustomPokemon {
  id: string;
  name: string;
  primaryType: string;
  secondaryType?: string;
  description: string;
  generation: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  moves: string[];
  spriteUrl?: string;
  createdAt: string;
}

export const REGIONS: string[] = [
  'Kanto',
  'Johto',
  'Hoenn',
  'Sinnoh',
  'Unova',
  'Kalos',
  'Alola',
  'Galar',
  'Paldea',
];
