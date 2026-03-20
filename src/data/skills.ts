import type { Skill, HeroClass, MonsterType } from '../models/types.ts';

// ============================================================
// CRUSADER SKILLS (front line fighter, positions 1-2)
// ============================================================
export const CRUSADER_SKILLS: Skill[] = [
  {
    id: 'crusader_smite',
    name: '강타',
    description: '신성한 힘으로 적을 내리친다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.0, max: 1.3 },
    accuracy: 5,
    crit: 5,
    effects: [],
  },
  {
    id: 'crusader_stunning_blow',
    name: '기절 타격',
    description: '적을 기절시키는 강력한 일격.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1.0 },
    accuracy: 0,
    crit: 3,
    effects: [
      { type: 'stun', chance: 60, duration: 1, value: 0 },
    ],
  },
  {
    id: 'crusader_battle_heal',
    name: '전투 치유',
    description: '동료의 상처를 치유한다.',
    usePositions: [1, 2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 3, max: 5 },
  },
  {
    id: 'crusader_holy_lance',
    name: '성스러운 창',
    description: '뒤에서 앞으로 돌진하며 공격한다.',
    usePositions: [3, 4],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.0, max: 1.2 },
    accuracy: 10,
    crit: 6,
    selfMove: -2,
  },
  {
    id: 'crusader_inspiring_cry',
    name: '고무의 함성',
    description: '아군 전체의 스트레스를 줄여준다.',
    usePositions: [1, 2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 4,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    stressHeal: 5,
  },
];

// ============================================================
// HIGHWAYMAN SKILLS (versatile, positions 2-3)
// ============================================================
export const HIGHWAYMAN_SKILLS: Skill[] = [
  {
    id: 'highwayman_wicked_slice',
    name: '사악한 베기',
    description: '날카로운 단검으로 적을 벤다.',
    usePositions: [1, 2, 3],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.0, max: 1.2 },
    accuracy: 5,
    crit: 7,
  },
  {
    id: 'highwayman_pistol_shot',
    name: '권총 사격',
    description: '원거리에서 적을 쏜다.',
    usePositions: [2, 3, 4],
    targetPositions: [3, 4],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.2 },
    accuracy: 10,
    crit: 8,
  },
  {
    id: 'highwayman_duelists_advance',
    name: '결투사의 전진',
    description: '앞으로 전진하며 공격한다.',
    usePositions: [2, 3, 4],
    targetPositions: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.1 },
    accuracy: 5,
    crit: 5,
    selfMove: -1,
  },
  {
    id: 'highwayman_open_vein',
    name: '정맥 절개',
    description: '적에게 출혈을 일으킨다.',
    usePositions: [1, 2, 3],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1.0 },
    accuracy: 5,
    crit: 4,
    effects: [
      { type: 'bleed', chance: 80, duration: 3, value: 2 },
    ],
  },
  {
    id: 'highwayman_tracking_shot',
    name: '추적 사격',
    description: '적에게 표식을 남기고 약화시킨다.',
    usePositions: [2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 0.9 },
    accuracy: 10,
    crit: 3,
    effects: [
      { type: 'mark', chance: 100, duration: 3, value: 0 },
      { type: 'debuff_dodge', chance: 80, duration: 3, value: -10 } as any,
    ],
  },
];

