export type GameState =
  | 'TITLE'
  | 'CHAR_SELECT'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAMEOVER'
  | 'CLEAR'
  | 'REPORT';

export type CharacterId = 'kenta_leader' | 'kenta_car' | 'kenta_bike';

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  subtitle: string;
  description: string;
  speed: number;
  dashSpeed: number;
  width: number;
  height: number;
  specialAbility: string;
  accentColor: string;
}

export type PolicyCategory =
  | 'child_care'
  | 'disaster_prep'
  | 'digital_dx'
  | 'local_economy'
  | 'healthcare'
  | 'green_energy';

export interface PolicyDefinition {
  id: PolicyCategory;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  description: string;
  points: number;
}

export type ItemType =
  | { kind: 'policy'; category: PolicyCategory }
  | { kind: 'voice'; text: string; category?: PolicyCategory }
  | { kind: 'obstacle'; obstacleType: 'waste_cost' | 'neglect_task' | 'fake_rumor' }
  | { kind: 'fever_star' };

export interface FallingItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  vy: number;
  width: number;
  height: number;
  type: ItemType;
  wobbleOffset: number;
  wobbleSpeed: number;
}

export interface FloatingEffect {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  opacity: number;
  vy: number;
  life: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
  life: number;
}

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  hearts: number;
  maxHearts: number;
  timeLeft: number;
  feverGauge: number; // 0 to 100
  isFever: boolean;
  feverTimeLeft: number;
  collectedPolicies: Record<PolicyCategory, number>;
  voicesHeard: number;
  obstaclesAvoided: number;
  obstaclesHit: number;
}

export interface CitizenVoice {
  resident: string;
  quote: string;
}

export type TownRank = 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C' | 'D';

export interface TownReport {
  townTitle: string;
  catchphrase: string;
  overallRank: TownRank;
  summary: string;
  headlineNews: string[];
  citizenVoices: CitizenVoice[];
  synergyEffect: string;
  kentaComment: string;
}
