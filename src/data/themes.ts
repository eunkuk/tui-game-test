import type { DungeonTheme, MonsterType } from '../models/types.ts';

export interface ThemeConfig {
  id: DungeonTheme;
  name: string;
  floorRange: [number, number];
  wallChar: string;
  wallColor: string;
  floorChar: string;
  floorColor: string;
  dimWallColor: string;
  dimFloorColor: string;
  envEffect?: 'hp_drain' | 'speed_debuff' | 'stress_gain';
  envValue?: number;
}

export const THEME_CONFIGS: ThemeConfig[] = [
  {
    id: 'catacombs', name: '지하묘지',
    floorRange: [1, 20],
    wallChar: '#', wallColor: 'gray',
    floorChar: '.', floorColor: '#888888',
    dimWallColor: '#444444', dimFloorColor: '#444444',
  },
  {
    id: 'dark_forest', name: '어둠의 숲',
    floorRange: [21, 40],
    wallChar: '\u2663', wallColor: '#228B22',
    floorChar: ',', floorColor: '#556B2F',
    dimWallColor: '#1a4a1a', dimFloorColor: '#2a3a2a',
  },
  {
    id: 'volcano', name: '화산',
    floorRange: [41, 60],
    wallChar: '#', wallColor: '#8B0000',
    floorChar: '.', floorColor: '#CD5C5C',
    dimWallColor: '#4a1111', dimFloorColor: '#3a2222',
    envEffect: 'hp_drain', envValue: 1,
  },
  {
    id: 'snow_mountain', name: '설산',
    floorRange: [61, 80],
    wallChar: '#', wallColor: '#B0C4DE',
    floorChar: '.', floorColor: '#E0E8F0',
    dimWallColor: '#4a5a6a', dimFloorColor: '#5a6a7a',
    envEffect: 'speed_debuff', envValue: 1,
  },
  {
    id: 'abyss', name: '심연',
    floorRange: [81, 100],
    wallChar: '#', wallColor: '#4B0082',
    floorChar: '.', floorColor: '#2F0044',
    dimWallColor: '#1a0033', dimFloorColor: '#220033',
    envEffect: 'stress_gain', envValue: 2,
  },
];

export function getThemeForFloor(floor: number): DungeonTheme {
  for (const config of THEME_CONFIGS) {
    if (floor >= config.floorRange[0] && floor <= config.floorRange[1]) {
      return config.id;
    }
  }
  return 'catacombs';
}

export function getThemeConfig(theme: DungeonTheme): ThemeConfig {
  return THEME_CONFIGS.find(t => t.id === theme) || THEME_CONFIGS[0]!;
}

export const THEME_MONSTER_POOLS: Record<DungeonTheme, MonsterType[]> = {
  catacombs: ['bone_soldier', 'bone_archer', 'plague_rat', 'shadow_lurker', 'cultist_brawler'],
  dark_forest: ['shadow_lurker', 'cultist_brawler', 'cultist_acolyte', 'madman', 'plague_rat'],
  volcano: ['cultist_acolyte', 'madman', 'dark_mage', 'gargoyle', 'cursed_knight'],
  snow_mountain: ['cursed_knight', 'dark_mage', 'gargoyle', 'wraith', 'bone_captain'],
  abyss: ['wraith', 'dark_mage', 'necromancer', 'gargoyle', 'cursed_knight', 'shadow_lurker'],
};