// ============================================================
// PLAGUE DOCTOR SKILLS (back line debuffer, positions 3-4)
// ============================================================
export const PLAGUE_DOCTOR_SKILLS: Skill[] = [
  {
    id: 'plague_doctor_noxious_blast',
    name: '독성 분사',
    description: '적에게 역병을 퍼뜨린다.',
    usePositions: [3, 4],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1.0 },
    accuracy: 5,
    crit: 3,
    effects: [
      { type: 'blight', chance: 80, duration: 3, value: 3 },
    ],
  },
  {
    id: 'plague_doctor_plague_grenade',
    name: '역병 수류탄',
    description: '후열 적들에게 역병을 퍼뜨린다.',
    usePositions: [3, 4],
    targetPositions: [3, 4],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.6, max: 0.9 },
    accuracy: 0,
    crit: 2,
    effects: [
      { type: 'blight', chance: 70, duration: 3, value: 2 },
    ],
  },
  {
    id: 'plague_doctor_battlefield_medicine',
    name: '야전 의술',
    description: '출혈과 역병을 치료하고 체력을 회복한다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 2, max: 4 },
  },
  {
    id: 'plague_doctor_blinding_gas',
    name: '실명 가스',
    description: '후열 적들을 기절시킨다.',
    usePositions: [3, 4],
    targetPositions: [3, 4],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: 'stun', chance: 70, duration: 1, value: 0 },
    ],
  },
  {
    id: 'plague_doctor_incision',
    name: '절개',
    description: '메스로 적을 베어 출혈을 일으킨다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.1 },
    accuracy: 10,
    crit: 6,
    effects: [
      { type: 'bleed', chance: 80, duration: 3, value: 2 },
    ],
  },
];

// ============================================================
// VESTAL SKILLS (healer, positions 3-4)
// ============================================================
export const VESTAL_SKILLS: Skill[] = [
  {
    id: 'vestal_judgment',
    name: '심판',
    description: '신성한 빛으로 적을 공격한다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.1 },
    accuracy: 0,
    crit: 2,
  },
  {
    id: 'vestal_dazzling_light',
    name: '눈부신 빛',
    description: '강렬한 빛으로 적을 기절시킨다.',
    usePositions: [3, 4],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.6, max: 0.8 },
    accuracy: 0,
    crit: 2,
    effects: [
      { type: 'stun', chance: 65, duration: 1, value: 0 },
    ],
  },
  {
    id: 'vestal_divine_grace',
    name: '신성한 은총',
    description: '아군 한 명을 크게 치유한다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 5, max: 9 },
  },
  {
    id: 'vestal_divine_comfort',
    name: '신성한 위안',
    description: '아군 전체를 약간 치유한다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 4,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 2, max: 3 },
  },
  {
    id: 'vestal_mace_bash',
    name: '철퇴 강타',
    description: '철퇴로 적을 내려친다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.0, max: 1.2 },
    accuracy: -5,
    crit: 3,
  },
];

// ============================================================
// MONSTER SKILLS
// ============================================================
const BONE_SOLDIER_SKILLS: Skill[] = [
  {
    id: 'bone_soldier_slash',
    name: '뼈 칼날',
    description: '녹슨 칼로 벤다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.1 },
    accuracy: 0,
    crit: 3,
  },
  {
    id: 'bone_soldier_shield_bash',
    name: '방패 강타',
    description: '방패로 들이받는다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.7, max: 0.9 },
    accuracy: -5,
    crit: 2,
    effects: [
      { type: 'stun', chance: 30, duration: 1, value: 0 },
    ],
  },
];

const BONE_ARCHER_SKILLS: Skill[] = [
  {
    id: 'bone_archer_quarrel',
    name: '뼈 화살',
    description: '후방에서 화살을 쏜다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1.1 },
    accuracy: 5,
    crit: 6,
  },
  {
    id: 'bone_archer_bayonet_jab',
    name: '총검 찌르기',
    description: '근접 거리에서 찌른다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.7, max: 0.9 },
    accuracy: -5,
    crit: 4,
  },
];

const BONE_CAPTAIN_SKILLS: Skill[] = [
  {
    id: 'bone_captain_officers_slash',
    name: '장교의 베기',
    description: '강력한 일격.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.1, max: 1.4 },
    accuracy: 10,
    crit: 6,
  },
  {
    id: 'bone_captain_command',
    name: '지휘',
    description: '아군을 독려하여 공격력을 높인다.',
    usePositions: [1, 2, 3],
    targetPositions: [1, 2, 3, 4],
    targetCount: 4,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: 'buff_attack', chance: 100, duration: 3, value: 3 },
    ],
  },
  {
    id: 'bone_captain_crushing_blow',
    name: '분쇄 타격',
    description: '적을 짓눌러 기절시킨다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.2 },
    accuracy: 5,
    crit: 4,
    effects: [
      { type: 'stun', chance: 50, duration: 1, value: 0 },
    ],
  },
];

const CULTIST_BRAWLER_SKILLS: Skill[] = [
  {
    id: 'cultist_brawler_rend',
    name: '난도질',
    description: '광기 어린 공격.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.2 },
    accuracy: 0,
    crit: 5,
    effects: [
      { type: 'bleed', chance: 40, duration: 3, value: 1 },
    ],
  },
  {
    id: 'cultist_brawler_stumbling_scratch',
    name: '비틀거리는 할퀴기',
    description: '거친 할퀴기 공격.',
    usePositions: [1, 2, 3],
    targetPositions: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1.0 },
    accuracy: -5,
    crit: 3,
  },
];

const CULTIST_ACOLYTE_SKILLS: Skill[] = [
  {
    id: 'cultist_acolyte_dark_heal',
    name: '암흑 치유',
    description: '어둠의 힘으로 아군을 치유한다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 4, max: 7 },
  },
  {
    id: 'cultist_acolyte_curse',
    name: '저주',
    description: '적에게 저주를 내린다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.6, max: 0.8 },
    accuracy: 0,
    crit: 2,
    effects: [
      { type: 'debuff_attack', chance: 60, duration: 3, value: -2 },
    ],
  },
];

const MADMAN_SKILLS: Skill[] = [
  {
    id: 'madman_dervish',
    name: '광란의 춤',
    description: '미친 듯이 난동을 부린다.',
    usePositions: [1, 2, 3],
    targetPositions: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.7, max: 0.9 },
    accuracy: -10,
    crit: 5,
  },
  {
    id: 'madman_accusation',
    name: '고발',
    description: '미친 소리를 질러 스트레스를 준다.',
    usePositions: [1, 2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.3, max: 0.5 },
    accuracy: 10,
    crit: 2,
    effects: [
      { type: 'debuff_speed', chance: 50, duration: 3, value: -2 },
    ],
  },
];

const LARGE_CARRION_EATER_SKILLS: Skill[] = [
  {
    id: 'carrion_eater_bite',
    name: '포식',
    description: '거대한 입으로 물어뜯는다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.0, max: 1.3 },
    accuracy: 0,
    crit: 3,
    effects: [
      { type: 'blight', chance: 50, duration: 3, value: 2 },
    ],
  },
  {
    id: 'carrion_eater_acid_spit',
    name: '산성 침',
    description: '멀리서 산성 침을 뱉는다.',
    usePositions: [1, 2, 3],
    targetPositions: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.6, max: 0.8 },
    accuracy: 5,
    crit: 2,
    effects: [
      { type: 'blight', chance: 70, duration: 3, value: 3 },
    ],
  },
];

const NECROMANCER_SKILLS: Skill[] = [
  {
    id: 'necromancer_the_clawing_dead',
    name: '죽은 자의 손아귀',
    description: '죽은 자의 손이 땅에서 솟아오른다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.8, max: 1.1 },
    accuracy: 5,
    crit: 3,
  },
  {
    id: 'necromancer_dark_bolt',
    name: '암흑 화살',
    description: '어둠의 에너지를 발사한다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.0, max: 1.3 },
    accuracy: 10,
    crit: 5,
    effects: [
      { type: 'debuff_defense', chance: 60, duration: 3, value: -3 },
    ],
  },
  {
    id: 'necromancer_life_drain',
    name: '생명력 흡수',
    description: '적의 생명력을 흡수한다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.7, max: 1.0 },
    accuracy: 5,
    crit: 2,
    heal: { min: 3, max: 5 },
  },
];

// ============================================================
// WARRIOR SKILLS (front line heavy hitter, positions 1-2)
// ============================================================
export const WARRIOR_SKILLS: Skill[] = [
  {
    id: 'warrior_heavy_strike',
    name: '강타',
    description: '전열에서 적을 강하게 내리친다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.1, max: 1.4 },
    accuracy: 5,
    crit: 5,
  },
  {
    id: 'warrior_shield_bash',
    name: '방패치기',
    description: '방패로 적을 강타하여 기절시킨다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.7, max: 0.9 },
    accuracy: 0,
    crit: 2,
    effects: [
      { type: 'stun', chance: 50, duration: 1, value: 0 },
    ],
  },
  {
    id: 'warrior_charge',
    name: '돌진',
    description: '후열에서 전열로 돌진하며 공격한다.',
    usePositions: [2, 3, 4],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.0, max: 1.2 },
    accuracy: 5,
    crit: 4,
    selfMove: -2,
  },
  {
    id: 'warrior_battle_cry',
    name: '전투함성',
    description: '아군 전체의 공격력을 높이는 함성을 지른다.',
    usePositions: [1, 2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 4,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: 'buff_attack', chance: 100, duration: 3, value: 3 },
    ],
  },
  {
    id: 'warrior_defensive_stance',
    name: '수비태세',
    description: '방어 자세를 취하여 방어력을 높인다.',
    usePositions: [1, 2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: 'buff_defense', chance: 100, duration: 3, value: 4 },
    ],
  },
];

// ============================================================
// ROGUE SKILLS (high crit melee, positions 1-2)
// ============================================================
export const ROGUE_SKILLS: Skill[] = [
  {
    id: 'rogue_ambush',
    name: '기습',
    description: '적의 빈틈을 노려 높은 치명타로 공격한다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.1 },
    accuracy: 10,
    crit: 15,
  },
  {
    id: 'rogue_blade_flurry',
    name: '단검난무',
    description: '단검으로 여러 적을 동시에 베어낸다.',
    usePositions: [1, 2],
    targetPositions: [1, 2, 3],
    targetCount: 3,
    targetAlly: false,
    damage: { min: 0.6, max: 0.8 },
    accuracy: 0,
    crit: 8,
  },
  {
    id: 'rogue_poison_blade',
    name: '독칼날',
    description: '독을 바른 칼날로 출혈과 역병을 일으킨다.',
    usePositions: [1, 2, 3],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1.0 },
    accuracy: 5,
    crit: 5,
    effects: [
      { type: 'bleed', chance: 60, duration: 3, value: 2 },
      { type: 'blight', chance: 60, duration: 3, value: 2 },
    ],
  },
  {
    id: 'rogue_shadow_step',
    name: '그림자걸음',
    description: '그림자 속에서 이동하며 기습 공격한다.',
    usePositions: [2, 3, 4],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.1 },
    accuracy: 10,
    crit: 8,
    selfMove: -1,
  },
  {
    id: 'rogue_evasion',
    name: '회피',
    description: '민첩한 움직임으로 회피력을 높인다.',
    usePositions: [1, 2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: 'buff_speed', chance: 100, duration: 3, value: 5 },
    ],
  },
];

// ============================================================
// MAGE SKILLS (back line caster, positions 3-4)
// ============================================================
export const MAGE_SKILLS: Skill[] = [
  {
    id: 'mage_fireball',
    name: '화염구',
    description: '화염 구체를 발사하여 여러 적을 불태운다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.8, max: 1.1 },
    accuracy: 5,
    crit: 3,
    effects: [
      { type: 'blight', chance: 50, duration: 3, value: 3 },
    ],
  },
  {
    id: 'mage_ice_shard',
    name: '얼음파편',
    description: '얼음 파편을 날려 적을 감속시킨다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.2 },
    accuracy: 10,
    crit: 4,
    effects: [
      { type: 'debuff_speed', chance: 70, duration: 3, value: -3 },
    ],
  },
  {
    id: 'mage_arcane_blast',
    name: '비전폭발',
    description: '비전 에너지를 집중하여 강력한 일격을 가한다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.2, max: 1.6 },
    accuracy: 0,
    crit: 5,
  },
  {
    id: 'mage_mana_shield',
    name: '마나방벽',
    description: '마나로 방어 장벽을 생성하여 방어력을 높인다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: 'buff_defense', chance: 100, duration: 3, value: 5 },
    ],
  },
  {
    id: 'mage_chain_lightning',
    name: '연쇄번개',
    description: '번개를 발사하여 여러 적에게 연쇄 피해를 준다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.7, max: 1.0 },
    accuracy: 5,
    crit: 4,
  },
];

// ============================================================
// RANGER SKILLS (back line ranged, positions 3-4)
// ============================================================
export const RANGER_SKILLS: Skill[] = [
  {
    id: 'ranger_power_shot',
    name: '강력사격',
    description: '힘을 모아 강력한 화살을 발사한다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.0, max: 1.3 },
    accuracy: 10,
    crit: 8,
  },
  {
    id: 'ranger_volley',
    name: '일제사격',
    description: '여러 화살을 동시에 발사하여 적들을 공격한다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3],
    targetCount: 3,
    targetAlly: false,
    damage: { min: 0.5, max: 0.7 },
    accuracy: 0,
    crit: 5,
  },
  {
    id: 'ranger_trap',
    name: '함정',
    description: '함정을 설치하여 적을 기절시킨다.',
    usePositions: [2, 3, 4],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.6, max: 0.8 },
    accuracy: 5,
    crit: 2,
    effects: [
      { type: 'stun', chance: 55, duration: 1, value: 0 },
    ],
  },
  {
    id: 'ranger_rapid_fire',
    name: '속사',
    description: '빠르게 화살을 연사한다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.7, max: 0.9 },
    accuracy: 15,
    crit: 10,
  },
  {
    id: 'ranger_mark_target',
    name: '표적지정',
    description: '적에게 표식을 남기고 방어력을 낮춘다.',
    usePositions: [2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.5, max: 0.6 },
    accuracy: 15,
    crit: 0,
    effects: [
      { type: 'mark', chance: 100, duration: 3, value: 0 },
      { type: 'debuff_defense', chance: 80, duration: 3, value: -3 },
    ],
  },
];

// ============================================================
// PALADIN SKILLS (front line tank/healer, positions 1-2)
// ============================================================
export const PALADIN_SKILLS: Skill[] = [
  {
    id: 'paladin_holy_strike',
    name: '신성타격',
    description: '신성한 힘을 담아 적을 공격한다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.0, max: 1.3 },
    accuracy: 5,
    crit: 3,
  },
  {
    id: 'paladin_holy_shield',
    name: '신성방패',
    description: '신성한 빛으로 아군 한 명을 치유한다.',
    usePositions: [1, 2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 4, max: 7 },
  },
  {
    id: 'paladin_smite',
    name: '천벌',
    description: '신의 분노를 담아 강력한 일격을 가한다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.3, max: 1.6 },
    accuracy: 0,
    crit: 4,
  },
  {
    id: 'paladin_lay_on_hands',
    name: '안수',
    description: '신성한 안수로 아군을 크게 치유한다.',
    usePositions: [1, 2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 8, max: 12 },
  },
  {
    id: 'paladin_consecrate',
    name: '축성',
    description: '축성된 땅으로 적 전체에 피해를 준다. 신성한 기운이 아군도 치유한다.',
    usePositions: [1, 2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 4,
    targetAlly: false,
    damage: { min: 0.4, max: 0.6 },
    accuracy: 5,
    crit: 1,
  },
];

// ============================================================
// DARK KNIGHT SKILLS (front line lifesteal/debuffer, positions 1-2)
// ============================================================
export const DARK_KNIGHT_SKILLS: Skill[] = [
  {
    id: 'dark_knight_life_steal',
    name: '생명흡수',
    description: '적의 생명력을 흡수하여 자신을 치유한다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1.1 },
    accuracy: 5,
    crit: 4,
    heal: { min: 3, max: 5 },
  },
  {
    id: 'dark_knight_curse',
    name: '저주',
    description: '어둠의 저주로 적의 공격력과 방어력을 낮춘다.',
    usePositions: [1, 2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.5, max: 0.7 },
    accuracy: 10,
    crit: 2,
    effects: [
      { type: 'debuff_attack', chance: 70, duration: 3, value: -3 },
      { type: 'debuff_defense', chance: 70, duration: 3, value: -2 },
    ],
  },
  {
    id: 'dark_knight_dark_blade',
    name: '암흑검',
    description: '암흑의 힘을 담은 검으로 강하게 베어낸다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.2, max: 1.5 },
    accuracy: 0,
    crit: 6,
  },
  {
    id: 'dark_knight_soul_harvest',
    name: '영혼수확',
    description: '적들의 영혼을 거두어 피해를 준다.',
    usePositions: [1, 2],
    targetPositions: [1, 2, 3],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.6, max: 0.9 },
    accuracy: 5,
    crit: 3,
  },
  {
    id: 'dark_knight_dark_oath',
    name: '암흑맹세',
    description: '어둠에 맹세하여 자신의 공격력을 크게 높인다.',
    usePositions: [1, 2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: 'buff_attack', chance: 100, duration: 3, value: 5 },
    ],
  },
];

// ============================================================
// SHADOW LURKER SKILLS
// ============================================================
const SHADOW_LURKER_SKILLS: Skill[] = [
  {
    id: 'shadow_lurker_ambush',
    name: '기습 공격',
    description: '그림자 속에서 기습하여 공격한다.',
    usePositions: [1, 2, 3],
    targetPositions: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.0, max: 1.3 },
    accuracy: 15,
    crit: 10,
  },
  {
    id: 'shadow_lurker_vanish',
    name: '소멸',
    description: '그림자 속으로 사라져 회피력을 높인다.',
    usePositions: [1, 2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: 'buff_speed', chance: 100, duration: 2, value: 5 },
    ],
  },
];

// ============================================================
// PLAGUE RAT SKILLS
// ============================================================
const PLAGUE_RAT_SKILLS: Skill[] = [
  {
    id: 'plague_rat_bite',
    name: '역병 물기',
    description: '역병에 감염된 이빨로 물어뜯는다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.6, max: 0.8 },
    accuracy: 0,
    crit: 3,
    effects: [
      { type: 'blight', chance: 70, duration: 3, value: 2 },
    ],
  },
  {
    id: 'plague_rat_infect',
    name: '감염',
    description: '역병을 퍼뜨려 여러 적을 감염시킨다.',
    usePositions: [1, 2],
    targetPositions: [1, 2, 3],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.3, max: 0.5 },
    accuracy: 0,
    crit: 1,
    effects: [
      { type: 'blight', chance: 80, duration: 3, value: 3 },
    ],
  },
];

// ============================================================
// CURSED KNIGHT SKILLS
// ============================================================
const CURSED_KNIGHT_SKILLS: Skill[] = [
  {
    id: 'cursed_knight_cursed_slash',
    name: '저주의 검',
    description: '저주받은 검으로 적을 베어낸다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.1, max: 1.4 },
    accuracy: 5,
    crit: 4,
  },
  {
    id: 'cursed_knight_shield_wall',
    name: '방패벽',
    description: '방패벽을 세워 아군 전체의 방어력을 높인다.',
    usePositions: [1, 2],
    targetPositions: [1, 2, 3, 4],
    targetCount: 4,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: 'buff_defense', chance: 100, duration: 2, value: 3 },
    ],
  },
];

// ============================================================
// DARK MAGE SKILLS
// ============================================================
const DARK_MAGE_SKILLS: Skill[] = [
  {
    id: 'dark_mage_shadow_bolt',
    name: '그림자 화살',
    description: '그림자 화살을 발사하여 적의 공격력을 낮춘다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.2 },
    accuracy: 10,
    crit: 4,
    effects: [
      { type: 'debuff_attack', chance: 60, duration: 3, value: -2 },
    ],
  },
  {
    id: 'dark_mage_dark_ritual',
    name: '암흑 의식',
    description: '암흑 의식을 행하여 여러 적에게 피해를 주고 방어력을 낮춘다.',
    usePositions: [3, 4],
    targetPositions: [1, 2, 3],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.6, max: 0.9 },
    accuracy: 5,
    crit: 2,
    effects: [
      { type: 'debuff_defense', chance: 50, duration: 3, value: -2 },
    ],
  },
];

// ============================================================
// GARGOYLE SKILLS
// ============================================================
const GARGOYLE_SKILLS: Skill[] = [
  {
    id: 'gargoyle_stone_fist',
    name: '돌주먹',
    description: '거대한 돌주먹으로 적을 내려쳐 기절시킨다.',
    usePositions: [1, 2],
    targetPositions: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.0, max: 1.3 },
    accuracy: 0,
    crit: 3,
    effects: [
      { type: 'stun', chance: 40, duration: 1, value: 0 },
    ],
  },
  {
    id: 'gargoyle_stone_skin',
    name: '석화 방어',
    description: '피부를 석화시켜 방어력을 크게 높인다.',
    usePositions: [1, 2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: 'buff_defense', chance: 100, duration: 3, value: 5 },
    ],
  },
];

// ============================================================
// WRAITH SKILLS
// ============================================================
const WRAITH_SKILLS: Skill[] = [
  {
    id: 'wraith_spectral_touch',
    name: '유령 손길',
    description: '실체 없는 손길로 방어를 무시하고 공격한다.',
    usePositions: [1, 2, 3],
    targetPositions: [1, 2, 3, 4],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1.1 },
    accuracy: 20,
    crit: 5,
  },
  {
    id: 'wraith_wail',
    name: '통곡',
    description: '원혼의 통곡으로 여러 적의 속도를 낮춘다.',
    usePositions: [1, 2, 3, 4],
    targetPositions: [1, 2, 3, 4],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.4, max: 0.6 },
    accuracy: 10,
    crit: 2,
    effects: [
      { type: 'debuff_speed', chance: 70, duration: 3, value: -3 },
    ],
  },
];

// ============================================================
// EXPORTS
// ============================================================
export const HERO_SKILLS: Record<HeroClass, Skill[]> = {
  crusader: CRUSADER_SKILLS,
  highwayman: HIGHWAYMAN_SKILLS,
  plague_doctor: PLAGUE_DOCTOR_SKILLS,
  vestal: VESTAL_SKILLS,
  warrior: WARRIOR_SKILLS,
  rogue: ROGUE_SKILLS,
  mage: MAGE_SKILLS,
  ranger: RANGER_SKILLS,
  paladin: PALADIN_SKILLS,
  dark_knight: DARK_KNIGHT_SKILLS,
};

export const MONSTER_SKILLS: Record<MonsterType, Skill[]> = {
  bone_soldier: BONE_SOLDIER_SKILLS,
  bone_archer: BONE_ARCHER_SKILLS,
  bone_captain: BONE_CAPTAIN_SKILLS,
  cultist_brawler: CULTIST_BRAWLER_SKILLS,
  cultist_acolyte: CULTIST_ACOLYTE_SKILLS,
  madman: MADMAN_SKILLS,
  large_carrion_eater: LARGE_CARRION_EATER_SKILLS,
  necromancer: NECROMANCER_SKILLS,
  shadow_lurker: SHADOW_LURKER_SKILLS,
  plague_rat: PLAGUE_RAT_SKILLS,
  cursed_knight: CURSED_KNIGHT_SKILLS,
  dark_mage: DARK_MAGE_SKILLS,
  gargoyle: GARGOYLE_SKILLS,
  wraith: WRAITH_SKILLS,
};
