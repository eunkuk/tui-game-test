#!/usr/bin/env node

// src/App.ts
import blessed13 from "blessed";

// src/state/GameStore.ts
import { EventEmitter } from "events";

// src/data/skills.ts
var CRUSADER_SKILLS = [
  {
    id: "crusader_smite",
    name: "\uAC15\uD0C0",
    description: "\uC2E0\uC131\uD55C \uD798\uC73C\uB85C \uC801\uC744 \uB0B4\uB9AC\uCE5C\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1, max: 1.3 },
    accuracy: 5,
    crit: 5,
    effects: []
  },
  {
    id: "crusader_stunning_blow",
    name: "\uAE30\uC808 \uD0C0\uACA9",
    description: "\uC801\uC744 \uAE30\uC808\uC2DC\uD0A4\uB294 \uAC15\uB825\uD55C \uC77C\uACA9.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1 },
    accuracy: 0,
    crit: 3,
    effects: [
      { type: "stun", chance: 60, duration: 1, value: 0 }
    ]
  },
  {
    id: "crusader_battle_heal",
    name: "\uC804\uD22C \uCE58\uC720",
    description: "\uB3D9\uB8CC\uC758 \uC0C1\uCC98\uB97C \uCE58\uC720\uD55C\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 3, max: 5 }
  },
  {
    id: "crusader_holy_lance",
    name: "\uC131\uC2A4\uB7EC\uC6B4 \uCC3D",
    description: "\uB4A4\uC5D0\uC11C \uC55E\uC73C\uB85C \uB3CC\uC9C4\uD558\uBA70 \uACF5\uACA9\uD55C\uB2E4.",
    useCols: [3],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1, max: 1.2 },
    accuracy: 10,
    crit: 6,
    selfMove: { row: 0, col: -2 }
  },
  {
    id: "crusader_inspiring_cry",
    name: "\uACE0\uBB34\uC758 \uD568\uC131",
    description: "\uC544\uAD70 \uC804\uCCB4\uB97C \uACE0\uBB34\uC2DC\uD0A8\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 9,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 1, max: 2 }
  }
];
var HIGHWAYMAN_SKILLS = [
  {
    id: "highwayman_wicked_slice",
    name: "\uC0AC\uC545\uD55C \uBCA0\uAE30",
    description: "\uB0A0\uCE74\uB85C\uC6B4 \uB2E8\uAC80\uC73C\uB85C \uC801\uC744 \uBCA4\uB2E4.",
    useCols: [1, 2],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1, max: 1.2 },
    accuracy: 5,
    crit: 7
  },
  {
    id: "highwayman_pistol_shot",
    name: "\uAD8C\uCD1D \uC0AC\uACA9",
    description: "\uC6D0\uAC70\uB9AC\uC5D0\uC11C \uC801\uC744 \uC3DC\uB2E4.",
    useCols: [2, 3],
    targetCols: [3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.2 },
    accuracy: 10,
    crit: 8
  },
  {
    id: "highwayman_duelists_advance",
    name: "\uACB0\uD22C\uC0AC\uC758 \uC804\uC9C4",
    description: "\uC55E\uC73C\uB85C \uC804\uC9C4\uD558\uBA70 \uACF5\uACA9\uD55C\uB2E4.",
    useCols: [2, 3],
    targetCols: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.1 },
    accuracy: 5,
    crit: 5,
    selfMove: { row: 0, col: -1 }
  },
  {
    id: "highwayman_open_vein",
    name: "\uC815\uB9E5 \uC808\uAC1C",
    description: "\uC801\uC5D0\uAC8C \uCD9C\uD608\uC744 \uC77C\uC73C\uD0A8\uB2E4.",
    useCols: [1, 2],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1 },
    accuracy: 5,
    crit: 4,
    effects: [
      { type: "bleed", chance: 80, duration: 3, value: 2 }
    ]
  },
  {
    id: "highwayman_tracking_shot",
    name: "\uCD94\uC801 \uC0AC\uACA9",
    description: "\uC801\uC5D0\uAC8C \uD45C\uC2DD\uC744 \uB0A8\uAE30\uACE0 \uC57D\uD654\uC2DC\uD0A8\uB2E4.",
    useCols: [2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 0.9 },
    accuracy: 10,
    crit: 3,
    effects: [
      { type: "mark", chance: 100, duration: 3, value: 0 },
      { type: "debuff_dodge", chance: 80, duration: 3, value: -10 }
    ]
  }
];
var PLAGUE_DOCTOR_SKILLS = [
  {
    id: "plague_doctor_noxious_blast",
    name: "\uB3C5\uC131 \uBD84\uC0AC",
    description: "\uC801\uC5D0\uAC8C \uC5ED\uBCD1\uC744 \uD37C\uB728\uB9B0\uB2E4.",
    useCols: [3],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1 },
    accuracy: 5,
    crit: 3,
    effects: [
      { type: "blight", chance: 80, duration: 3, value: 3 }
    ]
  },
  {
    id: "plague_doctor_plague_grenade",
    name: "\uC5ED\uBCD1 \uC218\uB958\uD0C4",
    description: "\uD6C4\uC5F4 \uC801\uB4E4\uC5D0\uAC8C \uC5ED\uBCD1\uC744 \uD37C\uB728\uB9B0\uB2E4.",
    useCols: [3],
    targetCols: [3],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.6, max: 0.9 },
    accuracy: 0,
    crit: 2,
    effects: [
      { type: "blight", chance: 70, duration: 3, value: 2 }
    ]
  },
  {
    id: "plague_doctor_battlefield_medicine",
    name: "\uC57C\uC804 \uC758\uC220",
    description: "\uCD9C\uD608\uACFC \uC5ED\uBCD1\uC744 \uCE58\uB8CC\uD558\uACE0 \uCCB4\uB825\uC744 \uD68C\uBCF5\uD55C\uB2E4.",
    useCols: [3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 2, max: 4 }
  },
  {
    id: "plague_doctor_blinding_gas",
    name: "\uC2E4\uBA85 \uAC00\uC2A4",
    description: "\uD6C4\uC5F4 \uC801\uB4E4\uC744 \uAE30\uC808\uC2DC\uD0A8\uB2E4.",
    useCols: [3],
    targetCols: [3],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: "stun", chance: 70, duration: 1, value: 0 }
    ]
  },
  {
    id: "plague_doctor_incision",
    name: "\uC808\uAC1C",
    description: "\uBA54\uC2A4\uB85C \uC801\uC744 \uBCA0\uC5B4 \uCD9C\uD608\uC744 \uC77C\uC73C\uD0A8\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.1 },
    accuracy: 10,
    crit: 6,
    effects: [
      { type: "bleed", chance: 80, duration: 3, value: 2 }
    ]
  }
];
var VESTAL_SKILLS = [
  {
    id: "vestal_judgment",
    name: "\uC2EC\uD310",
    description: "\uC2E0\uC131\uD55C \uBE5B\uC73C\uB85C \uC801\uC744 \uACF5\uACA9\uD55C\uB2E4.",
    useCols: [3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.1 },
    accuracy: 0,
    crit: 2
  },
  {
    id: "vestal_dazzling_light",
    name: "\uB208\uBD80\uC2E0 \uBE5B",
    description: "\uAC15\uB82C\uD55C \uBE5B\uC73C\uB85C \uC801\uC744 \uAE30\uC808\uC2DC\uD0A8\uB2E4.",
    useCols: [3],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.6, max: 0.8 },
    accuracy: 0,
    crit: 2,
    effects: [
      { type: "stun", chance: 65, duration: 1, value: 0 }
    ]
  },
  {
    id: "vestal_divine_grace",
    name: "\uC2E0\uC131\uD55C \uC740\uCD1D",
    description: "\uC544\uAD70 \uD55C \uBA85\uC744 \uD06C\uAC8C \uCE58\uC720\uD55C\uB2E4.",
    useCols: [3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 5, max: 9 }
  },
  {
    id: "vestal_divine_comfort",
    name: "\uC2E0\uC131\uD55C \uC704\uC548",
    description: "\uC544\uAD70 \uC804\uCCB4\uB97C \uC57D\uAC04 \uCE58\uC720\uD55C\uB2E4.",
    useCols: [3],
    targetCols: [1, 2, 3],
    targetCount: 9,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 2, max: 3 }
  },
  {
    id: "vestal_mace_bash",
    name: "\uCCA0\uD1F4 \uAC15\uD0C0",
    description: "\uCCA0\uD1F4\uB85C \uC801\uC744 \uB0B4\uB824\uCE5C\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1, max: 1.2 },
    accuracy: -5,
    crit: 3
  }
];
var BONE_SOLDIER_SKILLS = [
  {
    id: "bone_soldier_slash",
    name: "\uBF08 \uCE7C\uB0A0",
    description: "\uB179\uC2A8 \uCE7C\uB85C \uBCA4\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.1 },
    accuracy: 0,
    crit: 3
  },
  {
    id: "bone_soldier_shield_bash",
    name: "\uBC29\uD328 \uAC15\uD0C0",
    description: "\uBC29\uD328\uB85C \uB4E4\uC774\uBC1B\uB294\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.7, max: 0.9 },
    accuracy: -5,
    crit: 2,
    effects: [
      { type: "stun", chance: 30, duration: 1, value: 0 }
    ]
  }
];
var BONE_ARCHER_SKILLS = [
  {
    id: "bone_archer_quarrel",
    name: "\uBF08 \uD654\uC0B4",
    description: "\uD6C4\uBC29\uC5D0\uC11C \uD654\uC0B4\uC744 \uC3DC\uB2E4.",
    useCols: [3],
    targetCols: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1.1 },
    accuracy: 5,
    crit: 6
  },
  {
    id: "bone_archer_bayonet_jab",
    name: "\uCD1D\uAC80 \uCC0C\uB974\uAE30",
    description: "\uADFC\uC811 \uAC70\uB9AC\uC5D0\uC11C \uCC0C\uB978\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.7, max: 0.9 },
    accuracy: -5,
    crit: 4
  }
];
var BONE_CAPTAIN_SKILLS = [
  {
    id: "bone_captain_officers_slash",
    name: "\uC7A5\uAD50\uC758 \uBCA0\uAE30",
    description: "\uAC15\uB825\uD55C \uC77C\uACA9.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.1, max: 1.4 },
    accuracy: 10,
    crit: 6
  },
  {
    id: "bone_captain_command",
    name: "\uC9C0\uD718",
    description: "\uC544\uAD70\uC744 \uB3C5\uB824\uD558\uC5EC \uACF5\uACA9\uB825\uC744 \uB192\uC778\uB2E4.",
    useCols: [1, 2],
    targetCols: [1, 2, 3],
    targetCount: 9,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: "buff_attack", chance: 100, duration: 3, value: 3 }
    ]
  },
  {
    id: "bone_captain_crushing_blow",
    name: "\uBD84\uC1C4 \uD0C0\uACA9",
    description: "\uC801\uC744 \uC9D3\uB20C\uB7EC \uAE30\uC808\uC2DC\uD0A8\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.2 },
    accuracy: 5,
    crit: 4,
    effects: [
      { type: "stun", chance: 50, duration: 1, value: 0 }
    ]
  }
];
var CULTIST_BRAWLER_SKILLS = [
  {
    id: "cultist_brawler_rend",
    name: "\uB09C\uB3C4\uC9C8",
    description: "\uAD11\uAE30 \uC5B4\uB9B0 \uACF5\uACA9.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.2 },
    accuracy: 0,
    crit: 5,
    effects: [
      { type: "bleed", chance: 40, duration: 3, value: 1 }
    ]
  },
  {
    id: "cultist_brawler_stumbling_scratch",
    name: "\uBE44\uD2C0\uAC70\uB9AC\uB294 \uD560\uD034\uAE30",
    description: "\uAC70\uCE5C \uD560\uD034\uAE30 \uACF5\uACA9.",
    useCols: [1, 2],
    targetCols: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1 },
    accuracy: -5,
    crit: 3
  }
];
var CULTIST_ACOLYTE_SKILLS = [
  {
    id: "cultist_acolyte_dark_heal",
    name: "\uC554\uD751 \uCE58\uC720",
    description: "\uC5B4\uB460\uC758 \uD798\uC73C\uB85C \uC544\uAD70\uC744 \uCE58\uC720\uD55C\uB2E4.",
    useCols: [3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 4, max: 7 }
  },
  {
    id: "cultist_acolyte_curse",
    name: "\uC800\uC8FC",
    description: "\uC801\uC5D0\uAC8C \uC800\uC8FC\uB97C \uB0B4\uB9B0\uB2E4.",
    useCols: [3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.6, max: 0.8 },
    accuracy: 0,
    crit: 2,
    effects: [
      { type: "debuff_attack", chance: 60, duration: 3, value: -2 }
    ]
  }
];
var MADMAN_SKILLS = [
  {
    id: "madman_dervish",
    name: "\uAD11\uB780\uC758 \uCDA4",
    description: "\uBBF8\uCE5C \uB4EF\uC774 \uB09C\uB3D9\uC744 \uBD80\uB9B0\uB2E4.",
    useCols: [1, 2],
    targetCols: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.7, max: 0.9 },
    accuracy: -10,
    crit: 5
  },
  {
    id: "madman_accusation",
    name: "\uACE0\uBC1C",
    description: "\uBBF8\uCE5C \uC18C\uB9AC\uB97C \uC9C8\uB7EC \uC2A4\uD2B8\uB808\uC2A4\uB97C \uC900\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.3, max: 0.5 },
    accuracy: 10,
    crit: 2,
    effects: [
      { type: "debuff_speed", chance: 50, duration: 3, value: -2 }
    ]
  }
];
var LARGE_CARRION_EATER_SKILLS = [
  {
    id: "carrion_eater_bite",
    name: "\uD3EC\uC2DD",
    description: "\uAC70\uB300\uD55C \uC785\uC73C\uB85C \uBB3C\uC5B4\uB72F\uB294\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1, max: 1.3 },
    accuracy: 0,
    crit: 3,
    effects: [
      { type: "blight", chance: 50, duration: 3, value: 2 }
    ]
  },
  {
    id: "carrion_eater_acid_spit",
    name: "\uC0B0\uC131 \uCE68",
    description: "\uBA40\uB9AC\uC11C \uC0B0\uC131 \uCE68\uC744 \uBC49\uB294\uB2E4.",
    useCols: [1, 2],
    targetCols: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.6, max: 0.8 },
    accuracy: 5,
    crit: 2,
    effects: [
      { type: "blight", chance: 70, duration: 3, value: 3 }
    ]
  }
];
var NECROMANCER_SKILLS = [
  {
    id: "necromancer_the_clawing_dead",
    name: "\uC8FD\uC740 \uC790\uC758 \uC190\uC544\uADC0",
    description: "\uC8FD\uC740 \uC790\uC758 \uC190\uC774 \uB545\uC5D0\uC11C \uC19F\uC544\uC624\uB978\uB2E4.",
    useCols: [3],
    targetCols: [1, 2],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.8, max: 1.1 },
    accuracy: 5,
    crit: 3
  },
  {
    id: "necromancer_dark_bolt",
    name: "\uC554\uD751 \uD654\uC0B4",
    description: "\uC5B4\uB460\uC758 \uC5D0\uB108\uC9C0\uB97C \uBC1C\uC0AC\uD55C\uB2E4.",
    useCols: [3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1, max: 1.3 },
    accuracy: 10,
    crit: 5,
    effects: [
      { type: "debuff_defense", chance: 60, duration: 3, value: -3 }
    ]
  },
  {
    id: "necromancer_life_drain",
    name: "\uC0DD\uBA85\uB825 \uD761\uC218",
    description: "\uC801\uC758 \uC0DD\uBA85\uB825\uC744 \uD761\uC218\uD55C\uB2E4.",
    useCols: [3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.7, max: 1 },
    accuracy: 5,
    crit: 2,
    heal: { min: 3, max: 5 }
  }
];
var WARRIOR_SKILLS = [
  {
    id: "warrior_heavy_strike",
    name: "\uAC15\uD0C0",
    description: "\uC804\uC5F4\uC5D0\uC11C \uC801\uC744 \uAC15\uD558\uAC8C \uB0B4\uB9AC\uCE5C\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.1, max: 1.4 },
    accuracy: 5,
    crit: 5
  },
  {
    id: "warrior_shield_bash",
    name: "\uBC29\uD328\uCE58\uAE30",
    description: "\uBC29\uD328\uB85C \uC801\uC744 \uAC15\uD0C0\uD558\uC5EC \uAE30\uC808\uC2DC\uD0A8\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.7, max: 0.9 },
    accuracy: 0,
    crit: 2,
    effects: [
      { type: "stun", chance: 50, duration: 1, value: 0 }
    ]
  },
  {
    id: "warrior_charge",
    name: "\uB3CC\uC9C4",
    description: "\uD6C4\uC5F4\uC5D0\uC11C \uC804\uC5F4\uB85C \uB3CC\uC9C4\uD558\uBA70 \uACF5\uACA9\uD55C\uB2E4.",
    useCols: [2, 3],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1, max: 1.2 },
    accuracy: 5,
    crit: 4,
    selfMove: { row: 0, col: -2 }
  },
  {
    id: "warrior_battle_cry",
    name: "\uC804\uD22C\uD568\uC131",
    description: "\uC544\uAD70 \uC804\uCCB4\uC758 \uACF5\uACA9\uB825\uC744 \uB192\uC774\uB294 \uD568\uC131\uC744 \uC9C0\uB978\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 9,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: "buff_attack", chance: 100, duration: 3, value: 3 }
    ]
  },
  {
    id: "warrior_defensive_stance",
    name: "\uC218\uBE44\uD0DC\uC138",
    description: "\uBC29\uC5B4 \uC790\uC138\uB97C \uCDE8\uD558\uC5EC \uBC29\uC5B4\uB825\uC744 \uB192\uC778\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: "buff_defense", chance: 100, duration: 3, value: 4 }
    ]
  }
];
var ROGUE_SKILLS = [
  {
    id: "rogue_ambush",
    name: "\uAE30\uC2B5",
    description: "\uC801\uC758 \uBE48\uD2C8\uC744 \uB178\uB824 \uB192\uC740 \uCE58\uBA85\uD0C0\uB85C \uACF5\uACA9\uD55C\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.1 },
    accuracy: 10,
    crit: 15
  },
  {
    id: "rogue_blade_flurry",
    name: "\uB2E8\uAC80\uB09C\uBB34",
    description: "\uB2E8\uAC80\uC73C\uB85C \uC5EC\uB7EC \uC801\uC744 \uB3D9\uC2DC\uC5D0 \uBCA0\uC5B4\uB0B8\uB2E4.",
    useCols: [1],
    targetCols: [1, 2],
    targetCount: 3,
    targetAlly: false,
    damage: { min: 0.6, max: 0.8 },
    accuracy: 0,
    crit: 8
  },
  {
    id: "rogue_poison_blade",
    name: "\uB3C5\uCE7C\uB0A0",
    description: "\uB3C5\uC744 \uBC14\uB978 \uCE7C\uB0A0\uB85C \uCD9C\uD608\uACFC \uC5ED\uBCD1\uC744 \uC77C\uC73C\uD0A8\uB2E4.",
    useCols: [1, 2],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1 },
    accuracy: 5,
    crit: 5,
    effects: [
      { type: "bleed", chance: 60, duration: 3, value: 2 },
      { type: "blight", chance: 60, duration: 3, value: 2 }
    ]
  },
  {
    id: "rogue_shadow_step",
    name: "\uADF8\uB9BC\uC790\uAC78\uC74C",
    description: "\uADF8\uB9BC\uC790 \uC18D\uC5D0\uC11C \uC774\uB3D9\uD558\uBA70 \uAE30\uC2B5 \uACF5\uACA9\uD55C\uB2E4.",
    useCols: [2, 3],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.1 },
    accuracy: 10,
    crit: 8,
    selfMove: { row: 0, col: -1 }
  },
  {
    id: "rogue_evasion",
    name: "\uD68C\uD53C",
    description: "\uBBFC\uCCA9\uD55C \uC6C0\uC9C1\uC784\uC73C\uB85C \uD68C\uD53C\uB825\uC744 \uB192\uC778\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: "buff_speed", chance: 100, duration: 3, value: 5 }
    ]
  }
];
var MAGE_SKILLS = [
  {
    id: "mage_fireball",
    name: "\uD654\uC5FC\uAD6C",
    description: "\uD654\uC5FC \uAD6C\uCCB4\uB97C \uBC1C\uC0AC\uD558\uC5EC \uC5EC\uB7EC \uC801\uC744 \uBD88\uD0DC\uC6B4\uB2E4.",
    useCols: [3],
    targetCols: [1, 2],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.8, max: 1.1 },
    accuracy: 5,
    crit: 3,
    effects: [
      { type: "blight", chance: 50, duration: 3, value: 3 }
    ]
  },
  {
    id: "mage_ice_shard",
    name: "\uC5BC\uC74C\uD30C\uD3B8",
    description: "\uC5BC\uC74C \uD30C\uD3B8\uC744 \uB0A0\uB824 \uC801\uC744 \uAC10\uC18D\uC2DC\uD0A8\uB2E4.",
    useCols: [3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.2 },
    accuracy: 10,
    crit: 4,
    effects: [
      { type: "debuff_speed", chance: 70, duration: 3, value: -3 }
    ]
  },
  {
    id: "mage_arcane_blast",
    name: "\uBE44\uC804\uD3ED\uBC1C",
    description: "\uBE44\uC804 \uC5D0\uB108\uC9C0\uB97C \uC9D1\uC911\uD558\uC5EC \uAC15\uB825\uD55C \uC77C\uACA9\uC744 \uAC00\uD55C\uB2E4.",
    useCols: [3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.2, max: 1.6 },
    accuracy: 0,
    crit: 5
  },
  {
    id: "mage_mana_shield",
    name: "\uB9C8\uB098\uBC29\uBCBD",
    description: "\uB9C8\uB098\uB85C \uBC29\uC5B4 \uC7A5\uBCBD\uC744 \uC0DD\uC131\uD558\uC5EC \uBC29\uC5B4\uB825\uC744 \uB192\uC778\uB2E4.",
    useCols: [3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: "buff_defense", chance: 100, duration: 3, value: 5 }
    ]
  },
  {
    id: "mage_chain_lightning",
    name: "\uC5F0\uC1C4\uBC88\uAC1C",
    description: "\uBC88\uAC1C\uB97C \uBC1C\uC0AC\uD558\uC5EC \uC5EC\uB7EC \uC801\uC5D0\uAC8C \uC5F0\uC1C4 \uD53C\uD574\uB97C \uC900\uB2E4.",
    useCols: [3],
    targetCols: [1, 2, 3],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.7, max: 1 },
    accuracy: 5,
    crit: 4
  }
];
var RANGER_SKILLS = [
  {
    id: "ranger_power_shot",
    name: "\uAC15\uB825\uC0AC\uACA9",
    description: "\uD798\uC744 \uBAA8\uC544 \uAC15\uB825\uD55C \uD654\uC0B4\uC744 \uBC1C\uC0AC\uD55C\uB2E4.",
    useCols: [3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1, max: 1.3 },
    accuracy: 10,
    crit: 8
  },
  {
    id: "ranger_volley",
    name: "\uC77C\uC81C\uC0AC\uACA9",
    description: "\uC5EC\uB7EC \uD654\uC0B4\uC744 \uB3D9\uC2DC\uC5D0 \uBC1C\uC0AC\uD558\uC5EC \uC801\uB4E4\uC744 \uACF5\uACA9\uD55C\uB2E4.",
    useCols: [3],
    targetCols: [1, 2],
    targetCount: 3,
    targetAlly: false,
    damage: { min: 0.5, max: 0.7 },
    accuracy: 0,
    crit: 5
  },
  {
    id: "ranger_trap",
    name: "\uD568\uC815",
    description: "\uD568\uC815\uC744 \uC124\uCE58\uD558\uC5EC \uC801\uC744 \uAE30\uC808\uC2DC\uD0A8\uB2E4.",
    useCols: [2, 3],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.6, max: 0.8 },
    accuracy: 5,
    crit: 2,
    effects: [
      { type: "stun", chance: 55, duration: 1, value: 0 }
    ]
  },
  {
    id: "ranger_rapid_fire",
    name: "\uC18D\uC0AC",
    description: "\uBE60\uB974\uAC8C \uD654\uC0B4\uC744 \uC5F0\uC0AC\uD55C\uB2E4.",
    useCols: [3],
    targetCols: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.7, max: 0.9 },
    accuracy: 15,
    crit: 10
  },
  {
    id: "ranger_mark_target",
    name: "\uD45C\uC801\uC9C0\uC815",
    description: "\uC801\uC5D0\uAC8C \uD45C\uC2DD\uC744 \uB0A8\uAE30\uACE0 \uBC29\uC5B4\uB825\uC744 \uB0AE\uCD98\uB2E4.",
    useCols: [2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.5, max: 0.6 },
    accuracy: 15,
    crit: 0,
    effects: [
      { type: "mark", chance: 100, duration: 3, value: 0 },
      { type: "debuff_defense", chance: 80, duration: 3, value: -3 }
    ]
  }
];
var PALADIN_SKILLS = [
  {
    id: "paladin_holy_strike",
    name: "\uC2E0\uC131\uD0C0\uACA9",
    description: "\uC2E0\uC131\uD55C \uD798\uC744 \uB2F4\uC544 \uC801\uC744 \uACF5\uACA9\uD55C\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1, max: 1.3 },
    accuracy: 5,
    crit: 3
  },
  {
    id: "paladin_holy_shield",
    name: "\uC2E0\uC131\uBC29\uD328",
    description: "\uC2E0\uC131\uD55C \uBE5B\uC73C\uB85C \uC544\uAD70 \uD55C \uBA85\uC744 \uCE58\uC720\uD55C\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 4, max: 7 }
  },
  {
    id: "paladin_smite",
    name: "\uCC9C\uBC8C",
    description: "\uC2E0\uC758 \uBD84\uB178\uB97C \uB2F4\uC544 \uAC15\uB825\uD55C \uC77C\uACA9\uC744 \uAC00\uD55C\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.3, max: 1.6 },
    accuracy: 0,
    crit: 4
  },
  {
    id: "paladin_lay_on_hands",
    name: "\uC548\uC218",
    description: "\uC2E0\uC131\uD55C \uC548\uC218\uB85C \uC544\uAD70\uC744 \uD06C\uAC8C \uCE58\uC720\uD55C\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    heal: { min: 8, max: 12 }
  },
  {
    id: "paladin_consecrate",
    name: "\uCD95\uC131",
    description: "\uCD95\uC131\uB41C \uB545\uC73C\uB85C \uC801 \uC804\uCCB4\uC5D0 \uD53C\uD574\uB97C \uC900\uB2E4. \uC2E0\uC131\uD55C \uAE30\uC6B4\uC774 \uC544\uAD70\uB3C4 \uCE58\uC720\uD55C\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 9,
    targetAlly: false,
    damage: { min: 0.4, max: 0.6 },
    accuracy: 5,
    crit: 1
  }
];
var DARK_KNIGHT_SKILLS = [
  {
    id: "dark_knight_life_steal",
    name: "\uC0DD\uBA85\uD761\uC218",
    description: "\uC801\uC758 \uC0DD\uBA85\uB825\uC744 \uD761\uC218\uD558\uC5EC \uC790\uC2E0\uC744 \uCE58\uC720\uD55C\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1.1 },
    accuracy: 5,
    crit: 4,
    heal: { min: 3, max: 5 }
  },
  {
    id: "dark_knight_curse",
    name: "\uC800\uC8FC",
    description: "\uC5B4\uB460\uC758 \uC800\uC8FC\uB85C \uC801\uC758 \uACF5\uACA9\uB825\uACFC \uBC29\uC5B4\uB825\uC744 \uB0AE\uCD98\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.5, max: 0.7 },
    accuracy: 10,
    crit: 2,
    effects: [
      { type: "debuff_attack", chance: 70, duration: 3, value: -3 },
      { type: "debuff_defense", chance: 70, duration: 3, value: -2 }
    ]
  },
  {
    id: "dark_knight_dark_blade",
    name: "\uC554\uD751\uAC80",
    description: "\uC554\uD751\uC758 \uD798\uC744 \uB2F4\uC740 \uAC80\uC73C\uB85C \uAC15\uD558\uAC8C \uBCA0\uC5B4\uB0B8\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.2, max: 1.5 },
    accuracy: 0,
    crit: 6
  },
  {
    id: "dark_knight_soul_harvest",
    name: "\uC601\uD63C\uC218\uD655",
    description: "\uC801\uB4E4\uC758 \uC601\uD63C\uC744 \uAC70\uB450\uC5B4 \uD53C\uD574\uB97C \uC900\uB2E4.",
    useCols: [1],
    targetCols: [1, 2],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.6, max: 0.9 },
    accuracy: 5,
    crit: 3
  },
  {
    id: "dark_knight_dark_oath",
    name: "\uC554\uD751\uB9F9\uC138",
    description: "\uC5B4\uB460\uC5D0 \uB9F9\uC138\uD558\uC5EC \uC790\uC2E0\uC758 \uACF5\uACA9\uB825\uC744 \uD06C\uAC8C \uB192\uC778\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: "buff_attack", chance: 100, duration: 3, value: 5 }
    ]
  }
];
var SHADOW_LURKER_SKILLS = [
  {
    id: "shadow_lurker_ambush",
    name: "\uAE30\uC2B5 \uACF5\uACA9",
    description: "\uADF8\uB9BC\uC790 \uC18D\uC5D0\uC11C \uAE30\uC2B5\uD558\uC5EC \uACF5\uACA9\uD55C\uB2E4.",
    useCols: [1, 2],
    targetCols: [1, 2],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1, max: 1.3 },
    accuracy: 15,
    crit: 10
  },
  {
    id: "shadow_lurker_vanish",
    name: "\uC18C\uBA78",
    description: "\uADF8\uB9BC\uC790 \uC18D\uC73C\uB85C \uC0AC\uB77C\uC838 \uD68C\uD53C\uB825\uC744 \uB192\uC778\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: "buff_speed", chance: 100, duration: 2, value: 5 }
    ]
  }
];
var PLAGUE_RAT_SKILLS = [
  {
    id: "plague_rat_bite",
    name: "\uC5ED\uBCD1 \uBB3C\uAE30",
    description: "\uC5ED\uBCD1\uC5D0 \uAC10\uC5FC\uB41C \uC774\uBE68\uB85C \uBB3C\uC5B4\uB72F\uB294\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.6, max: 0.8 },
    accuracy: 0,
    crit: 3,
    effects: [
      { type: "blight", chance: 70, duration: 3, value: 2 }
    ]
  },
  {
    id: "plague_rat_infect",
    name: "\uAC10\uC5FC",
    description: "\uC5ED\uBCD1\uC744 \uD37C\uB728\uB824 \uC5EC\uB7EC \uC801\uC744 \uAC10\uC5FC\uC2DC\uD0A8\uB2E4.",
    useCols: [1],
    targetCols: [1, 2],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.3, max: 0.5 },
    accuracy: 0,
    crit: 1,
    effects: [
      { type: "blight", chance: 80, duration: 3, value: 3 }
    ]
  }
];
var CURSED_KNIGHT_SKILLS = [
  {
    id: "cursed_knight_cursed_slash",
    name: "\uC800\uC8FC\uC758 \uAC80",
    description: "\uC800\uC8FC\uBC1B\uC740 \uAC80\uC73C\uB85C \uC801\uC744 \uBCA0\uC5B4\uB0B8\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.1, max: 1.4 },
    accuracy: 5,
    crit: 4
  },
  {
    id: "cursed_knight_shield_wall",
    name: "\uBC29\uD328\uBCBD",
    description: "\uBC29\uD328\uBCBD\uC744 \uC138\uC6CC \uC544\uAD70 \uC804\uCCB4\uC758 \uBC29\uC5B4\uB825\uC744 \uB192\uC778\uB2E4.",
    useCols: [1],
    targetCols: [1, 2, 3],
    targetCount: 9,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: "buff_defense", chance: 100, duration: 2, value: 3 }
    ]
  }
];
var DARK_MAGE_SKILLS = [
  {
    id: "dark_mage_shadow_bolt",
    name: "\uADF8\uB9BC\uC790 \uD654\uC0B4",
    description: "\uADF8\uB9BC\uC790 \uD654\uC0B4\uC744 \uBC1C\uC0AC\uD558\uC5EC \uC801\uC758 \uACF5\uACA9\uB825\uC744 \uB0AE\uCD98\uB2E4.",
    useCols: [3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.9, max: 1.2 },
    accuracy: 10,
    crit: 4,
    effects: [
      { type: "debuff_attack", chance: 60, duration: 3, value: -2 }
    ]
  },
  {
    id: "dark_mage_dark_ritual",
    name: "\uC554\uD751 \uC758\uC2DD",
    description: "\uC554\uD751 \uC758\uC2DD\uC744 \uD589\uD558\uC5EC \uC5EC\uB7EC \uC801\uC5D0\uAC8C \uD53C\uD574\uB97C \uC8FC\uACE0 \uBC29\uC5B4\uB825\uC744 \uB0AE\uCD98\uB2E4.",
    useCols: [3],
    targetCols: [1, 2],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.6, max: 0.9 },
    accuracy: 5,
    crit: 2,
    effects: [
      { type: "debuff_defense", chance: 50, duration: 3, value: -2 }
    ]
  }
];
var GARGOYLE_SKILLS = [
  {
    id: "gargoyle_stone_fist",
    name: "\uB3CC\uC8FC\uBA39",
    description: "\uAC70\uB300\uD55C \uB3CC\uC8FC\uBA39\uC73C\uB85C \uC801\uC744 \uB0B4\uB824\uCCD0 \uAE30\uC808\uC2DC\uD0A8\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1, max: 1.3 },
    accuracy: 0,
    crit: 3,
    effects: [
      { type: "stun", chance: 40, duration: 1, value: 0 }
    ]
  },
  {
    id: "gargoyle_stone_skin",
    name: "\uC11D\uD654 \uBC29\uC5B4",
    description: "\uD53C\uBD80\uB97C \uC11D\uD654\uC2DC\uCF1C \uBC29\uC5B4\uB825\uC744 \uD06C\uAC8C \uB192\uC778\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: "buff_defense", chance: 100, duration: 3, value: 5 }
    ]
  }
];
var WRAITH_SKILLS = [
  {
    id: "wraith_spectral_touch",
    name: "\uC720\uB839 \uC190\uAE38",
    description: "\uC2E4\uCCB4 \uC5C6\uB294 \uC190\uAE38\uB85C \uBC29\uC5B4\uB97C \uBB34\uC2DC\uD558\uACE0 \uACF5\uACA9\uD55C\uB2E4.",
    useCols: [1, 2],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1.1 },
    accuracy: 20,
    crit: 5
  },
  {
    id: "wraith_wail",
    name: "\uD1B5\uACE1",
    description: "\uC6D0\uD63C\uC758 \uD1B5\uACE1\uC73C\uB85C \uC5EC\uB7EC \uC801\uC758 \uC18D\uB3C4\uB97C \uB0AE\uCD98\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.4, max: 0.6 },
    accuracy: 10,
    crit: 2,
    effects: [
      { type: "debuff_speed", chance: 70, duration: 3, value: -3 }
    ]
  }
];
var FROST_TITAN_SKILLS = [
  {
    id: "frost_titan_ice_smash",
    name: "\uBE59\uACB0 \uAC15\uD0C0",
    description: "\uC5BC\uC74C \uC8FC\uBA39\uC73C\uB85C \uC801\uC744 \uB0B4\uB9AC\uCE5C\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.1, max: 1.4 },
    accuracy: 5,
    crit: 4,
    effects: [
      { type: "debuff_speed", chance: 60, duration: 2, value: -3 }
    ]
  },
  {
    id: "frost_titan_avalanche",
    name: "\uB208\uC0AC\uD0DC",
    description: "\uC804\uBC29\uC758 \uC801\uB4E4\uC744 \uB208\uC0AC\uD0DC\uB85C \uB36E\uCE5C\uB2E4.",
    useCols: [1],
    targetCols: [1, 2],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.7, max: 1 },
    accuracy: 0,
    crit: 3
  },
  {
    id: "frost_titan_frost_armor",
    name: "\uC11C\uB9AC \uAC11\uC637",
    description: "\uC11C\uB9AC\uB85C \uBC29\uC5B4\uB825\uC744 \uB192\uC778\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: "buff_defense", chance: 100, duration: 3, value: 5 }
    ]
  }
];
var FLAME_DEMON_SKILLS = [
  {
    id: "flame_demon_hellfire",
    name: "\uC9C0\uC625\uBD88",
    description: "\uC9C0\uC625\uC758 \uBD88\uAF43\uC73C\uB85C \uC801\uC744 \uBD88\uD0DC\uC6B4\uB2E4.",
    useCols: [1, 2],
    targetCols: [1, 2, 3],
    targetCount: 2,
    targetAlly: false,
    damage: { min: 0.8, max: 1.1 },
    accuracy: 10,
    crit: 5,
    effects: [
      { type: "blight", chance: 60, duration: 3, value: 3 }
    ]
  },
  {
    id: "flame_demon_flame_lash",
    name: "\uD654\uC5FC \uCC44\uCC0D",
    description: "\uD654\uC5FC \uCC44\uCC0D\uC73C\uB85C \uC801\uC744 \uACF5\uACA9\uD55C\uB2E4.",
    useCols: [1],
    targetCols: [1],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.2, max: 1.5 },
    accuracy: 5,
    crit: 6,
    effects: [
      { type: "bleed", chance: 50, duration: 3, value: 2 }
    ]
  },
  {
    id: "flame_demon_inferno",
    name: "\uC778\uD398\uB974\uB178",
    description: "\uC804\uCCB4\uB97C \uBD88\uD0DC\uC6B0\uB294 \uD654\uC5FC.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 9,
    targetAlly: false,
    damage: { min: 0.5, max: 0.7 },
    accuracy: 5,
    crit: 2
  }
];
var VOID_LORD_SKILLS = [
  {
    id: "void_lord_void_strike",
    name: "\uACF5\uD5C8 \uC77C\uACA9",
    description: "\uACF5\uD5C8\uC758 \uC5D0\uB108\uC9C0\uB85C \uC801\uC744 \uACF5\uACA9\uD55C\uB2E4.",
    useCols: [1, 2],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 1.1, max: 1.4 },
    accuracy: 10,
    crit: 5,
    effects: [
      { type: "debuff_attack", chance: 50, duration: 3, value: -3 }
    ]
  },
  {
    id: "void_lord_dark_pulse",
    name: "\uC554\uD751 \uD30C\uB3D9",
    description: "\uC554\uD751 \uD30C\uB3D9\uC73C\uB85C \uC804\uCCB4\uB97C \uACF5\uACA9\uD55C\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 9,
    targetAlly: false,
    damage: { min: 0.5, max: 0.8 },
    accuracy: 5,
    crit: 3
  },
  {
    id: "void_lord_life_siphon",
    name: "\uC0DD\uBA85 \uCC29\uCDE8",
    description: "\uC801\uC758 \uC0DD\uBA85\uB825\uC744 \uD761\uC218\uD55C\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: false,
    damage: { min: 0.8, max: 1.1 },
    accuracy: 10,
    crit: 4,
    heal: { min: 5, max: 8 }
  },
  {
    id: "void_lord_void_shield",
    name: "\uACF5\uD5C8 \uBC29\uBCBD",
    description: "\uACF5\uD5C8\uC758 \uD798\uC73C\uB85C \uBC29\uC5B4\uB825\uC744 \uB192\uC778\uB2E4.",
    useCols: [1, 2, 3],
    targetCols: [1, 2, 3],
    targetCount: 1,
    targetAlly: true,
    damage: { min: 0, max: 0 },
    accuracy: 0,
    crit: 0,
    effects: [
      { type: "buff_defense", chance: 100, duration: 3, value: 4 },
      { type: "buff_attack", chance: 100, duration: 3, value: 3 }
    ]
  }
];
var HERO_SKILLS = {
  crusader: CRUSADER_SKILLS,
  highwayman: HIGHWAYMAN_SKILLS,
  plague_doctor: PLAGUE_DOCTOR_SKILLS,
  vestal: VESTAL_SKILLS,
  warrior: WARRIOR_SKILLS,
  rogue: ROGUE_SKILLS,
  mage: MAGE_SKILLS,
  ranger: RANGER_SKILLS,
  paladin: PALADIN_SKILLS,
  dark_knight: DARK_KNIGHT_SKILLS
};
var MONSTER_SKILLS = {
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
  frost_titan: FROST_TITAN_SKILLS,
  flame_demon: FLAME_DEMON_SKILLS,
  void_lord: VOID_LORD_SKILLS
};

// src/utils/helpers.ts
import { RNG } from "rot-js";
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function randomInt(min, max) {
  return Math.floor(RNG.getUniform() * (max - min + 1)) + min;
}
function randomChoice(arr) {
  return arr[Math.floor(RNG.getUniform() * arr.length)];
}
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(RNG.getUniform() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function formatBar(current, max, width, fillChar = "\u2588", emptyChar = "\u2591") {
  const ratio = Math.max(0, current) / max;
  const filled = Math.round(ratio * width);
  return fillChar.repeat(filled) + emptyChar.repeat(width - filled);
}
function percentChance(percent) {
  return RNG.getUniform() * 100 < percent;
}
var STAT_KOREAN = {
  attack: "\uACF5",
  defense: "\uBC29",
  speed: "\uC18D",
  accuracy: "\uBA85",
  dodge: "\uD68C",
  crit: "\uCE58",
  maxHp: "HP"
};
function formatEquipComparison(newItem, equippedItem) {
  const newMods = {};
  const oldMods = {};
  for (const m of newItem.modifiers) newMods[m.stat] = (newMods[m.stat] || 0) + m.value;
  if (equippedItem) {
    for (const m of equippedItem.modifiers) oldMods[m.stat] = (oldMods[m.stat] || 0) + m.value;
  }
  const allStats = /* @__PURE__ */ new Set([...Object.keys(newMods), ...Object.keys(oldMods)]);
  const parts = [];
  for (const stat of allStats) {
    const diff = (newMods[stat] || 0) - (oldMods[stat] || 0);
    if (diff === 0) continue;
    const label = STAT_KOREAN[stat] || stat;
    if (diff > 0) {
      parts.push(`{green-fg}${label}\u2191${diff}{/green-fg}`);
    } else {
      parts.push(`{red-fg}${label}\u2193${Math.abs(diff)}{/red-fg}`);
    }
  }
  return parts.join(" ");
}

// src/data/traits.ts
var TRAIT_POOL = [
  // === Positive (8) ===
  {
    id: "hard_hitter",
    name: "\uAC15\uD0C0\uC790",
    description: "\uACF5\uACA9\uB825\uC774 \uB192\uB2E4.",
    category: "positive",
    effects: [{ type: "stat_bonus", stat: "attack", value: 2 }]
  },
  {
    id: "quick_reflexes",
    name: "\uBE60\uB978 \uBC18\uC0AC\uC2E0\uACBD",
    description: "\uC18D\uB3C4\uAC00 \uBE60\uB974\uB2E4.",
    category: "positive",
    effects: [{ type: "stat_bonus", stat: "speed", value: 2 }]
  },
  {
    id: "tough",
    name: "\uAC15\uC778\uD568",
    description: "\uCCB4\uB825\uC774 \uB192\uB2E4.",
    category: "positive",
    effects: [{ type: "stat_bonus", stat: "maxHp", value: 5 }]
  },
  {
    id: "eagle_eye",
    name: "\uB9E4\uC758 \uB208",
    description: "\uBA85\uC911\uB960\uC774 \uB192\uB2E4.",
    category: "positive",
    effects: [{ type: "stat_bonus", stat: "accuracy", value: 5 }]
  },
  {
    id: "nimble",
    name: "\uB0A0\uB835\uD568",
    description: "\uD68C\uD53C\uB825\uC774 \uB192\uB2E4.",
    category: "positive",
    effects: [{ type: "stat_bonus", stat: "dodge", value: 5 }]
  },
  {
    id: "natural_crit",
    name: "\uCC9C\uC0DD \uAE09\uC18C\uACF5\uACA9\uC790",
    description: "\uCE58\uBA85\uD0C0\uC728\uC774 \uB192\uB2E4.",
    category: "positive",
    effects: [{ type: "crit_bonus", value: 3 }]
  },
  {
    id: "treasure_hunter",
    name: "\uBCF4\uBB3C \uC0AC\uB0E5\uAFBC",
    description: "\uACE8\uB4DC \uD68D\uB4DD\uC774 \uC99D\uAC00\uD55C\uB2E4.",
    category: "positive",
    effects: [{ type: "gold_modifier", value: 20, isPercent: true }]
  },
  // === Negative (6) ===
  {
    id: "frail",
    name: "\uD5C8\uC57D\uD568",
    description: "\uCCB4\uB825\uC774 \uB0AE\uB2E4.",
    category: "negative",
    effects: [{ type: "stat_bonus", stat: "maxHp", value: -4 }]
  },
  {
    id: "clumsy",
    name: "\uC11C\uD22C\uB984",
    description: "\uBA85\uC911\uB960\uC774 \uB0AE\uB2E4.",
    category: "negative",
    effects: [{ type: "stat_bonus", stat: "accuracy", value: -5 }]
  },
  {
    id: "slow",
    name: "\uAD7C\uB728\uAE30",
    description: "\uC18D\uB3C4\uAC00 \uB290\uB9AC\uB2E4.",
    category: "negative",
    effects: [{ type: "stat_bonus", stat: "speed", value: -2 }]
  },
  {
    id: "weak",
    name: "\uB098\uC57D\uD568",
    description: "\uACF5\uACA9\uB825\uC774 \uB0AE\uB2E4.",
    category: "negative",
    effects: [{ type: "stat_bonus", stat: "attack", value: -2 }]
  },
  {
    id: "glass_jaw",
    name: "\uC720\uB9AC\uD131",
    description: "\uBC29\uC5B4\uB825\uC774 \uB0AE\uB2E4.",
    category: "negative",
    effects: [{ type: "stat_bonus", stat: "defense", value: -2 }]
  },
  // === Neutral (4) ===
  {
    id: "boss_slayer",
    name: "\uBCF4\uC2A4 \uC0AC\uB0E5\uAFBC",
    description: "\uBCF4\uC2A4\uC804\uC5D0\uC11C \uACF5\uACA9\uB825\uC774 \uC624\uB978\uB2E4.",
    category: "neutral",
    effects: [{ type: "stat_bonus", stat: "attack", value: 3, condition: "boss_fight" }]
  },
  {
    id: "cornered",
    name: "\uAD81\uC9C0\uC758 \uD798",
    description: "HP\uAC00 \uB0AE\uC744 \uB54C \uCE58\uBA85\uD0C0\uAC00 \uC624\uB978\uB2E4.",
    category: "neutral",
    effects: [{ type: "crit_bonus", value: 8, condition: "low_hp" }]
  }
];
function rollTraits() {
  const count = randomInt(1, 2);
  const shuffled = shuffleArray([...TRAIT_POOL]);
  const result = [];
  const usedIds = /* @__PURE__ */ new Set();
  for (const trait of shuffled) {
    if (result.length >= count) break;
    if (usedIds.has(trait.id)) continue;
    usedIds.add(trait.id);
    result.push(trait);
  }
  return result;
}
function getTraitStatBonuses(traits, context) {
  const bonuses = {
    attack: 0,
    defense: 0,
    speed: 0,
    accuracy: 0,
    dodge: 0,
    crit: 0,
    maxHp: 0,
    goldModifier: 0
  };
  for (const trait of traits) {
    for (const effect of trait.effects) {
      if (effect.condition) {
        if (!context) continue;
        switch (effect.condition) {
          case "boss_fight":
            if (!context.isBoss) continue;
            break;
          case "low_hp":
            if ((context.hpPercent ?? 1) >= 0.3) continue;
            break;
        }
      }
      switch (effect.type) {
        case "stat_bonus":
          if (effect.stat && effect.stat in bonuses) {
            bonuses[effect.stat] += effect.value;
          }
          break;
        case "gold_modifier":
          bonuses.goldModifier += effect.value;
          break;
        case "crit_bonus":
          bonuses.crit += effect.value;
          break;
      }
    }
  }
  return bonuses;
}
function getTraitCategoryColor(category) {
  switch (category) {
    case "positive":
      return "green";
    case "negative":
      return "red";
    case "neutral":
      return "yellow";
  }
}

// src/data/heroes.ts
var RARITY_MULTIPLIER = { 1: 1, 2: 1.15, 3: 1.3 };
function getStars(rarity) {
  if (rarity === 3) return "\u2605\u2605\u2605";
  if (rarity === 2) return "\u2605\u2605";
  return "\u2605";
}
function rollRarity() {
  const roll = Math.random() * 100;
  if (roll < 10) return 3;
  if (roll < 40) return 2;
  return 1;
}
var HERO_NAMES = {
  // Main character classes
  warrior: [
    "Aron",
    "Bjorn",
    "Hector",
    "Marcus",
    "Leonidas",
    "Sigurd",
    "Thorin",
    "Ragnar",
    "Gideon",
    "Victor"
  ],
  rogue: [
    "Shadow",
    "Raven",
    "Vex",
    "Cipher",
    "Shade",
    "Phantom",
    "Ghost",
    "Wraith",
    "Nyx",
    "Onyx"
  ],
  mage: [
    "Merlin",
    "Gandara",
    "Azoth",
    "Elric",
    "Theron",
    "Mordecai",
    "Zephyr",
    "Arcanus",
    "Ignis",
    "Voltaire"
  ],
  ranger: [
    "Artemis",
    "Robin",
    "Hawke",
    "Falcone",
    "Strider",
    "Arrow",
    "Scout",
    "Hunter",
    "Talon",
    "Swift"
  ],
  paladin: [
    "Galahad",
    "Percival",
    "Lancelot",
    "Tristan",
    "Arthur",
    "Uther",
    "Balin",
    "Gawain",
    "Mordred",
    "Geraint"
  ],
  dark_knight: [
    "Draven",
    "Malthus",
    "Oberon",
    "Thanatos",
    "Erebus",
    "Noctis",
    "Abaddon",
    "Moros",
    "Tenebris",
    "Umbra"
  ],
  // Companion classes
  crusader: [
    "Reynauld",
    "Baldwin",
    "Godfrey",
    "Tancred",
    "Aldric",
    "Cedric",
    "Brant",
    "Lucian",
    "Gareth",
    "Roland"
  ],
  highwayman: [
    "Dismas",
    "William",
    "Cutter",
    "Varen",
    "Rowan",
    "Fletcher",
    "Blythe",
    "Corbin",
    "Maddox",
    "Sterling"
  ],
  plague_doctor: [
    "Paracelsus",
    "Isolde",
    "Vivienne",
    "Ophelia",
    "Marguerite",
    "Beatrix",
    "Cordelia",
    "Lenora",
    "Sylvia",
    "Helena"
  ],
  vestal: [
    "Junia",
    "Agnes",
    "Theodora",
    "Clarice",
    "Emmeline",
    "Rosalind",
    "Solange",
    "Verena",
    "Celestia",
    "Miriam"
  ]
};
var BASE_STATS = {
  // Main character classes
  warrior: {
    maxHp: 40,
    hp: 40,
    attack: 8,
    defense: 4,
    speed: 2,
    accuracy: 82,
    dodge: 5,
    crit: 4
  },
  rogue: {
    maxHp: 26,
    hp: 26,
    attack: 7,
    defense: 1,
    speed: 7,
    accuracy: 88,
    dodge: 20,
    crit: 10
  },
  mage: {
    maxHp: 22,
    hp: 22,
    attack: 10,
    defense: 0,
    speed: 4,
    accuracy: 92,
    dodge: 8,
    crit: 3
  },
  ranger: {
    maxHp: 28,
    hp: 28,
    attack: 7,
    defense: 1,
    speed: 5,
    accuracy: 90,
    dodge: 12,
    crit: 7
  },
  paladin: {
    maxHp: 45,
    hp: 45,
    attack: 6,
    defense: 5,
    speed: 1,
    accuracy: 80,
    dodge: 3,
    crit: 2
  },
  dark_knight: {
    maxHp: 35,
    hp: 35,
    attack: 9,
    defense: 3,
    speed: 3,
    accuracy: 85,
    dodge: 5,
    crit: 5
  },
  // Companion classes
  crusader: {
    maxHp: 33,
    hp: 33,
    attack: 8,
    defense: 3,
    speed: 1,
    accuracy: 85,
    dodge: 5,
    crit: 3
  },
  highwayman: {
    maxHp: 26,
    hp: 26,
    attack: 7,
    defense: 1,
    speed: 5,
    accuracy: 85,
    dodge: 15,
    crit: 6
  },
  plague_doctor: {
    maxHp: 22,
    hp: 22,
    attack: 5,
    defense: 0,
    speed: 6,
    accuracy: 95,
    dodge: 10,
    crit: 2
  },
  vestal: {
    maxHp: 24,
    hp: 24,
    attack: 4,
    defense: 1,
    speed: 3,
    accuracy: 90,
    dodge: 5,
    crit: 1
  }
};
var heroNameIndex = {
  warrior: 0,
  rogue: 0,
  mage: 0,
  ranger: 0,
  paladin: 0,
  dark_knight: 0,
  crusader: 0,
  highwayman: 0,
  plague_doctor: 0,
  vestal: 0
};
function resetHeroNames() {
  heroNameIndex = {
    warrior: 0,
    rogue: 0,
    mage: 0,
    ranger: 0,
    paladin: 0,
    dark_knight: 0,
    crusader: 0,
    highwayman: 0,
    plague_doctor: 0,
    vestal: 0
  };
}
function createHero(heroClass, rarity) {
  const names = HERO_NAMES[heroClass];
  const idx = heroNameIndex[heroClass] % names.length;
  heroNameIndex[heroClass]++;
  const base = BASE_STATS[heroClass];
  const r = rarity ?? rollRarity();
  const mult = RARITY_MULTIPLIER[r];
  return {
    id: generateId(),
    name: names[idx],
    class: heroClass,
    level: 0,
    rarity: r,
    stats: {
      maxHp: Math.round(base.maxHp * mult),
      hp: Math.round(base.maxHp * mult),
      attack: Math.round(base.attack * mult),
      defense: Math.round(base.defense * mult),
      speed: Math.round(base.speed * mult),
      accuracy: Math.round(base.accuracy * mult),
      dodge: Math.round(base.dodge * mult),
      crit: Math.round(base.crit * mult)
    },
    skills: HERO_SKILLS[heroClass].map((s) => ({ ...s })),
    equipment: {},
    position: { row: 0, col: 0 },
    statusEffects: [],
    isDeathsDoor: false,
    deathsDoorResist: 67,
    isMainCharacter: false,
    statPoints: 0,
    exp: 0,
    expToLevel: 100,
    traits: rollTraits()
  };
}
function createMainCharacter(mainClass) {
  const names = HERO_NAMES[mainClass];
  const idx = heroNameIndex[mainClass] % names.length;
  heroNameIndex[mainClass]++;
  const base = BASE_STATS[mainClass];
  const mult = RARITY_MULTIPLIER[3];
  return {
    id: generateId(),
    name: names[idx],
    class: mainClass,
    level: 0,
    rarity: 3,
    stats: {
      maxHp: Math.round(base.maxHp * mult),
      hp: Math.round(base.maxHp * mult),
      attack: Math.round(base.attack * mult),
      defense: Math.round(base.defense * mult),
      speed: Math.round(base.speed * mult),
      accuracy: Math.round(base.accuracy * mult),
      dodge: Math.round(base.dodge * mult),
      crit: Math.round(base.crit * mult)
    },
    skills: HERO_SKILLS[mainClass].map((s) => ({ ...s })),
    equipment: {},
    position: { row: 0, col: 0 },
    statusEffects: [],
    isDeathsDoor: false,
    deathsDoorResist: 67,
    isMainCharacter: true,
    statPoints: 0,
    exp: 0,
    expToLevel: 100,
    traits: rollTraits()
  };
}
function getClassName(heroClass) {
  const classNames = {
    warrior: "\uC804\uC0AC",
    rogue: "\uB3C4\uC801",
    mage: "\uB9C8\uBC95\uC0AC",
    ranger: "\uAD81\uC218",
    paladin: "\uC131\uAE30\uC0AC",
    dark_knight: "\uC554\uD751\uAE30\uC0AC",
    crusader: "\uC2ED\uC790\uAD70",
    highwayman: "\uB178\uC0C1\uAC15\uB3C4",
    plague_doctor: "\uC5ED\uBCD1\uC758\uC0AC",
    vestal: "\uC131\uB140"
  };
  return classNames[heroClass];
}
var CLASS_DESCRIPTIONS = {
  warrior: "\uC804\uC5F4 \uD0F1\uCEE4/\uB51C\uB7EC. \uB192\uC740 HP\uC640 \uACF5\uACA9\uB825.",
  rogue: "\uC804\uC5F4 \uCE58\uBA85\uD0C0 \uC804\uBB38. \uB192\uC740 \uC18D\uB3C4\uC640 \uD68C\uD53C.",
  mage: "\uD6C4\uC5F4 \uB9C8\uBC95\uC0AC. \uAD11\uC5ED \uD53C\uD574\uC640 \uB514\uBC84\uD504.",
  ranger: "\uD6C4\uC5F4 \uC6D0\uAC70\uB9AC \uB51C\uB7EC. \uD45C\uC801 \uC9C0\uC815\uACFC \uB192\uC740 \uBA85\uC911.",
  paladin: "\uC804\uC5F4 \uD0F1\uCEE4/\uD790\uB7EC. \uC2E0\uC131\uD55C \uCE58\uC720\uC640 \uBC29\uC5B4.",
  dark_knight: "\uC804\uC5F4 \uD761\uD608 \uC804\uC0AC. \uC0DD\uBA85\uD761\uC218\uC640 \uC800\uC8FC.",
  crusader: "\uC804\uC5F4 \uC804\uC0AC. \uAC15\uD0C0\uC640 \uAE30\uC808, \uC544\uAD70 \uCE58\uC720 \uAC00\uB2A5.",
  highwayman: "\uC911\uC5F4 \uB2E4\uBAA9\uC801. \uADFC\uC811/\uC6D0\uAC70\uB9AC \uACB8\uC6A9, \uCD9C\uD608.",
  plague_doctor: "\uD6C4\uC5F4 \uC0C1\uD0DC\uC774\uC0C1. \uC5ED\uBCD1/\uAE30\uC808, \uCD9C\uD608 \uCE58\uB8CC.",
  vestal: "\uD6C4\uC5F4 \uD790\uB7EC. \uB2E8\uC77C/\uC804\uCCB4 \uCE58\uC720, \uC2A4\uD2B8\uB808\uC2A4 \uAC10\uC18C."
};
var MAIN_CHAR_CLASSES = ["warrior", "rogue", "mage", "ranger", "paladin", "dark_knight"];
var COMPANION_CLASSES = ["crusader", "highwayman", "plague_doctor", "vestal"];
var HERO_CLASSES = [...MAIN_CHAR_CLASSES, ...COMPANION_CLASSES];
function levelUpHero(hero) {
  const maxLevel = hero.isMainCharacter ? 10 : 5;
  if (hero.level >= maxLevel) return hero;
  const newLevel = hero.level + 1;
  if (hero.isMainCharacter) {
    return {
      ...hero,
      level: newLevel,
      statPoints: hero.statPoints + 5,
      stats: {
        ...hero.stats,
        hp: hero.stats.maxHp
        // heal to full
      },
      exp: 0,
      expToLevel: (newLevel + 1) * 100
    };
  }
  const hpGain = randomInt(3, 5);
  return {
    ...hero,
    level: newLevel,
    stats: {
      ...hero.stats,
      maxHp: hero.stats.maxHp + hpGain,
      hp: hero.stats.maxHp + hpGain,
      attack: hero.stats.attack + 1,
      speed: hero.stats.speed + (newLevel % 2 === 0 ? 1 : 0),
      accuracy: hero.stats.accuracy + 2,
      dodge: hero.stats.dodge + 1
    },
    exp: 0,
    expToLevel: (newLevel + 1) * 100
  };
}
function applyStatPoints(hero, allocation) {
  const totalPoints = Object.values(allocation).reduce((sum, v) => sum + v, 0);
  if (totalPoints > hero.statPoints) return hero;
  return {
    ...hero,
    statPoints: hero.statPoints - totalPoints,
    stats: {
      ...hero.stats,
      maxHp: hero.stats.maxHp + (allocation["hp"] || 0) * 3,
      hp: hero.stats.hp + (allocation["hp"] || 0) * 3,
      attack: hero.stats.attack + (allocation["attack"] || 0),
      defense: hero.stats.defense + (allocation["defense"] || 0),
      speed: hero.stats.speed + (allocation["speed"] || 0),
      accuracy: hero.stats.accuracy + (allocation["accuracy"] || 0) * 2,
      dodge: hero.stats.dodge + (allocation["dodge"] || 0) * 2,
      crit: hero.stats.crit + (allocation["crit"] || 0)
    }
  };
}
var RECOMMENDED_POSITIONS = {
  warrior: { cols: [1], label: "\uCD94\uCC9C \uC5F4: \uC804\uC5F4" },
  rogue: { cols: [1, 2], label: "\uCD94\uCC9C \uC5F4: \uC804/\uC911\uC5F4" },
  mage: { cols: [3], label: "\uCD94\uCC9C \uC5F4: \uD6C4\uC5F4" },
  ranger: { cols: [3], label: "\uCD94\uCC9C \uC5F4: \uD6C4\uC5F4" },
  paladin: { cols: [1], label: "\uCD94\uCC9C \uC5F4: \uC804\uC5F4" },
  dark_knight: { cols: [1], label: "\uCD94\uCC9C \uC5F4: \uC804\uC5F4" },
  crusader: { cols: [1], label: "\uCD94\uCC9C \uC5F4: \uC804\uC5F4" },
  highwayman: { cols: [2], label: "\uCD94\uCC9C \uC5F4: \uC911\uC5F4" },
  plague_doctor: { cols: [3], label: "\uCD94\uCC9C \uC5F4: \uD6C4\uC5F4" },
  vestal: { cols: [3], label: "\uCD94\uCC9C \uC5F4: \uD6C4\uC5F4" }
};

// src/data/items.ts
function createItemCopy(item) {
  return { ...item, id: generateId(), modifiers: item.modifiers.map((m) => ({ ...m })) };
}
var SUPPLY_ITEMS = [
  {
    id: "food",
    name: "\uC2DD\uB7C9",
    type: "supply",
    rarity: "common",
    description: "\uBC30\uACE0\uD514\uC744 \uD574\uC18C\uD55C\uB2E4. HP 10 \uD68C\uBCF5.",
    modifiers: [],
    value: 75,
    consumable: true,
    healAmount: 10
  },
  {
    id: "bandage",
    name: "\uBD95\uB300",
    type: "supply",
    rarity: "common",
    description: "\uCD9C\uD608\uC744 \uCE58\uB8CC\uD558\uACE0 HP\uB97C \uC57D\uAC04 \uD68C\uBCF5\uD55C\uB2E4.",
    modifiers: [],
    value: 100,
    consumable: true,
    healAmount: 5
  },
  {
    id: "antivenom",
    name: "\uD574\uB3C5\uC81C",
    type: "supply",
    rarity: "common",
    description: "\uC5ED\uBCD1\uC744 \uCE58\uB8CC\uD558\uACE0 HP\uB97C \uC57D\uAC04 \uD68C\uBCF5\uD55C\uB2E4.",
    modifiers: [],
    value: 100,
    consumable: true,
    healAmount: 5
  },
  {
    id: "medicinal_herbs",
    name: "\uC57D\uCD08",
    type: "supply",
    rarity: "uncommon",
    description: "HP\uB97C \uD06C\uAC8C \uD68C\uBCF5\uD55C\uB2E4.",
    modifiers: [],
    value: 200,
    consumable: true,
    healAmount: 20
  }
];
var POTION_ITEMS = [
  {
    id: "hp_potion_s",
    name: "\uC18C\uD615 \uCCB4\uB825 \uBB3C\uC57D",
    type: "potion",
    rarity: "common",
    description: "\uCCB4\uB825\uC744 \uC57D\uAC04 \uD68C\uBCF5\uD558\uB294 \uBB3C\uC57D.",
    modifiers: [],
    value: 120,
    consumable: true,
    healAmount: 15
  },
  {
    id: "hp_potion_l",
    name: "\uB300\uD615 \uCCB4\uB825 \uBB3C\uC57D",
    type: "potion",
    rarity: "uncommon",
    description: "\uCCB4\uB825\uC744 \uD06C\uAC8C \uD68C\uBCF5\uD558\uB294 \uBB3C\uC57D.",
    modifiers: [],
    value: 300,
    consumable: true,
    healAmount: 35
  },
  {
    id: "attack_potion",
    name: "\uD798\uC758 \uBB3C\uC57D",
    type: "potion",
    rarity: "uncommon",
    description: "\uC77C\uC2DC\uC801\uC73C\uB85C \uACF5\uACA9\uB825\uC744 \uB192\uC778\uB2E4.",
    modifiers: [],
    value: 280,
    consumable: true,
    buffEffect: { stat: "attack", value: 3, duration: 3 }
  },
  {
    id: "defense_potion",
    name: "\uBC29\uC5B4\uC758 \uBB3C\uC57D",
    type: "potion",
    rarity: "uncommon",
    description: "\uC77C\uC2DC\uC801\uC73C\uB85C \uBC29\uC5B4\uB825\uC744 \uB192\uC778\uB2E4.",
    modifiers: [],
    value: 280,
    consumable: true,
    buffEffect: { stat: "defense", value: 3, duration: 3 }
  },
  {
    id: "speed_potion",
    name: "\uC2E0\uC18D\uC758 \uBB3C\uC57D",
    type: "potion",
    rarity: "rare",
    description: "\uC77C\uC2DC\uC801\uC73C\uB85C \uC18D\uB3C4\uB97C \uB192\uC778\uB2E4.",
    modifiers: [],
    value: 350,
    consumable: true,
    buffEffect: { stat: "speed", value: 3, duration: 3 }
  },
  {
    id: "full_restore",
    name: "\uC644\uC804 \uD68C\uBCF5\uC57D",
    type: "potion",
    rarity: "rare",
    description: "HP\uB97C \uC644\uC804\uD788 \uD68C\uBCF5\uD558\uACE0 \uC2A4\uD2B8\uB808\uC2A4\uB97C \uC904\uC778\uB2E4.",
    modifiers: [],
    value: 600,
    consumable: true,
    healAmount: 999
  },
  {
    id: "elixir",
    name: "\uC601\uC6C5\uC758 \uC601\uC57D",
    type: "potion",
    rarity: "legendary",
    description: "\uC804\uC124\uC801\uC778 \uC601\uC57D. HP \uD68C\uBCF5\uACFC \uACF5\uACA9\uB825 \uAC15\uD654.",
    modifiers: [],
    value: 1200,
    consumable: true,
    healAmount: 50,
    buffEffect: { stat: "attack", value: 5, duration: 5 }
  }
];
var SHOP_WEAPONS = [
  {
    id: "rusty_sword",
    name: "\uB179\uC2A8 \uAC80",
    type: "weapon",
    rarity: "common",
    description: "\uB0A1\uC740 \uAC80. \uACF5\uACA9\uB825\uC744 \uC57D\uAC04 \uC62C\uB9B0\uB2E4.",
    modifiers: [{ stat: "attack", value: 1 }],
    value: 100
  },
  {
    id: "iron_blade",
    name: "\uCCA0 \uCE7C\uB0A0",
    type: "weapon",
    rarity: "common",
    description: "\uBB34\uB09C\uD55C \uBB34\uAE30.",
    modifiers: [{ stat: "attack", value: 2 }],
    value: 200
  },
  {
    id: "steel_sword",
    name: "\uAC15\uCCA0 \uAC80",
    type: "weapon",
    rarity: "uncommon",
    description: "\uD2BC\uD2BC\uD55C \uAC15\uCCA0 \uAC80.",
    modifiers: [{ stat: "attack", value: 3 }, { stat: "crit", value: 2 }],
    value: 400
  },
  {
    id: "hunters_pistol",
    name: "\uC0AC\uB0E5\uAFBC\uC758 \uAD8C\uCD1D",
    type: "weapon",
    rarity: "uncommon",
    description: "\uC815\uBC00\uD55C \uAD8C\uCD1D.",
    modifiers: [{ stat: "attack", value: 4 }, { stat: "crit", value: 3 }],
    value: 500
  },
  {
    id: "holy_mace",
    name: "\uC2E0\uC131\uD55C \uCCA0\uD1F4",
    type: "weapon",
    rarity: "rare",
    description: "\uCD95\uBCF5\uBC1B\uC740 \uBB34\uAE30.",
    modifiers: [{ stat: "attack", value: 5 }, { stat: "accuracy", value: 5 }],
    value: 800
  },
  {
    id: "plague_blade",
    name: "\uC5ED\uBCD1\uC758 \uCE7C\uB0A0",
    type: "weapon",
    rarity: "rare",
    description: "\uB3C5\uC774 \uBC1C\uB9B0 \uCE7C.",
    modifiers: [{ stat: "attack", value: 6 }, { stat: "speed", value: 2 }],
    value: 1e3
  }
];
var SHOP_ARMOR = [
  {
    id: "padded_vest",
    name: "\uB204\uBE44 \uC870\uB07C",
    type: "armor",
    rarity: "common",
    description: "\uAE30\uBCF8\uC801\uC778 \uBCF4\uD638\uB97C \uC81C\uACF5\uD55C\uB2E4.",
    modifiers: [{ stat: "defense", value: 1 }],
    value: 100
  },
  {
    id: "leather_armor",
    name: "\uAC00\uC8FD \uAC11\uC637",
    type: "armor",
    rarity: "common",
    description: "\uAC00\uBCBC\uC6B4 \uAC00\uC8FD \uAC11\uC637.",
    modifiers: [{ stat: "defense", value: 2 }, { stat: "dodge", value: 3 }],
    value: 200
  },
  {
    id: "chain_mail",
    name: "\uC0AC\uC2AC \uAC11\uC637",
    type: "armor",
    rarity: "uncommon",
    description: "\uD2BC\uD2BC\uD55C \uC0AC\uC2AC \uAC11\uC637.",
    modifiers: [{ stat: "defense", value: 3 }, { stat: "maxHp", value: 5 }],
    value: 400
  },
  {
    id: "cleric_vestments",
    name: "\uC131\uC9C1\uC790 \uBC95\uBCF5",
    type: "armor",
    rarity: "uncommon",
    description: "\uCD95\uBCF5\uBC1B\uC740 \uBC95\uBCF5.",
    modifiers: [{ stat: "defense", value: 2 }, { stat: "dodge", value: 5 }, { stat: "maxHp", value: 3 }],
    value: 500
  },
  {
    id: "plate_armor",
    name: "\uD310\uAE08 \uAC11\uC637",
    type: "armor",
    rarity: "rare",
    description: "\uBB34\uAC70\uC6B4 \uD310\uAE08 \uAC11\uC637.",
    modifiers: [{ stat: "defense", value: 5 }, { stat: "maxHp", value: 10 }, { stat: "speed", value: -2 }],
    value: 900
  }
];
var SHOP_TRINKETS = [
  {
    id: "sun_ring",
    name: "\uD0DC\uC591\uC758 \uBC18\uC9C0",
    type: "trinket",
    rarity: "uncommon",
    description: "\uBA85\uC911\uACFC \uCE58\uBA85\uD0C0\uB97C \uB192\uC5EC\uC900\uB2E4.",
    modifiers: [{ stat: "accuracy", value: 10 }, { stat: "crit", value: 5 }],
    value: 450
  },
  {
    id: "moon_cloak",
    name: "\uB2EC\uBE5B \uB9DD\uD1A0",
    type: "trinket",
    rarity: "uncommon",
    description: "\uD68C\uD53C\uC640 \uC18D\uB3C4\uB97C \uB192\uC5EC\uC900\uB2E4.",
    modifiers: [{ stat: "dodge", value: 10 }, { stat: "speed", value: 2 }],
    value: 500
  },
  {
    id: "blood_charm",
    name: "\uD53C\uC758 \uBD80\uC801",
    type: "trinket",
    rarity: "rare",
    description: "\uD53C\uC758 \uD798\uC744 \uBE4C\uB9B0\uB2E4. \uACF5\uACA9\uB825\uC740 \uB192\uC9C0\uB9CC \uD68C\uD53C\uAC00 \uAC10\uC18C\uD55C\uB2E4.",
    modifiers: [{ stat: "attack", value: 3 }, { stat: "dodge", value: -5 }],
    value: 600
  },
  {
    id: "holy_relic",
    name: "\uC2E0\uC131\uD55C \uC720\uBB3C",
    type: "trinket",
    rarity: "rare",
    description: "\uC131\uB140 \uC804\uC6A9. \uC2E0\uC131\uD55C \uD798\uC744 \uC99D\uD3ED\uC2DC\uD0A8\uB2E4.",
    modifiers: [{ stat: "accuracy", value: 5 }, { stat: "speed", value: 1 }, { stat: "maxHp", value: 5 }],
    value: 750
  },
  {
    id: "warriors_bracer",
    name: "\uC804\uC0AC\uC758 \uD314\uCC0C",
    type: "trinket",
    rarity: "uncommon",
    description: "\uD798\uC744 \uC99D\uD3ED\uC2DC\uD0A8\uB2E4.",
    modifiers: [{ stat: "attack", value: 2 }, { stat: "defense", value: 1 }],
    value: 400
  },
  {
    id: "sacred_scroll",
    name: "\uC2E0\uC131\uD55C \uB450\uB8E8\uB9C8\uB9AC",
    type: "trinket",
    rarity: "legendary",
    description: "\uACE0\uB300\uC758 \uC131\uC2A4\uB7EC\uC6B4 \uC9C0\uC2DD\uC774 \uB2F4\uAE34 \uB450\uB8E8\uB9C8\uB9AC.",
    modifiers: [{ stat: "accuracy", value: 10 }, { stat: "attack", value: 4 }, { stat: "speed", value: 2 }],
    value: 1500
  }
];

// src/engine/save-load.ts
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { join } from "path";

// src/utils/grid.ts
function gridPosEqual(a, b) {
  return a.row === b.row && a.col === b.col;
}
function isGridCellOccupied(units, pos) {
  return units.some((u) => gridPosEqual(u.position, pos));
}
function findEmptyGridCell(units, preferredCols) {
  const cols = preferredCols || [1, 2, 3];
  for (const col of cols) {
    for (const row of [2, 1, 3]) {
      const pos = { row, col };
      if (!isGridCellOccupied(units, pos)) return pos;
    }
  }
  for (let col = 1; col <= 3; col++) {
    for (let row = 1; row <= 3; row++) {
      const pos = { row, col };
      if (!isGridCellOccupied(units, pos)) return pos;
    }
  }
  return null;
}
var COL_LABELS = ["", "\uC804", "\uC911", "\uD6C4"];
var ROW_LABELS = ["", "\uC0C1", "\uC911", "\uD558"];
function gridPosLabel(pos) {
  return `[${COL_LABELS[pos.col]}${ROW_LABELS[pos.row]}]`;
}
function migrateOldPosition(pos) {
  if (typeof pos === "object" && pos !== null && "row" in pos && "col" in pos) {
    return pos;
  }
  if (typeof pos === "number") {
    if (pos <= 0) return { row: 2, col: 1 };
    const col = pos <= 2 ? 1 : 3;
    return { row: 2, col };
  }
  return { row: 2, col: 1 };
}

// src/engine/save-load.ts
var SAVE_DIR = join(process.cwd(), "saves");
var SAVE_FILE = join(SAVE_DIR, "save.json");
var PRESTIGE_FILE = join(SAVE_DIR, "prestige.json");
function serializeState(state) {
  const serializable = { ...state };
  if (serializable.currentEvent) {
    serializable.currentEvent = {
      ...serializable.currentEvent,
      choices: serializable.currentEvent.choices.map((c) => ({
        text: c.text
        // action is a function, cannot be serialized
      }))
    };
  }
  return serializable;
}
function saveGame(state) {
  try {
    if (!existsSync(SAVE_DIR)) {
      mkdirSync(SAVE_DIR, { recursive: true });
    }
    const data = JSON.stringify(serializeState(state), null, 2);
    writeFileSync(SAVE_FILE, data, "utf-8");
    return true;
  } catch (err) {
    return false;
  }
}
function loadGame() {
  try {
    if (!existsSync(SAVE_FILE)) return null;
    const data = readFileSync(SAVE_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (parsed.currentEvent) {
      parsed.currentEvent = {
        ...parsed.currentEvent,
        choices: (parsed.currentEvent.choices || []).map((c) => ({
          text: c.text,
          action: () => {
          }
        }))
      };
    }
    if (typeof parsed.screen !== "string" || !Array.isArray(parsed.roster) || !Array.isArray(parsed.party) || !Array.isArray(parsed.inventory) || typeof parsed.gold !== "number" || typeof parsed.week !== "number") {
      return null;
    }
    if (parsed.gameSpeed === void 0) parsed.gameSpeed = 1;
    if (parsed.continuousRun === void 0) parsed.continuousRun = false;
    if (parsed.runsCompleted === void 0) parsed.runsCompleted = 0;
    if (parsed.autoMode !== void 0) delete parsed.autoMode;
    if (parsed.dungeon !== void 0) {
      parsed.tower = null;
      delete parsed.dungeon;
    }
    if (parsed.maxFloorReached === void 0) parsed.maxFloorReached = 0;
    if (parsed.tower === void 0) parsed.tower = null;
    if (parsed.completedDungeons !== void 0) delete parsed.completedDungeons;
    if (parsed.lastDungeonId !== void 0) delete parsed.lastDungeonId;
    if (parsed.tower && parsed.tower.rooms !== void 0 && !parsed.tower.floorMap) {
      parsed.tower = null;
    }
    if (parsed.paused === void 0) parsed.paused = false;
    if (parsed.tower && parsed.tower.paused === void 0) {
      parsed.tower.paused = false;
    }
    for (const hero of parsed.roster) {
      if (hero.rarity === void 0) hero.rarity = 1;
    }
    for (let i = 0; i < parsed.party.length; i++) {
      const h = parsed.party[i];
      if (h && h.rarity === void 0) h.rarity = 1;
    }
    if (parsed.pendingLoot === void 0) parsed.pendingLoot = null;
    if (parsed.mainCharacterId === void 0) parsed.mainCharacterId = null;
    for (const hero of parsed.roster) {
      if (hero.isMainCharacter === void 0) hero.isMainCharacter = false;
      if (hero.statPoints === void 0) hero.statPoints = 0;
    }
    for (let i = 0; i < parsed.party.length; i++) {
      const h = parsed.party[i];
      if (h) {
        if (h.isMainCharacter === void 0) h.isMainCharacter = false;
        if (h.statPoints === void 0) h.statPoints = 0;
      }
    }
    for (const hero of parsed.roster) {
      if (hero.exp === void 0) hero.exp = 0;
      if (hero.expToLevel === void 0) hero.expToLevel = (hero.level + 1) * 100;
    }
    for (let i = 0; i < parsed.party.length; i++) {
      const h = parsed.party[i];
      if (h) {
        if (h.exp === void 0) h.exp = 0;
        if (h.expToLevel === void 0) h.expToLevel = (h.level + 1) * 100;
      }
    }
    for (const hero of parsed.roster) {
      if (hero.traits === void 0) hero.traits = [];
    }
    for (let i = 0; i < parsed.party.length; i++) {
      const h = parsed.party[i];
      if (h && h.traits === void 0) h.traits = [];
    }
    if (parsed.tower && parsed.tower.theme === void 0) {
      parsed.tower.theme = "catacombs";
    }
    if (parsed.tower && parsed.tower.floorMap && parsed.tower.floorMap.playerAngle === void 0) {
      parsed.tower.floorMap.playerAngle = 0;
    }
    if (parsed.prestige === void 0) {
      parsed.prestige = loadPrestige();
    }
    for (const hero of parsed.roster) {
      if (typeof hero.position === "number") {
        hero.position = migrateOldPosition(hero.position);
      }
      if (hero.skills && hero.skills[0] && "usePositions" in hero.skills[0]) {
        hero.skills = HERO_SKILLS[hero.class].map((s) => ({ ...s }));
      }
    }
    for (let i = 0; i < parsed.party.length; i++) {
      const h = parsed.party[i];
      if (h) {
        if (typeof h.position === "number") {
          h.position = migrateOldPosition(h.position);
        }
        if (h.skills && h.skills[0] && "usePositions" in h.skills[0]) {
          h.skills = HERO_SKILLS[h.class].map((s) => ({ ...s }));
        }
      }
    }
    if (parsed.party.length === 4) {
      parsed.party.push(null, null);
    }
    if (parsed.combat) {
      for (const m of parsed.combat.monsters) {
        if (typeof m.position === "number") {
          m.position = migrateOldPosition(m.position);
        }
        if (m.size === void 0) m.size = "small";
      }
      for (const h of parsed.combat.heroes) {
        if (typeof h.position === "number") {
          h.position = migrateOldPosition(h.position);
        }
        if (h.skills && h.skills[0] && "usePositions" in h.skills[0]) {
          h.skills = HERO_SKILLS[h.class].map((s) => ({ ...s }));
        }
      }
    }
    return parsed;
  } catch (err) {
    return null;
  }
}
function hasSaveFile() {
  return existsSync(SAVE_FILE);
}
function deleteSave() {
  try {
    if (existsSync(SAVE_FILE)) {
      unlinkSync(SAVE_FILE);
    }
  } catch (err) {
  }
}
function savePrestige(prestige) {
  try {
    if (!existsSync(SAVE_DIR)) {
      mkdirSync(SAVE_DIR, { recursive: true });
    }
    writeFileSync(PRESTIGE_FILE, JSON.stringify(prestige, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}
function loadPrestige() {
  try {
    if (!existsSync(PRESTIGE_FILE)) {
      return { points: 0, totalEarned: 0, purchased: [] };
    }
    const data = readFileSync(PRESTIGE_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed.purchased)) parsed.purchased = [];
    if (typeof parsed.points !== "number") parsed.points = 0;
    if (typeof parsed.totalEarned !== "number") parsed.totalEarned = 0;
    return parsed;
  } catch {
    return { points: 0, totalEarned: 0, purchased: [] };
  }
}

// src/engine/map-generator.ts
import { Map as RotMap, FOV } from "rot-js";

// src/data/themes.ts
var THEME_CONFIGS = [
  {
    id: "catacombs",
    name: "\uC9C0\uD558\uBB18\uC9C0",
    floorRange: [1, 20],
    wallChar: "#",
    wallColor: "#808080",
    floorChar: ".",
    floorColor: "#888888",
    dimWallColor: "#444444",
    dimFloorColor: "#444444"
  },
  {
    id: "dark_forest",
    name: "\uC5B4\uB460\uC758 \uC232",
    floorRange: [21, 40],
    wallChar: "\u2663",
    wallColor: "#228B22",
    floorChar: ",",
    floorColor: "#556B2F",
    dimWallColor: "#1a4a1a",
    dimFloorColor: "#2a3a2a"
  },
  {
    id: "volcano",
    name: "\uD654\uC0B0",
    floorRange: [41, 60],
    wallChar: "#",
    wallColor: "#8B0000",
    floorChar: ".",
    floorColor: "#CD5C5C",
    dimWallColor: "#4a1111",
    dimFloorColor: "#3a2222",
    envEffect: "hp_drain",
    envValue: 1
  },
  {
    id: "snow_mountain",
    name: "\uC124\uC0B0",
    floorRange: [61, 80],
    wallChar: "#",
    wallColor: "#B0C4DE",
    floorChar: ".",
    floorColor: "#E0E8F0",
    dimWallColor: "#4a5a6a",
    dimFloorColor: "#5a6a7a",
    envEffect: "speed_debuff",
    envValue: 1
  },
  {
    id: "abyss",
    name: "\uC2EC\uC5F0",
    floorRange: [81, 100],
    wallChar: "#",
    wallColor: "#4B0082",
    floorChar: ".",
    floorColor: "#2F0044",
    dimWallColor: "#1a0033",
    dimFloorColor: "#220033"
  }
];
function getThemeForFloor(floor) {
  for (const config of THEME_CONFIGS) {
    if (floor >= config.floorRange[0] && floor <= config.floorRange[1]) {
      return config.id;
    }
  }
  return "catacombs";
}
function getThemeConfig(theme) {
  return THEME_CONFIGS.find((t) => t.id === theme) || THEME_CONFIGS[0];
}
var THEME_MONSTER_POOLS = {
  catacombs: ["bone_soldier", "bone_archer", "plague_rat", "shadow_lurker", "cultist_brawler"],
  dark_forest: ["shadow_lurker", "cultist_brawler", "cultist_acolyte", "madman", "plague_rat"],
  volcano: ["cultist_acolyte", "madman", "dark_mage", "gargoyle", "cursed_knight"],
  snow_mountain: ["cursed_knight", "dark_mage", "gargoyle", "wraith", "bone_captain"],
  abyss: ["wraith", "dark_mage", "necromancer", "gargoyle", "cursed_knight", "shadow_lurker"]
};

// src/data/dungeons.ts
function getStatMultiplier(floor) {
  return 1 + (floor - 1) * 0.02;
}
function getDifficulty(floor) {
  return Math.ceil(floor / 10);
}
function getMonsterPool(floor) {
  const theme = getThemeForFloor(floor);
  const pool = [...THEME_MONSTER_POOLS[theme]];
  return [...new Set(pool)];
}
function getBossType(floor) {
  if (floor === 10) return "bone_captain";
  if (floor === 20) return "large_carrion_eater";
  if (floor === 30) return "necromancer";
  if (floor === 40) return "frost_titan";
  if (floor === 50) return "flame_demon";
  if (floor === 60) return "void_lord";
  if (floor >= 70 && floor <= 90) {
    return randomChoice(["necromancer", "frost_titan", "flame_demon", "void_lord", "large_carrion_eater", "bone_captain"]);
  }
  if (floor === 100) return "void_lord";
  return "bone_captain";
}
function getMonsterCount(floor, partySize = 4) {
  let base;
  if (floor <= 20) base = randomInt(2, 3);
  else if (floor <= 50) base = randomInt(3, 4);
  else base = randomInt(3, 5);
  return Math.max(1, base - (4 - partySize));
}

// src/engine/map-generator.ts
function generateFloorMap(floor) {
  const width = randomInt(40, 50);
  const height = randomInt(18, 22);
  const tiles = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = {
        type: "wall",
        explored: false,
        visible: false,
        cleared: false
      };
    }
  }
  const floorTiles = [];
  const digger = new RotMap.Digger(width, height, {
    roomWidth: [3, 8],
    roomHeight: [3, 6],
    corridorLength: [1, 6],
    dugPercentage: 0.35
  });
  digger.create((x, y, value) => {
    if (value === 0 && x >= 0 && x < width && y >= 0 && y < height) {
      tiles[y][x] = {
        type: "floor",
        explored: false,
        visible: false,
        cleared: false
      };
      floorTiles.push([x, y]);
    }
  });
  if (floorTiles.length < 20) {
    const midY = Math.floor(height / 2);
    for (let x = 1; x < width - 1; x++) {
      tiles[midY][x] = { type: "floor", explored: false, visible: false, cleared: false };
      floorTiles.push([x, midY]);
      if (percentChance(30)) {
        const dy = randomChoice([-1, 1]);
        if (midY + dy > 0 && midY + dy < height - 1) {
          tiles[midY + dy][x] = { type: "floor", explored: false, visible: false, cleared: false };
          floorTiles.push([x, midY + dy]);
        }
      }
    }
  }
  const entrance = floorTiles[0];
  const [entranceX, entranceY] = entrance;
  tiles[entranceY][entranceX].type = "entrance";
  tiles[entranceY][entranceX].cleared = true;
  let maxDist = 0;
  let exitX = entranceX;
  let exitY = entranceY;
  for (const [fx, fy] of floorTiles) {
    const dist = Math.abs(fx - entranceX) + Math.abs(fy - entranceY);
    if (dist > maxDist) {
      maxDist = dist;
      exitX = fx;
      exitY = fy;
    }
  }
  tiles[exitY][exitX].type = "exit";
  const availableFloors = floorTiles.filter(
    ([x, y]) => !(x === entranceX && y === entranceY) && !(x === exitX && y === exitY)
  );
  const shuffled = [...availableFloors];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  let placeIdx = 0;
  const combatCount = Math.min(randomInt(3, 6) + Math.floor(floor / 20), shuffled.length - placeIdx - 5);
  const pool = getMonsterPool(floor);
  for (let i = 0; i < combatCount && placeIdx < shuffled.length; i++) {
    const [cx, cy] = shuffled[placeIdx];
    placeIdx++;
    const count = getMonsterCount(floor);
    const monsterTypes = [];
    for (let j = 0; j < count; j++) {
      monsterTypes.push(randomChoice(pool));
    }
    tiles[cy][cx] = {
      type: "combat",
      explored: false,
      visible: false,
      cleared: false,
      monsterTypes
    };
  }
  const treasureCount = randomInt(1, 2);
  for (let i = 0; i < treasureCount && placeIdx < shuffled.length; i++) {
    const [tx, ty] = shuffled[placeIdx];
    placeIdx++;
    tiles[ty][tx] = {
      type: "treasure",
      explored: false,
      visible: false,
      cleared: false
    };
  }
  const diff = getDifficulty(floor);
  const trapCount = randomInt(1, 2);
  for (let i = 0; i < trapCount && placeIdx < shuffled.length; i++) {
    const [tx, ty] = shuffled[placeIdx];
    placeIdx++;
    tiles[ty][tx] = {
      type: "trap",
      explored: false,
      visible: false,
      cleared: false,
      trapDamage: randomInt(3, 8) + diff * 2
    };
  }
  const curioCount = randomInt(0, 1);
  for (let i = 0; i < curioCount && placeIdx < shuffled.length; i++) {
    const [cx, cy] = shuffled[placeIdx];
    placeIdx++;
    tiles[cy][cx] = {
      type: "curio",
      explored: false,
      visible: false,
      cleared: false
    };
  }
  if (floor % 10 === 0) {
    const dirs2 = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    let bossPlaced = false;
    for (const [dx, dy] of dirs2) {
      const bx = exitX + dx;
      const by = exitY + dy;
      if (bx >= 0 && bx < width && by >= 0 && by < height) {
        const tile = tiles[by][bx];
        if (tile.type === "floor") {
          const bossType = getBossType(floor);
          const minionCount = randomInt(1, 2);
          const monsterTypes = [bossType];
          for (let i = 0; i < minionCount; i++) {
            monsterTypes.push(randomChoice(pool));
          }
          tiles[by][bx] = {
            type: "boss",
            explored: false,
            visible: false,
            cleared: false,
            monsterTypes
          };
          bossPlaced = true;
          break;
        }
      }
    }
    if (!bossPlaced) {
      const bossType = getBossType(floor);
      const minionCount = randomInt(1, 2);
      const monsterTypes = [bossType];
      for (let i = 0; i < minionCount; i++) {
        monsterTypes.push(randomChoice(pool));
      }
      if (placeIdx < shuffled.length) {
        const [bx, by] = shuffled[placeIdx];
        placeIdx++;
        tiles[by][bx] = {
          type: "boss",
          explored: false,
          visible: false,
          cleared: false,
          monsterTypes
        };
      }
    }
  }
  const dirs = [{ dx: 1, dy: 0, a: 0 }, { dx: 0, dy: 1, a: Math.PI / 2 }, { dx: -1, dy: 0, a: Math.PI }, { dx: 0, dy: -1, a: -Math.PI / 2 }];
  let initAngle = 0;
  for (const d of dirs) {
    const nx = entranceX + d.dx, ny = entranceY + d.dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height && tiles[ny][nx].type !== "wall") {
      initAngle = d.a;
      break;
    }
  }
  const floorMap = {
    width,
    height,
    tiles,
    playerX: entranceX,
    playerY: entranceY,
    exitX,
    exitY,
    playerAngle: initAngle
  };
  updateFOV(floorMap, 7);
  return floorMap;
}
function updateFOV(floorMap, radius) {
  for (let y = 0; y < floorMap.height; y++) {
    for (let x = 0; x < floorMap.width; x++) {
      floorMap.tiles[y][x].visible = false;
    }
  }
  const fov = new FOV.RecursiveShadowcasting((x, y) => {
    if (x < 0 || x >= floorMap.width || y < 0 || y >= floorMap.height) return false;
    return floorMap.tiles[y][x].type !== "wall";
  });
  fov.compute(floorMap.playerX, floorMap.playerY, radius, (x, y, _r, _vis) => {
    if (x >= 0 && x < floorMap.width && y >= 0 && y < floorMap.height) {
      floorMap.tiles[y][x].visible = true;
      floorMap.tiles[y][x].explored = true;
    }
  });
}
function getFOVRadius() {
  return 7;
}

// src/data/prestige.ts
var PRESTIGE_UPGRADES = [
  { id: "start_gold_100", name: "\uC2DC\uC791 \uACE8\uB4DC +100", description: "\uC0C8 \uAC8C\uC784 \uC2DC \uACE8\uB4DC 600\uC73C\uB85C \uC2DC\uC791", cost: 50 },
  { id: "start_gold_200", name: "\uC2DC\uC791 \uACE8\uB4DC +200", description: "\uC0C8 \uAC8C\uC784 \uC2DC \uACE8\uB4DC 800\uC73C\uB85C \uC2DC\uC791 (\uC911\uCCA9)", cost: 100, requires: "start_gold_100" },
  { id: "recruit_discount_50", name: "\uBAA8\uC9D1 \uD560\uC778 I", description: "\uC601\uC6C5 \uBAA8\uC9D1 \uBE44\uC6A9 250G", cost: 80 },
  { id: "recruit_discount_100", name: "\uBAA8\uC9D1 \uD560\uC778 II", description: "\uC601\uC6C5 \uBAA8\uC9D1 \uBE44\uC6A9 150G (\uC911\uCCA9)", cost: 150, requires: "recruit_discount_50" },
  { id: "start_potions", name: "\uC2DC\uC791 \uBB3C\uC57D", description: "\uCE58\uC720 \uBB3C\uC57D 2\uAC1C \uC9C0\uAE09", cost: 60 },
  { id: "exp_bonus_10", name: "\uACBD\uD5D8\uCE58 +10%", description: "\uC804\uD22C \uACBD\uD5D8\uCE58 x1.1", cost: 100 },
  { id: "exp_bonus_20", name: "\uACBD\uD5D8\uCE58 +20%", description: "\uC804\uD22C \uACBD\uD5D8\uCE58 x1.2 (\uC911\uCCA9)", cost: 200, requires: "exp_bonus_10" },
  { id: "max_roster_14", name: "\uB300\uAE30\uC18C \uD655\uC7A5", description: "\uCD5C\uB300 \uC601\uC6C5 12\u219214\uBA85", cost: 150 }
];
function calculatePrestigeGain(maxFloor, bossKills, week) {
  return maxFloor * 2 + bossKills * 10 + week;
}
function hasPrestigeUpgrade(prestige, upgradeId) {
  return prestige.purchased.includes(upgradeId);
}
function getRecruitCost(prestige) {
  if (hasPrestigeUpgrade(prestige, "recruit_discount_100")) return 150;
  if (hasPrestigeUpgrade(prestige, "recruit_discount_50")) return 250;
  return 300;
}
function getStartGold(prestige) {
  let gold = 500;
  if (hasPrestigeUpgrade(prestige, "start_gold_100")) gold += 100;
  if (hasPrestigeUpgrade(prestige, "start_gold_200")) gold += 200;
  return gold;
}
function getMaxRoster(prestige) {
  return hasPrestigeUpgrade(prestige, "max_roster_14") ? 14 : 12;
}
function canBuyUpgrade(prestige, upgrade) {
  if (prestige.purchased.includes(upgrade.id)) return false;
  if (prestige.points < upgrade.cost) return false;
  if (upgrade.requires && !prestige.purchased.includes(upgrade.requires)) return false;
  return true;
}

// src/engine/boss-patterns.ts
var usedPatterns = /* @__PURE__ */ new Set();
function resetBossPatterns() {
  usedPatterns.clear();
}
function executeBossPattern(combat, monster) {
  if (!monster.isBoss) return null;
  switch (monster.type) {
    case "bone_captain":
      return boneCommanderPattern(combat, monster);
    case "necromancer":
      return necromancerPattern(combat, monster);
    case "large_carrion_eater":
      return carrionEaterPattern(combat, monster);
    case "frost_titan":
      return frostTitanPattern(combat, monster);
    case "flame_demon":
      return flameDemonPattern(combat, monster);
    case "void_lord":
      return voidLordPattern(combat, monster);
    default:
      return null;
  }
}
function boneCommanderPattern(combat, monster) {
  const key = `bone_captain_${monster.id}`;
  if (usedPatterns.has(key)) return null;
  if (monster.stats.hp / monster.stats.maxHp > 0.5) return null;
  usedPatterns.add(key);
  const log = [];
  log.push(`{bold}{red-fg}${monster.name}: "\uCD5C\uD6C4\uC758 \uBA85\uB839!"{/red-fg}{/bold}`);
  const newMonsters = combat.monsters.map((m) => {
    if (m.stats.hp <= 0) return m;
    const newEffect = {
      type: "buff_attack",
      duration: 3,
      value: 5,
      source: "\uCD5C\uD6C4\uC758 \uBA85\uB839"
    };
    const newEffects = m.statusEffects.filter((e) => !(e.type === "buff_attack" && e.source === "\uCD5C\uD6C4\uC758 \uBA85\uB839"));
    newEffects.push(newEffect);
    return { ...m, statusEffects: newEffects };
  });
  log.push("\uC801 \uC804\uCCB4\uC758 \uACF5\uACA9\uB825\uC774 \uC0C1\uC2B9\uD588\uB2E4!");
  return {
    combat: { ...combat, monsters: newMonsters },
    log,
    skipNormalAction: true
  };
}
function necromancerPattern(combat, monster) {
  const key = `necromancer_${monster.id}`;
  if (usedPatterns.has(key)) return null;
  if (monster.stats.hp / monster.stats.maxHp > 0.3) return null;
  usedPatterns.add(key);
  const log = [];
  log.push(`{bold}{red-fg}${monster.name}: "\uC8FD\uC740 \uC790\uC5EC, \uC77C\uC5B4\uB098\uB77C!"{/red-fg}{/bold}`);
  const aliveMonsters = combat.monsters.filter((m) => m.stats.hp > 0);
  const summonPos = findEmptyGridCell(aliveMonsters, [1]) || { row: 1, col: 1 };
  const summon = {
    id: Math.random().toString(36).substring(2, 9),
    name: "\uC18C\uD658\uB41C \uD574\uACE8 \uBCD1\uC0AC",
    type: "bone_soldier",
    stats: {
      maxHp: Math.round(monster.stats.maxHp * 0.3),
      hp: Math.round(monster.stats.maxHp * 0.3),
      attack: Math.round(monster.stats.attack * 0.7),
      defense: 2,
      speed: 3,
      accuracy: 80,
      dodge: 5,
      crit: 3
    },
    skills: [{
      id: "summoned_slash",
      name: "\uBF08 \uCE7C\uB0A0",
      description: "",
      useCols: [1],
      targetCols: [1],
      targetCount: 1,
      targetAlly: false,
      damage: { min: 0.9, max: 1.1 },
      accuracy: 0,
      crit: 3
    }],
    position: summonPos,
    size: "small",
    statusEffects: [],
    isBoss: false
  };
  const newMonsters = [...combat.monsters, summon];
  const newTurnOrder = [...combat.turnOrder, {
    id: summon.id,
    isHero: false,
    speed: summon.stats.speed + randomInt(1, 8),
    done: false
  }];
  log.push(`\uD574\uACE8 \uBCD1\uC0AC\uAC00 \uC18C\uD658\uB418\uC5C8\uB2E4!`);
  return {
    combat: { ...combat, monsters: newMonsters, turnOrder: newTurnOrder },
    log,
    skipNormalAction: true
  };
}
function carrionEaterPattern(combat, monster) {
  const deadHeroes = combat.heroes.filter((h) => h.stats.hp <= 0 && !h.isDeathsDoor);
  if (deadHeroes.length === 0) return null;
  const log = [];
  const healAmount = Math.round(monster.stats.maxHp * 0.2);
  const newHp = Math.min(monster.stats.maxHp, monster.stats.hp + healAmount);
  log.push(`{bold}{red-fg}${monster.name}\uC774(\uAC00) \uC2DC\uCCB4\uB97C \uD3EC\uC2DD\uD558\uC5EC HP ${healAmount} \uD68C\uBCF5!{/red-fg}{/bold}`);
  const newMonsters = combat.monsters.map(
    (m) => m.id === monster.id ? { ...m, stats: { ...m.stats, hp: newHp } } : m
  );
  return {
    combat: { ...combat, monsters: newMonsters },
    log,
    skipNormalAction: false
    // still does normal attack
  };
}
function frostTitanPattern(combat, monster) {
  if (combat.round % 3 !== 0) return null;
  const key = `frost_titan_r${combat.round}_${monster.id}`;
  if (usedPatterns.has(key)) return null;
  usedPatterns.add(key);
  const log = [];
  log.push(`{bold}{cyan-fg}${monster.name}: "\uBE59\uACB0\uC758 \uD30C\uB3C4!"{/cyan-fg}{/bold}`);
  const newHeroes = combat.heroes.map((h) => {
    if (h.stats.hp <= 0) return h;
    let newEffects = h.statusEffects.filter((e) => !(e.type === "debuff_speed" && e.source === "\uBE59\uACB0\uC758 \uD30C\uB3C4"));
    let updated = { ...h, statusEffects: newEffects };
    if (percentChance(30)) {
      updated.statusEffects = [...updated.statusEffects, {
        type: "stun",
        duration: 1,
        value: 0,
        source: "\uBE59\uACB0\uC758 \uD30C\uB3C4"
      }];
      log.push(`${h.name}\uC774(\uAC00) \uBE59\uACB0\uB418\uC5C8\uB2E4!`);
    }
    updated.statusEffects = [...updated.statusEffects, {
      type: "debuff_speed",
      duration: 2,
      value: -3,
      source: "\uBE59\uACB0\uC758 \uD30C\uB3C4"
    }];
    return updated;
  });
  log.push("\uC544\uAD70 \uC804\uCCB4\uC758 \uC18D\uB3C4\uAC00 \uAC10\uC18C\uD588\uB2E4!");
  return {
    combat: { ...combat, heroes: newHeroes },
    log,
    skipNormalAction: true
  };
}
function flameDemonPattern(combat, monster) {
  const log = [];
  const aliveHeroes = combat.heroes.filter((h) => h.stats.hp > 0 || h.isDeathsDoor);
  if (aliveHeroes.length === 0) return null;
  const target = randomChoice(aliveHeroes);
  log.push(`{bold}{red-fg}${monster.name}\uC758 \uD654\uC5FC\uC774 ${target.name}\uC744(\uB97C) \uAC10\uC30C\uB2E4!{/red-fg}{/bold}`);
  const newHeroes = combat.heroes.map((h) => {
    if (h.id === target.id) {
      const filtered = h.statusEffects.filter((e) => !(e.type === "bleed" && e.source === "\uD654\uC5FC\uC758 \uC1C4\uB3C4"));
      return {
        ...h,
        statusEffects: [...filtered, {
          type: "bleed",
          duration: 3,
          value: 2,
          source: "\uD654\uC5FC\uC758 \uC1C4\uB3C4"
        }]
      };
    }
    return h;
  });
  log.push(`${target.name}\uC5D0\uAC8C \uCD9C\uD608 \uD6A8\uACFC!`);
  return {
    combat: { ...combat, heroes: newHeroes },
    log,
    skipNormalAction: false
  };
}
function voidLordPattern(combat, monster) {
  const key = `void_lord_${monster.id}`;
  if (usedPatterns.has(key)) return null;
  if (monster.stats.hp / monster.stats.maxHp > 0.5) return null;
  usedPatterns.add(key);
  const log = [];
  log.push(`{bold}{magenta-fg}${monster.name}: "\uACF5\uD5C8\uB97C \uD574\uBC29\uD55C\uB2E4!"{/magenta-fg}{/bold}`);
  log.push("{bold}{magenta-fg}\uD398\uC774\uC988 2 \uB3CC\uC785!{/magenta-fg}{/bold}");
  const newMonsters = combat.monsters.map((m) => {
    if (m.id !== monster.id) return m;
    return {
      ...m,
      name: "\uACF5\uD5C8\uC758 \uAD70\uC8FC (\uD574\uBC29)",
      stats: {
        ...m.stats,
        attack: Math.round(m.stats.attack * 1.5),
        defense: Math.round(m.stats.defense * 1.5),
        speed: Math.round(m.stats.speed * 1.5),
        accuracy: Math.round(m.stats.accuracy * 1.1)
      }
    };
  });
  return {
    combat: { ...combat, monsters: newMonsters },
    log,
    skipNormalAction: true
  };
}

// src/state/GameStore.ts
function initialState() {
  return {
    screen: "title",
    roster: [],
    party: [null, null, null, null, null, null],
    inventory: [],
    gold: 500,
    tower: null,
    combat: null,
    week: 1,
    maxFloorReached: 0,
    gameLog: ["\uC0C8\uB85C\uC6B4 \uBAA8\uD5D8\uC774 \uC2DC\uC791\uB429\uB2C8\uB2E4..."],
    currentEvent: null,
    gameWon: false,
    selectedHeroId: null,
    gameSpeed: 1,
    continuousRun: false,
    runsCompleted: 0,
    paused: false,
    mainCharacterId: null,
    pendingLoot: null,
    prestige: { points: 0, totalEarned: 0, purchased: [] }
  };
}
function gameReducer(state, action) {
  switch (action.type) {
    case "NEW_GAME": {
      resetHeroNames();
      const prestige = state.prestige;
      const mainChar = { ...createMainCharacter(action.mainCharClass), position: { row: 2, col: 1 } };
      const food = [createItemCopy(SUPPLY_ITEMS[1]), createItemCopy(SUPPLY_ITEMS[1])];
      const startInventory = [...food];
      if (hasPrestigeUpgrade(prestige, "start_potions")) {
        const healPotion = SUPPLY_ITEMS.find((i) => i.healAmount);
        if (healPotion) {
          startInventory.push(createItemCopy(healPotion), createItemCopy(healPotion));
        }
      }
      return {
        ...initialState(),
        roster: [mainChar],
        party: [mainChar, null, null, null, null, null],
        inventory: startInventory,
        gold: getStartGold(prestige),
        mainCharacterId: mainChar.id,
        screen: "town",
        prestige,
        // preserve prestige across games
        gameLog: ["\uC0C8\uB85C\uC6B4 \uBAA8\uD5D8\uC774 \uC2DC\uC791\uB429\uB2C8\uB2E4...", `${mainChar.name}\uC774(\uAC00) \uC5EC\uC815\uC744 \uC2DC\uC791\uD569\uB2C8\uB2E4.`]
      };
    }
    case "NAVIGATE":
      return { ...state, screen: action.screen };
    case "RECRUIT_HERO": {
      const recruitCost = getRecruitCost(state.prestige);
      const maxRoster = getMaxRoster(state.prestige);
      if (state.gold < recruitCost) return state;
      if (state.roster.length >= maxRoster) return state;
      const newHero = createHero(action.heroClass);
      return {
        ...state,
        roster: [...state.roster, newHero],
        gold: state.gold - recruitCost,
        gameLog: [...state.gameLog, `${newHero.name}\uC774(\uAC00) \uC601\uC785\uB418\uC5C8\uC2B5\uB2C8\uB2E4. (${getStars(newHero.rarity)})`]
      };
    }
    case "DISMISS_HERO": {
      if (action.heroId === state.mainCharacterId) return state;
      const inParty = state.party.some((h) => h?.id === action.heroId);
      if (inParty) return state;
      return {
        ...state,
        roster: state.roster.filter((h) => h.id !== action.heroId),
        gameLog: [...state.gameLog, "\uC601\uC6C5\uC774 \uD574\uACE0\uB418\uC5C8\uC2B5\uB2C8\uB2E4."]
      };
    }
    case "ADD_TO_PARTY": {
      const hero = state.roster.find((h) => h.id === action.heroId);
      if (!hero) return state;
      if (action.slotIndex < 0 || action.slotIndex > 5) return state;
      if (state.party[action.slotIndex] !== null) return state;
      if (state.party.some((h) => h?.id === action.heroId)) return state;
      const slotToGridPos = (slot) => {
        const col = Math.floor(slot / 3) + 1;
        const row = slot % 3 + 1;
        return { row, col };
      };
      const gridPos = slotToGridPos(action.slotIndex);
      const updatedHero = { ...hero, position: gridPos };
      const newParty = [...state.party];
      newParty[action.slotIndex] = updatedHero;
      return {
        ...state,
        party: newParty,
        gameLog: [...state.gameLog, `${hero.name}\uC774(\uAC00) \uD30C\uD2F0\uC5D0 \uBC30\uCE58\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`]
      };
    }
    case "REMOVE_FROM_PARTY": {
      if (action.slotIndex < 0 || action.slotIndex > 5) return state;
      const removed = state.party[action.slotIndex];
      if (!removed) return state;
      if (removed.id === state.mainCharacterId) return state;
      const newParty = [...state.party];
      newParty[action.slotIndex] = null;
      return {
        ...state,
        party: newParty,
        gameLog: [...state.gameLog, `${removed.name}\uC774(\uAC00) \uD30C\uD2F0\uC5D0\uC11C \uC81C\uAC70\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`]
      };
    }
    case "SWAP_PARTY_POSITION": {
      const { pos1, pos2 } = action;
      if (pos1 < 0 || pos1 > 5 || pos2 < 0 || pos2 > 5) return state;
      const newParty = [...state.party];
      const h1 = newParty[pos1];
      const h2 = newParty[pos2];
      if (h1 && h2) {
        const tempPos = { ...h1.position };
        newParty[pos1] = { ...h2, position: tempPos };
        newParty[pos2] = { ...h1, position: { ...h2.position } };
      } else {
        newParty[pos1] = h2 ? { ...h2 } : null;
        newParty[pos2] = h1 ? { ...h1 } : null;
      }
      return { ...state, party: newParty };
    }
    case "BUY_ITEM": {
      if (state.gold < action.item.value) return state;
      if (state.inventory.length >= 16) return state;
      const boughtItem = createItemCopy(action.item);
      return {
        ...state,
        gold: state.gold - action.item.value,
        inventory: [...state.inventory, boughtItem],
        gameLog: [...state.gameLog, `${action.item.name}\uC744(\uB97C) \uAD6C\uB9E4\uD588\uC2B5\uB2C8\uB2E4.`]
      };
    }
    case "SELL_ITEM": {
      const item = state.inventory.find((i) => i.id === action.itemId);
      if (!item) return state;
      const sellValue = Math.floor(item.value / 2);
      return {
        ...state,
        gold: state.gold + sellValue,
        inventory: state.inventory.filter((i) => i.id !== action.itemId),
        gameLog: [...state.gameLog, `${item.name}\uC744(\uB97C) ${sellValue}\uACE8\uB4DC\uC5D0 \uD314\uC558\uC2B5\uB2C8\uB2E4.`]
      };
    }
    case "EQUIP_ITEM": {
      const item = state.inventory.find((i) => i.id === action.itemId);
      if (!item) return state;
      if (item.type === "supply" || item.type === "potion") return state;
      const updateHeroEquip = (hero) => {
        const newEquip = { ...hero.equipment };
        let unequipped;
        if (item.type === "weapon") {
          unequipped = newEquip.weapon;
          newEquip.weapon = item;
        } else if (item.type === "armor") {
          unequipped = newEquip.armor;
          newEquip.armor = item;
        } else if (item.type === "trinket") {
          if (!newEquip.trinket1) {
            newEquip.trinket1 = item;
          } else if (!newEquip.trinket2) {
            newEquip.trinket2 = item;
          } else {
            unequipped = newEquip.trinket1;
            newEquip.trinket1 = item;
          }
        }
        return { ...hero, equipment: newEquip };
      };
      let newInventory = state.inventory.filter((i) => i.id !== action.itemId);
      let newRoster = [...state.roster];
      let newParty = [...state.party];
      let found = false;
      const rosterIdx = newRoster.findIndex((h) => h.id === action.heroId);
      if (rosterIdx !== -1) {
        const oldHero = newRoster[rosterIdx];
        const updatedHero = updateHeroEquip(oldHero);
        const oldSlotItem = item.type === "weapon" ? oldHero.equipment.weapon : item.type === "armor" ? oldHero.equipment.armor : void 0;
        if (oldSlotItem) newInventory.push(oldSlotItem);
        newRoster[rosterIdx] = updatedHero;
        found = true;
      }
      if (!found) {
        for (let i = 0; i < newParty.length; i++) {
          if (newParty[i]?.id === action.heroId) {
            const oldHero = newParty[i];
            const updatedHero = updateHeroEquip(oldHero);
            const oldSlotItem = item.type === "weapon" ? oldHero.equipment.weapon : item.type === "armor" ? oldHero.equipment.armor : void 0;
            if (oldSlotItem) newInventory.push(oldSlotItem);
            newParty[i] = updatedHero;
            const ri = newRoster.findIndex((h) => h.id === action.heroId);
            if (ri !== -1) newRoster[ri] = updatedHero;
            found = true;
            break;
          }
        }
      }
      if (!found) return state;
      return {
        ...state,
        roster: newRoster,
        party: newParty,
        inventory: newInventory,
        gameLog: [...state.gameLog, `${item.name}\uC744(\uB97C) \uC7A5\uCC29\uD588\uC2B5\uB2C8\uB2E4.`]
      };
    }
    case "UNEQUIP_ITEM": {
      const findAndUnequip = (hero) => {
        const newEquip = { ...hero.equipment };
        let removed;
        if (action.slot === "weapon") {
          removed = newEquip.weapon;
          newEquip.weapon = void 0;
        } else if (action.slot === "armor") {
          removed = newEquip.armor;
          newEquip.armor = void 0;
        } else if (action.slot === "trinket1") {
          removed = newEquip.trinket1;
          newEquip.trinket1 = void 0;
        } else if (action.slot === "trinket2") {
          removed = newEquip.trinket2;
          newEquip.trinket2 = void 0;
        }
        return { hero: { ...hero, equipment: newEquip }, item: removed };
      };
      let newRoster = [...state.roster];
      let newParty = [...state.party];
      let removedItem;
      const rosterIdx = newRoster.findIndex((h) => h.id === action.heroId);
      if (rosterIdx !== -1) {
        const result = findAndUnequip(newRoster[rosterIdx]);
        newRoster[rosterIdx] = result.hero;
        removedItem = result.item;
        for (let i = 0; i < newParty.length; i++) {
          if (newParty[i]?.id === action.heroId) {
            newParty[i] = result.hero;
            break;
          }
        }
      } else {
        for (let i = 0; i < newParty.length; i++) {
          if (newParty[i]?.id === action.heroId) {
            const result = findAndUnequip(newParty[i]);
            newParty[i] = result.hero;
            removedItem = result.item;
            break;
          }
        }
      }
      if (!removedItem) return state;
      return {
        ...state,
        roster: newRoster,
        party: newParty,
        inventory: [...state.inventory, removedItem],
        gameLog: [...state.gameLog, `${removedItem.name}\uC744(\uB97C) \uD574\uC81C\uD588\uC2B5\uB2C8\uB2E4.`]
      };
    }
    case "USE_ITEM": {
      const item = state.inventory.find((i) => i.id === action.itemId);
      if (!item || !item.consumable) return state;
      let newParty = [...state.party];
      const logs = [];
      if (action.heroId && (item.healAmount || item.buffEffect)) {
        for (let i = 0; i < newParty.length; i++) {
          if (newParty[i]?.id === action.heroId) {
            let hero = { ...newParty[i], stats: { ...newParty[i].stats }, statusEffects: [...newParty[i].statusEffects] };
            if (item.healAmount) {
              const actualHeal = Math.min(item.healAmount, hero.stats.maxHp - hero.stats.hp);
              hero.stats.hp = clamp(hero.stats.hp + item.healAmount, 0, hero.stats.maxHp);
              if (hero.isDeathsDoor && hero.stats.hp > 0) {
                hero = { ...hero, isDeathsDoor: false };
              }
              logs.push(`${hero.name}\uC774(\uAC00) HP ${actualHeal} \uD68C\uBCF5!`);
            }
            if (item.buffEffect) {
              const buffStatMap = {
                attack: "buff_attack",
                defense: "buff_defense",
                speed: "buff_speed"
              };
              const effectType = buffStatMap[item.buffEffect.stat] || `buff_${item.buffEffect.stat}`;
              const newEffect = {
                type: effectType,
                duration: item.buffEffect.duration,
                value: item.buffEffect.value,
                source: item.name
              };
              hero.statusEffects.push(newEffect);
              logs.push(`${hero.name}\uC5D0\uAC8C ${item.name} \uD6A8\uACFC \uC801\uC6A9! (${item.buffEffect.stat} +${item.buffEffect.value}, ${item.buffEffect.duration}\uD134)`);
            }
            newParty[i] = hero;
            break;
          }
        }
      }
      return {
        ...state,
        party: newParty,
        inventory: state.inventory.filter((i) => i.id !== action.itemId),
        gameLog: [...state.gameLog, ...logs]
      };
    }
    case "ENTER_TOWER": {
      resetBossPatterns();
      const firstFloorMap = generateFloorMap(1);
      return {
        ...state,
        tower: {
          currentFloor: 1,
          maxFloorReached: state.maxFloorReached,
          floorMap: firstFloorMap,
          inProgress: true,
          paused: false,
          theme: getThemeForFloor(1)
        },
        paused: false,
        screen: "dungeon",
        gameLog: [...state.gameLog, "\uC5B4\uB460\uC758 \uD0D1\uC5D0 \uC9C4\uC785\uD588\uC2B5\uB2C8\uB2E4. 1\uCE35..."]
      };
    }
    case "ADVANCE_FLOOR": {
      if (!state.tower) return state;
      const nextFloor = state.tower.currentFloor + 1;
      if (nextFloor > 100) return state;
      const newFloorMap = generateFloorMap(nextFloor);
      const newMaxFloor = Math.max(state.maxFloorReached, nextFloor);
      return {
        ...state,
        tower: {
          ...state.tower,
          currentFloor: nextFloor,
          maxFloorReached: newMaxFloor,
          floorMap: newFloorMap,
          theme: getThemeForFloor(nextFloor)
        },
        maxFloorReached: newMaxFloor,
        gameLog: [...state.gameLog, `${nextFloor}\uCE35\uC73C\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4.`]
      };
    }
    case "EXIT_TOWER": {
      return {
        ...state,
        tower: null,
        screen: "town",
        gameLog: [...state.gameLog, "\uC5B4\uB460\uC758 \uD0D1\uC5D0\uC11C \uADC0\uD658\uD588\uC2B5\uB2C8\uB2E4."]
      };
    }
    case "START_COMBAT": {
      const heroes = state.party.filter((h) => h !== null);
      const surprised = action.isSurprised || false;
      const enemySurprised = action.enemySurprised || false;
      const combatLog = ["\uC804\uD22C \uC2DC\uC791!"];
      if (surprised) combatLog.push("{red-fg}\uAE30\uC2B5\uB2F9\uD588\uB2E4! \uC801\uC774 \uBA3C\uC800 \uD589\uB3D9\uD569\uB2C8\uB2E4!{/red-fg}");
      if (enemySurprised) combatLog.push("{green-fg}\uC801\uC744 \uAE30\uC2B5\uD588\uB2E4! \uC544\uAD70\uC774 \uBA3C\uC800 \uD589\uB3D9\uD569\uB2C8\uB2E4!{/green-fg}");
      return {
        ...state,
        combat: {
          phase: "animating",
          heroes: heroes.map((h) => ({ ...h, stats: { ...h.stats } })),
          monsters: action.monsters,
          turnOrder: [],
          currentTurnIndex: 0,
          round: 1,
          log: combatLog,
          selectedSkillIndex: 0,
          isSurprised: surprised,
          enemySurprised
        },
        screen: "combat"
      };
    }
    case "SET_COMBAT":
      return { ...state, combat: action.combat };
    case "END_COMBAT_VICTORY": {
      if (!state.tower || !state.combat) return state;
      const updatedParty = [...state.party];
      for (const combatHero of state.combat.heroes) {
        for (let i = 0; i < updatedParty.length; i++) {
          if (updatedParty[i]?.id === combatHero.id) {
            updatedParty[i] = { ...combatHero };
            break;
          }
        }
      }
      const monsterCount = state.combat.monsters.length;
      const hasBossMonster = state.combat.monsters.some((m) => m.isBoss);
      const floor = state.tower.currentFloor;
      const baseExp = floor * 10 + monsterCount * 15;
      let totalExp = hasBossMonster ? baseExp * 3 : baseExp;
      if (hasPrestigeUpgrade(state.prestige, "exp_bonus_20")) {
        totalExp = Math.round(totalExp * 1.2);
      } else if (hasPrestigeUpgrade(state.prestige, "exp_bonus_10")) {
        totalExp = Math.round(totalExp * 1.1);
      }
      const levelUpLogs = [];
      for (let i = 0; i < updatedParty.length; i++) {
        let h = updatedParty[i];
        if (!h || h.stats.hp <= 0) continue;
        h = { ...h, exp: h.exp + totalExp };
        const maxLevel = h.isMainCharacter ? 10 : 5;
        while (h.exp >= h.expToLevel && h.level < maxLevel) {
          h = levelUpHero(h);
          levelUpLogs.push(`${h.name}\uC774(\uAC00) \uB808\uBCA8 ${h.level}\uB85C \uC131\uC7A5!`);
        }
        updatedParty[i] = h;
      }
      let newRoster = [...state.roster];
      for (let i = 0; i < updatedParty.length; i++) {
        const h = updatedParty[i];
        if (h && h.stats.hp <= 0 && h.isDeathsDoor) {
          if (h.id !== state.mainCharacterId) {
            updatedParty[i] = null;
            newRoster = newRoster.filter((rh) => rh.id !== h.id);
          }
        }
      }
      const combatFloorMap = { ...state.tower.floorMap };
      const combatTiles = combatFloorMap.tiles.map((row) => row.map((t) => ({ ...t })));
      const px = combatFloorMap.playerX;
      const py = combatFloorMap.playerY;
      if (py >= 0 && py < combatFloorMap.height && px >= 0 && px < combatFloorMap.width) {
        combatTiles[py][px].cleared = true;
      }
      combatFloorMap.tiles = combatTiles;
      newRoster = newRoster.map((rh) => {
        const partyVersion = updatedParty.find((ph) => ph?.id === rh.id);
        if (partyVersion) return { ...partyVersion };
        const combatVersion = state.combat.heroes.find((ch) => ch.id === rh.id);
        return combatVersion ? { ...combatVersion } : rh;
      });
      const currentTile = combatTiles[py]?.[px];
      const isBossRoom = currentTile?.type === "boss";
      const currentFloor = state.tower.currentFloor;
      const floorGold = action.gold + currentFloor * 5;
      const newMaxFloor = Math.max(state.maxFloorReached, currentFloor);
      const pendingLoot = action.loot.length > 0 ? {
        items: action.loot,
        currentIndex: 0,
        gold: 0,
        // gold added separately
        source: "combat"
      } : null;
      if (isBossRoom) {
        const bossBonus = currentFloor * 20;
        const totalGold = floorGold + bossBonus;
        const isGameWon = currentFloor >= 100;
        return {
          ...state,
          party: updatedParty,
          roster: newRoster,
          combat: null,
          gold: state.gold + totalGold,
          pendingLoot,
          tower: { ...state.tower, floorMap: combatFloorMap },
          maxFloorReached: newMaxFloor,
          gameWon: isGameWon,
          week: state.week + 1,
          screen: "dungeon",
          gameLog: [...state.gameLog, `\uBCF4\uC2A4 \uCC98\uCE58! ${totalGold}\uACE8\uB4DC \uD68D\uB4DD! (\uBCF4\uC2A4 \uBCF4\uB108\uC2A4 ${bossBonus}G)`, `\uACBD\uD5D8\uCE58 +${totalExp}`, ...levelUpLogs]
        };
      }
      return {
        ...state,
        party: updatedParty,
        roster: newRoster,
        combat: null,
        gold: state.gold + floorGold,
        pendingLoot,
        tower: { ...state.tower, floorMap: combatFloorMap },
        maxFloorReached: newMaxFloor,
        screen: "dungeon",
        gameLog: [...state.gameLog, `\uC804\uD22C \uC2B9\uB9AC! ${floorGold}\uACE8\uB4DC \uD68D\uB4DD.`, `\uACBD\uD5D8\uCE58 +${totalExp}`, ...levelUpLogs]
      };
    }
    case "END_COMBAT_DEFEAT":
      return {
        ...state,
        combat: null,
        screen: "game_over",
        gameLog: [...state.gameLog, "\uC8FC\uC778\uACF5\uC774 \uC4F0\uB7EC\uC84C\uC2B5\uB2C8\uB2E4..."]
      };
    case "FLEE_COMBAT": {
      if (!state.tower || !state.combat) return state;
      const updatedParty2 = [...state.party];
      for (const combatHero of state.combat.heroes) {
        for (let i = 0; i < updatedParty2.length; i++) {
          if (updatedParty2[i]?.id === combatHero.id) {
            updatedParty2[i] = { ...combatHero, stats: { ...combatHero.stats } };
            break;
          }
        }
      }
      return {
        ...state,
        party: updatedParty2,
        combat: null,
        tower: null,
        screen: "town",
        gameLog: [...state.gameLog, "\uC804\uD22C\uC5D0\uC11C \uB3C4\uC8FC\uD588\uC2B5\uB2C8\uB2E4! \uD0D1\uC5D0\uC11C \uADC0\uD658\uD569\uB2C8\uB2E4."]
      };
    }
    case "MAIN_CHAR_FLEE": {
      if (!state.tower || !state.combat) return state;
      const updatedParty3 = [...state.party];
      for (const combatHero of state.combat.heroes) {
        for (let i = 0; i < updatedParty3.length; i++) {
          if (updatedParty3[i]?.id === combatHero.id) {
            updatedParty3[i] = { ...combatHero, stats: { ...combatHero.stats } };
            break;
          }
        }
      }
      return {
        ...state,
        party: updatedParty3,
        combat: null,
        tower: null,
        screen: "town",
        gameLog: [...state.gameLog, "{red-fg}\uC8FC\uC778\uACF5\uC758 HP\uAC00 \uC704\uD5D8\uD569\uB2C8\uB2E4! \uAE34\uAE09 \uB3C4\uC8FC!{/red-fg}"]
      };
    }
    case "UPDATE_PARTY_HERO": {
      const newParty = [...state.party];
      for (let i = 0; i < newParty.length; i++) {
        if (newParty[i]?.id === action.hero.id) {
          newParty[i] = action.hero;
          break;
        }
      }
      const newRoster = state.roster.map((h) => h.id === action.hero.id ? action.hero : h);
      return { ...state, party: newParty, roster: newRoster };
    }
    case "SET_EVENT":
      return {
        ...state,
        currentEvent: action.event,
        screen: action.event ? "event" : state.screen
      };
    case "CLEAR_ROOM": {
      return state;
    }
    case "CLEAR_TILE": {
      if (!state.tower) return state;
      const fm = state.tower.floorMap;
      const newTiles = fm.tiles.map((row) => row.map((t) => ({ ...t })));
      if (action.y >= 0 && action.y < fm.height && action.x >= 0 && action.x < fm.width) {
        newTiles[action.y][action.x].cleared = true;
      }
      return {
        ...state,
        tower: {
          ...state.tower,
          floorMap: { ...fm, tiles: newTiles }
        }
      };
    }
    case "UPDATE_FLOOR_MAP": {
      if (!state.tower) return state;
      return {
        ...state,
        tower: { ...state.tower, floorMap: action.floorMap }
      };
    }
    case "TOGGLE_PAUSE": {
      return { ...state, paused: !state.paused };
    }
    case "ADD_GOLD":
      return { ...state, gold: state.gold + action.amount };
    case "ADD_LOG":
      return { ...state, gameLog: [...state.gameLog, action.message] };
    case "SET_GAME_WON":
      return { ...state, gameWon: action.won };
    case "LOAD_STATE":
      return { ...action.state };
    case "LEVEL_UP_HERO": {
      const hero = state.roster.find((h) => h.id === action.heroId);
      if (!hero) return state;
      const maxLevel = hero.isMainCharacter ? 10 : 5;
      if (hero.level >= maxLevel) return state;
      if (hero.exp < hero.expToLevel) return state;
      const upgraded = levelUpHero(hero);
      const newRoster = state.roster.map((h) => h.id === action.heroId ? upgraded : h);
      const newParty = state.party.map((h) => h?.id === action.heroId ? upgraded : h);
      return {
        ...state,
        roster: newRoster,
        party: newParty,
        gameLog: [...state.gameLog, `${upgraded.name}\uC774(\uAC00) \uB808\uBCA8 ${upgraded.level}\uB85C \uC131\uC7A5\uD588\uC2B5\uB2C8\uB2E4!`]
      };
    }
    case "ALLOCATE_STATS": {
      const hero = state.roster.find((h) => h.id === action.heroId);
      if (!hero || !hero.isMainCharacter) return state;
      const updated = applyStatPoints(hero, action.allocation);
      const newRoster = state.roster.map((h) => h.id === action.heroId ? updated : h);
      const newParty = state.party.map((h) => h?.id === action.heroId ? updated : h);
      return {
        ...state,
        roster: newRoster,
        party: newParty,
        gameLog: [...state.gameLog, `${updated.name}\uC758 \uB2A5\uB825\uCE58\uAC00 \uAC15\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4!`]
      };
    }
    case "SET_SELECTED_HERO":
      return { ...state, selectedHeroId: action.heroId };
    case "ADVANCE_WEEK":
      return { ...state, week: state.week + 1, gameLog: [...state.gameLog, `${state.week + 1}\uC8FC\uCC28\uAC00 \uC2DC\uC791\uB429\uB2C8\uB2E4.`] };
    case "SET_GAME_SPEED":
      return { ...state, gameSpeed: action.speed };
    case "TOGGLE_CONTINUOUS_RUN":
      return { ...state, continuousRun: !state.continuousRun };
    case "SET_CONTINUOUS_RUN":
      return { ...state, continuousRun: action.enabled };
    case "INCREMENT_RUNS":
      return { ...state, runsCompleted: state.runsCompleted + 1 };
    case "SET_PENDING_LOOT":
      return {
        ...state,
        pendingLoot: action.loot,
        gold: state.gold + action.loot.gold
      };
    case "RESOLVE_LOOT_ITEM": {
      if (!state.pendingLoot) return state;
      const pl = state.pendingLoot;
      const currentItem = pl.items[pl.currentIndex];
      if (!currentItem) return { ...state, pendingLoot: null };
      let newState = { ...state };
      if (action.decision === "equip" && action.heroId) {
        const equipResult = gameReducer(newState, { type: "EQUIP_ITEM", heroId: action.heroId, itemId: "__pending__" });
        const targetHero = newState.roster.find((h) => h.id === action.heroId) || newState.party.find((h) => h?.id === action.heroId);
        if (targetHero && (currentItem.type === "weapon" || currentItem.type === "armor" || currentItem.type === "trinket")) {
          const newEquip = { ...targetHero.equipment };
          let unequipped;
          if (currentItem.type === "weapon") {
            unequipped = newEquip.weapon;
            newEquip.weapon = currentItem;
          } else if (currentItem.type === "armor") {
            unequipped = newEquip.armor;
            newEquip.armor = currentItem;
          } else if (currentItem.type === "trinket") {
            if (!newEquip.trinket1) newEquip.trinket1 = currentItem;
            else if (!newEquip.trinket2) newEquip.trinket2 = currentItem;
            else {
              unequipped = newEquip.trinket1;
              newEquip.trinket1 = currentItem;
            }
          }
          const updatedHero = { ...targetHero, equipment: newEquip };
          newState = {
            ...newState,
            roster: newState.roster.map((h) => h.id === action.heroId ? updatedHero : h),
            party: newState.party.map((h) => h?.id === action.heroId ? updatedHero : h),
            inventory: unequipped ? [...newState.inventory, unequipped] : newState.inventory,
            gameLog: [...newState.gameLog, `${currentItem.name}\uC744(\uB97C) ${targetHero.name}\uC5D0\uAC8C \uC7A5\uCC29!`]
          };
        }
      } else if (action.decision === "store") {
        if (newState.inventory.length < 16) {
          newState = {
            ...newState,
            inventory: [...newState.inventory, currentItem],
            gameLog: [...newState.gameLog, `${currentItem.name}\uC744(\uB97C) \uBCF4\uAD00\uD588\uC2B5\uB2C8\uB2E4.`]
          };
        }
      } else if (action.decision === "use" && action.heroId) {
        const useResult = gameReducer(newState, { type: "USE_ITEM", itemId: "__pending__", heroId: action.heroId });
        let newParty = [...newState.party];
        const logs = [];
        for (let i = 0; i < newParty.length; i++) {
          if (newParty[i]?.id === action.heroId) {
            let hero = { ...newParty[i], stats: { ...newParty[i].stats }, statusEffects: [...newParty[i].statusEffects] };
            if (currentItem.healAmount) {
              const actualHeal = Math.min(currentItem.healAmount, hero.stats.maxHp - hero.stats.hp);
              hero.stats.hp = clamp(hero.stats.hp + currentItem.healAmount, 0, hero.stats.maxHp);
              if (hero.isDeathsDoor && hero.stats.hp > 0) hero = { ...hero, isDeathsDoor: false };
              logs.push(`${hero.name}\uC774(\uAC00) HP ${actualHeal} \uD68C\uBCF5!`);
            }
            if (currentItem.buffEffect) {
              const buffStatMap = { attack: "buff_attack", defense: "buff_defense", speed: "buff_speed" };
              const effectType = buffStatMap[currentItem.buffEffect.stat] || `buff_${currentItem.buffEffect.stat}`;
              hero.statusEffects.push({
                type: effectType,
                duration: currentItem.buffEffect.duration,
                value: currentItem.buffEffect.value,
                source: currentItem.name
              });
              logs.push(`${hero.name}\uC5D0\uAC8C ${currentItem.name} \uD6A8\uACFC \uC801\uC6A9!`);
            }
            newParty[i] = hero;
            break;
          }
        }
        const newRoster2 = newState.roster.map((rh) => {
          const partyVer = newParty.find((ph) => ph?.id === rh.id);
          return partyVer || rh;
        });
        newState = { ...newState, party: newParty, roster: newRoster2, gameLog: [...newState.gameLog, ...logs] };
      }
      const nextIndex = pl.currentIndex + 1;
      if (nextIndex >= pl.items.length) {
        newState = { ...newState, pendingLoot: null };
      } else {
        newState = { ...newState, pendingLoot: { ...pl, currentIndex: nextIndex } };
      }
      return newState;
    }
    case "CLEAR_PENDING_LOOT":
      return { ...state, pendingLoot: null };
    case "EARN_PRESTIGE": {
      const newPrestige = {
        ...state.prestige,
        points: state.prestige.points + action.amount,
        totalEarned: state.prestige.totalEarned + action.amount
      };
      return { ...state, prestige: newPrestige };
    }
    case "BUY_PRESTIGE_UPGRADE": {
      const upgrade = PRESTIGE_UPGRADES.find((u) => u.id === action.upgradeId);
      if (!upgrade) return state;
      if (state.prestige.purchased.includes(action.upgradeId)) return state;
      if (state.prestige.points < upgrade.cost) return state;
      if (upgrade.requires && !state.prestige.purchased.includes(upgrade.requires)) return state;
      const newPrestige = {
        ...state.prestige,
        points: state.prestige.points - upgrade.cost,
        purchased: [...state.prestige.purchased, action.upgradeId]
      };
      return {
        ...state,
        prestige: newPrestige,
        gameLog: [...state.gameLog, `\uBA85\uC131 \uC5C5\uADF8\uB808\uC774\uB4DC: ${upgrade.name} \uAD6C\uB9E4!`]
      };
    }
    case "USE_COMBAT_ITEM": {
      if (!state.combat) return state;
      const item = state.inventory.find((i) => i.id === action.itemId);
      if (!item || !item.consumable) return state;
      const heroIdx = state.combat.heroes.findIndex((h) => h.id === action.heroId);
      if (heroIdx === -1) return state;
      const newHeroes = [...state.combat.heroes];
      let hero = { ...newHeroes[heroIdx], stats: { ...newHeroes[heroIdx].stats }, statusEffects: [...newHeroes[heroIdx].statusEffects] };
      const logs = [];
      if (item.healAmount) {
        const actualHeal = Math.min(item.healAmount, hero.stats.maxHp - hero.stats.hp);
        hero.stats.hp = clamp(hero.stats.hp + item.healAmount, 0, hero.stats.maxHp);
        if (hero.isDeathsDoor && hero.stats.hp > 0) hero = { ...hero, isDeathsDoor: false };
        logs.push(`${hero.name}\uC774(\uAC00) ${item.name}\uC73C\uB85C HP ${actualHeal} \uD68C\uBCF5!`);
      }
      if (item.buffEffect) {
        const buffStatMap = { attack: "buff_attack", defense: "buff_defense", speed: "buff_speed" };
        const effectType = buffStatMap[item.buffEffect.stat] || `buff_${item.buffEffect.stat}`;
        hero.statusEffects.push({
          type: effectType,
          duration: item.buffEffect.duration,
          value: item.buffEffect.value,
          source: item.name
        });
        logs.push(`${hero.name}\uC5D0\uAC8C ${item.name} \uD6A8\uACFC \uC801\uC6A9! (${item.buffEffect.stat} +${item.buffEffect.value}, ${item.buffEffect.duration}\uD134)`);
      }
      newHeroes[heroIdx] = hero;
      return {
        ...state,
        combat: { ...state.combat, heroes: newHeroes, log: [...state.combat.log, ...logs] },
        inventory: state.inventory.filter((i) => i.id !== action.itemId)
      };
    }
    default:
      return state;
  }
}
var GameStore = class extends EventEmitter {
  state;
  constructor() {
    super();
    this.state = initialState();
    this.state.prestige = loadPrestige();
  }
  getState() {
    return this.state;
  }
  dispatch(action) {
    this.state = gameReducer(this.state, action);
    this.emit("change", this.state);
  }
  reset() {
    this.state = initialState();
    this.emit("change", this.state);
  }
  saveGame() {
    savePrestige(this.state.prestige);
    return saveGame(this.state);
  }
  loadGame() {
    const loaded = loadGame();
    if (loaded) {
      this.dispatch({ type: "LOAD_STATE", state: loaded });
      return true;
    }
    return false;
  }
  hasSaveFile() {
    return hasSaveFile();
  }
  deleteSave() {
    deleteSave();
  }
};

// src/screens/TitleScreen.ts
import blessed2 from "blessed";

// src/screens/BaseScreen.ts
import blessed from "blessed";
var BaseScreen = class {
  screen;
  store;
  widgets = [];
  keyHandlers = [];
  constructor(screen, store) {
    this.screen = screen;
    this.store = store;
  }
  registerKey(keys, handler) {
    this.screen.key(keys, handler);
    this.keyHandlers.push({ keys, handler });
  }
  addWidget(widget) {
    this.widgets.push(widget);
    this.screen.append(widget);
  }
  createBox(options) {
    const box = blessed.box(options);
    this.addWidget(box);
    return box;
  }
  destroy() {
    for (const { keys, handler } of this.keyHandlers) {
      this.screen.unkey(keys, handler);
    }
    this.keyHandlers = [];
    for (const widget of this.widgets) {
      widget.destroy();
    }
    this.widgets = [];
  }
  refresh() {
    this.screen.render();
  }
};

// src/data/ascii-art.ts
var TITLE_ART = [
  "    \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557    ",
  "    \u2551                                          \u2551    ",
  "    \u2551      \u2588\u2588  \u2588\u2588 \u2588\u2588\u2588 \u2588 \u2588 \u2588 \u2588\u2588                 \u2551    ",
  "    \u2551      \u2588 \u2588 \u2588  \u2588 \u2588 \u2588 \u2588 \u2588 \u2588 \u2588                \u2551    ",
  "    \u2551      \u2588\u2588  \u2588  \u2588\u2588\u2588 \u2588 \u2588\u2588  \u2588\u2588                 \u2551    ",
  "    \u2551                                          \u2551    ",
  "    \u2551          \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510                 \u2551    ",
  "    \u2551          \u2502  \uC5B4\uB460\uC758 \uD0D1  \u2502                 \u2551    ",
  "    \u2551          \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518                 \u2551    ",
  "    \u2551                                          \u2551    ",
  "    \u2551      \uB05D\uC5C6\uB294 \uC5B4\uB460 \uC18D, 100\uCE35\uC758 \uD0D1\uC774        \u2551    ",
  "    \u2551      \uB2F9\uC2E0\uC744 \uAE30\uB2E4\uB9AC\uACE0 \uC788\uC2B5\uB2C8\uB2E4...          \u2551    ",
  "    \u2551                                          \u2551    ",
  "    \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D    "
];
var HERO_ART = {
  warrior: [
    "    _===_  ",
    "   /|   |\\ ",
    "   (o_o)  ",
    "  /|###|\\ ",
    "  +|###|+ ",
    "   |===|  ",
    "   |   |  ",
    "  _/   \\_ "
  ],
  rogue: [
    "     _^_   ",
    "    /~ ~\\  ",
    "    (o.o)  ",
    "   _/|=|\\_  ",
    "  / /| |\\ \\ ",
    "  `-` `-`  ",
    "     | |   ",
    "    _/ \\_  "
  ],
  mage: [
    "    /\\~    ",
    "   / *\\    ",
    "   \\__/    ",
    "   (o o)   ",
    "  ~/|~|\\~  ",
    "    |~|    ",
    "    | |    ",
    "   _/ \\_   "
  ],
  ranger: [
    "     ^     ",
    "    / \\    ",
    "    (o_o)  ",
    "  ))|=|D>> ",
    "    |=|    ",
    "    | |    ",
    "   _/ \\_   "
  ],
  paladin: [
    "      ,/|  ",
    "     / +|  ",
    "    /___|  ",
    "    (o o)  ",
    "   [|+++|] ",
    "  +-|+++|-+",
    "    |===|  ",
    "   _/   \\_ "
  ],
  dark_knight: [
    "    _/\\_   ",
    "   /V  V\\  ",
    "   (X_X)   ",
    "  /|###|\\ ",
    "  ||###|| ",
    "   |###|  ",
    "   |   |  ",
    "  _/   \\_ "
  ],
  crusader: [
    "      ,/| ",
    "     / +|  ",
    "    /___|  ",
    "    (o o)  ",
    "   [|###|] ",
    "  +-|###|-+",
    "  | |   | |",
    "    |===|  ",
    "    |   |  ",
    "   _/   \\_ "
  ],
  highwayman: [
    "     _===_ ",
    "    / ~.~ \\",
    "    (o_-o) ",
    "  __/|=|\\__",
    " |  /| |\\  |",
    " `-` | | `-`",
    "     | |    ",
    "    _/ \\_   "
  ],
  plague_doctor: [
    "     .---.  ",
    "    / o   \\ ",
    "    |>====/  ",
    "    \\___/   ",
    "   /|~~~|\\  ",
    "  o |~~~| o ",
    "    |===|   ",
    "    | | |   ",
    "   _/ | \\_  "
  ],
  vestal: [
    "     _*_    ",
    "    (* *)   ",
    "   /     \\  ",
    "   | o o |  ",
    "   | -v- |  ",
    "   /|===|\\  ",
    "  * | | | * ",
    "    |===|   ",
    "    |   |   ",
    "   _/   \\_  "
  ]
};
var SKULL_ART = [
  "      ___       ",
  "     /   \\      ",
  "    | o o |     ",
  "    |  ^  |     ",
  "     \\====/     ",
  "      |||       ",
  "   ___|||___    ",
  "  /=========\\   ",
  "  |  \uC548\uC2DD\uC744  |   ",
  "  |  \uBE55\uB2C8\uB2E4  |   ",
  "  |_________|   "
];
var TOWN_ART = [
  "                  /\\          /\\                    ",
  "      /\\         /  \\   /\\   /  \\        /\\         ",
  "     /  \\   /\\  / [] \\ /  \\ / [] \\  /\\  /  \\       ",
  "    / [] \\ /  \\|______|    |______|/  \\/ [] \\      ",
  "   |______|    | [] ||  /\\ | []  ||    |______|     ",
  "   | [] | |    |    || /  \\|     ||    | | [] |     ",
  "   |    | | [] |    ||/ [] |     || [] | |    |     ",
  "  _|____|_|____|____|_|____|_____|_|___|_|____|_    ",
  " /________________________________________________\\ ",
  "  ~~~  \uB9C8\uC744  ~~~  \uBAA8\uD5D8\uAC00\uAE38\uB4DC  ~~~  \uC8FC\uC810  ~~~        "
];
var VICTORY_ART = [
  "     ___________     ",
  "    /           \\    ",
  "   /    \uC2B9 \uB9AC!   \\   ",
  "  |   =========   |  ",
  "  |    \\     /    |  ",
  "  |     \\   /     |  ",
  "  |      \\ /      |  ",
  "  |       V       |  ",
  "   \\             /   ",
  "    \\___________/    "
];

// src/screens/TitleScreen.ts
var TitleScreen = class extends BaseScreen {
  render() {
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      style: { bg: "black" }
    });
    const titleText = TITLE_ART.join("\n");
    this.createBox({
      top: 1,
      left: "center",
      width: 78,
      height: TITLE_ART.length + 2,
      content: titleText,
      tags: true,
      style: { fg: "red", bg: "black" },
      align: "center"
    });
    this.createBox({
      top: TITLE_ART.length + 3,
      left: "center",
      width: 40,
      height: 3,
      content: "{bold}{yellow-fg}\uC5B4\uB460\uC758 \uD0D1{/yellow-fg}{/bold}\n{gray-fg}\uC5B4\uB460 \uC18D\uC73C\uB85C \uB0B4\uB824\uAC00\uB77C... \uAC10\uD788 \uD560 \uC218 \uC788\uB2E4\uBA74.{/gray-fg}",
      tags: true,
      style: { fg: "white", bg: "black" },
      align: "center"
    });
    const hasSave = this.store.hasSaveFile();
    const menuItems = ["\uC0C8 \uAC8C\uC784"];
    if (hasSave) {
      menuItems.push("\uC774\uC5B4\uD558\uAE30");
    } else {
      menuItems.push("{gray-fg}\uC774\uC5B4\uD558\uAE30 (\uC800\uC7A5 \uC5C6\uC74C){/gray-fg}");
    }
    menuItems.push("\uB098\uAC00\uAE30");
    const menu = blessed2.list({
      top: TITLE_ART.length + 7,
      left: "center",
      width: 30,
      height: menuItems.length + 2,
      items: menuItems,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "gray" },
        selected: { fg: "black", bg: "yellow", bold: true }
      }
    });
    this.addWidget(menu);
    this.createBox({
      bottom: 1,
      left: "center",
      width: 40,
      height: 1,
      content: "{gray-fg}   \u2191\u2193: \uC120\uD0DD   Enter: \uD655\uC778{/gray-fg}",
      tags: true,
      style: { fg: "gray", bg: "black" },
      align: "center"
    });
    menu.on("select", (_item, index) => {
      if (index === 0) {
        this.store.dispatch({ type: "NAVIGATE", screen: "character_select" });
      } else if (index === 1) {
        if (hasSave) {
          const loaded = this.store.loadGame();
          if (loaded) {
            this.store.dispatch({ type: "NAVIGATE", screen: "town" });
          }
        }
      } else if (hasSave && index === 2 || !hasSave && index === 2) {
        process.exit(0);
      }
    });
    menu.focus();
    this.screen.render();
  }
};

// src/screens/TownScreen.ts
import blessed3 from "blessed";
var TownScreen = class extends BaseScreen {
  infoBox;
  mainMenu;
  subMenu = null;
  partyBox;
  render() {
    const state = this.store.getState();
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      style: { bg: "black" }
    });
    const uniqueCollected = new Set(state.roster.map((h) => `${h.class}_${h.rarity}`)).size;
    const totalPossible = HERO_CLASSES.length * 3;
    const runsDisplay = state.runsCompleted > 0 ? `  |  {green-fg}\uC644\uB8CC: ${state.runsCompleted}\uD68C{/green-fg}` : "";
    const floorRecord = state.maxFloorReached > 0 ? `  |  {magenta-fg}\uCD5C\uACE0: ${state.maxFloorReached}\uCE35{/magenta-fg}` : "";
    const prestigeDisplay = state.prestige.points > 0 ? `  |  {yellow-fg}\uBA85\uC131: ${state.prestige.points}{/yellow-fg}` : "";
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: 3,
      content: `{bold}{yellow-fg} \uB9C8\uC744{/yellow-fg}{/bold}  |  {yellow-fg}\uACE8\uB4DC: ${state.gold}{/yellow-fg}  |  {bold}{cyan-fg}[ ${state.week}\uC8FC\uCC28 ]{/cyan-fg}{/bold}  |  {gray-fg}\uC601\uC6C5: ${state.roster.length}\uBA85{/gray-fg}  |  \uC218\uC9D1: ${uniqueCollected}/${totalPossible}${floorRecord}${runsDisplay}${prestigeDisplay}`,
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "gray" } }
    });
    this.partyBox = this.createBox({
      top: 3,
      left: 0,
      width: "30%",
      height: "70%",
      label: " \uD604\uC7AC \uD30C\uD2F0 ",
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "blue" }, label: { fg: "cyan" } },
      scrollable: true
    });
    this.updatePartyDisplay();
    const recruitCost = getRecruitCost(state.prestige);
    const menuItems = [
      `\uB3D9\uB8CC \uBAA8\uC9D1 (${recruitCost}G)`,
      "\uC601\uC6C5 \uB3C4\uAC10",
      "\uD30C\uD2F0 \uD3B8\uC131",
      "\uC7A5\uBE44/\uC778\uBCA4\uD1A0\uB9AC",
      "\uC0C1\uC810",
      "\uBA85\uC131 \uC0C1\uC810",
      "\uD0D1 \uB3C4\uC804",
      "\uC800\uC7A5",
      "\uD0C0\uC774\uD2C0\uB85C"
    ];
    this.mainMenu = blessed3.list({
      top: 3,
      left: "30%",
      width: "40%",
      height: "70%",
      label: " \uD589\uB3D9 \uC120\uD0DD ",
      items: menuItems,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "yellow" },
        selected: { fg: "black", bg: "yellow", bold: true },
        label: { fg: "yellow" }
      }
    });
    this.addWidget(this.mainMenu);
    this.infoBox = this.createBox({
      top: 3,
      left: "70%",
      width: "30%",
      height: "70%",
      label: " \uC815\uBCF4 ",
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "gray" }, label: { fg: "gray" } },
      content: "{gray-fg}\uBA54\uB274\uB97C \uC120\uD0DD\uD558\uC138\uC694.{/gray-fg}"
    });
    this.createBox({
      bottom: 0,
      left: 0,
      width: "100%",
      height: TOWN_ART.length + 2,
      content: TOWN_ART.join("\n"),
      tags: true,
      border: { type: "line" },
      style: { fg: "gray", bg: "black", border: { fg: "gray" } },
      align: "center"
    });
    this.mainMenu.on("select item", (_item, index) => {
      this.updateInfoForIndex(index);
    });
    this.mainMenu.on("select", (_item, index) => {
      this.handleMenuSelect(index);
    });
    this.registerKey(["i"], () => {
      if (this.subMenu) return;
      this.store.dispatch({ type: "NAVIGATE", screen: "inventory" });
    });
    this.mainMenu.focus();
    this.screen.render();
  }
  updatePartyDisplay() {
    const state = this.store.getState();
    let content = "";
    for (let i = 0; i < 6; i++) {
      const hero = state.party[i];
      const col = Math.floor(i / 3) + 1;
      const posLabel = col === 1 ? "{cyan-fg}\uC804\uC5F4{/cyan-fg}" : "{green-fg}\uC911\uC5F4{/green-fg}";
      if (hero) {
        const stars = getStars(hero.rarity);
        const hpColor = hero.stats.hp / hero.stats.maxHp > 0.5 ? "green" : hero.stats.hp / hero.stats.maxHp > 0.25 ? "yellow" : "red";
        const hpBar = formatBar(hero.stats.hp, hero.stats.maxHp, 10);
        const mcTag = hero.isMainCharacter ? "{bold}{yellow-fg}[\uC8FC\uC778\uACF5]{/yellow-fg}{/bold} " : "";
        content += `[${i + 1}] ${posLabel} ${mcTag}{yellow-fg}${stars}{/yellow-fg} ${getClassName(hero.class)}
`;
        content += `  {bold}${hero.name}{/bold} Lv.${hero.level}
`;
        content += `  HP {${hpColor}-fg}${hpBar}{/${hpColor}-fg} ${hero.stats.hp}/${hero.stats.maxHp}
`;
        content += "\n";
      } else {
        content += `[${i + 1}] ${posLabel} {gray-fg}\uBE48 \uC2AC\uB86F{/gray-fg}

`;
      }
    }
    this.partyBox.setContent(content);
  }
  updateInfoForIndex(index) {
    const state = this.store.getState();
    const recruitCost = getRecruitCost(state.prestige);
    let info = "";
    switch (index) {
      case 0:
        info = `{yellow-fg}\uC601\uC6C5 \uBAA8\uC9D1{/yellow-fg}

\uBE44\uC6A9: ${recruitCost} \uACE8\uB4DC
\uD604\uC7AC \uACE8\uB4DC: ${state.gold}

\uC0C8\uB85C\uC6B4 \uC601\uC6C5\uC744 \uACE0\uC6A9\uD569\uB2C8\uB2E4.
\uB808\uC5B4\uB9AC\uD2F0: \u2605 60% \u2605\u2605 30% \u2605\u2605\u2605 10%`;
        break;
      case 1:
        info = "{yellow-fg}\uC601\uC6C5 \uB3C4\uAC10{/yellow-fg}\n\n\uC218\uC9D1\uD55C \uC601\uC6C5 \uC870\uD569\uC744\n\uD655\uC778\uD569\uB2C8\uB2E4.";
        break;
      case 2:
        info = "{yellow-fg}\uD30C\uD2F0 \uD3B8\uC131{/yellow-fg}\n\n\uD30C\uD2F0 \uAD6C\uC131\uC6D0\uC744\n\uBC30\uCE58\uD569\uB2C8\uB2E4.\n\n\uD604\uC7AC \uD30C\uD2F0\uC6D0: " + state.party.filter((h) => h !== null).length + "/6";
        break;
      case 3:
        info = "{yellow-fg}\uC7A5\uBE44/\uC778\uBCA4\uD1A0\uB9AC{/yellow-fg}\n\n\uBCF4\uC720 \uC544\uC774\uD15C: " + state.inventory.length + "\uAC1C";
        break;
      case 4:
        info = "{yellow-fg}\uC0C1\uC810{/yellow-fg}\n\n\uBB34\uAE30, \uBC29\uC5B4\uAD6C, \uC7A5\uC2E0\uAD6C,\n\uBCF4\uAE09\uD488\uC744 \uAD6C\uB9E4\uD569\uB2C8\uB2E4.\n\n\uD604\uC7AC \uACE8\uB4DC: " + state.gold;
        break;
      case 5:
        info = `{yellow-fg}\uBA85\uC131 \uC0C1\uC810{/yellow-fg}

\uBA85\uC131 \uD3EC\uC778\uD2B8: ${state.prestige.points}
\uCD1D \uD68D\uB4DD: ${state.prestige.totalEarned}
\uAD6C\uB9E4: ${state.prestige.purchased.length}\uAC1C

\uB7F0 \uC885\uB8CC \uC2DC \uBA85\uC131\uC744 \uD68D\uB4DD\uD558\uACE0
\uC601\uAD6C \uC5C5\uADF8\uB808\uC774\uB4DC\uB97C \uAD6C\uB9E4\uD569\uB2C8\uB2E4.`;
        break;
      case 6:
        info = "{yellow-fg}\uD0D1 \uB3C4\uC804{/yellow-fg}\n\n{bold}{red-fg}\uC5B4\uB460\uC758 \uD0D1{/red-fg}{/bold}\n100\uCE35\uC758 \uD0D1\uC5D0 \uB3C4\uC804\uD569\uB2C8\uB2E4.\n\n{magenta-fg}\uCD5C\uACE0 \uAE30\uB85D: " + state.maxFloorReached + "\uCE35{/magenta-fg}\n\n\uD55C\uBC88/\uC5F0\uC18D \uD0D0\uD5D8 \uC120\uD0DD \uAC00\uB2A5";
        break;
      case 7:
        info = "{yellow-fg}\uC800\uC7A5{/yellow-fg}\n\n\uD604\uC7AC \uC9C4\uD589 \uC0C1\uD669\uC744\n\uC800\uC7A5\uD569\uB2C8\uB2E4.";
        break;
      case 8:
        info = "{yellow-fg}\uD0C0\uC774\uD2C0\uB85C{/yellow-fg}\n\n\uD0C0\uC774\uD2C0 \uD654\uBA74\uC73C\uB85C\n\uB3CC\uC544\uAC11\uB2C8\uB2E4.";
        break;
    }
    this.infoBox.setContent(info);
    this.screen.render();
  }
  handleMenuSelect(index) {
    switch (index) {
      case 0:
        this.showRecruitMenu();
        break;
      case 1:
        this.showCollectionView();
        break;
      case 2:
        this.store.dispatch({ type: "NAVIGATE", screen: "party_select" });
        break;
      case 3:
        this.showHeroDetailOrInventory();
        break;
      case 4:
        this.showShopMenu();
        break;
      case 5:
        this.showPrestigeShop();
        break;
      case 6:
        this.showTowerMenu();
        break;
      case 7:
        this.saveGame();
        break;
      case 8:
        this.store.dispatch({ type: "NAVIGATE", screen: "title" });
        break;
    }
  }
  clearSubMenu() {
    if (this.subMenu) {
      this.subMenu.destroy();
      const idx = this.widgets.indexOf(this.subMenu);
      if (idx !== -1) this.widgets.splice(idx, 1);
      this.subMenu = null;
    }
  }
  showRecruitMenu() {
    this.clearSubMenu();
    const state = this.store.getState();
    const recruitCost = getRecruitCost(state.prestige);
    const maxRoster = getMaxRoster(state.prestige);
    if (state.gold < recruitCost) {
      this.infoBox.setContent(`{red-fg}\uACE8\uB4DC\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4!{/red-fg}

\uD544\uC694: ${recruitCost}G
\uD604\uC7AC: ${state.gold}G`);
      this.screen.render();
      return;
    }
    if (state.roster.length >= maxRoster) {
      this.infoBox.setContent(`{red-fg}\uC601\uC6C5 \uBAA9\uB85D\uC774 \uAC00\uB4DD \uCC3C\uC2B5\uB2C8\uB2E4!{/red-fg}

\uCD5C\uB300 ${maxRoster}\uBA85\uAE4C\uC9C0 \uACE0\uC6A9 \uAC00\uB2A5.`);
      this.screen.render();
      return;
    }
    const items = COMPANION_CLASSES.map((hc) => `${getClassName(hc)} (${recruitCost}G)`);
    items.push("\uB3CC\uC544\uAC00\uAE30");
    this.subMenu = blessed3.list({
      top: "center",
      left: "center",
      width: 30,
      height: items.length + 2,
      label: " \uB3D9\uB8CC \uBAA8\uC9D1 ",
      items,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "yellow" },
        selected: { fg: "black", bg: "yellow", bold: true },
        label: { fg: "yellow" }
      }
    });
    this.addWidget(this.subMenu);
    this.subMenu.focus();
    this.subMenu.on("select item", (_el, idx) => {
      if (idx < COMPANION_CLASSES.length) {
        const hc = COMPANION_CLASSES[idx];
        this.infoBox.setContent(`{yellow-fg}${getClassName(hc)}{/yellow-fg}

${CLASS_DESCRIPTIONS[hc]}

\uBE44\uC6A9: ${recruitCost}G`);
        this.screen.render();
      }
    });
    this.subMenu.on("select", (_item, idx) => {
      if (idx < COMPANION_CLASSES.length) {
        this.store.dispatch({ type: "RECRUIT_HERO", heroClass: COMPANION_CLASSES[idx] });
        const newState = this.store.getState();
        const newHero = newState.roster[newState.roster.length - 1];
        if (newHero) {
          const stars = getStars(newHero.rarity);
          const rarityColor = newHero.rarity === 3 ? "yellow" : newHero.rarity === 2 ? "cyan" : "white";
          this.infoBox.setContent(`{${rarityColor}-fg}{bold}${stars} \uB4F1\uC7A5!{/bold}{/${rarityColor}-fg}

${newHero.name} (${getClassName(newHero.class)})

\uB0A8\uC740 \uACE8\uB4DC: ${newState.gold}`);
        }
        this.updatePartyDisplay();
      }
      this.clearSubMenu();
      this.mainMenu.focus();
      this.screen.render();
    });
    this.subMenu.key(["escape"], () => {
      this.clearSubMenu();
      this.mainMenu.focus();
      this.screen.render();
    });
    this.screen.render();
  }
  showCollectionView() {
    this.clearSubMenu();
    const state = this.store.getState();
    let content = "{bold}{yellow-fg}\uC601\uC6C5 \uB3C4\uAC10{/yellow-fg}{/bold}\n\n";
    for (const hc of HERO_CLASSES) {
      content += `{cyan-fg}${getClassName(hc)}{/cyan-fg}
`;
      for (const rarity of [1, 2, 3]) {
        const stars = getStars(rarity);
        const heroes = state.roster.filter((h) => h.class === hc && h.rarity === rarity);
        if (heroes.length > 0) {
          const heroNames = heroes.map((h) => h.name).join(", ");
          content += `  {yellow-fg}${stars}{/yellow-fg} ${heroNames} (${heroes.length}\uBA85)
`;
        } else {
          content += `  {gray-fg}${stars} ???{/gray-fg}
`;
        }
      }
      content += "\n";
    }
    const uniqueCollected = new Set(state.roster.map((h) => `${h.class}_${h.rarity}`)).size;
    const totalPossible = HERO_CLASSES.length * 3;
    content += `
{bold}\uC218\uC9D1 \uC9C4\uD589: ${uniqueCollected}/${totalPossible}{/bold}`;
    this.infoBox.setContent(content);
    this.screen.render();
  }
  showHeroDetailOrInventory() {
    this.clearSubMenu();
    const items = ["\uC601\uC6C5 \uC0C1\uC138", "\uC778\uBCA4\uD1A0\uB9AC", "\uB3CC\uC544\uAC00\uAE30"];
    this.subMenu = blessed3.list({
      top: "center",
      left: "center",
      width: 25,
      height: items.length + 2,
      label: " \uC120\uD0DD ",
      items,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "cyan" },
        selected: { fg: "black", bg: "cyan", bold: true },
        label: { fg: "cyan" }
      }
    });
    this.addWidget(this.subMenu);
    this.subMenu.focus();
    this.subMenu.on("select", (_item, idx) => {
      this.clearSubMenu();
      if (idx === 0) {
        this.showHeroDetailMenu();
      } else if (idx === 1) {
        this.store.dispatch({ type: "NAVIGATE", screen: "inventory" });
      } else {
        this.mainMenu.focus();
        this.screen.render();
      }
    });
    this.subMenu.key(["escape"], () => {
      this.clearSubMenu();
      this.mainMenu.focus();
      this.screen.render();
    });
    this.screen.render();
  }
  showShopMenu() {
    this.clearSubMenu();
    const allItems = [...SUPPLY_ITEMS, ...SHOP_WEAPONS, ...SHOP_ARMOR, ...SHOP_TRINKETS];
    const itemLabels = allItems.map((item) => {
      const typeLabel = item.type === "supply" ? "[\uBCF4\uAE09]" : item.type === "weapon" ? "[\uBB34\uAE30]" : item.type === "armor" ? "[\uBC29\uC5B4]" : "[\uC7A5\uC2E0]";
      return `${typeLabel} ${item.name} - ${item.value}G`;
    });
    itemLabels.push("\uB3CC\uC544\uAC00\uAE30");
    this.subMenu = blessed3.list({
      top: "center",
      left: "center",
      width: 40,
      height: Math.min(itemLabels.length + 2, 20),
      label: " \uC0C1\uC810 ",
      items: itemLabels,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      scrollable: true,
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "green" },
        selected: { fg: "black", bg: "green", bold: true },
        label: { fg: "green" }
      }
    });
    this.addWidget(this.subMenu);
    this.subMenu.focus();
    this.subMenu.on("select item", (_el, idx) => {
      if (idx < allItems.length) {
        const item = allItems[idx];
        let detail = `{yellow-fg}${item.name}{/yellow-fg}

${item.description}

\uAC00\uACA9: ${item.value}G
`;
        if (item.modifiers.length > 0) {
          detail += "\n\uD6A8\uACFC:\n";
          for (const mod of item.modifiers) {
            detail += `  ${mod.stat}: ${mod.value > 0 ? "+" : ""}${mod.value}
`;
          }
        }
        this.infoBox.setContent(detail);
        this.screen.render();
      }
    });
    this.subMenu.on("select", (_item, idx) => {
      if (idx < allItems.length) {
        const item = allItems[idx];
        const state = this.store.getState();
        if (state.gold >= item.value) {
          this.store.dispatch({ type: "BUY_ITEM", item });
          this.infoBox.setContent(`{green-fg}${item.name}\uC744(\uB97C) \uAD6C\uB9E4\uD588\uC2B5\uB2C8\uB2E4!{/green-fg}

\uB0A8\uC740 \uACE8\uB4DC: ${this.store.getState().gold}`);
        } else {
          this.infoBox.setContent("{red-fg}\uACE8\uB4DC\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4!{/red-fg}");
        }
        this.screen.render();
      } else {
        this.clearSubMenu();
        this.mainMenu.focus();
        this.screen.render();
      }
    });
    this.subMenu.key(["escape"], () => {
      this.clearSubMenu();
      this.mainMenu.focus();
      this.screen.render();
    });
    this.screen.render();
  }
  showTowerMenu() {
    this.clearSubMenu();
    const state = this.store.getState();
    const partyCount = state.party.filter((h) => h !== null).length;
    if (partyCount === 0) {
      this.infoBox.setContent("{red-fg}\uD30C\uD2F0\uC5D0 \uC601\uC6C5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4!{/red-fg}\n\n\uD30C\uD2F0 \uD3B8\uC131\uC5D0\uC11C\n\uC601\uC6C5\uC744 \uBC30\uCE58\uD558\uC138\uC694.");
      this.screen.render();
      return;
    }
    const items = ["\uD55C\uBC88 \uB3C4\uC804", "\uC5F0\uC18D \uB3C4\uC804 (\uC790\uB3D9 \uBC18\uBCF5)", "\uB3CC\uC544\uAC00\uAE30"];
    this.subMenu = blessed3.list({
      top: "center",
      left: "center",
      width: 30,
      height: items.length + 2,
      label: " \uC5B4\uB460\uC758 \uD0D1 ",
      items,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "red" },
        selected: { fg: "black", bg: "red", bold: true },
        label: { fg: "red" }
      }
    });
    this.addWidget(this.subMenu);
    this.subMenu.focus();
    this.subMenu.on("select item", (_el, idx) => {
      if (idx === 0) {
        this.infoBox.setContent(`{red-fg}{bold}\uC5B4\uB460\uC758 \uD0D1{/bold}{/red-fg}

100\uCE35\uC758 \uD0D1\uC5D0 \uB3C4\uC804\uD569\uB2C8\uB2E4.
1\uCE35\uBD80\uD130 \uC2DC\uC791\uD569\uB2C8\uB2E4.

{magenta-fg}\uCD5C\uACE0 \uAE30\uB85D: ${state.maxFloorReached}\uCE35{/magenta-fg}

10\uCE35\uB9C8\uB2E4 \uBCF4\uC2A4 \uCD9C\uD604!`);
      } else if (idx === 1) {
        this.infoBox.setContent(`{red-fg}{bold}\uC5F0\uC18D \uB3C4\uC804{/bold}{/red-fg}

\uD0D1 \uD074\uB9AC\uC5B4 \uD6C4
\uC790\uB3D9\uC73C\uB85C \uB2E4\uC2DC \uB3C4\uC804\uD569\uB2C8\uB2E4.

\uD30C\uD2F0 \uD68C\uBCF5 \uD6C4 \uC7AC\uC785\uC7A5
HP \uC704\uD5D8\uC2DC \uC790\uB3D9 \uC911\uC9C0`);
      }
      this.screen.render();
    });
    this.subMenu.on("select", (_item, idx) => {
      this.clearSubMenu();
      if (idx === 0 || idx === 1) {
        if (idx === 1) {
          this.store.dispatch({ type: "SET_CONTINUOUS_RUN", enabled: true });
        } else {
          this.store.dispatch({ type: "SET_CONTINUOUS_RUN", enabled: false });
        }
        this.store.dispatch({ type: "ENTER_TOWER" });
      } else {
        this.mainMenu.focus();
        this.screen.render();
      }
    });
    this.subMenu.key(["escape"], () => {
      this.clearSubMenu();
      this.mainMenu.focus();
      this.screen.render();
    });
    this.screen.render();
  }
  showPrestigeShop() {
    this.clearSubMenu();
    const state = this.store.getState();
    const upgradeLabels = PRESTIGE_UPGRADES.map((u) => {
      const owned = state.prestige.purchased.includes(u.id);
      const canBuy = canBuyUpgrade(state.prestige, u);
      if (owned) return `{green-fg}[\uAD6C\uB9E4\uC644\uB8CC] ${u.name}{/green-fg}`;
      if (!canBuy && u.requires && !state.prestige.purchased.includes(u.requires)) {
        return `{gray-fg}[\uC7A0\uAE40] ${u.name} (${u.cost}P){/gray-fg}`;
      }
      return `${u.name} (${u.cost}P)`;
    });
    upgradeLabels.push("\uB3CC\uC544\uAC00\uAE30");
    this.subMenu = blessed3.list({
      top: "center",
      left: "center",
      width: 45,
      height: Math.min(upgradeLabels.length + 2, 16),
      label: ` \uBA85\uC131 \uC0C1\uC810 (\uBCF4\uC720: ${state.prestige.points}P) `,
      items: upgradeLabels,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      scrollable: true,
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "yellow" },
        selected: { fg: "black", bg: "yellow", bold: true },
        label: { fg: "yellow" }
      }
    });
    this.addWidget(this.subMenu);
    this.subMenu.focus();
    this.subMenu.on("select item", (_el, idx) => {
      if (idx < PRESTIGE_UPGRADES.length) {
        const u = PRESTIGE_UPGRADES[idx];
        const owned = state.prestige.purchased.includes(u.id);
        let detail = `{yellow-fg}${u.name}{/yellow-fg}

${u.description}

\uBE44\uC6A9: ${u.cost}P
`;
        if (u.requires) detail += `\uD544\uC694: ${PRESTIGE_UPGRADES.find((p) => p.id === u.requires)?.name}
`;
        if (owned) detail += "\n{green-fg}\uC774\uBBF8 \uAD6C\uB9E4\uD588\uC2B5\uB2C8\uB2E4.{/green-fg}";
        this.infoBox.setContent(detail);
        this.screen.render();
      }
    });
    this.subMenu.on("select", (_item, idx) => {
      if (idx < PRESTIGE_UPGRADES.length) {
        const u = PRESTIGE_UPGRADES[idx];
        const currentState = this.store.getState();
        if (canBuyUpgrade(currentState.prestige, u)) {
          this.store.dispatch({ type: "BUY_PRESTIGE_UPGRADE", upgradeId: u.id });
          savePrestige(this.store.getState().prestige);
          this.infoBox.setContent(`{green-fg}${u.name}\uC744(\uB97C) \uAD6C\uB9E4\uD588\uC2B5\uB2C8\uB2E4!{/green-fg}

\uB0A8\uC740 \uBA85\uC131: ${this.store.getState().prestige.points}P`);
          this.clearSubMenu();
          this.showPrestigeShop();
        } else if (currentState.prestige.purchased.includes(u.id)) {
          this.infoBox.setContent("{yellow-fg}\uC774\uBBF8 \uAD6C\uB9E4\uD55C \uC5C5\uADF8\uB808\uC774\uB4DC\uC785\uB2C8\uB2E4.{/yellow-fg}");
        } else if (currentState.prestige.points < u.cost) {
          this.infoBox.setContent("{red-fg}\uBA85\uC131 \uD3EC\uC778\uD2B8\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4!{/red-fg}");
        } else {
          this.infoBox.setContent("{red-fg}\uC120\uD589 \uC5C5\uADF8\uB808\uC774\uB4DC\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4!{/red-fg}");
        }
        this.screen.render();
      } else {
        this.clearSubMenu();
        this.mainMenu.focus();
        this.screen.render();
      }
    });
    this.subMenu.key(["escape"], () => {
      this.clearSubMenu();
      this.mainMenu.focus();
      this.screen.render();
    });
    this.screen.render();
  }
  showHeroDetailMenu() {
    this.clearSubMenu();
    const state = this.store.getState();
    if (state.roster.length === 0) {
      this.infoBox.setContent("{red-fg}\uC601\uC6C5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4!{/red-fg}\n\n\uC601\uC6C5\uC744 \uBAA8\uC9D1\uD558\uC138\uC694.");
      this.screen.render();
      return;
    }
    const heroLabels = state.roster.map((h) => {
      const stars = getStars(h.rarity);
      return `${stars} ${h.name} (${getClassName(h.class)}) Lv.${h.level}`;
    });
    heroLabels.push("\uB3CC\uC544\uAC00\uAE30");
    this.subMenu = blessed3.list({
      top: "center",
      left: "center",
      width: 40,
      height: Math.min(heroLabels.length + 2, 16),
      label: " \uC601\uC6C5 \uC120\uD0DD ",
      items: heroLabels,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      scrollable: true,
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "cyan" },
        selected: { fg: "black", bg: "cyan", bold: true },
        label: { fg: "cyan" }
      }
    });
    this.addWidget(this.subMenu);
    this.subMenu.focus();
    this.subMenu.on("select", (_item, idx) => {
      if (idx < state.roster.length) {
        const hero = state.roster[idx];
        this.store.dispatch({ type: "SET_SELECTED_HERO", heroId: hero.id });
        this.store.dispatch({ type: "NAVIGATE", screen: "hero_detail" });
      } else {
        this.clearSubMenu();
        this.mainMenu.focus();
        this.screen.render();
      }
    });
    this.subMenu.key(["escape"], () => {
      this.clearSubMenu();
      this.mainMenu.focus();
      this.screen.render();
    });
    this.screen.render();
  }
  saveGame() {
    const success = this.store.saveGame();
    if (success) {
      this.infoBox.setContent("{green-fg}\uAC8C\uC784\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4!{/green-fg}");
    } else {
      this.infoBox.setContent("{red-fg}\uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.{/red-fg}");
    }
    this.screen.render();
  }
};

// src/screens/PartySelectScreen.ts
import blessed4 from "blessed";
var PartySelectScreen = class extends BaseScreen {
  availableList;
  partyList;
  statsBox;
  focusedPanel = "available";
  swapMode = false;
  swapFirst = -1;
  render() {
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      style: { bg: "black" }
    });
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: 3,
      content: "{bold}{yellow-fg} \uD30C\uD2F0 \uD3B8\uC131{/yellow-fg}{/bold}  |  {gray-fg}\u2190\u2192: \uD328\uB110 \uC804\uD658  Enter: \uC120\uD0DD  S: \uAD50\uD658  Esc: \uB3CC\uC544\uAC00\uAE30{/gray-fg}",
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "gray" } }
    });
    this.availableList = blessed4.list({
      top: 3,
      left: 0,
      width: "35%",
      height: "60%",
      label: " \uB300\uAE30 \uC601\uC6C5 ",
      items: [],
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      scrollable: true,
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "yellow" },
        selected: { fg: "black", bg: "yellow", bold: true },
        label: { fg: "yellow" }
      }
    });
    this.addWidget(this.availableList);
    this.partyList = blessed4.list({
      top: 3,
      left: "35%",
      width: "35%",
      height: "60%",
      label: " \uD30C\uD2F0 \uBC30\uCE58 ",
      items: [],
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "gray" },
        selected: { fg: "black", bg: "cyan", bold: true },
        label: { fg: "cyan" }
      }
    });
    this.addWidget(this.partyList);
    this.statsBox = this.createBox({
      top: 3,
      left: "70%",
      width: "30%",
      height: "60%",
      label: " \uC601\uC6C5 \uC815\uBCF4 ",
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "gray" }, label: { fg: "gray" } },
      content: "{gray-fg}\uC601\uC6C5\uC744 \uC120\uD0DD\uD558\uC138\uC694.{/gray-fg}"
    });
    this.createBox({
      bottom: 0,
      left: 0,
      width: "100%",
      height: 3,
      content: "{gray-fg}\u2190\u2192: \uD328\uB110 \uC804\uD658  \u2191\u2193: \uC120\uD0DD  Enter: \uCD94\uAC00/\uC81C\uAC70  S: \uC704\uCE58 \uAD50\uD658  1-6: \uC704\uCE58 \uAD50\uD658  Esc: \uB9C8\uC744\uB85C{/gray-fg}",
      tags: true,
      border: { type: "line" },
      style: { fg: "gray", bg: "black", border: { fg: "gray" } },
      align: "center"
    });
    this.updateLists();
    this.setupKeys();
    this.setFocus("available");
    this.screen.render();
  }
  getAvailableHeroes() {
    const state = this.store.getState();
    const partyIds = new Set(state.party.filter((h) => h !== null).map((h) => h.id));
    return state.roster.filter((h) => !partyIds.has(h.id));
  }
  updateLists() {
    const available = this.getAvailableHeroes();
    const state = this.store.getState();
    const availItems = available.map((h) => `${getStars(h.rarity)} ${getClassName(h.class)} - ${h.name} (Lv${h.level})`);
    if (availItems.length === 0) availItems.push("{gray-fg}(\uB300\uAE30 \uC601\uC6C5 \uC5C6\uC74C){/gray-fg}");
    this.availableList.setItems(availItems);
    const partyItems = [];
    for (let i = 0; i < 6; i++) {
      const hero = state.party[i];
      const col = Math.floor(i / 3) + 1;
      const row = i % 3 + 1;
      const colLabel = col === 1 ? "\uC804\uC5F4" : col === 2 ? "\uC911\uC5F4" : "\uD6C4\uC5F4";
      const posTag = `${colLabel}${row}`;
      if (hero) {
        const hpPct = hero.stats.hp / hero.stats.maxHp;
        const hpColor = hpPct > 0.5 ? "green" : hpPct > 0.25 ? "yellow" : "red";
        const mcTag = hero.isMainCharacter ? "[\uC8FC\uC778\uACF5] " : "";
        partyItems.push(`[${i + 1}] ${posTag} ${mcTag}${getStars(hero.rarity)} ${getClassName(hero.class)} - ${hero.name}`);
      } else {
        partyItems.push(`[${i + 1}] ${posTag} --- \uBE48 \uC2AC\uB86F ---`);
      }
    }
    this.partyList.setItems(partyItems);
    this.screen.render();
  }
  showHeroStats(hero) {
    if (!hero) {
      this.statsBox.setContent("{gray-fg}\uC601\uC6C5\uC744 \uC120\uD0DD\uD558\uC138\uC694.{/gray-fg}");
      this.screen.render();
      return;
    }
    const hpBar = formatBar(hero.stats.hp, hero.stats.maxHp, 12);
    const hpColor = hero.stats.hp / hero.stats.maxHp > 0.5 ? "green" : hero.stats.hp / hero.stats.maxHp > 0.25 ? "yellow" : "red";
    const rec = RECOMMENDED_POSITIONS[hero.class];
    const isOptimalPos = rec.cols.includes(hero.position.col);
    let content = `{bold}{yellow-fg}${hero.name}{/yellow-fg}{/bold}
`;
    content += `{cyan-fg}${getClassName(hero.class)}{/cyan-fg} Lv.${hero.level}
`;
    content += `{cyan-fg}${rec.label}{/cyan-fg}
`;
    if (!isOptimalPos) {
      content += `{yellow-fg}! \uD604\uC7AC \uC704\uCE58${gridPosLabel(hero.position)}\uAC00 \uBE44\uCD94\uCC9C!{/yellow-fg}
`;
    }
    content += `
`;
    content += `HP  {${hpColor}-fg}${hpBar}{/${hpColor}-fg}
    ${hero.stats.hp}/${hero.stats.maxHp}
`;
    const expBar = formatBar(hero.exp, hero.expToLevel, 12);
    content += `EXP {cyan-fg}${expBar}{/cyan-fg}
    ${hero.exp}/${hero.expToLevel}

`;
    content += `{white-fg}\uACF5\uACA9:{/white-fg} ${hero.stats.attack}
`;
    content += `{white-fg}\uBC29\uC5B4:{/white-fg} ${hero.stats.defense}
`;
    content += `{white-fg}\uC18D\uB3C4:{/white-fg} ${hero.stats.speed}
`;
    content += `{white-fg}\uBA85\uC911:{/white-fg} ${hero.stats.accuracy}
`;
    content += `{white-fg}\uD68C\uD53C:{/white-fg} ${hero.stats.dodge}
`;
    content += `{white-fg}\uCE58\uBA85:{/white-fg} ${hero.stats.crit}%
`;
    if (hero.traits && hero.traits.length > 0) {
      content += "\n{yellow-fg}\uD2B9\uC131:{/yellow-fg}\n";
      for (const trait of hero.traits) {
        const color = getTraitCategoryColor(trait.category);
        content += `  {${color}-fg}${trait.name}{/${color}-fg}
`;
      }
    }
    if (hero.skills.length > 0) {
      content += "\n{yellow-fg}\uC2A4\uD0AC:{/yellow-fg}\n";
      for (const skill of hero.skills) {
        const canUse = skill.useCols.includes(hero.position.col);
        const skillColor = canUse ? "white" : "red";
        const useMark = canUse ? "+" : "x";
        content += `  {${skillColor}-fg}[${useMark}] ${skill.name}{/${skillColor}-fg}
`;
      }
    }
    this.statsBox.setContent(content);
    this.screen.render();
  }
  setFocus(panel) {
    this.focusedPanel = panel;
    if (panel === "available") {
      this.availableList.focus();
      this.availableList.style.border.fg = "yellow";
      this.partyList.style.border.fg = "gray";
    } else {
      this.partyList.focus();
      this.partyList.style.border.fg = "yellow";
      this.availableList.style.border.fg = "gray";
    }
    this.screen.render();
  }
  setupKeys() {
    this.registerKey(["left", "right"], () => {
      if (this.focusedPanel === "available") {
        this.setFocus("party");
      } else {
        this.setFocus("available");
      }
    });
    this.availableList.on("select", (_item, index) => {
      const available = this.getAvailableHeroes();
      if (index >= available.length) return;
      const hero = available[index];
      const state = this.store.getState();
      const emptySlot = state.party.findIndex((h) => h === null);
      if (emptySlot === -1) return;
      this.store.dispatch({ type: "ADD_TO_PARTY", heroId: hero.id, slotIndex: emptySlot });
      this.updateLists();
    });
    this.availableList.on("select item", (_el, index) => {
      const available = this.getAvailableHeroes();
      if (index < available.length) {
        this.showHeroStats(available[index]);
      }
    });
    this.partyList.on("select", (_item, index) => {
      if (this.swapMode) {
        if (this.swapFirst === -1) {
          this.swapFirst = index;
          this.statsBox.setContent("{yellow-fg}\uAD50\uD658\uD560 \uB450 \uBC88\uC9F8 \uC704\uCE58\uB97C \uC120\uD0DD\uD558\uC138\uC694...{/yellow-fg}");
          this.screen.render();
        } else {
          this.store.dispatch({ type: "SWAP_PARTY_POSITION", pos1: this.swapFirst, pos2: index });
          this.swapMode = false;
          this.swapFirst = -1;
          this.updateLists();
        }
        return;
      }
      const state = this.store.getState();
      const hero = state.party[index];
      if (hero) {
        if (hero.id === state.mainCharacterId) {
          this.statsBox.setContent("{red-fg}\uC8FC\uC778\uACF5\uC740 \uD30C\uD2F0\uC5D0\uC11C \uC81C\uAC70\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4!{/red-fg}");
          this.screen.render();
          return;
        }
        this.store.dispatch({ type: "REMOVE_FROM_PARTY", slotIndex: index });
        this.updateLists();
      }
    });
    this.partyList.on("select item", (_el, index) => {
      const state = this.store.getState();
      this.showHeroStats(state.party[index] || null);
    });
    this.registerKey(["1", "2", "3", "4", "5", "6"], (ch) => {
      if (this.focusedPanel !== "party") return;
      const targetPos = parseInt(ch) - 1;
      if (targetPos < 0 || targetPos >= 6) return;
      const currentPos = this.partyList.selected;
      if (targetPos === currentPos) return;
      this.store.dispatch({ type: "SWAP_PARTY_POSITION", pos1: currentPos, pos2: targetPos });
      this.updateLists();
    });
    this.registerKey(["s"], () => {
      if (this.focusedPanel === "party") {
        this.swapMode = true;
        this.swapFirst = -1;
        this.statsBox.setContent("{yellow-fg}\uAD50\uD658\uD560 \uCCAB \uBC88\uC9F8 \uC704\uCE58\uB97C \uC120\uD0DD\uD558\uC138\uC694...{/yellow-fg}\n\n{gray-fg}Esc: \uCDE8\uC18C{/gray-fg}");
        this.screen.render();
      }
    });
    this.registerKey(["escape"], () => {
      if (this.swapMode) {
        this.swapMode = false;
        this.swapFirst = -1;
        this.statsBox.setContent("{gray-fg}\uAD50\uD658 \uCDE8\uC18C{/gray-fg}");
        this.screen.render();
        return;
      }
      this.store.dispatch({ type: "NAVIGATE", screen: "town" });
    });
  }
};

// src/screens/DungeonScreen.ts
import blessed6 from "blessed";

// src/engine/monster-factory.ts
var MONSTER_TEMPLATES = {
  bone_soldier: {
    name: "\uD574\uACE8 \uBCD1\uC0AC",
    maxHp: 18,
    attack: 6,
    defense: 2,
    speed: 2,
    accuracy: 80,
    dodge: 5,
    crit: 3,
    isBoss: false,
    preferredCols: [1]
  },
  bone_archer: {
    name: "\uD574\uACE8 \uAD81\uC218",
    maxHp: 14,
    attack: 5,
    defense: 1,
    speed: 4,
    accuracy: 85,
    dodge: 10,
    crit: 6,
    isBoss: false,
    preferredCols: [3]
  },
  bone_captain: {
    name: "\uD574\uACE8 \uB300\uC7A5",
    maxHp: 30,
    attack: 8,
    defense: 4,
    speed: 3,
    accuracy: 85,
    dodge: 5,
    crit: 5,
    isBoss: true,
    preferredCols: [1]
  },
  cultist_brawler: {
    name: "\uAD11\uC2E0\uB3C4 \uD22C\uC0AC",
    maxHp: 20,
    attack: 7,
    defense: 2,
    speed: 3,
    accuracy: 82,
    dodge: 8,
    crit: 5,
    isBoss: false,
    preferredCols: [1]
  },
  cultist_acolyte: {
    name: "\uAD11\uC2E0\uB3C4 \uC218\uC2B5",
    maxHp: 16,
    attack: 4,
    defense: 1,
    speed: 5,
    accuracy: 85,
    dodge: 12,
    crit: 2,
    isBoss: false,
    preferredCols: [3]
  },
  madman: {
    name: "\uAD11\uC778",
    maxHp: 12,
    attack: 5,
    defense: 0,
    speed: 6,
    accuracy: 75,
    dodge: 15,
    crit: 5,
    isBoss: false,
    preferredCols: [2]
  },
  large_carrion_eater: {
    name: "\uAC70\uB300 \uC2DC\uCCB4 \uD3EC\uC2DD\uC790",
    maxHp: 35,
    attack: 9,
    defense: 3,
    speed: 1,
    accuracy: 80,
    dodge: 0,
    crit: 3,
    isBoss: true,
    preferredCols: [1]
  },
  necromancer: {
    name: "\uC0AC\uB839\uC220\uC0AC",
    maxHp: 40,
    attack: 7,
    defense: 2,
    speed: 5,
    accuracy: 90,
    dodge: 10,
    crit: 4,
    isBoss: true,
    preferredCols: [3]
  },
  shadow_lurker: {
    name: "\uADF8\uB9BC\uC790 \uC7A0\uBCF5\uC790",
    maxHp: 16,
    attack: 6,
    defense: 0,
    speed: 8,
    accuracy: 88,
    dodge: 25,
    crit: 8,
    isBoss: false,
    preferredCols: [1, 2]
  },
  plague_rat: {
    name: "\uC5ED\uBCD1 \uC950",
    maxHp: 10,
    attack: 3,
    defense: 0,
    speed: 5,
    accuracy: 78,
    dodge: 12,
    crit: 3,
    isBoss: false,
    preferredCols: [1]
  },
  cursed_knight: {
    name: "\uC800\uC8FC\uBC1B\uC740 \uAE30\uC0AC",
    maxHp: 28,
    attack: 8,
    defense: 4,
    speed: 1,
    accuracy: 82,
    dodge: 3,
    crit: 4,
    isBoss: false,
    preferredCols: [1]
  },
  dark_mage: {
    name: "\uC554\uD751 \uB9C8\uBC95\uC0AC",
    maxHp: 18,
    attack: 7,
    defense: 0,
    speed: 5,
    accuracy: 88,
    dodge: 10,
    crit: 4,
    isBoss: false,
    preferredCols: [3]
  },
  gargoyle: {
    name: "\uAC00\uACE0\uC77C",
    maxHp: 25,
    attack: 6,
    defense: 5,
    speed: 2,
    accuracy: 78,
    dodge: 3,
    crit: 3,
    isBoss: false,
    preferredCols: [1]
  },
  wraith: {
    name: "\uB9DD\uB839",
    maxHp: 20,
    attack: 5,
    defense: 0,
    speed: 6,
    accuracy: 90,
    dodge: 15,
    crit: 5,
    isBoss: false,
    preferredCols: [2]
  },
  frost_titan: {
    name: "\uC11C\uB9AC \uAC70\uC778",
    maxHp: 55,
    attack: 10,
    defense: 5,
    speed: 2,
    accuracy: 82,
    dodge: 3,
    crit: 4,
    isBoss: true,
    preferredCols: [1]
  },
  flame_demon: {
    name: "\uD654\uC5FC \uC545\uB9C8",
    maxHp: 50,
    attack: 12,
    defense: 3,
    speed: 6,
    accuracy: 88,
    dodge: 10,
    crit: 6,
    isBoss: true,
    preferredCols: [1]
  },
  void_lord: {
    name: "\uACF5\uD5C8\uC758 \uAD70\uC8FC",
    maxHp: 70,
    attack: 11,
    defense: 4,
    speed: 5,
    accuracy: 90,
    dodge: 8,
    crit: 5,
    isBoss: true,
    preferredCols: [2]
  }
};
function createMonster(type, position) {
  const template = MONSTER_TEMPLATES[type];
  return {
    id: generateId(),
    name: template.name,
    type,
    stats: {
      maxHp: template.maxHp,
      hp: template.maxHp,
      attack: template.attack,
      defense: template.defense,
      speed: template.speed,
      accuracy: template.accuracy,
      dodge: template.dodge,
      crit: template.crit
    },
    skills: MONSTER_SKILLS[type].map((s) => ({ ...s })),
    position,
    size: "small",
    statusEffects: [],
    isBoss: template.isBoss
  };
}
function createMonsterScaled(type, position, statMultiplier) {
  const monster = createMonster(type, position);
  const m = statMultiplier;
  monster.stats.maxHp = Math.round(monster.stats.maxHp * m);
  monster.stats.hp = monster.stats.maxHp;
  monster.stats.attack = Math.round(monster.stats.attack * m);
  monster.stats.defense = Math.round(monster.stats.defense * m);
  return monster;
}
function createMonsterGroupScaled(types, statMultiplier) {
  const placed = [];
  return types.map((t) => {
    const template = MONSTER_TEMPLATES[t];
    const pos = findEmptyGridCell(placed, template.preferredCols) || { row: 1, col: 1 };
    const m = createMonsterScaled(t, pos, statMultiplier);
    placed.push(m);
    return m;
  });
}

// src/engine/auto-explorer.ts
import { Path } from "rot-js";
function findNextTarget(floorMap) {
  const { tiles, playerX, playerY, exitX, exitY, width, height } = floorMap;
  const eventTypes = ["combat", "treasure", "trap", "curio", "boss"];
  let closestEvent = null;
  let closestEventDist = Infinity;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = tiles[y][x];
      if (tile.visible && !tile.cleared && eventTypes.includes(tile.type)) {
        const dist = Math.abs(x - playerX) + Math.abs(y - playerY);
        if (dist > 0 && dist < closestEventDist) {
          closestEventDist = dist;
          closestEvent = { x, y, type: "event" };
        }
      }
    }
  }
  if (closestEvent) return closestEvent;
  let closestUnexplored = null;
  let closestUnexploredDist = Infinity;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = tiles[y][x];
      if (!tile.explored && tile.type !== "wall") {
        const dist = Math.abs(x - playerX) + Math.abs(y - playerY);
        if (dist > 0 && dist < closestUnexploredDist) {
          closestUnexploredDist = dist;
          closestUnexplored = { x, y, type: "unexplored" };
        }
      }
    }
  }
  if (!closestUnexplored) {
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tiles[y][x];
        if (tile.explored && tile.type !== "wall") {
          for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (!tiles[ny][nx].explored) {
                const dist = Math.abs(x - playerX) + Math.abs(y - playerY);
                if (dist > 0 && dist < closestUnexploredDist) {
                  closestUnexploredDist = dist;
                  closestUnexplored = { x, y, type: "unexplored" };
                }
              }
            }
          }
        }
      }
    }
  }
  if (closestUnexplored) return closestUnexplored;
  if (playerX !== exitX || playerY !== exitY) {
    return { x: exitX, y: exitY, type: "exit" };
  }
  return null;
}
function computePath(floorMap, targetX, targetY) {
  const { tiles, playerX, playerY, width, height } = floorMap;
  const passableCallback = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const tile = tiles[y][x];
    return tile.type !== "wall";
  };
  const astar = new Path.AStar(targetX, targetY, passableCallback, { topology: 4 });
  const path = [];
  astar.compute(playerX, playerY, (x, y) => {
    path.push([x, y]);
  });
  if (path.length > 0) {
    path.shift();
  }
  return path;
}

// src/engine/loot-generator.ts
function generateCombatLoot(floor) {
  let gold = 30 + floor * 8 + randomInt(0, 50);
  const items = [];
  const itemRolls = randomInt(1, 3);
  let rarityBonus = 0;
  if (floor > 50) rarityBonus = 20;
  else if (floor > 20) rarityBonus = 10;
  const totalBonus = rarityBonus;
  for (let i = 0; i < itemRolls; i++) {
    const roll = randomInt(1, 100);
    if (roll <= 5 + totalBonus) {
      const pool = [...SHOP_WEAPONS.filter((w) => w.rarity === "rare"), ...SHOP_ARMOR.filter((a) => a.rarity === "rare"), ...SHOP_TRINKETS.filter((t) => t.rarity === "rare")];
      if (pool.length > 0) {
        items.push(createItemCopy(randomChoice(pool)));
      }
    } else if (roll <= 20 + totalBonus) {
      const pool = [...SHOP_WEAPONS.filter((w) => w.rarity === "uncommon"), ...SHOP_ARMOR.filter((a) => a.rarity === "uncommon"), ...SHOP_TRINKETS.filter((t) => t.rarity === "uncommon")];
      if (pool.length > 0) {
        items.push(createItemCopy(randomChoice(pool)));
      }
    } else if (roll <= 50) {
      items.push(createItemCopy(randomChoice(SUPPLY_ITEMS)));
    } else if (roll <= 65) {
      items.push(createItemCopy(randomChoice(POTION_ITEMS)));
    }
  }
  return { items, gold };
}
function generateBossLoot(floor) {
  const gold = floor * 25 + randomInt(100, 300);
  const items = [];
  const legendaryPool = SHOP_TRINKETS.filter((t) => t.rarity === "legendary");
  const rarePool = [
    ...SHOP_WEAPONS.filter((w) => w.rarity === "rare"),
    ...SHOP_ARMOR.filter((a) => a.rarity === "rare"),
    ...SHOP_TRINKETS.filter((t) => t.rarity === "rare")
  ];
  const legendaryChance = Math.min(50, 20 + Math.floor(floor / 5));
  if (percentChance(legendaryChance) && legendaryPool.length > 0) {
    items.push(createItemCopy(randomChoice(legendaryPool)));
  } else if (rarePool.length > 0) {
    items.push(createItemCopy(randomChoice(rarePool)));
  }
  const extraRolls = randomInt(1, 2);
  for (let i = 0; i < extraRolls; i++) {
    const roll = randomInt(1, 100);
    if (roll <= 30) {
      if (rarePool.length > 0) items.push(createItemCopy(randomChoice(rarePool)));
    } else if (roll <= 70) {
      const uncommonPool = [
        ...SHOP_WEAPONS.filter((w) => w.rarity === "uncommon"),
        ...SHOP_ARMOR.filter((a) => a.rarity === "uncommon"),
        ...SHOP_TRINKETS.filter((t) => t.rarity === "uncommon")
      ];
      if (uncommonPool.length > 0) items.push(createItemCopy(randomChoice(uncommonPool)));
    } else {
      if (percentChance(50)) {
        items.push(createItemCopy(randomChoice(POTION_ITEMS)));
      } else {
        items.push(createItemCopy(randomChoice(SUPPLY_ITEMS)));
      }
    }
  }
  return { items, gold };
}
function generateTreasureLoot(floor) {
  const gold = 30 + floor * 10 + randomInt(50, 150);
  const items = [];
  const itemCount = randomInt(1, 3);
  for (let i = 0; i < itemCount; i++) {
    const roll = randomInt(1, 100);
    if (roll <= 10) {
      const legendaryPool = SHOP_TRINKETS.filter((t) => t.rarity === "legendary");
      const rarePool = [...SHOP_WEAPONS.filter((w) => w.rarity === "rare"), ...SHOP_ARMOR.filter((a) => a.rarity === "rare"), ...SHOP_TRINKETS.filter((t) => t.rarity === "rare")];
      const pool = roll <= 3 && legendaryPool.length > 0 ? legendaryPool : rarePool;
      if (pool.length > 0) {
        items.push(createItemCopy(randomChoice(pool)));
      }
    } else if (roll <= 35) {
      const pool = [...SHOP_WEAPONS.filter((w) => w.rarity === "uncommon"), ...SHOP_ARMOR.filter((a) => a.rarity === "uncommon"), ...SHOP_TRINKETS.filter((t) => t.rarity === "uncommon")];
      if (pool.length > 0) {
        items.push(createItemCopy(randomChoice(pool)));
      }
    } else if (roll <= 60) {
      const pool = [...SHOP_WEAPONS.filter((w) => w.rarity === "common"), ...SHOP_ARMOR.filter((a) => a.rarity === "common")];
      if (pool.length > 0) {
        items.push(createItemCopy(randomChoice(pool)));
      }
    } else if (roll <= 80) {
      items.push(createItemCopy(randomChoice(SUPPLY_ITEMS)));
    } else {
      items.push(createItemCopy(randomChoice(POTION_ITEMS)));
    }
  }
  return { items, gold };
}

// src/ui/LootPopup.ts
import blessed5 from "blessed";
var RARITY_COLORS = {
  common: "white",
  uncommon: "green",
  rare: "blue",
  legendary: "yellow"
};
var RARITY_NAMES = {
  common: "\uC77C\uBC18",
  uncommon: "\uACE0\uAE09",
  rare: "\uD76C\uADC0",
  legendary: "\uC804\uC124"
};
var TYPE_LABELS = {
  weapon: "{red-fg}[\uBB34\uAE30]{/red-fg}",
  armor: "{blue-fg}[\uBC29\uC5B4]{/blue-fg}",
  trinket: "{magenta-fg}[\uC7A5\uC2E0]{/magenta-fg}",
  supply: "{green-fg}[\uBCF4\uAE09]{/green-fg}",
  potion: "{#ff88ff-fg}[\uBB3C\uC57D]{/#ff88ff-fg}"
};
function showLootPopup(screen, item, party, inventoryCount, onDecision) {
  const widgets = [];
  let active = true;
  let resolved = false;
  const isEquipment = item.type === "weapon" || item.type === "armor" || item.type === "trinket";
  const isConsumable = item.consumable === true;
  const inventoryFull = inventoryCount >= 16;
  const rColor = RARITY_COLORS[item.rarity] || "white";
  const rName = RARITY_NAMES[item.rarity] || "???";
  const typeLabel = TYPE_LABELS[item.type] || "[???]";
  let info = `  ${typeLabel} {${rColor}-fg}{bold}${item.name}{/bold}{/${rColor}-fg}  ({${rColor}-fg}${rName}{/${rColor}-fg})
`;
  info += `  {gray-fg}${item.description}{/gray-fg}

`;
  if (item.modifiers.length > 0) {
    const modText = item.modifiers.map((m) => {
      const sign = m.value > 0 ? "+" : "";
      return `${m.stat}: ${sign}${m.value}`;
    }).join("  ");
    info += `  {cyan-fg}${modText}{/cyan-fg}
`;
  }
  if (item.healAmount) info += `  {green-fg}HP \uD68C\uBCF5: ${item.healAmount}{/green-fg}
`;
  if (item.buffEffect) info += `  {yellow-fg}\uBC84\uD504: ${item.buffEffect.stat} +${item.buffEffect.value} (${item.buffEffect.duration}\uD134){/yellow-fg}
`;
  info += `  {yellow-fg}\uAC00\uCE58: ${item.value}G{/yellow-fg}
`;
  info += `
  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
`;
  if (isEquipment) {
    info += `  {bold}1{/bold}: \uC7A5\uCC29 (\uC601\uC6C5 \uC120\uD0DD)
`;
  } else if (isConsumable) {
    info += `  {bold}1{/bold}: \uC0AC\uC6A9 (\uC601\uC6C5 \uC120\uD0DD)
`;
  }
  if (inventoryFull) {
    info += `  {gray-fg}2: \uBCF4\uAD00 (${inventoryCount}/16 \uAC00\uB4DD!){/gray-fg}
`;
  } else {
    info += `  {bold}2{/bold}: \uBCF4\uAD00 (${inventoryCount}/16)
`;
  }
  info += `  {bold}3{/bold}: \uBC84\uB9AC\uAE30
`;
  const popupHeight = 18;
  const popupWidth = 50;
  const popup = blessed5.box({
    top: "center",
    left: "center",
    width: popupWidth,
    height: popupHeight,
    label: ` {bold}{yellow-fg}\uC544\uC774\uD15C \uD68D\uB4DD!{/yellow-fg}{/bold} `,
    content: info,
    tags: true,
    border: { type: "line" },
    style: {
      fg: "white",
      bg: "black",
      border: { fg: rColor },
      label: { fg: "yellow" }
    }
  });
  screen.append(popup);
  widgets.push(popup);
  popup.focus();
  screen.render();
  let heroSelectBox = null;
  const cleanup = () => {
    active = false;
    if (heroSelectBox) {
      heroSelectBox.destroy();
      heroSelectBox = null;
    }
    for (const w of widgets) {
      w.destroy();
    }
    widgets.length = 0;
  };
  const resolve = (decision, heroId) => {
    if (resolved) return;
    resolved = true;
    screen.removeListener("keypress", handleKey);
    cleanup();
    onDecision(decision, heroId);
  };
  const showHeroSelect = (action) => {
    const aliveHeroes = party.filter((h) => h !== null && h.stats.hp > 0);
    if (aliveHeroes.length === 0) return;
    const heroLabels = aliveHeroes.map((h) => {
      if (action === "equip") {
        let equipped;
        if (item.type === "weapon") equipped = h.equipment.weapon;
        else if (item.type === "armor") equipped = h.equipment.armor;
        else if (item.type === "trinket") {
          if (!h.equipment.trinket1) equipped = void 0;
          else if (!h.equipment.trinket2) equipped = void 0;
          else equipped = h.equipment.trinket1;
        }
        const currentStr = equipped ? equipped.name : "\uC5C6\uC74C";
        const comparison = formatEquipComparison(item, equipped);
        const compStr = comparison ? ` ${comparison}` : "";
        return `${h.name} (${getClassName(h.class)}) ${currentStr} \u2192 ${item.name}${compStr}`;
      } else {
        return `${h.name} (${getClassName(h.class)}) HP ${h.stats.hp}/${h.stats.maxHp}`;
      }
    });
    heroSelectBox = blessed5.list({
      top: "center",
      left: "center",
      width: 64,
      height: Math.min(aliveHeroes.length + 2, 10),
      label: action === "equip" ? " \uC7A5\uCC29 \uB300\uC0C1 " : " \uC0AC\uC6A9 \uB300\uC0C1 ",
      items: heroLabels,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "cyan" },
        selected: { fg: "black", bg: "cyan", bold: true },
        label: { fg: "cyan" }
      }
    });
    screen.append(heroSelectBox);
    heroSelectBox.focus();
    screen.render();
    heroSelectBox.on("select", (_el, idx) => {
      if (idx >= aliveHeroes.length) return;
      const hero = aliveHeroes[idx];
      resolve(action, hero.id);
    });
    heroSelectBox.key(["escape"], () => {
      if (heroSelectBox) {
        heroSelectBox.destroy();
        heroSelectBox = null;
        popup.focus();
        screen.render();
      }
    });
  };
  const handleKey = (ch, _key) => {
    if (resolved) return;
    if (heroSelectBox) return;
    if (ch === "1") {
      if (isEquipment) {
        showHeroSelect("equip");
      } else if (isConsumable) {
        showHeroSelect("use");
      }
    } else if (ch === "2") {
      if (!inventoryFull) {
        resolve("store");
      }
    } else if (ch === "3") {
      resolve("discard");
    }
  };
  screen.on("keypress", handleKey);
  const result = {
    active,
    destroy: () => {
      screen.removeListener("keypress", handleKey);
      cleanup();
    }
  };
  Object.defineProperty(result, "active", {
    get: () => active
  });
  return result;
}

// src/data/curio-events.ts
var CURIO_EVENTS = [
  {
    id: "altar",
    title: "\uC218\uC0C1\uD55C \uC81C\uB2E8",
    description: "\uC5B4\uB460 \uC18D\uC5D0\uC11C \uD76C\uBBF8\uD558\uAC8C \uBE5B\uB098\uB294 \uC81C\uB2E8\uC774 \uC788\uB2E4.",
    choices: [
      {
        text: "\uAE30\uB3C4\uD558\uAE30",
        outcomes: [
          { description: "\uD3C9\uC628\uD568\uC774 \uBC00\uB824\uC628\uB2E4.", weight: 60 },
          { description: "\uC800\uC8FC\uAC00 \uB418\uB3CC\uC544\uC654\uB2E4!", weight: 40 }
        ]
      },
      {
        text: "\uBD80\uC218\uAE30",
        outcomes: [
          { description: "\uBCF4\uC11D\uC774 \uC3DF\uC544\uC9C4\uB2E4!", goldChange: 50, weight: 50 },
          { description: "\uD568\uC815\uC774 \uBC1C\uB3D9\uD588\uB2E4!", hpChange: -8, weight: 50 }
        ]
      },
      {
        text: "\uBB34\uC2DC\uD558\uAE30",
        outcomes: [
          { description: "\uC870\uC2EC\uC2A4\uB7FD\uAC8C \uC9C0\uB098\uCCE4\uB2E4.", weight: 100 }
        ]
      }
    ]
  },
  {
    id: "bookshelf",
    title: "\uBA3C\uC9C0 \uC313\uC778 \uCC45\uC7A5",
    description: "\uC624\uB798\uB41C \uCC45\uB4E4\uC774 \uAC00\uB4DD\uD55C \uCC45\uC7A5\uC774 \uC788\uB2E4.",
    choices: [
      {
        text: "\uC77D\uAE30",
        outcomes: [
          { description: "\uC9C0\uD61C\uB97C \uC5BB\uC5C8\uB2E4. \uB9C8\uC74C\uC774 \uD3B8\uC548\uD574\uC9C4\uB2E4.", weight: 55 },
          { description: "\uAE08\uC11C\uC600\uB2E4! \uC815\uC2E0\uC774 \uD63C\uB780\uD574\uC9C4\uB2E4.", weight: 45 }
        ]
      },
      {
        text: "\uB4A4\uC9C0\uAE30",
        outcomes: [
          { description: "\uCC45 \uC0AC\uC774\uC5D0 \uAE08\uD654\uAC00 \uC788\uC5C8\uB2E4!", goldChange: 30, weight: 55 },
          { description: "\uB3C5\uCE68 \uD568\uC815\uC774 \uBC1C\uB3D9!", hpChange: -6, weight: 45 }
        ]
      },
      {
        text: "\uBB34\uC2DC\uD558\uAE30",
        outcomes: [
          { description: "\uC9C0\uB098\uCCE4\uB2E4.", weight: 100 }
        ]
      }
    ]
  },
  {
    id: "fountain",
    title: "\uC2E0\uBE44\uB85C\uC6B4 \uBD84\uC218\uB300",
    description: "\uB9D1\uC740 \uBB3C\uC774 \uC19F\uC544\uC624\uB974\uB294 \uBD84\uC218\uB300\uB2E4.",
    choices: [
      {
        text: "\uB9C8\uC2DC\uAE30",
        outcomes: [
          { description: "\uC0C1\uCC98\uAC00 \uCE58\uC720\uB41C\uB2E4!", hpChange: 8, weight: 60 },
          { description: "\uB3C5\uC774 \uC11E\uC5EC \uC788\uC5C8\uB2E4!", hpChange: -5, weight: 40 }
        ]
      },
      {
        text: "\uB3D9\uC804 \uB358\uC9C0\uAE30",
        outcomes: [
          { description: "\uD589\uC6B4\uC758 \uBE5B\uC774 \uAC10\uB3C8\uB2E4.", goldChange: 40, weight: 50 },
          { description: "\uC544\uBB34 \uC77C\uB3C4 \uC77C\uC5B4\uB098\uC9C0 \uC54A\uC558\uB2E4.", goldChange: -10, weight: 50 }
        ]
      },
      {
        text: "\uBB34\uC2DC\uD558\uAE30",
        outcomes: [
          { description: "\uC870\uC2EC\uC2A4\uB7FD\uAC8C \uC9C0\uB098\uCCE4\uB2E4.", weight: 100 }
        ]
      }
    ]
  },
  {
    id: "corpse",
    title: "\uD0D0\uD5D8\uAC00\uC758 \uC2DC\uCCB4",
    description: "\uC774\uC804 \uD0D0\uD5D8\uAC00\uC758 \uC2DC\uCCB4\uAC00 \uC788\uB2E4. \uC18C\uC9C0\uD488\uC774 \uBCF4\uC778\uB2E4.",
    choices: [
      {
        text: "\uB4A4\uC9C0\uAE30",
        outcomes: [
          { description: "\uAE08\uD654\uB97C \uBC1C\uACAC\uD588\uB2E4!", goldChange: 35, weight: 65 },
          { description: "\uD568\uC815\uC774 \uBC1C\uB3D9! \uB3C5\uAC00\uC2A4!", hpChange: -4, weight: 35 }
        ]
      },
      {
        text: "\uBB35\uB150\uD558\uAE30",
        outcomes: [
          { description: "\uB9C8\uC74C\uC774 \uC548\uC815\uB41C\uB2E4.", weight: 100 }
        ]
      },
      {
        text: "\uBB34\uC2DC\uD558\uAE30",
        outcomes: [
          { description: "\uC9C0\uB098\uCCE4\uB2E4.", weight: 100 }
        ]
      }
    ]
  },
  {
    id: "chest",
    title: "\uC7A0\uAE34 \uC0C1\uC790",
    description: "\uC790\uBB3C\uC1E0\uAC00 \uAC78\uB9B0 \uB0A1\uC740 \uC0C1\uC790\uAC00 \uC788\uB2E4.",
    choices: [
      {
        text: "\uBD80\uC218\uAE30",
        outcomes: [
          { description: "\uBCF4\uBB3C\uC774 \uAC00\uB4DD\uD588\uB2E4!", goldChange: 60, weight: 50 },
          { description: "\uD568\uC815\uC774 \uBC1C\uB3D9!", hpChange: -6, weight: 50 }
        ]
      },
      {
        text: "\uC870\uC2EC\uC2A4\uB7FD\uAC8C \uC5F4\uAE30",
        outcomes: [
          { description: "\uAE08\uD654\uAC00 \uC57D\uAC04 \uC788\uC5C8\uB2E4.", goldChange: 25, weight: 70 },
          { description: "\uBE44\uC5B4\uC788\uC5C8\uB2E4.", weight: 30 }
        ]
      },
      {
        text: "\uBB34\uC2DC\uD558\uAE30",
        outcomes: [
          { description: "\uC9C0\uB098\uCCE4\uB2E4.", weight: 100 }
        ]
      }
    ]
  },
  {
    id: "statue",
    title: "\uBCBD\uC758 \uAE30\uBB18\uD55C \uBD80\uC870",
    description: "\uBCBD\uC5D0 \uC0C8\uACA8\uC9C4 \uACE0\uB300 \uBD80\uC870\uAC00 \uBE5B\uB098\uACE0 \uC788\uB2E4.",
    choices: [
      {
        text: "\uB9CC\uC9C0\uAE30",
        outcomes: [
          { description: "\uD798\uC774 \uD758\uB7EC\uB4E4\uC5B4\uC628\uB2E4!", hpChange: 5, weight: 50 },
          { description: "\uC800\uC8FC\uAC00 \uB36E\uCCE4\uB2E4!", weight: 50 }
        ]
      },
      {
        text: "\uBB34\uC2DC\uD558\uAE30",
        outcomes: [
          { description: "\uC9C0\uB098\uCCE4\uB2E4.", weight: 100 }
        ]
      }
    ]
  }
];
function resolveOutcome(outcomes) {
  const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const outcome of outcomes) {
    roll -= outcome.weight;
    if (roll <= 0) return outcome;
  }
  return outcomes[outcomes.length - 1];
}

// src/engine/raycaster.ts
function castRays(tiles, width, height, px, py, angle, columns, fov = Math.PI / 2.5, maxDist = 16) {
  const hits = [];
  const originX = px + 0.5;
  const originY = py + 0.5;
  for (let i = 0; i < columns; i++) {
    const rayAngle = angle - fov / 2 + i / columns * fov;
    const hit = castSingleRay(tiles, width, height, originX, originY, rayAngle, maxDist);
    hit.dist *= Math.cos(rayAngle - angle);
    if (hit.dist < 0.1) hit.dist = 0.1;
    hits.push(hit);
  }
  return hits;
}
function findSpecialTiles(tiles, width, height, px, py, angle, columns, fov = Math.PI / 2.5, maxDist = 16) {
  const markers = [];
  const originX = px + 0.5;
  const originY = py + 0.5;
  for (let i = 0; i < columns; i++) {
    const rayAngle = angle - fov / 2 + i / columns * fov;
    const specials = scanSpecialTiles(tiles, width, height, originX, originY, rayAngle, maxDist, angle);
    for (const s of specials) {
      markers.push({ column: i, tileType: s.tileType, dist: s.dist });
    }
  }
  return markers;
}
function castSingleRay(tiles, width, height, ox, oy, angle, maxDist) {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  let mapX = Math.floor(ox);
  let mapY = Math.floor(oy);
  const deltaDistX = Math.abs(dirX) < 1e-10 ? 1e10 : Math.abs(1 / dirX);
  const deltaDistY = Math.abs(dirY) < 1e-10 ? 1e10 : Math.abs(1 / dirY);
  let stepX, stepY;
  let sideDistX, sideDistY;
  if (dirX < 0) {
    stepX = -1;
    sideDistX = (ox - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - ox) * deltaDistX;
  }
  if (dirY < 0) {
    stepY = -1;
    sideDistY = (oy - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - oy) * deltaDistY;
  }
  let side = 0;
  let dist = 0;
  for (let step = 0; step < 64; step++) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
      dist = sideDistX - deltaDistX;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
      dist = sideDistY - deltaDistY;
    }
    if (dist > maxDist) break;
    if (mapX < 0 || mapX >= width || mapY < 0 || mapY >= height) break;
    const tile = tiles[mapY][mapX];
    if (tile.type === "wall") {
      return { dist, tileType: "wall", side, tileX: mapX, tileY: mapY };
    }
  }
  return { dist: maxDist, tileType: "wall", side: 0, tileX: mapX, tileY: mapY };
}
function scanSpecialTiles(tiles, width, height, ox, oy, angle, maxDist, playerAngle) {
  const result = [];
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  let mapX = Math.floor(ox);
  let mapY = Math.floor(oy);
  const deltaDistX = Math.abs(dirX) < 1e-10 ? 1e10 : Math.abs(1 / dirX);
  const deltaDistY = Math.abs(dirY) < 1e-10 ? 1e10 : Math.abs(1 / dirY);
  let stepX, stepY;
  let sideDistX, sideDistY;
  if (dirX < 0) {
    stepX = -1;
    sideDistX = (ox - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - ox) * deltaDistX;
  }
  if (dirY < 0) {
    stepY = -1;
    sideDistY = (oy - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - oy) * deltaDistY;
  }
  const visited = /* @__PURE__ */ new Set();
  for (let step = 0; step < 64; step++) {
    let dist;
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      dist = sideDistX - deltaDistX;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      dist = sideDistY - deltaDistY;
    }
    if (dist > maxDist) break;
    if (mapX < 0 || mapX >= width || mapY < 0 || mapY >= height) break;
    const tile = tiles[mapY][mapX];
    if (tile.type === "wall") break;
    const key = `${mapX},${mapY}`;
    if (visited.has(key)) continue;
    visited.add(key);
    const specialTypes = ["exit", "combat", "treasure", "boss", "trap", "curio"];
    if (specialTypes.includes(tile.type) && tile.visible && !tile.cleared) {
      const corrDist = dist * Math.cos(angle - playerAngle);
      result.push({ tileType: tile.type, dist: corrDist < 0.1 ? 0.1 : corrDist });
    }
  }
  return result;
}

// src/engine/fps-renderer.ts
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function rgb(r, g, b) {
  const clamp2 = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v) => clamp2(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function lerpColor(r1, g1, b1, r2, g2, b2, t) {
  return rgb(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
}
function getWallPalette(tc) {
  const hex = tc.wallColor;
  const nearR = parseInt(hex.slice(1, 3), 16);
  const nearG = parseInt(hex.slice(3, 5), 16);
  const nearB = parseInt(hex.slice(5, 7), 16);
  return {
    nearR,
    nearG,
    nearB,
    farR: 48,
    farG: 40,
    farB: 40
  };
}
function getWallColor(dist, side, pal) {
  const maxDist = 18;
  const t = Math.min(dist / maxDist, 1);
  let r = lerp(pal.nearR, pal.farR, t);
  let g = lerp(pal.nearG, pal.farG, t);
  let b = lerp(pal.nearB, pal.farB, t);
  if (side === 1) {
    r *= 0.75;
    g *= 0.75;
    b *= 0.75;
  }
  return rgb(r, g, b);
}
function getSpecialIcon(tileType) {
  switch (tileType) {
    case "exit":
      return "{#00ffff-fg}\u25B6{/#00ffff-fg}";
    case "combat":
      return "{#ff3300-fg}\u203C{/#ff3300-fg}";
    case "treasure":
      return "{#ffcc00-fg}\u25C6{/#ffcc00-fg}";
    case "boss":
      return "{#ff0033-fg}\u25CF{/#ff0033-fg}";
    case "trap":
      return "{#ff6600-fg}\u25B2{/#ff6600-fg}";
    case "curio":
      return "{#cc44ff-fg}\u25C7{/#cc44ff-fg}";
    default:
      return " ";
  }
}
function renderFPS(hits, specials, viewWidth, viewHeight, theme) {
  const tc = getThemeConfig(theme);
  const pal = getWallPalette(tc);
  const lines = [];
  const specialByCol = /* @__PURE__ */ new Map();
  for (const s of specials) {
    const existing = specialByCol.get(s.column);
    if (!existing || s.dist < existing.dist) {
      specialByCol.set(s.column, s);
    }
  }
  const ceilTopR = 26, ceilTopG = 26, ceilTopB = 62;
  const ceilBotR = 90, ceilBotG = 106, ceilBotB = 154;
  const floorTopR = 106, floorTopG = 90, floorTopB = 64;
  const floorBotR = 204, floorBotG = 187, floorBotB = 136;
  for (let row = 0; row < viewHeight; row++) {
    let line = "";
    for (let col = 0; col < viewWidth; col++) {
      const hit = hits[col];
      if (!hit) {
        line += " ";
        continue;
      }
      const wallH = Math.floor(viewHeight / hit.dist);
      const wallTop = Math.floor((viewHeight - wallH) / 2);
      const wallBot = wallTop + wallH;
      if (row < wallTop) {
        const maxCeil = Math.max(wallTop, 1);
        const t = row / maxCeil;
        const c = lerpColor(ceilTopR, ceilTopG, ceilTopB, ceilBotR, ceilBotG, ceilBotB, t);
        line += `{${c}-fg}\u2588{/${c}-fg}`;
      } else if (row >= wallBot) {
        const floorRows = viewHeight - wallBot;
        const maxFloor = Math.max(floorRows, 1);
        const t = (row - wallBot) / maxFloor;
        let fR = lerp(floorTopR, floorBotR, t);
        let fG = lerp(floorTopG, floorBotG, t);
        let fB = lerp(floorTopB, floorBotB, t);
        if ((col + row) % 2 === 0) {
          fR *= 1.15;
          fG *= 1.15;
          fB *= 1.15;
        } else {
          fR *= 0.85;
          fG *= 0.85;
          fB *= 0.85;
        }
        const c = rgb(fR, fG, fB);
        line += `{${c}-fg}\u2588{/${c}-fg}`;
      } else {
        const wallMid = Math.floor((wallTop + wallBot) / 2);
        const special = specialByCol.get(col);
        if (special && row === wallMid && special.dist < hit.dist) {
          line += getSpecialIcon(special.tileType);
        } else {
          const c = getWallColor(hit.dist, hit.side, pal);
          line += `{${c}-fg}\u2588{/${c}-fg}`;
        }
      }
    }
    lines.push(line);
  }
  return lines.join("\n");
}

// src/screens/DungeonScreen.ts
var DungeonScreen = class extends BaseScreen {
  mapBox;
  partyBox;
  logBox;
  headerBox;
  hintBox;
  autoTimer = null;
  speed = 1;
  destroyed = false;
  explorationLog = [];
  exploring = false;
  currentPath = [];
  paused = false;
  lootPopup = null;
  autoMode = false;
  // true=자동, false=수동
  modalActive = false;
  fpsMode = false;
  minimapVisible = true;
  minimapBox;
  destroy() {
    this.destroyed = true;
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    if (this.lootPopup) {
      this.lootPopup.destroy();
      this.lootPopup = null;
    }
    super.destroy();
  }
  render() {
    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;
    this.speed = state.gameSpeed;
    this.paused = state.paused;
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      style: { bg: "black" }
    });
    this.headerBox = this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: 3,
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "red" } }
    });
    this.updateHeader();
    const mapHeight = this.fpsMode ? 16 : 22;
    const bottomTop = 3 + mapHeight;
    this.mapBox = this.createBox({
      top: 3,
      left: 0,
      width: "100%",
      height: mapHeight,
      tags: true,
      border: { type: "line" },
      label: " \uC9C0\uB3C4 ",
      style: { fg: "white", bg: "black", border: { fg: "gray" }, label: { fg: "gray" } }
    });
    this.minimapBox = this.createBox({
      top: 3,
      right: 1,
      width: 17,
      height: 10,
      tags: true,
      border: { type: "line" },
      label: " MAP ",
      style: { fg: "gray", bg: "black", border: { fg: "gray" }, label: { fg: "gray" } }
    });
    this.minimapBox.hide();
    this.renderMap();
    this.partyBox = this.createBox({
      top: bottomTop,
      left: 0,
      width: "40%",
      bottom: 1,
      tags: true,
      border: { type: "line" },
      label: " \uD30C\uD2F0 ",
      style: { fg: "white", bg: "black", border: { fg: "blue" }, label: { fg: "cyan" } }
    });
    this.updatePartyStatus();
    this.logBox = this.createBox({
      top: bottomTop,
      left: "40%",
      width: "60%",
      bottom: 1,
      tags: true,
      border: { type: "line" },
      label: " \uAE30\uB85D ",
      scrollable: true,
      alwaysScroll: true,
      style: { fg: "gray", bg: "black", border: { fg: "gray" }, label: { fg: "gray" } }
    });
    this.hintBox = this.createBox({
      bottom: 0,
      left: 0,
      width: "100%",
      height: 1,
      tags: true,
      style: { fg: "gray", bg: "black" }
    });
    this.updateHint();
    this.setupKeys();
    this.screen.render();
    this.startExploration();
  }
  updateHint() {
    if (this.autoMode) {
      const viewKey = this.fpsMode ? "V:\uD0D1\uBDF0 M:\uBBF8\uB2C8\uB9F5" : "V:1\uC778\uCE6D";
      this.hintBox.setContent(`{gray-fg}1/2/3:\uC18D\uB3C4  Space:\uC77C\uC2DC\uC815\uC9C0  Tab:\uC218\uB3D9\uBAA8\uB4DC  ${viewKey}  I:\uC778\uBCA4  Esc:\uD0C8\uCD9C{/gray-fg}`);
    } else if (this.fpsMode) {
      this.hintBox.setContent("{gray-fg}W:\uC804\uC9C4 S:\uD6C4\uD1F4 A:\uC88C\uD68C\uC804 D:\uC6B0\uD68C\uC804 V:\uD0D1\uBDF0 M:\uBBF8\uB2C8\uB9F5 Tab:\uC790\uB3D9 I:\uC778\uBCA4 Esc:\uD0C8\uCD9C{/gray-fg}");
    } else {
      this.hintBox.setContent("{gray-fg}\u2191\u2193\u2190\u2192/WASD:\uC774\uB3D9  V:1\uC778\uCE6D  Tab:\uC790\uB3D9\uBAA8\uB4DC  I:\uC778\uBCA4  Esc:\uD0C8\uCD9C{/gray-fg}");
    }
  }
  updateHeader() {
    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;
    const speedBtns = [1, 2, 3].map((s) => s === this.speed ? `{yellow-fg}[${s}x]{/yellow-fg}` : `{gray-fg}[${s}x]{/gray-fg}`).join(" ");
    const continuous = state.continuousRun ? "  {yellow-fg}[\uC5F0\uC18D]{/yellow-fg}" : "";
    const diff = getDifficulty(tower.currentFloor);
    const stars = "\u2605".repeat(diff);
    const pauseLabel = this.paused ? "  {bold}{red-fg}[\uC77C\uC2DC\uC815\uC9C0]{/red-fg}{/bold}" : "";
    const modeLabel = this.autoMode ? "{cyan-fg}[\uC790\uB3D9]{/cyan-fg}" : "{yellow-fg}[\uC218\uB3D9]{/yellow-fg}";
    const viewLabel = this.fpsMode ? "{magenta-fg}[1\uC778\uCE6D]{/magenta-fg}" : "{cyan-fg}[\uD0D1\uBDF0]{/cyan-fg}";
    const tc = getThemeConfig(tower.theme || "catacombs");
    const envLabel = tc.envEffect ? ` {red-fg}[${tc.name}]{/red-fg}` : ` {cyan-fg}[${tc.name}]{/cyan-fg}`;
    this.headerBox.setContent(` {bold}{red-fg}\uC5B4\uB460\uC758 \uD0D1{/red-fg}{/bold} ${tower.currentFloor}\uCE35${envLabel}  |  \uCD5C\uACE0 ${state.maxFloorReached}\uCE35  |  \uB09C\uC774\uB3C4 {yellow-fg}${stars}{/yellow-fg}  |  ${speedBtns}  ${modeLabel} ${viewLabel}${continuous}${pauseLabel}`);
  }
  renderMap() {
    if (this.fpsMode) {
      this.renderFPSView();
      if (this.minimapVisible) {
        this.renderMinimap();
        this.minimapBox.show();
      } else {
        this.minimapBox.hide();
      }
    } else {
      this.renderTopDownMap();
      this.minimapBox.hide();
    }
  }
  renderTopDownMap() {
    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;
    const fm = tower.floorMap;
    const boxWidth = (typeof this.mapBox.width === "number" ? this.mapBox.width : 80) - 2;
    const boxHeight = (typeof this.mapBox.height === "number" ? this.mapBox.height : 14) - 2;
    const camX = Math.max(0, Math.min(fm.playerX - Math.floor(boxWidth / 2), fm.width - boxWidth));
    const camY = Math.max(0, Math.min(fm.playerY - Math.floor(boxHeight / 2), fm.height - boxHeight));
    let content = "";
    for (let sy = 0; sy < boxHeight && sy + camY < fm.height; sy++) {
      const y = sy + camY;
      let line = "";
      for (let sx = 0; sx < boxWidth && sx + camX < fm.width; sx++) {
        const x = sx + camX;
        const tile = fm.tiles[y][x];
        if (x === fm.playerX && y === fm.playerY) {
          line += "{bold}{yellow-fg}@{/yellow-fg}{/bold}";
          continue;
        }
        if (!tile.explored) {
          line += "{#333333-fg}\u2591{/#333333-fg}";
          continue;
        }
        if (!tile.visible) {
          line += this.getDimTileChar(tile);
          continue;
        }
        line += this.getTileChar(tile);
      }
      content += line + "\n";
    }
    this.mapBox.setContent(content);
  }
  renderFPSView() {
    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;
    const fm = tower.floorMap;
    const viewWidth = (typeof this.mapBox.width === "number" ? this.mapBox.width : 80) - 2;
    const viewHeight = (typeof this.mapBox.height === "number" ? this.mapBox.height : 14) - 2;
    const angle = fm.playerAngle ?? 0;
    const hits = castRays(fm.tiles, fm.width, fm.height, fm.playerX, fm.playerY, angle, viewWidth);
    const specials = findSpecialTiles(fm.tiles, fm.width, fm.height, fm.playerX, fm.playerY, angle, viewWidth);
    const content = renderFPS(hits, specials, viewWidth, viewHeight, tower.theme || "catacombs");
    this.mapBox.setContent(content);
  }
  renderMinimap() {
    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;
    const fm = tower.floorMap;
    const mapW = 15;
    const mapH = 8;
    const camX = Math.max(0, Math.min(fm.playerX - Math.floor(mapW / 2), fm.width - mapW));
    const camY = Math.max(0, Math.min(fm.playerY - Math.floor(mapH / 2), fm.height - mapH));
    const angle = fm.playerAngle ?? 0;
    const norm = (angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const idx = Math.round(norm / (Math.PI / 4)) % 8;
    const dirChars = ["\u25B8", "\u25E2", "\u25BE", "\u25E3", "\u25C2", "\u25E4", "\u25B4", "\u25E5"];
    const playerChar = dirChars[idx] || "@";
    const dxDir = Math.round(Math.cos(angle));
    const dyDir = Math.round(Math.sin(angle));
    const fovDots = /* @__PURE__ */ new Set();
    for (let step = 1; step <= 2; step++) {
      const fx = fm.playerX + dxDir * step;
      const fy = fm.playerY + dyDir * step;
      if (fy >= 0 && fy < fm.height && fx >= 0 && fx < fm.width) {
        const fTile = fm.tiles[fy][fx];
        if (fTile.type === "wall") break;
        fovDots.add(`${fx},${fy}`);
      } else break;
    }
    let content = "";
    for (let sy = 0; sy < mapH && sy + camY < fm.height; sy++) {
      const y = sy + camY;
      let line = "";
      for (let sx = 0; sx < mapW && sx + camX < fm.width; sx++) {
        const x = sx + camX;
        const tile = fm.tiles[y][x];
        if (x === fm.playerX && y === fm.playerY) {
          line += `{bold}{yellow-fg}${playerChar}{/yellow-fg}{/bold}`;
          continue;
        }
        if (fovDots.has(`${x},${y}`) && tile.explored) {
          line += "{yellow-fg}\xB7{/yellow-fg}";
          continue;
        }
        if (!tile.explored) {
          line += " ";
          continue;
        }
        switch (tile.type) {
          case "wall":
            line += "{gray-fg}#{/gray-fg}";
            break;
          case "exit":
            line += "{cyan-fg}>{/cyan-fg}";
            break;
          case "combat":
            line += tile.cleared ? "{#555555-fg}.{/#555555-fg}" : "{red-fg}!{/red-fg}";
            break;
          case "boss":
            line += tile.cleared ? "{#555555-fg}.{/#555555-fg}" : "{red-fg}B{/red-fg}";
            break;
          case "treasure":
            line += tile.cleared ? "{#555555-fg}.{/#555555-fg}" : "{yellow-fg}${/yellow-fg}";
            break;
          default:
            line += "{#555555-fg}.{/#555555-fg}";
            break;
        }
      }
      content += line + "\n";
    }
    this.minimapBox.setContent(content);
  }
  getTheme() {
    const state = this.store.getState();
    return state.tower?.theme || "catacombs";
  }
  getTileChar(tile) {
    const tc = getThemeConfig(this.getTheme());
    if (tile.cleared) {
      if (tile.type === "entrance" || tile.type === "floor") {
        return "{#555555-fg}.{/#555555-fg}";
      }
      return "{green-fg}\u2713{/green-fg}";
    }
    switch (tile.type) {
      case "wall":
        return `{${tc.wallColor}-fg}${tc.wallChar}{/${tc.wallColor}-fg}`;
      case "floor":
        return `{${tc.floorColor}-fg}${tc.floorChar}{/${tc.floorColor}-fg}`;
      case "entrance":
        return `{${tc.floorColor}-fg}${tc.floorChar}{/${tc.floorColor}-fg}`;
      case "exit":
        return "{bold}{cyan-fg}>{/cyan-fg}{/bold}";
      case "combat":
        return "{red-fg}!{/red-fg}";
      case "treasure":
        return "{yellow-fg}${/yellow-fg}";
      case "trap":
        return "{red-fg}^{/red-fg}";
      case "curio":
        return "{magenta-fg}?{/magenta-fg}";
      case "boss":
        return "{bold}{red-fg}B{/red-fg}{/bold}";
      default:
        return tc.floorChar;
    }
  }
  getDimTileChar(tile) {
    const tc = getThemeConfig(this.getTheme());
    if (tile.cleared) {
      return `{${tc.dimFloorColor}-fg}.{/${tc.dimFloorColor}-fg}`;
    }
    switch (tile.type) {
      case "wall":
        return `{${tc.dimWallColor}-fg}${tc.wallChar}{/${tc.dimWallColor}-fg}`;
      case "floor":
        return `{${tc.dimFloorColor}-fg}${tc.floorChar}{/${tc.dimFloorColor}-fg}`;
      case "entrance":
        return `{${tc.dimFloorColor}-fg}${tc.floorChar}{/${tc.dimFloorColor}-fg}`;
      case "exit":
        return "{#448888-fg}>{/#448888-fg}";
      case "combat":
        return "{#884444-fg}!{/#884444-fg}";
      case "treasure":
        return "{#888844-fg}${/#888844-fg}";
      case "trap":
        return "{#884444-fg}^{/#884444-fg}";
      case "curio":
        return "{#664488-fg}?{/#664488-fg}";
      case "boss":
        return "{#884444-fg}B{/#884444-fg}";
      default:
        return `{${tc.dimFloorColor}-fg}.{/${tc.dimFloorColor}-fg}`;
    }
  }
  updatePartyStatus() {
    const state = this.store.getState();
    let content = "";
    for (let i = 0; i < 6; i++) {
      const hero = state.party[i];
      if (!hero) continue;
      const starStr = getStars(hero.rarity);
      const hpPct = hero.stats.hp / hero.stats.maxHp;
      const hpColor = hpPct > 0.5 ? "green" : hpPct > 0.25 ? "yellow" : "red";
      const hpBar = formatBar(hero.stats.hp, hero.stats.maxHp, 8);
      const mcTag = hero.isMainCharacter ? "{yellow-fg}[MC]{/yellow-fg}" : "";
      if (hero.stats.hp <= 0) {
        content += `{red-fg}{bold}${hero.name} - \uC0AC\uB9DD{/bold}{/red-fg}
`;
      } else {
        content += `${mcTag}{yellow-fg}${starStr}{/yellow-fg}{bold}${hero.name}{/bold} {${hpColor}-fg}${hpBar}{/${hpColor}-fg} ${hero.stats.hp}/${hero.stats.maxHp}
`;
      }
    }
    this.partyBox.setContent(content);
  }
  updateLog() {
    const logs = this.explorationLog.slice(-8);
    this.logBox.setContent(logs.join("\n"));
    this.logBox.setScrollPerc(100);
  }
  addLog(msg) {
    this.explorationLog.push(msg);
    this.updateLog();
  }
  /** Check if a popup/modal is active — all dungeon keys should be suppressed */
  isModalActive() {
    return !!(this.lootPopup && this.lootPopup.active) || this.modalActive;
  }
  setupKeys() {
    this.registerKey(["1"], () => {
      if (this.isModalActive()) return;
      this.speed = 1;
      this.store.dispatch({ type: "SET_GAME_SPEED", speed: 1 });
      this.updateHeader();
      this.screen.render();
    });
    this.registerKey(["2"], () => {
      if (this.isModalActive()) return;
      this.speed = 2;
      this.store.dispatch({ type: "SET_GAME_SPEED", speed: 2 });
      this.updateHeader();
      this.screen.render();
    });
    this.registerKey(["3"], () => {
      if (this.isModalActive()) return;
      this.speed = 3;
      this.store.dispatch({ type: "SET_GAME_SPEED", speed: 3 });
      this.updateHeader();
      this.screen.render();
    });
    this.registerKey(["space"], () => {
      if (this.isModalActive()) return;
      if (!this.autoMode) return;
      this.paused = !this.paused;
      this.store.dispatch({ type: "TOGGLE_PAUSE" });
      this.updateHeader();
      this.screen.render();
      if (!this.paused && !this.exploring) {
        this.exploring = true;
        this.stepExploration();
      }
    });
    this.registerKey(["escape"], () => {
      if (this.isModalActive()) return;
      this.showRetreatConfirm();
    });
    this.registerKey(["tab"], () => {
      if (this.isModalActive()) return;
      this.autoMode = !this.autoMode;
      this.updateHeader();
      this.updateHint();
      this.screen.render();
      if (this.autoMode) {
        this.addLog("{cyan-fg}\uC790\uB3D9 \uD0D0\uD5D8 \uBAA8\uB4DC\uB85C \uC804\uD658{/cyan-fg}");
        if (!this.exploring && !this.paused) {
          this.currentPath = [];
          this.exploring = true;
          this.stepExploration();
        }
      } else {
        this.addLog("{yellow-fg}\uC218\uB3D9 \uC774\uB3D9 \uBAA8\uB4DC\uB85C \uC804\uD658 (\u2191\u2193\u2190\u2192/WASD){/yellow-fg}");
        this.exploring = false;
        if (this.autoTimer) {
          clearTimeout(this.autoTimer);
          this.autoTimer = null;
        }
      }
    });
    this.registerKey(["v"], () => {
      if (this.isModalActive()) return;
      this.fpsMode = !this.fpsMode;
      this.addLog(this.fpsMode ? "{magenta-fg}1\uC778\uCE6D \uC2DC\uC810{/magenta-fg}" : "{cyan-fg}\uD0D1\uBDF0 \uC2DC\uC810{/cyan-fg}");
      if (this.fpsMode && this.minimapVisible) this.minimapBox.show();
      else this.minimapBox.hide();
      this.updateHint();
      this.refreshDisplay();
    });
    this.registerKey(["m"], () => {
      if (this.isModalActive()) return;
      if (!this.fpsMode) return;
      this.minimapVisible = !this.minimapVisible;
      if (this.minimapVisible) {
        this.minimapBox.show();
      } else {
        this.minimapBox.hide();
      }
      this.screen.render();
    });
    this.registerKey(["i"], () => {
      if (this.isModalActive()) return;
      this.store.dispatch({ type: "NAVIGATE", screen: "inventory" });
    });
    this.registerKey(["up", "w"], () => {
      if (this.isModalActive()) return;
      if (this.autoMode) return;
      if (this.fpsMode) {
        const { dx, dy } = this.getFacingDelta();
        this.manualMove(dx, dy);
      } else {
        this.manualMove(0, -1);
      }
    });
    this.registerKey(["down", "s"], () => {
      if (this.isModalActive()) return;
      if (this.autoMode) return;
      if (this.fpsMode) {
        const { dx, dy } = this.getFacingDelta();
        this.manualMove(-dx, -dy);
      } else {
        this.manualMove(0, 1);
      }
    });
    this.registerKey(["left", "a"], () => {
      if (this.isModalActive()) return;
      if (this.autoMode) return;
      if (this.fpsMode) {
        this.rotatePlayer(-Math.PI / 2);
      } else {
        this.manualMove(-1, 0);
      }
    });
    this.registerKey(["right", "d"], () => {
      if (this.isModalActive()) return;
      if (this.autoMode) return;
      if (this.fpsMode) {
        this.rotatePlayer(Math.PI / 2);
      } else {
        this.manualMove(1, 0);
      }
    });
  }
  getFacingDelta() {
    const angle = this.store.getState().tower?.floorMap.playerAngle ?? 0;
    const norm = (angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const idx = Math.round(norm / (Math.PI / 2)) % 4;
    return [{ dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 0, dy: -1 }][idx];
  }
  rotatePlayer(delta) {
    const tower = this.store.getState().tower;
    if (!tower) return;
    const fm = { ...tower.floorMap };
    fm.playerAngle = ((fm.playerAngle + delta) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    this.store.dispatch({ type: "UPDATE_FLOOR_MAP", floorMap: fm });
    this.refreshDisplay();
  }
  manualMove(dx, dy) {
    if (this.destroyed) return;
    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;
    if (state.pendingLoot) return;
    const fm = tower.floorMap;
    const nx = fm.playerX + dx;
    const ny = fm.playerY + dy;
    if (ny < 0 || ny >= fm.height || nx < 0 || nx >= fm.width) return;
    const tile = fm.tiles[ny][nx];
    if (tile.type === "wall") return;
    const newFm = { ...fm };
    newFm.playerX = nx;
    newFm.playerY = ny;
    if (this.fpsMode) {
      newFm.playerAngle = Math.atan2(dy, dx);
      if (newFm.playerAngle < 0) newFm.playerAngle += 2 * Math.PI;
    }
    const radius = getFOVRadius();
    updateFOV(newFm, radius);
    this.store.dispatch({ type: "UPDATE_FLOOR_MAP", floorMap: newFm });
    this.refreshDisplay();
    if (!tile.cleared) {
      const eventTypes = ["combat", "boss", "treasure", "trap", "curio", "exit"];
      if (eventTypes.includes(tile.type)) {
        this.handleTileEvent(nx, ny);
      } else {
        this.store.dispatch({ type: "CLEAR_TILE", x: nx, y: ny });
      }
    }
    if (nx === fm.exitX && ny === fm.exitY && tile.cleared) {
      this.advanceToNextFloor();
    }
  }
  showRetreatConfirm() {
    this.modalActive = true;
    const wasAutoMode = this.autoMode;
    this.exploring = false;
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    const confirmBox = blessed6.box({
      top: "center",
      left: "center",
      width: 40,
      height: 8,
      content: "{bold}{red-fg}\uC815\uB9D0 \uD0C8\uCD9C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?{/red-fg}{/bold}\n\n\uD0C8\uCD9C\uD558\uBA74 \uD0D1\uC5D0\uC11C \uADC0\uD658\uD569\uB2C8\uB2E4.\n\n{gray-fg}Y: \uD0C8\uCD9C  N: \uCDE8\uC18C{/gray-fg}",
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "red" } },
      align: "center"
    });
    this.addWidget(confirmBox);
    this.screen.render();
    let handled = false;
    const cleanup = () => {
      if (handled) return;
      handled = true;
      this.modalActive = false;
      confirmBox.destroy();
      const idx = this.widgets.indexOf(confirmBox);
      if (idx !== -1) this.widgets.splice(idx, 1);
      this.screen.unkey(["y"], yHandler);
      this.screen.unkey(["n", "escape"], nHandler);
    };
    const yHandler = () => {
      if (handled) return;
      cleanup();
      this.store.dispatch({ type: "SET_CONTINUOUS_RUN", enabled: false });
      this.store.dispatch({ type: "EXIT_TOWER" });
    };
    const nHandler = () => {
      if (handled) return;
      cleanup();
      if (wasAutoMode && !this.paused && !this.destroyed) {
        this.exploring = true;
        this.stepExploration();
      }
      this.screen.render();
    };
    this.screen.key(["y"], yHandler);
    this.screen.key(["n", "escape"], nHandler);
  }
  startExploration() {
    if (this.destroyed || this.exploring) return;
    const preState = this.store.getState();
    if (preState.pendingLoot) {
      this.showLootDecision();
      return;
    }
    if (!this.autoMode) return;
    this.exploring = true;
    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;
    this.addLog(`${tower.currentFloor}\uCE35 \uD0D0\uD5D8 \uC2DC\uC791...`);
    this.stepExploration();
  }
  stepExploration() {
    if (this.destroyed || this.paused || !this.autoMode) {
      this.exploring = false;
      return;
    }
    const state = this.store.getState();
    if (state.pendingLoot) {
      this.exploring = false;
      this.showLootDecision();
      return;
    }
    const tower = state.tower;
    if (!tower) return;
    const aliveHeroes = state.party.filter((h) => h !== null && h.stats.hp > 0);
    if (aliveHeroes.length === 0) {
      this.store.dispatch({ type: "SET_CONTINUOUS_RUN", enabled: false });
      this.store.dispatch({ type: "NAVIGATE", screen: "game_over" });
      return;
    }
    const fm = tower.floorMap;
    const currentTile = fm.tiles[fm.playerY][fm.playerX];
    if (!currentTile.cleared) {
      this.handleTileEvent(fm.playerX, fm.playerY);
      return;
    }
    if (fm.playerX === fm.exitX && fm.playerY === fm.exitY) {
      this.advanceToNextFloor();
      return;
    }
    const target = findNextTarget(fm);
    if (!target) {
      this.advanceToNextFloor();
      return;
    }
    if (this.currentPath.length === 0) {
      this.currentPath = computePath(fm, target.x, target.y);
    }
    if (this.currentPath.length === 0) {
      this.currentPath = computePath(fm, fm.exitX, fm.exitY);
      if (this.currentPath.length === 0) {
        this.advanceToNextFloor();
        return;
      }
    }
    const [nextX, nextY] = this.currentPath.shift();
    this.autoMovePlayer(nextX, nextY);
  }
  autoMovePlayer(x, y) {
    if (this.destroyed) return;
    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;
    const fm = { ...tower.floorMap };
    if (this.fpsMode) {
      fm.playerAngle = Math.atan2(y - fm.playerY, x - fm.playerX);
      if (fm.playerAngle < 0) fm.playerAngle += 2 * Math.PI;
    }
    fm.playerX = x;
    fm.playerY = y;
    const radius = getFOVRadius();
    updateFOV(fm, radius);
    this.store.dispatch({ type: "UPDATE_FLOOR_MAP", floorMap: fm });
    this.refreshDisplay();
    const tile = fm.tiles[y][x];
    if (!tile.cleared && tile.type !== "floor" && tile.type !== "wall") {
      this.currentPath = [];
      this.autoTimer = setTimeout(() => {
        if (!this.destroyed && !this.paused) {
          this.handleTileEvent(x, y);
        }
      }, Math.floor(500 / this.speed));
      return;
    }
    this.autoTimer = setTimeout(() => {
      if (!this.destroyed && !this.paused) {
        this.stepExploration();
      }
    }, Math.floor(100 / this.speed));
  }
  handleTileEvent(x, y) {
    if (this.destroyed) return;
    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;
    const tile = tower.floorMap.tiles[y][x];
    const floor = tower.currentFloor;
    switch (tile.type) {
      case "entrance":
      case "floor":
        this.store.dispatch({ type: "CLEAR_TILE", x, y });
        if (this.autoMode) {
          this.autoTimer = setTimeout(() => {
            if (!this.destroyed && !this.paused) this.stepExploration();
          }, Math.floor(100 / this.speed));
        }
        break;
      case "exit":
        this.store.dispatch({ type: "CLEAR_TILE", x, y });
        this.addLog("\uACC4\uB2E8 \uBC1C\uACAC! \uB2E4\uC74C \uCE35\uC73C\uB85C...");
        this.refreshDisplay();
        this.advanceToNextFloor();
        break;
      case "combat":
      case "boss": {
        const roomLabel = tile.type === "boss" ? `\u2605 \uBCF4\uC2A4! \u2605` : "\uC801\uACFC \uC870\uC6B0!";
        this.addLog(`{red-fg}${roomLabel}{/red-fg}`);
        this.refreshDisplay();
        if (tile.monsterTypes && tile.monsterTypes.length > 0) {
          const statMultiplier = getStatMultiplier(floor);
          const monsters = createMonsterGroupScaled(tile.monsterTypes, statMultiplier);
          let isSurprised = false;
          let enemySurprised = false;
          if (percentChance(15)) {
            isSurprised = true;
            this.addLog("{red-fg}\uAE30\uC2B5\uB2F9\uD588\uB2E4!{/red-fg}");
          } else if (percentChance(15)) {
            enemySurprised = true;
            this.addLog("{green-fg}\uC801\uC744 \uAE30\uC2B5\uD588\uB2E4!{/green-fg}");
          }
          this.store.dispatch({ type: "CLEAR_TILE", x, y });
          this.exploring = false;
          this.autoTimer = setTimeout(() => {
            if (!this.destroyed) {
              this.store.dispatch({ type: "START_COMBAT", monsters, isSurprised, enemySurprised });
            }
          }, Math.floor(1e3 / this.speed));
        }
        break;
      }
      case "treasure": {
        const treasureLoot = generateTreasureLoot(floor);
        this.addLog(`{yellow-fg}\uBCF4\uBB3C \uBC1C\uACAC! \uACE8\uB4DC +${treasureLoot.gold}{/yellow-fg}`);
        this.store.dispatch({ type: "ADD_GOLD", amount: treasureLoot.gold });
        this.store.dispatch({ type: "CLEAR_TILE", x, y });
        if (treasureLoot.items.length > 0) {
          this.store.dispatch({
            type: "SET_PENDING_LOOT",
            loot: { items: treasureLoot.items, currentIndex: 0, gold: 0, source: "treasure" }
          });
          this.refreshDisplay();
          this.exploring = false;
          this.autoTimer = setTimeout(() => {
            if (!this.destroyed) this.showLootDecision();
          }, Math.floor(500 / this.speed));
        } else {
          this.refreshDisplay();
          if (this.autoMode) {
            this.autoTimer = setTimeout(() => {
              if (!this.destroyed && !this.paused) this.stepExploration();
            }, Math.floor(800 / this.speed));
          }
        }
        break;
      }
      case "trap": {
        const diff = getDifficulty(floor);
        const damage = tile.trapDamage || randomInt(3, 8) + diff * 2;
        this.addLog(`{red-fg}\uD568\uC815! \uD30C\uD2F0 \uC804\uCCB4 ${damage} \uD53C\uD574!{/red-fg}`);
        const currentState = this.store.getState();
        for (const hero of currentState.party) {
          if (hero && hero.stats.hp > 0) {
            const updated = {
              ...hero,
              stats: {
                ...hero.stats,
                hp: Math.max(1, hero.stats.hp - damage)
              }
            };
            this.store.dispatch({ type: "UPDATE_PARTY_HERO", hero: updated });
          }
        }
        this.store.dispatch({ type: "CLEAR_TILE", x, y });
        this.refreshDisplay();
        if (this.autoMode) {
          this.autoTimer = setTimeout(() => {
            if (!this.destroyed && !this.paused) this.stepExploration();
          }, Math.floor(800 / this.speed));
        }
        break;
      }
      case "curio": {
        this.store.dispatch({ type: "CLEAR_TILE", x, y });
        this.showCurioEvent();
        break;
      }
      default:
        this.store.dispatch({ type: "CLEAR_TILE", x, y });
        if (this.autoMode) {
          this.autoTimer = setTimeout(() => {
            if (!this.destroyed && !this.paused) this.stepExploration();
          }, Math.floor(100 / this.speed));
        }
        break;
    }
  }
  showLootDecision() {
    if (this.destroyed) return;
    if (this.lootPopup && this.lootPopup.active) return;
    const state = this.store.getState();
    if (!state.pendingLoot) {
      if (this.autoMode) {
        this.exploring = true;
        this.stepExploration();
      }
      return;
    }
    const currentItem = state.pendingLoot.items[state.pendingLoot.currentIndex];
    if (!currentItem) {
      this.store.dispatch({ type: "CLEAR_PENDING_LOOT" });
      if (this.autoMode) {
        this.exploring = true;
        this.stepExploration();
      }
      return;
    }
    this.lootPopup = showLootPopup(
      this.screen,
      currentItem,
      state.party,
      state.inventory.length,
      (decision, heroId) => {
        this.lootPopup = null;
        this.store.dispatch({ type: "RESOLVE_LOOT_ITEM", decision, heroId });
        this.refreshDisplay();
        const newState = this.store.getState();
        if (newState.pendingLoot) {
          this.autoTimer = setTimeout(() => {
            if (!this.destroyed) this.showLootDecision();
          }, 300);
        } else {
          this.autoTimer = setTimeout(() => {
            if (!this.destroyed && !this.paused) {
              if (this.autoMode) {
                this.exploring = true;
                this.stepExploration();
              }
            }
          }, 500);
        }
      }
    );
  }
  showCurioEvent() {
    if (this.destroyed) return;
    this.exploring = false;
    this.modalActive = true;
    const event = randomChoice(CURIO_EVENTS);
    this.addLog(`{magenta-fg}${event.title}{/magenta-fg}`);
    const choiceLabels = event.choices.map((c) => c.text);
    const popup = blessed6.box({
      top: "center",
      left: "center",
      width: 50,
      height: choiceLabels.length + 8,
      label: ` ${event.title} `,
      content: `{white-fg}${event.description}{/white-fg}`,
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "magenta" }, label: { fg: "magenta" } }
    });
    this.addWidget(popup);
    const choiceList = blessed6.list({
      top: 3,
      left: 1,
      right: 1,
      bottom: 1,
      parent: popup,
      items: choiceLabels,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      style: {
        fg: "white",
        selected: { fg: "black", bg: "magenta", bold: true }
      }
    });
    choiceList.focus();
    this.screen.render();
    choiceList.on("select", (_item, idx) => {
      const choice = event.choices[idx];
      if (!choice) return;
      const outcome = resolveOutcome(choice.outcomes);
      this.addLog(`{magenta-fg}> ${choice.text}{/magenta-fg}`);
      this.addLog(`{white-fg}${outcome.description}{/white-fg}`);
      const state = this.store.getState();
      if (outcome.goldChange) {
        this.store.dispatch({ type: "ADD_GOLD", amount: outcome.goldChange });
        if (outcome.goldChange > 0) {
          this.addLog(`{yellow-fg}\uACE8\uB4DC +${outcome.goldChange}{/yellow-fg}`);
        } else {
          this.addLog(`{red-fg}\uACE8\uB4DC ${outcome.goldChange}{/red-fg}`);
        }
      }
      if (outcome.hpChange) {
        const currentState = this.store.getState();
        for (const hero of currentState.party) {
          if (hero && hero.stats.hp > 0) {
            let updated = { ...hero, stats: { ...hero.stats } };
            if (outcome.hpChange) {
              updated.stats.hp = clamp(updated.stats.hp + outcome.hpChange, 1, updated.stats.maxHp);
              if (updated.isDeathsDoor && updated.stats.hp > 0) {
                updated = { ...updated, isDeathsDoor: false };
              }
            }
            this.store.dispatch({ type: "UPDATE_PARTY_HERO", hero: updated });
          }
        }
        if (outcome.hpChange) {
          this.addLog(outcome.hpChange > 0 ? `{green-fg}\uD30C\uD2F0 HP +${outcome.hpChange}{/green-fg}` : `{red-fg}\uD30C\uD2F0 HP ${outcome.hpChange}{/red-fg}`);
        }
      }
      this.modalActive = false;
      popup.destroy();
      const popIdx = this.widgets.indexOf(popup);
      if (popIdx !== -1) this.widgets.splice(popIdx, 1);
      this.refreshDisplay();
      if (this.autoMode) {
        this.autoTimer = setTimeout(() => {
          if (!this.destroyed && !this.paused) {
            this.exploring = true;
            this.stepExploration();
          }
        }, Math.floor(800 / this.speed));
      }
    });
  }
  applyEnvironmentEffect() {
    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;
    const tc = getThemeConfig(tower.theme || "catacombs");
    if (!tc.envEffect || !tc.envValue) return;
    for (const hero of state.party) {
      if (!hero || hero.stats.hp <= 0) continue;
      let updated = { ...hero, stats: { ...hero.stats } };
      switch (tc.envEffect) {
        case "hp_drain":
          updated.stats.hp = Math.max(1, updated.stats.hp - tc.envValue);
          break;
      }
      this.store.dispatch({ type: "UPDATE_PARTY_HERO", hero: updated });
    }
    if (tc.envEffect === "hp_drain") {
      this.addLog(`{red-fg}${tc.name}\uC758 \uC5F4\uAE30\uB85C \uD30C\uD2F0 HP -${tc.envValue}{/red-fg}`);
    }
  }
  advanceToNextFloor() {
    if (this.destroyed) return;
    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;
    const aliveHeroes = state.party.filter((h) => h !== null && h.stats.hp > 0);
    if (aliveHeroes.length === 0) {
      this.store.dispatch({ type: "SET_CONTINUOUS_RUN", enabled: false });
      this.store.dispatch({ type: "NAVIGATE", screen: "game_over" });
      return;
    }
    if (state.gameWon) {
      this.towerComplete();
      return;
    }
    if (tower.currentFloor >= 100) {
      this.towerComplete();
      return;
    }
    this.autoTimer = setTimeout(() => {
      if (this.destroyed) return;
      this.store.dispatch({ type: "ADVANCE_FLOOR" });
      this.currentPath = [];
      this.applyEnvironmentEffect();
      const updatedTower = this.store.getState().tower;
      if (updatedTower) {
        this.addLog(`${updatedTower.currentFloor}\uCE35\uC73C\uB85C \uC774\uB3D9...`);
      }
      this.refreshDisplay();
      if (this.autoMode) {
        this.exploring = true;
        this.stepExploration();
      }
    }, Math.floor(1500 / this.speed));
  }
  towerComplete() {
    if (this.destroyed) return;
    this.exploring = false;
    const state = this.store.getState();
    const tower = state.tower;
    const floor = tower ? tower.currentFloor : 0;
    if (state.gameWon && floor >= 100) {
      this.addLog("{bold}{yellow-fg}\uC5B4\uB460\uC758 \uD0D1 \uC815\uBCF5!! \uCD95\uD558\uD569\uB2C8\uB2E4!{/yellow-fg}{/bold}");
    } else {
      this.addLog("{bold}{green-fg}\uD0D1 \uD0D0\uD5D8 \uC644\uB8CC!{/green-fg}{/bold}");
    }
    this.store.saveGame();
    if (state.continuousRun && !state.gameWon) {
      this.store.dispatch({ type: "INCREMENT_RUNS" });
      const partyHeroes = state.party.filter((h) => h !== null);
      const anyDead = partyHeroes.some((h) => h.stats.hp <= 0);
      const anyLowHp = partyHeroes.some((h) => h.stats.hp / h.stats.maxHp < 0.3);
      if (anyDead || anyLowHp) {
        this.addLog("{yellow-fg}\uD30C\uD2F0 \uC0C1\uD0DC \uC704\uD5D8! \uC5F0\uC18D \uD0D0\uD5D8 \uC911\uC9C0.{/yellow-fg}");
        this.store.dispatch({ type: "SET_CONTINUOUS_RUN", enabled: false });
        this.returnToTown();
        return;
      }
      const currentState = this.store.getState();
      for (const hero of currentState.party) {
        if (hero && hero.stats.hp > 0) {
          const healAmount = Math.round(hero.stats.maxHp * 0.3);
          const updated = {
            ...hero,
            stats: {
              ...hero.stats,
              hp: clamp(hero.stats.hp + healAmount, 0, hero.stats.maxHp)
            }
          };
          this.store.dispatch({ type: "UPDATE_PARTY_HERO", hero: updated });
        }
      }
      this.addLog("{cyan-fg}\uD30C\uD2F0 \uD68C\uBCF5! (+30% HP){/cyan-fg}");
      this.addLog("{yellow-fg}\uC5F0\uC18D \uD0D0\uD5D8: \uB2E4\uC2DC \uC785\uC7A5!{/yellow-fg}");
      this.refreshDisplay();
      this.autoTimer = setTimeout(() => {
        if (this.destroyed) return;
        this.store.dispatch({ type: "ADVANCE_WEEK" });
        this.store.dispatch({ type: "ENTER_TOWER" });
      }, Math.floor(2500 / this.speed));
    } else {
      this.returnToTown();
    }
  }
  returnToTown() {
    this.autoTimer = setTimeout(() => {
      if (this.destroyed) return;
      this.store.dispatch({ type: "ADVANCE_WEEK" });
      this.store.dispatch({ type: "EXIT_TOWER" });
    }, Math.floor(1500 / this.speed));
  }
  refreshDisplay() {
    if (this.destroyed) return;
    const mapHeight = this.fpsMode ? 16 : 22;
    const bottomTop = 3 + mapHeight;
    this.mapBox.height = mapHeight;
    this.partyBox.top = bottomTop;
    this.logBox.top = bottomTop;
    this.updateHeader();
    this.renderMap();
    this.updatePartyStatus();
    this.updateLog();
    this.screen.render();
  }
};

// src/screens/CombatScreen.ts
import blessed7 from "blessed";

// src/engine/combat-engine.ts
function deepCopyCombat(combat) {
  return {
    ...combat,
    heroes: combat.heroes.map((h) => ({
      ...h,
      stats: { ...h.stats },
      statusEffects: h.statusEffects.map((e) => ({ ...e })),
      skills: h.skills.map((s) => ({ ...s })),
      equipment: { ...h.equipment }
    })),
    monsters: combat.monsters.map((m) => ({
      ...m,
      stats: { ...m.stats },
      statusEffects: m.statusEffects.map((e) => ({ ...e })),
      skills: m.skills.map((s) => ({ ...s }))
    })),
    turnOrder: combat.turnOrder.map((t) => ({ ...t })),
    log: [...combat.log]
  };
}
function generateTurnOrder(heroes, monsters) {
  const entries = [];
  for (const hero of heroes) {
    if (hero.stats.hp > 0 || hero.isDeathsDoor) {
      entries.push({
        id: hero.id,
        isHero: true,
        speed: hero.stats.speed + randomInt(1, 8),
        done: false
      });
    }
  }
  for (const monster of monsters) {
    if (monster.stats.hp > 0) {
      entries.push({
        id: monster.id,
        isHero: false,
        speed: monster.stats.speed + randomInt(1, 8),
        done: false
      });
    }
  }
  entries.sort((a, b) => b.speed - a.speed);
  return entries;
}
function getEffectiveStats(hero, context) {
  const stats = { ...hero.stats };
  const equipment = [hero.equipment.weapon, hero.equipment.armor, hero.equipment.trinket1, hero.equipment.trinket2];
  for (const item of equipment) {
    if (!item) continue;
    for (const mod of item.modifiers) {
      const key = mod.stat;
      if (key in stats && typeof stats[key] === "number") {
        stats[key] = stats[key] + mod.value;
      }
    }
  }
  if (hero.traits && hero.traits.length > 0) {
    const hpPercent = stats.hp / stats.maxHp;
    const bonuses = getTraitStatBonuses(hero.traits, {
      isBoss: context?.isBoss,
      hpPercent
    });
    stats.attack += bonuses.attack;
    stats.defense += bonuses.defense;
    stats.speed += bonuses.speed;
    stats.accuracy += bonuses.accuracy;
    stats.dodge += bonuses.dodge;
    stats.crit += bonuses.crit;
    if (bonuses.maxHp !== 0) {
      stats.maxHp += bonuses.maxHp;
      if (stats.hp > stats.maxHp) stats.hp = stats.maxHp;
    }
  }
  return stats;
}
function calculateHit(attackerAcc, skill, targetDodge) {
  const hitChance = attackerAcc + skill.accuracy - targetDodge;
  const roll = randomInt(1, 100);
  return roll <= hitChance;
}
function calculateDamage(attackerAtk, skill, targetDef, critBonus = 0) {
  const multiplier = skill.damage.min + Math.random() * (skill.damage.max - skill.damage.min);
  let baseDamage = Math.round(attackerAtk * multiplier) - targetDef + randomInt(-2, 2);
  baseDamage = Math.max(1, baseDamage);
  const isCrit = percentChance(skill.crit + critBonus);
  if (isCrit) {
    baseDamage = Math.round(baseDamage * 1.5);
  }
  return { damage: baseDamage, isCrit };
}
function applyDamageToHero(hero, damage) {
  const log = [];
  let newHp = hero.stats.hp - damage;
  if (newHp <= 0) {
    if (!hero.isDeathsDoor) {
      log.push(`${hero.name}\uC774(\uAC00) \uC8FD\uC74C\uC758 \uBB38\uD131\uC5D0 \uC130\uC2B5\uB2C8\uB2E4!`);
      return {
        hero: { ...hero, stats: { ...hero.stats, hp: 0 }, isDeathsDoor: true },
        log
      };
    } else {
      const resistChance = hero.deathsDoorResist;
      if (percentChance(resistChance)) {
        log.push(`${hero.name}\uC774(\uAC00) \uC8FD\uC74C\uC5D0 \uC800\uD56D\uD588\uC2B5\uB2C8\uB2E4! (${resistChance}%)`);
        return {
          hero: {
            ...hero,
            stats: { ...hero.stats, hp: 0 },
            deathsDoorResist: Math.max(0, hero.deathsDoorResist - 17)
          },
          log
        };
      } else {
        log.push(`${hero.name}\uC774(\uAC00) \uC0AC\uB9DD\uD588\uC2B5\uB2C8\uB2E4!`);
        return {
          hero: { ...hero, stats: { ...hero.stats, hp: 0 } },
          log
        };
      }
    }
  }
  return {
    hero: { ...hero, stats: { ...hero.stats, hp: newHp } },
    log
  };
}
function applyDamageToMonster(monster, damage) {
  const newHp = Math.max(0, monster.stats.hp - damage);
  return { ...monster, stats: { ...monster.stats, hp: newHp } };
}
function applyHealing(hero, amount) {
  const newHp = clamp(hero.stats.hp + amount, 0, hero.stats.maxHp);
  let updatedHero = { ...hero, stats: { ...hero.stats, hp: newHp } };
  if (hero.isDeathsDoor && newHp > 0) {
    updatedHero = { ...updatedHero, isDeathsDoor: false };
  }
  return updatedHero;
}
function processStatusEffects(entity) {
  const log = [];
  let updated = { ...entity, stats: { ...entity.stats }, statusEffects: [...entity.statusEffects] };
  const name = updated.name;
  for (const effect of updated.statusEffects) {
    if (effect.type === "bleed" && effect.duration > 0) {
      updated.stats.hp = Math.max(0, updated.stats.hp - effect.value);
      log.push(`${name}\uC774(\uAC00) \uCD9C\uD608\uB85C ${effect.value} \uD53C\uD574!`);
    }
    if (effect.type === "blight" && effect.duration > 0) {
      updated.stats.hp = Math.max(0, updated.stats.hp - effect.value);
      log.push(`${name}\uC774(\uAC00) \uC5ED\uBCD1\uC73C\uB85C ${effect.value} \uD53C\uD574!`);
    }
  }
  return { entity: updated, log };
}
function tickStatusEffects(effects) {
  return effects.map((e) => ({ ...e, duration: e.duration - 1 })).filter((e) => e.duration > 0);
}
function isStunned(effects) {
  return effects.some((e) => e.type === "stun" && e.duration > 0);
}
function removeStun(effects) {
  return effects.filter((e) => e.type !== "stun");
}
function canUseSkill(hero, skill) {
  return skill.useCols.includes(hero.position.col);
}
function matchesSkillTarget(skill, pos) {
  if (!skill.targetCols.includes(pos.col)) return false;
  if (skill.targetRows && !skill.targetRows.includes(pos.row)) return false;
  return true;
}
function getValidTargets(skill, combat, isHero) {
  if (isHero) {
    if (skill.targetAlly) {
      return combat.heroes.filter((h) => h.stats.hp > 0 || h.isDeathsDoor).filter((h) => matchesSkillTarget(skill, h.position)).map((h) => h.id);
    } else {
      return combat.monsters.filter((m) => m.stats.hp > 0).filter((m) => matchesSkillTarget(skill, m.position)).map((m) => m.id);
    }
  } else {
    if (skill.targetAlly) {
      return combat.monsters.filter((m) => m.stats.hp > 0).filter((m) => matchesSkillTarget(skill, m.position)).map((m) => m.id);
    } else {
      return combat.heroes.filter((h) => h.stats.hp > 0 || h.isDeathsDoor).filter((h) => matchesSkillTarget(skill, h.position)).map((h) => h.id);
    }
  }
}
function applySkillEffects(skill, target, log) {
  if (!skill.effects || skill.effects.length === 0) return target;
  const name = target.name;
  const newEffects = [...target.statusEffects];
  const effectNames = {
    bleed: "\uCD9C\uD608",
    blight: "\uC5ED\uBCD1",
    stun: "\uAE30\uC808",
    mark: "\uD45C\uC2DD",
    buff_attack: "\uACF5\uACA9 \uAC15\uD654",
    buff_defense: "\uBC29\uC5B4 \uAC15\uD654",
    buff_speed: "\uC18D\uB3C4 \uAC15\uD654",
    debuff_attack: "\uACF5\uACA9 \uC57D\uD654",
    debuff_defense: "\uBC29\uC5B4 \uC57D\uD654",
    debuff_speed: "\uC18D\uB3C4 \uC57D\uD654"
  };
  for (const effect of skill.effects) {
    if (percentChance(effect.chance)) {
      const existingIdx = newEffects.findIndex(
        (e) => e.type === effect.type && e.source === skill.name
      );
      const newEffect = {
        type: effect.type,
        duration: effect.duration,
        value: effect.value,
        source: skill.name
      };
      if (existingIdx !== -1) {
        newEffects[existingIdx] = newEffect;
      } else {
        newEffects.push(newEffect);
      }
      log.push(`${name}\uC5D0\uAC8C ${effectNames[effect.type] ?? effect.type} \uD6A8\uACFC!`);
    }
  }
  return { ...target, statusEffects: newEffects };
}
function executeHeroSkill(combat, heroId, skillIndex, targetId) {
  const log = [];
  const newCombat = deepCopyCombat(combat);
  const heroes = newCombat.heroes;
  const monsters = newCombat.monsters;
  const heroIdx = heroes.findIndex((h) => h.id === heroId);
  if (heroIdx === -1) return { combat, log: ["\uC601\uC6C5\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."] };
  const hero = heroes[heroIdx];
  const skill = hero.skills[skillIndex];
  if (!skill) return { combat, log: ["\uC2A4\uD0AC\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."] };
  if (skill.targetAlly) {
    const targetIdx = heroes.findIndex((h) => h.id === targetId);
    if (targetIdx === -1) return { combat, log: ["\uB300\uC0C1\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."] };
    const target = heroes[targetIdx];
    log.push(`${hero.name}\uC774(\uAC00) ${skill.name}\uC744(\uB97C) ${target.name}\uC5D0\uAC8C \uC0AC\uC6A9!`);
    if (skill.heal) {
      const healAmount = randomInt(skill.heal.min, skill.heal.max);
      heroes[targetIdx] = applyHealing(target, healAmount);
      log.push(`{bold}{green-fg}${target.name}\uC774(\uAC00) HP ${healAmount} \uD68C\uBCF5!{/green-fg}{/bold}`);
    }
    if (skill.effects) {
      heroes[targetIdx] = applySkillEffects(skill, heroes[targetIdx], log);
    }
    if (skill.id === "battlefield_medicine" || skill.id === "plague_doctor_battlefield_medicine") {
      heroes[targetIdx] = {
        ...heroes[targetIdx],
        statusEffects: heroes[targetIdx].statusEffects.filter((e) => e.type !== "bleed" && e.type !== "blight")
      };
      log.push("\uCD9C\uD608/\uC5ED\uBCD1 \uD574\uC81C!");
    }
  } else {
    const targetIds = [];
    if (skill.targetCount > 1) {
      const validTargets = getValidTargets(skill, newCombat, true);
      targetIds.push(...validTargets.slice(0, skill.targetCount));
    } else {
      targetIds.push(targetId);
    }
    for (const tid of targetIds) {
      const monsterIdx = monsters.findIndex((m) => m.id === tid);
      if (monsterIdx === -1) continue;
      const target = monsters[monsterIdx];
      const effectiveStats = getEffectiveStats(hero);
      log.push(`${hero.name}\uC774(\uAC00) ${skill.name}\uC73C\uB85C ${target.name}\uC744(\uB97C) \uACF5\uACA9!`);
      if (!calculateHit(effectiveStats.accuracy, skill, target.stats.dodge)) {
        log.push("\uBE57\uB098\uAC10!");
        continue;
      }
      const { damage, isCrit } = calculateDamage(effectiveStats.attack, skill, target.stats.defense, effectiveStats.crit);
      if (isCrit) {
        log.push(`{bold}{yellow-fg}\uCE58\uBA85\uD0C0! ${damage} \uD53C\uD574!{/yellow-fg}{/bold}`);
      } else {
        log.push(`{bold}{red-fg}${damage} \uD53C\uD574!{/red-fg}{/bold}`);
      }
      monsters[monsterIdx] = applyDamageToMonster(target, damage);
      if (monsters[monsterIdx].stats.hp <= 0) {
        log.push(`${target.name}\uC774(\uAC00) \uC4F0\uB7EC\uC84C\uC2B5\uB2C8\uB2E4!`);
      }
      if (skill.effects && monsters[monsterIdx].stats.hp > 0) {
        monsters[monsterIdx] = applySkillEffects(skill, monsters[monsterIdx], log);
      }
    }
  }
  if (skill.selfMove && (skill.selfMove.row !== 0 || skill.selfMove.col !== 0)) {
    const currentPos = heroes[heroIdx].position;
    const newPos = {
      row: clamp(currentPos.row + skill.selfMove.row, 1, 3),
      col: clamp(currentPos.col + skill.selfMove.col, 1, 3)
    };
    heroes[heroIdx] = { ...heroes[heroIdx], position: newPos };
  }
  newCombat.log.push(...log);
  return { combat: newCombat, log };
}
function getEnemyAction(monster, heroes, monsters) {
  const aliveHeroes = heroes.filter((h) => h.stats.hp > 0 || h.isDeathsDoor);
  if (aliveHeroes.length === 0) return null;
  const availableSkills = monster.skills.filter((s) => s.useCols.includes(monster.position.col));
  if (availableSkills.length === 0) return null;
  const allyMonsters = monsters.filter((m) => m.stats.hp > 0 && m.id !== monster.id);
  const lowHpAlly = allyMonsters.find((m) => m.stats.hp / m.stats.maxHp < 0.3);
  if (lowHpAlly) {
    const healSkill = availableSkills.find((s) => s.targetAlly && s.heal);
    if (healSkill) {
      return { skill: healSkill, targetId: lowHpAlly.id };
    }
  }
  const buffSkills = availableSkills.filter((s) => s.targetAlly && !s.heal && s.effects && s.effects.length > 0);
  if (buffSkills.length > 0) {
    for (const bs of buffSkills) {
      const buffTargets = allyMonsters.filter((m) => {
        return !bs.effects.every(
          (eff) => m.statusEffects.some((se) => se.type === eff.type && se.duration >= 2)
        );
      });
      const selfNeedsBuff = !bs.effects.every(
        (eff) => monster.statusEffects.some((se) => se.type === eff.type && se.duration >= 2)
      );
      if (selfNeedsBuff && percentChance(30)) {
        return { skill: bs, targetId: monster.id };
      }
      if (buffTargets.length > 0 && percentChance(30)) {
        return { skill: bs, targetId: buffTargets[randomInt(0, buffTargets.length - 1)].id };
      }
    }
  }
  const stunSkill = availableSkills.find((s) => s.effects?.some((e) => e.type === "stun"));
  if (stunSkill && percentChance(40)) {
    const dummyCombat2 = {
      phase: "enemy_turn",
      heroes,
      monsters,
      turnOrder: [],
      currentTurnIndex: 0,
      round: 0,
      log: [],
      selectedSkillIndex: 0,
      isSurprised: false,
      enemySurprised: false
    };
    const validTargets2 = getValidTargets(stunSkill, dummyCombat2, false);
    if (validTargets2.length > 0) {
      const nonStunned = validTargets2.filter((tid) => {
        const h = heroes.find((hero) => hero.id === tid);
        return h && !isStunned(h.statusEffects);
      });
      const target = nonStunned.length > 0 ? nonStunned[randomInt(0, nonStunned.length - 1)] : validTargets2[randomInt(0, validTargets2.length - 1)];
      return { skill: stunSkill, targetId: target };
    }
  }
  const damageSkills = availableSkills.filter((s) => !s.targetAlly && (s.damage.min > 0 || s.damage.max > 0));
  const chosenSkill = damageSkills.length > 0 ? damageSkills[randomInt(0, damageSkills.length - 1)] : availableSkills[randomInt(0, availableSkills.length - 1)];
  const dummyCombat = {
    phase: "enemy_turn",
    heroes,
    monsters,
    turnOrder: [],
    currentTurnIndex: 0,
    round: 0,
    log: [],
    selectedSkillIndex: 0,
    isSurprised: false,
    enemySurprised: false
  };
  const validTargets = getValidTargets(chosenSkill, dummyCombat, false);
  if (validTargets.length === 0) return null;
  const markedTargets = validTargets.filter((tid) => {
    const h = heroes.find((hero) => hero.id === tid);
    return h && h.statusEffects.some((e) => e.type === "mark");
  });
  let targetId;
  if (markedTargets.length > 0) {
    targetId = markedTargets[randomInt(0, markedTargets.length - 1)];
  } else {
    const sorted = validTargets.map((tid) => ({ id: tid, hp: heroes.find((h) => h.id === tid)?.stats.hp ?? 999 })).sort((a, b) => a.hp - b.hp);
    if (percentChance(60)) {
      targetId = sorted[0].id;
    } else {
      targetId = validTargets[randomInt(0, validTargets.length - 1)];
    }
  }
  return { skill: chosenSkill, targetId };
}
function executeEnemyTurn(combat, monsterId) {
  const log = [];
  const newCombat = deepCopyCombat(combat);
  const heroes = newCombat.heroes;
  const monsters = newCombat.monsters;
  const monsterIdx = monsters.findIndex((m) => m.id === monsterId);
  if (monsterIdx === -1) return { combat, log: ["\uBAAC\uC2A4\uD130\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."] };
  const monster = monsters[monsterIdx];
  const dotResult = processStatusEffects(monster);
  monsters[monsterIdx] = dotResult.entity;
  log.push(...dotResult.log);
  if (monsters[monsterIdx].stats.hp <= 0) {
    log.push(`${monster.name}\uC774(\uAC00) \uC0C1\uD0DC\uC774\uC0C1\uC73C\uB85C \uC4F0\uB7EC\uC84C\uC2B5\uB2C8\uB2E4!`);
    newCombat.log.push(...log);
    return { combat: newCombat, log };
  }
  if (isStunned(monsters[monsterIdx].statusEffects)) {
    log.push(`${monster.name}\uC740(\uB294) \uAE30\uC808 \uC0C1\uD0DC\uC785\uB2C8\uB2E4!`);
    monsters[monsterIdx] = {
      ...monsters[monsterIdx],
      statusEffects: removeStun(monsters[monsterIdx].statusEffects)
    };
    newCombat.log.push(...log);
    return { combat: newCombat, log };
  }
  monsters[monsterIdx] = {
    ...monsters[monsterIdx],
    statusEffects: tickStatusEffects(monsters[monsterIdx].statusEffects)
  };
  if (monsters[monsterIdx].isBoss) {
    const patternResult = executeBossPattern(newCombat, monsters[monsterIdx]);
    if (patternResult) {
      log.push(...patternResult.log);
      Object.assign(newCombat, patternResult.combat);
      newCombat.heroes = patternResult.combat.heroes;
      newCombat.monsters = patternResult.combat.monsters;
      if (patternResult.combat.turnOrder) newCombat.turnOrder = patternResult.combat.turnOrder;
      if (patternResult.skipNormalAction) {
        newCombat.log.push(...log);
        return { combat: newCombat, log };
      }
    }
  }
  const action = getEnemyAction(monsters[monsterIdx], heroes, monsters);
  if (!action) {
    log.push(`${monster.name}\uC740(\uB294) \uD589\uB3D9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.`);
    newCombat.log.push(...log);
    return { combat: newCombat, log };
  }
  const { skill, targetId } = action;
  if (skill.targetAlly && skill.heal) {
    const allyIdx = monsters.findIndex((m) => m.id === targetId);
    if (allyIdx !== -1) {
      const healAmount = randomInt(skill.heal.min, skill.heal.max);
      const ally = monsters[allyIdx];
      const newHp = clamp(ally.stats.hp + healAmount, 0, ally.stats.maxHp);
      monsters[allyIdx] = { ...ally, stats: { ...ally.stats, hp: newHp } };
      log.push(`${monster.name}\uC774(\uAC00) ${skill.name}\uC73C\uB85C ${ally.name}\uC744(\uB97C) ${healAmount} \uCE58\uC720!`);
    }
  } else {
    const targetIds = [];
    if (skill.targetCount > 1) {
      const validTargets = getValidTargets(skill, newCombat, false);
      targetIds.push(...validTargets.slice(0, skill.targetCount));
    } else {
      targetIds.push(targetId);
    }
    for (const tid of targetIds) {
      const heroIdx = heroes.findIndex((h) => h.id === tid);
      if (heroIdx === -1) continue;
      const target = heroes[heroIdx];
      const targetEffStats = getEffectiveStats(target);
      log.push(`${monster.name}\uC774(\uAC00) ${skill.name}\uC73C\uB85C ${target.name}\uC744(\uB97C) \uACF5\uACA9!`);
      if (!calculateHit(monster.stats.accuracy, skill, targetEffStats.dodge)) {
        log.push("\uBE57\uB098\uAC10!");
        continue;
      }
      const { damage, isCrit } = calculateDamage(monster.stats.attack, skill, targetEffStats.defense);
      if (isCrit) {
        log.push(`{bold}{yellow-fg}\uCE58\uBA85\uD0C0! ${damage} \uD53C\uD574!{/yellow-fg}{/bold}`);
      } else {
        log.push(`{bold}{red-fg}${damage} \uD53C\uD574!{/red-fg}{/bold}`);
      }
      const damageResult = applyDamageToHero(target, damage);
      heroes[heroIdx] = damageResult.hero;
      log.push(...damageResult.log);
      if (skill.effects && heroes[heroIdx].stats.hp > 0) {
        heroes[heroIdx] = applySkillEffects(skill, heroes[heroIdx], log);
      }
    }
  }
  newCombat.log.push(...log);
  return { combat: newCombat, log };
}
function checkCombatEnd(combat) {
  const aliveMonsters = combat.monsters.filter((m) => m.stats.hp > 0);
  if (aliveMonsters.length === 0) return "victory";
  const aliveHeroes = combat.heroes.filter((h) => h.stats.hp > 0 || h.isDeathsDoor);
  if (aliveHeroes.length === 0) return "defeat";
  return "ongoing";
}

// src/engine/hero-ai.ts
function getHeroAutoAction(hero, combat) {
  const usableSkills = hero.skills.filter((s) => canUseSkill(hero, s));
  if (usableSkills.length === 0) return null;
  const aliveHeroes = combat.heroes.filter((h) => h.stats.hp > 0);
  const aliveMonsters = combat.monsters.filter((m) => m.stats.hp > 0);
  const healSkills = usableSkills.filter((s) => s.targetAlly && s.heal);
  if (healSkills.length > 0) {
    const woundedAlly = aliveHeroes.filter((h) => h.stats.hp / h.stats.maxHp < 0.4 && h.stats.hp > 0).sort((a, b) => a.stats.hp / a.stats.maxHp - b.stats.hp / b.stats.maxHp)[0];
    if (woundedAlly) {
      const healSkill = healSkills[0];
      const skillIndex = hero.skills.indexOf(healSkill);
      const validTargets = getValidTargets(healSkill, combat, true);
      if (validTargets.includes(woundedAlly.id)) {
        return { skillIndex, targetId: woundedAlly.id };
      }
    }
  }
  if (healSkills.length > 0 && hero.class === "vestal") {
    const needsHeal = aliveHeroes.filter((h) => h.stats.hp / h.stats.maxHp < 0.6 && h.stats.hp > 0).sort((a, b) => a.stats.hp / a.stats.maxHp - b.stats.hp / b.stats.maxHp)[0];
    if (needsHeal) {
      const healSkill = healSkills[0];
      const skillIndex = hero.skills.indexOf(healSkill);
      const validTargets = getValidTargets(healSkill, combat, true);
      if (validTargets.includes(needsHeal.id)) {
        return { skillIndex, targetId: needsHeal.id };
      }
    }
  }
  if (Math.random() < 0.3) {
    const stunSkills = usableSkills.filter(
      (s) => !s.targetAlly && s.effects?.some((e) => e.type === "stun")
    );
    if (stunSkills.length > 0) {
      const stunSkill = stunSkills[0];
      const validTargets = getValidTargets(stunSkill, combat, true);
      const unstunnedTargets = validTargets.filter((tid) => {
        const m = aliveMonsters.find((mon) => mon.id === tid);
        return m && !m.statusEffects.some((e) => e.type === "stun");
      });
      if (unstunnedTargets.length > 0) {
        const skillIndex = hero.skills.indexOf(stunSkill);
        const sorted = unstunnedTargets.map((tid) => ({
          id: tid,
          hp: aliveMonsters.find((m) => m.id === tid)?.stats.hp ?? 0
        })).sort((a, b) => b.hp - a.hp);
        return { skillIndex, targetId: sorted[0].id };
      }
    }
  }
  const damageSkills = usableSkills.filter((s) => !s.targetAlly && s.damage.max > 0);
  if (damageSkills.length > 0) {
    const bestSkill = [...damageSkills].sort(
      (a, b) => (b.damage.min + b.damage.max) / 2 - (a.damage.min + a.damage.max) / 2
    )[0];
    const validTargets = getValidTargets(bestSkill, combat, true);
    if (validTargets.length > 0) {
      const skillIndex = hero.skills.indexOf(bestSkill);
      const markedTargets = validTargets.filter((tid) => {
        const m = aliveMonsters.find((mon) => mon.id === tid);
        return m && m.statusEffects.some((e) => e.type === "mark");
      });
      if (markedTargets.length > 0) {
        return { skillIndex, targetId: markedTargets[0] };
      }
      const sorted = validTargets.map((tid) => ({
        id: tid,
        hp: aliveMonsters.find((m) => m.id === tid)?.stats.hp ?? 999
      })).sort((a, b) => a.hp - b.hp);
      return { skillIndex, targetId: sorted[0].id };
    }
  }
  const anyAttackSkills = usableSkills.filter((s) => !s.targetAlly);
  for (const skill of anyAttackSkills) {
    const validTargets = getValidTargets(skill, combat, true);
    if (validTargets.length > 0) {
      const skillIndex = hero.skills.indexOf(skill);
      const sorted = validTargets.map((tid) => ({
        id: tid,
        hp: aliveMonsters.find((m) => m.id === tid)?.stats.hp ?? 999
      })).sort((a, b) => a.hp - b.hp);
      return { skillIndex, targetId: sorted[0].id };
    }
  }
  for (const skill of usableSkills) {
    if (!skill.targetAlly) continue;
    if (skill.effects && skill.effects.length > 0) {
      const buffType = skill.effects[0].type;
      const alreadyBuffed = aliveHeroes.filter(
        (h) => h.statusEffects.some((e) => e.type === buffType && e.duration >= 2)
      ).length;
      if (alreadyBuffed >= Math.ceil(aliveHeroes.length * 0.5)) continue;
    }
    const skillIndex = hero.skills.indexOf(skill);
    const validTargets = getValidTargets(skill, combat, true);
    if (validTargets.length > 0) {
      if (skill.heal) {
        const mostHurt = validTargets.map((tid) => ({ id: tid, hp: aliveHeroes.find((h) => h.id === tid)?.stats.hp ?? 999 })).sort((a, b) => a.hp - b.hp)[0];
        if (mostHurt) return { skillIndex, targetId: mostHurt.id };
      }
      const selfTarget = validTargets.find((tid) => tid === hero.id);
      return { skillIndex, targetId: selfTarget || validTargets[0] };
    }
  }
  return null;
}

// src/screens/CombatScreen.ts
var CombatScreen = class extends BaseScreen {
  gridBox;
  infoBox;
  logBox;
  headerBox;
  turnOrderBox;
  hintBox;
  combat;
  currentPhase = "init";
  speed = 1;
  destroyed = false;
  paused = false;
  destroy() {
    this.destroyed = true;
    super.destroy();
  }
  render() {
    const state = this.store.getState();
    if (!state.combat) return;
    this.combat = state.combat;
    this.speed = state.gameSpeed;
    this.paused = state.paused;
    if (this.combat.turnOrder.length === 0) {
      let turnOrder = generateTurnOrder(this.combat.heroes, this.combat.monsters);
      if (this.combat.isSurprised && this.combat.round === 1) {
        const enemies = turnOrder.filter((t) => !t.isHero);
        const heroes = turnOrder.filter((t) => t.isHero);
        turnOrder = [...enemies, ...heroes];
      } else if (this.combat.enemySurprised && this.combat.round === 1) {
        const heroes = turnOrder.filter((t) => t.isHero);
        const enemies = turnOrder.filter((t) => !t.isHero);
        turnOrder = [...heroes, ...enemies];
      }
      this.combat = { ...this.combat, turnOrder, currentTurnIndex: 0 };
      this.store.dispatch({ type: "SET_COMBAT", combat: this.combat });
    }
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      style: { bg: "black" }
    });
    this.headerBox = this.createBox({
      top: 0,
      left: 0,
      width: "25%",
      height: 3,
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "red" } }
    });
    this.turnOrderBox = this.createBox({
      top: 3,
      left: 0,
      width: "25%",
      height: 3,
      tags: true,
      border: { type: "line" },
      label: " \uC21C\uC11C ",
      style: { fg: "white", bg: "black", border: { fg: "gray" }, label: { fg: "gray" } }
    });
    this.logBox = this.createBox({
      top: 6,
      left: 0,
      width: "25%",
      bottom: 1,
      label: " \uC804\uD22C \uAE30\uB85D ",
      tags: true,
      border: { type: "line" },
      scrollable: true,
      alwaysScroll: true,
      style: { fg: "gray", bg: "black", border: { fg: "gray" }, label: { fg: "gray" } }
    });
    this.gridBox = this.createBox({
      top: 0,
      left: "25%",
      width: "50%",
      bottom: 1,
      label: " \uC804\uC7A5 ",
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "yellow" }, label: { fg: "yellow" } }
    });
    this.infoBox = this.createBox({
      top: 0,
      left: "75%",
      width: "25%",
      bottom: 1,
      label: " \uC804\uD22C \uC815\uBCF4 ",
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "cyan" }, label: { fg: "cyan" } }
    });
    this.hintBox = this.createBox({
      bottom: 0,
      left: 0,
      width: "100%",
      height: 1,
      tags: true,
      content: "{gray-fg}1/2/3:\uC18D\uB3C4  Space:\uC77C\uC2DC\uC815\uC9C0  P:\uBB3C\uC57D  Esc:\uD3EC\uAE30{/gray-fg}",
      style: { fg: "gray", bg: "black" }
    });
    this.setupKeys();
    this.updateDisplay();
    this.advanceTurn();
  }
  updateDisplay() {
    if (this.destroyed) return;
    this.updateHeader();
    this.updateTurnOrder();
    this.updateGrid();
    this.updateInfo();
    this.updateLog();
    this.screen.render();
  }
  updateHeader() {
    const towerState = this.store.getState().tower;
    const floorNum = towerState ? towerState.currentFloor : 0;
    const isBossFloor = floorNum > 0 && floorNum % 10 === 0;
    const floorLabel = isBossFloor ? `{red-fg}B${floorNum}{/red-fg}` : `${floorNum}F`;
    const speedBtns = [1, 2, 3].map((s) => s === this.speed ? `{yellow-fg}[${s}]{/yellow-fg}` : `{gray-fg}[${s}]{/gray-fg}`).join("");
    const pauseLabel = this.paused ? " {red-fg}\u23F8{/red-fg}" : "";
    this.headerBox.setContent(` R${this.combat.round} ${floorLabel} ${speedBtns}${pauseLabel}`);
  }
  updateTurnOrder() {
    const currentIdx = this.combat.currentTurnIndex;
    const order = this.combat.turnOrder;
    let content = "";
    const count = Math.min(6, order.length);
    for (let i = 0; i < count; i++) {
      const idx = (currentIdx + i) % order.length;
      if (idx >= order.length) break;
      const entry = order[idx];
      let name = "???";
      let color = "gray";
      if (entry.isHero) {
        const hero = this.combat.heroes.find((h) => h.id === entry.id);
        if (hero && hero.stats.hp > 0) {
          name = hero.name;
          color = "cyan";
        } else continue;
      } else {
        const monster = this.combat.monsters.find((m) => m.id === entry.id);
        if (monster && monster.stats.hp > 0) {
          name = monster.name;
          color = "red";
        } else continue;
      }
      const marker = i === 0 ? "{bold}{yellow-fg}>{/yellow-fg}{/bold}" : " ";
      content += `${marker}{${color}-fg}${name}{/${color}-fg} `;
    }
    this.turnOrderBox.setContent(content);
  }
  /** Truncate a name to fit in a grid cell (max ~6 display chars) */
  truncName(name, maxWidth = 6) {
    let width = 0;
    let result = "";
    for (const ch of name) {
      const w = ch.charCodeAt(0) > 127 ? 2 : 1;
      if (width + w > maxWidth) break;
      width += w;
      result += ch;
    }
    return result;
  }
  /** Build a 3x3 grid string for one side (enemy or ally) */
  buildGridSide(units, isEnemy) {
    const colOrder = isEnemy ? [3, 2, 1] : [1, 2, 3];
    const colLabels = isEnemy ? ["\uD6C4", "\uC911", "\uC804"] : ["\uC804", "\uC911", "\uD6C4"];
    const CELL_W = 10;
    const lines = [];
    let headerLine = " ";
    for (let ci = 0; ci < 3; ci++) {
      const label = colLabels[ci];
      headerLine += `   ${label}     `;
    }
    lines.push(headerLine);
    let topBorder = " ";
    for (let ci = 0; ci < 3; ci++) {
      topBorder += "\u250C" + "\u2500".repeat(CELL_W) + "\u2510";
    }
    lines.push(topBorder);
    for (let row = 1; row <= 3; row++) {
      let nameLine = " ";
      let hpLine = " ";
      let bottomBorder = " ";
      const isLastRow = row === 3;
      for (let ci = 0; ci < 3; ci++) {
        const col = colOrder[ci];
        const unit = units.find((u) => u.pos.row === row && u.pos.col === col && !u.isDead);
        if (unit) {
          const borderColor = unit.isCurrent ? "yellow" : isEnemy ? "red" : "cyan";
          const nameColor = unit.isBoss ? "red" : isEnemy ? "red" : "cyan";
          const truncated = this.truncName(unit.name, CELL_W);
          let nameDisplayWidth = 0;
          for (const ch of truncated) {
            nameDisplayWidth += ch.charCodeAt(0) > 127 ? 2 : 1;
          }
          const namePad = Math.max(0, CELL_W - nameDisplayWidth);
          nameLine += `{${borderColor}-fg}\u2502{/${borderColor}-fg}{${nameColor}-fg}${truncated}{/${nameColor}-fg}${" ".repeat(namePad)}{${borderColor}-fg}\u2502{/${borderColor}-fg}`;
          const hpPct = unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
          const hpColor = hpPct > 0.5 ? "green" : hpPct > 0.25 ? "yellow" : "red";
          const barLen = CELL_W;
          const filled = Math.round(hpPct * barLen);
          const hpBar = `{${hpColor}-fg}${"\u2588".repeat(filled)}{/${hpColor}-fg}{gray-fg}${"\u2591".repeat(barLen - filled)}{/gray-fg}`;
          hpLine += `{${borderColor}-fg}\u2502{/${borderColor}-fg}${hpBar}{${borderColor}-fg}\u2502{/${borderColor}-fg}`;
        } else {
          nameLine += "{gray-fg}\u2502{/gray-fg}" + " ".repeat(CELL_W) + "{gray-fg}\u2502{/gray-fg}";
          hpLine += "{gray-fg}\u2502{/gray-fg}{gray-fg}" + "\u2500".repeat(CELL_W) + "{/gray-fg}{gray-fg}\u2502{/gray-fg}";
        }
      }
      for (let ci = 0; ci < 3; ci++) {
        const col = colOrder[ci];
        const unit = units.find((u) => u.pos.row === row && u.pos.col === col && !u.isDead);
        const borderColor = unit?.isCurrent ? "yellow" : "gray";
        if (isLastRow) {
          bottomBorder += `{${borderColor}-fg}\u2514${"\u2500".repeat(CELL_W)}\u2518{/${borderColor}-fg}`;
        } else {
          bottomBorder += `{${borderColor}-fg}\u251C${"\u2500".repeat(CELL_W)}\u2524{/${borderColor}-fg}`;
        }
      }
      lines.push(nameLine);
      lines.push(hpLine);
      lines.push(bottomBorder);
    }
    return lines;
  }
  updateGrid() {
    const currentTurn = this.combat.turnOrder[this.combat.currentTurnIndex];
    const enemyUnits = this.combat.monsters.map((m) => ({
      name: m.isBoss ? "\u2605" + m.name : m.name,
      hp: m.stats.hp,
      maxHp: m.stats.maxHp,
      pos: m.position,
      isCurrent: !!(currentTurn && !currentTurn.isHero && currentTurn.id === m.id),
      isDead: m.stats.hp <= 0,
      isBoss: m.isBoss,
      effects: this.formatEffects(m.statusEffects)
    }));
    const allyUnits = this.combat.heroes.map((h) => ({
      name: h.isMainCharacter ? "\u2605" + h.name : h.name,
      hp: h.stats.hp,
      maxHp: h.stats.maxHp,
      pos: h.position,
      isCurrent: !!(currentTurn && currentTurn.isHero && currentTurn.id === h.id),
      isDead: h.stats.hp <= 0 && !h.isDeathsDoor,
      isBoss: false,
      effects: this.formatEffects(h.statusEffects)
    }));
    const enemyGrid = this.buildGridSide(enemyUnits, true);
    const allyGrid = this.buildGridSide(allyUnits, false);
    let content = "";
    content += ` {bold}{red-fg}[ \uC801 \uC9C4\uC601 ]{/red-fg}{/bold}              {bold}{cyan-fg}[ \uC544\uAD70 \uC9C4\uC601 ]{/cyan-fg}{/bold}
`;
    const maxLines = Math.max(enemyGrid.length, allyGrid.length);
    for (let i = 0; i < maxLines; i++) {
      const eLine = i < enemyGrid.length ? enemyGrid[i] : "";
      const aLine = i < allyGrid.length ? allyGrid[i] : "";
      content += `${eLine}  ${aLine}
`;
    }
    this.gridBox.setContent(content);
  }
  updateInfo() {
    const currentTurn = this.combat.turnOrder[this.combat.currentTurnIndex];
    let turnLabel = "";
    if (currentTurn) {
      if (currentTurn.isHero) {
        const hero = this.combat.heroes.find((h) => h.id === currentTurn.id);
        turnLabel = hero ? `{yellow-fg}\u25B6 ${hero.name}\uC758 \uCC28\uB840{/yellow-fg}` : "";
      } else {
        const monster = this.combat.monsters.find((m) => m.id === currentTurn.id);
        turnLabel = monster ? `{red-fg}\u25B6 ${monster.name}\uC758 \uCC28\uB840{/red-fg}` : "";
      }
    }
    let content = "";
    content += turnLabel + "\n\n";
    const aliveEnemies = this.combat.monsters.filter((m) => m.stats.hp > 0);
    if (aliveEnemies.length > 0) {
      content += " {bold}{red-fg}[ \uC801 ]{/red-fg}{/bold}\n";
      for (const m of aliveEnemies) {
        const effects = this.formatEffects(m.statusEffects);
        const hpPct = m.stats.hp / m.stats.maxHp;
        const hpColor = hpPct > 0.5 ? "green" : hpPct > 0.25 ? "yellow" : "red";
        const boss = m.isBoss ? "{red-fg}[B]{/red-fg}" : "";
        const barLen = 10;
        const filled = Math.round(hpPct * barLen);
        const hpBar = `{${hpColor}-fg}${"\u2588".repeat(filled)}{/${hpColor}-fg}{gray-fg}${"\u2591".repeat(barLen - filled)}{/gray-fg}`;
        content += ` ${boss}{red-fg}${m.name}{/red-fg}
`;
        content += ` ${hpBar} {${hpColor}-fg}${m.stats.hp}/${m.stats.maxHp}{/${hpColor}-fg}
`;
        if (effects) content += ` ${effects}
`;
      }
    }
    content += "\n";
    const aliveHeroes = this.combat.heroes.filter((h) => h.stats.hp > 0 || h.isDeathsDoor);
    if (aliveHeroes.length > 0) {
      content += " {bold}{cyan-fg}[ \uC544\uAD70 ]{/cyan-fg}{/bold}\n";
      for (const h of aliveHeroes) {
        const effects = this.formatEffects(h.statusEffects);
        const hpPct = h.stats.hp / h.stats.maxHp;
        const hpColor = hpPct > 0.5 ? "green" : hpPct > 0.25 ? "yellow" : "red";
        const deathsDoor = h.isDeathsDoor ? "{red-fg}[\uC8FD\uBB38]{/red-fg}" : "";
        const mc = h.isMainCharacter ? "{yellow-fg}[MC]{/yellow-fg}" : "";
        const barLen = 10;
        const filled = Math.round(hpPct * barLen);
        const hpBar = `{${hpColor}-fg}${"\u2588".repeat(filled)}{/${hpColor}-fg}{gray-fg}${"\u2591".repeat(barLen - filled)}{/gray-fg}`;
        content += ` ${mc}{cyan-fg}${h.name}{/cyan-fg} ${deathsDoor}
`;
        content += ` ${hpBar} {${hpColor}-fg}${h.stats.hp}/${h.stats.maxHp}{/${hpColor}-fg}
`;
        if (effects) content += ` ${effects}
`;
      }
    }
    this.infoBox.setContent(content);
  }
  formatEffects(effects) {
    return effects.map((e) => {
      const colors = {
        bleed: "red",
        blight: "green",
        stun: "yellow",
        mark: "magenta",
        buff_attack: "cyan",
        buff_defense: "cyan",
        buff_speed: "cyan",
        debuff_attack: "red",
        debuff_defense: "red",
        debuff_speed: "red"
      };
      const names = {
        bleed: "\uCD9C\uD608",
        blight: "\uC5ED\uBCD1",
        stun: "\uAE30\uC808",
        mark: "\uD45C\uC2DD",
        buff_attack: "\uACF5\u2191",
        buff_defense: "\uBC29\u2191",
        buff_speed: "\uC18D\u2191",
        debuff_attack: "\uACF5\u2193",
        debuff_defense: "\uBC29\u2193",
        debuff_speed: "\uC18D\u2193"
      };
      const c = colors[e.type] || "white";
      const n = names[e.type] || e.type;
      return `{${c}-fg}[${n}]{/${c}-fg}`;
    }).join(" ");
  }
  updateLog() {
    const logs = this.combat.log.slice(-8);
    this.logBox.setContent(logs.join("\n"));
    this.logBox.setScrollPerc(100);
  }
  setupKeys() {
    this.registerKey(["1"], () => {
      if (this.currentPhase === "victory" || this.currentPhase === "defeat") return;
      this.speed = 1;
      this.store.dispatch({ type: "SET_GAME_SPEED", speed: 1 });
      this.updateHeader();
      this.screen.render();
    });
    this.registerKey(["2"], () => {
      if (this.currentPhase === "victory" || this.currentPhase === "defeat") return;
      this.speed = 2;
      this.store.dispatch({ type: "SET_GAME_SPEED", speed: 2 });
      this.updateHeader();
      this.screen.render();
    });
    this.registerKey(["3"], () => {
      if (this.currentPhase === "victory" || this.currentPhase === "defeat") return;
      this.speed = 3;
      this.store.dispatch({ type: "SET_GAME_SPEED", speed: 3 });
      this.updateHeader();
      this.screen.render();
    });
    this.registerKey(["space"], () => {
      if (this.currentPhase === "victory" || this.currentPhase === "defeat") return;
      this.paused = !this.paused;
      this.store.dispatch({ type: "TOGGLE_PAUSE" });
      this.updateHeader();
      this.screen.render();
      if (!this.paused) {
        this.advanceTurn();
      }
    });
    this.registerKey(["escape"], () => {
      if (this.currentPhase === "victory" || this.currentPhase === "defeat") return;
      this.showAbandonConfirm();
    });
    this.registerKey(["p"], () => {
      if (this.currentPhase === "victory" || this.currentPhase === "defeat") return;
      if (!this.paused) {
        this.paused = true;
        this.store.dispatch({ type: "TOGGLE_PAUSE" });
        this.updateHeader();
        this.screen.render();
      }
      this.showPotionSelect();
    });
  }
  showAbandonConfirm() {
    this.paused = true;
    const confirmBox = blessed7.box({
      top: "center",
      left: "center",
      width: 40,
      height: 8,
      content: "{bold}{red-fg}\uC815\uB9D0 \uD3EC\uAE30\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?{/red-fg}{/bold}\n\n\uD3EC\uAE30\uD558\uBA74 \uB358\uC804\uC744 \uD0C8\uCD9C\uD569\uB2C8\uB2E4.\n\n{gray-fg}Y: \uD3EC\uAE30  N: \uCDE8\uC18C{/gray-fg}",
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "red" } },
      align: "center"
    });
    this.addWidget(confirmBox);
    this.screen.render();
    let handled = false;
    const cleanup = () => {
      if (handled) return;
      handled = true;
      confirmBox.destroy();
      const idx = this.widgets.indexOf(confirmBox);
      if (idx !== -1) this.widgets.splice(idx, 1);
      this.screen.unkey(["y"], yHandler);
      this.screen.unkey(["n", "escape"], nHandler);
    };
    const yHandler = () => {
      if (handled) return;
      cleanup();
      this.store.dispatch({ type: "SET_CONTINUOUS_RUN", enabled: false });
      this.store.dispatch({ type: "NAVIGATE", screen: "town" });
    };
    const nHandler = () => {
      if (handled) return;
      cleanup();
      this.paused = false;
      this.store.dispatch({ type: "TOGGLE_PAUSE" });
      this.updateHeader();
      this.screen.render();
      this.advanceTurn();
    };
    this.screen.key(["y"], yHandler);
    this.screen.key(["n", "escape"], nHandler);
  }
  executeAutoHeroTurn() {
    if (this.destroyed) return;
    const turn = this.combat.turnOrder[this.combat.currentTurnIndex];
    if (!turn || !turn.isHero) return;
    const hero = this.combat.heroes.find((h) => h.id === turn.id);
    if (!hero || hero.stats.hp <= 0) return;
    const action = getHeroAutoAction(hero, this.combat);
    if (!action) {
      this.combat.log.push(`${hero.name}: \uC720\uD6A8\uD55C \uD589\uB3D9 \uC5C6\uC74C, \uD134 \uB118\uAE40`);
      this.updateDisplay();
      setTimeout(() => {
        if (!this.destroyed) this.nextTurn();
      }, Math.floor(200 / this.speed));
      return;
    }
    this.currentPhase = "animating";
    setTimeout(() => {
      if (!this.destroyed && !this.paused) this.executeHeroAction(action.skillIndex, action.targetId);
    }, Math.floor(600 / this.speed));
  }
  checkMainCharFlee() {
    const state = this.store.getState();
    const mcId = state.mainCharacterId;
    if (!mcId) return false;
    const mc = this.combat.heroes.find((h) => h.id === mcId);
    if (!mc || mc.stats.hp <= 0) return false;
    if (mc.stats.hp <= mc.stats.maxHp * 0.05) {
      this.combat.log.push("{bold}{red-fg}\uC8FC\uC778\uACF5\uC758 HP\uAC00 \uC704\uD5D8! \uAE34\uAE09 \uB3C4\uC8FC!{/red-fg}{/bold}");
      this.updateDisplay();
      setTimeout(() => {
        if (!this.destroyed) {
          this.store.dispatch({ type: "MAIN_CHAR_FLEE" });
        }
      }, Math.floor(1500 / this.speed));
      return true;
    }
    return false;
  }
  checkMainCharDead() {
    const state = this.store.getState();
    const mcId = state.mainCharacterId;
    if (!mcId) return false;
    const mc = this.combat.heroes.find((h) => h.id === mcId);
    if (mc && mc.stats.hp <= 0 && !mc.isDeathsDoor) {
      this.combat.log.push("{bold}{red-fg}\uC8FC\uC778\uACF5\uC774 \uC4F0\uB7EC\uC84C\uC2B5\uB2C8\uB2E4!{/red-fg}{/bold}");
      this.store.dispatch({ type: "SET_COMBAT", combat: this.combat });
      this.updateDisplay();
      setTimeout(() => {
        if (!this.destroyed) {
          this.store.dispatch({ type: "END_COMBAT_DEFEAT" });
        }
      }, Math.floor(2e3 / this.speed));
      return true;
    }
    return false;
  }
  executeHeroAction(skillIndex, targetId) {
    if (this.destroyed) return;
    const turn = this.combat.turnOrder[this.combat.currentTurnIndex];
    if (!turn) return;
    const monsterHpBefore = {};
    for (const m of this.combat.monsters) {
      monsterHpBefore[m.id] = m.stats.hp;
    }
    const result = executeHeroSkill(this.combat, turn.id, skillIndex, targetId);
    this.combat = result.combat;
    this.store.dispatch({ type: "SET_COMBAT", combat: this.combat });
    this.updateDisplay();
    if (this.checkMainCharFlee()) return;
    if (this.checkMainCharDead()) return;
    const endState = checkCombatEnd(this.combat);
    if (endState === "victory") {
      this.handleVictory();
      return;
    }
    if (endState === "defeat") {
      this.handleDefeat();
      return;
    }
    setTimeout(() => {
      if (!this.destroyed && !this.paused) this.nextTurn();
    }, Math.floor(400 / this.speed));
  }
  advanceTurn() {
    if (this.destroyed) return;
    while (this.combat.currentTurnIndex < this.combat.turnOrder.length) {
      const turn = this.combat.turnOrder[this.combat.currentTurnIndex];
      if (turn.isHero) {
        const hero = this.combat.heroes.find((h) => h.id === turn.id);
        if (hero && hero.stats.hp > 0) {
          const dotResult = processStatusEffects(hero);
          const updatedHero = dotResult.entity;
          const heroIdx = this.combat.heroes.findIndex((h) => h.id === hero.id);
          if (heroIdx !== -1) {
            this.combat.heroes[heroIdx] = updatedHero;
            this.combat.log.push(...dotResult.log);
          }
          if (updatedHero.stats.hp <= 0) {
            this.combat.currentTurnIndex++;
            continue;
          }
          if (isStunned(updatedHero.statusEffects)) {
            this.combat.log.push(`${updatedHero.name}\uC740(\uB294) \uAE30\uC808 \uC0C1\uD0DC\uC785\uB2C8\uB2E4!`);
            this.combat.heroes[heroIdx] = {
              ...updatedHero,
              statusEffects: removeStun(updatedHero.statusEffects)
            };
            this.combat.currentTurnIndex++;
            this.updateDisplay();
            continue;
          }
          if (heroIdx !== -1) {
            this.combat.heroes[heroIdx] = {
              ...this.combat.heroes[heroIdx],
              statusEffects: tickStatusEffects(this.combat.heroes[heroIdx].statusEffects)
            };
          }
          this.currentPhase = "animating";
          this.updateDisplay();
          this.executeAutoHeroTurn();
          return;
        }
      } else {
        const monster = this.combat.monsters.find((m) => m.id === turn.id);
        if (monster && monster.stats.hp > 0) {
          this.currentPhase = "enemy_turn";
          this.updateDisplay();
          setTimeout(() => {
            if (!this.destroyed && !this.paused) this.executeEnemyAction(turn.id);
          }, Math.floor(800 / this.speed));
          return;
        }
      }
      this.combat.currentTurnIndex++;
    }
    this.newRound();
  }
  nextTurn() {
    if (this.destroyed) return;
    this.combat.currentTurnIndex++;
    this.store.dispatch({ type: "SET_COMBAT", combat: this.combat });
    const endState = checkCombatEnd(this.combat);
    if (endState === "victory") {
      this.handleVictory();
      return;
    }
    if (endState === "defeat") {
      this.handleDefeat();
      return;
    }
    this.advanceTurn();
  }
  executeEnemyAction(monsterId) {
    if (this.destroyed) return;
    const heroHpBefore = {};
    for (const h of this.combat.heroes) {
      heroHpBefore[h.id] = h.stats.hp;
    }
    const result = executeEnemyTurn(this.combat, monsterId);
    this.combat = result.combat;
    this.store.dispatch({ type: "SET_COMBAT", combat: this.combat });
    this.updateDisplay();
    if (this.checkMainCharFlee()) return;
    if (this.checkMainCharDead()) return;
    const endState = checkCombatEnd(this.combat);
    if (endState === "victory") {
      setTimeout(() => {
        if (!this.destroyed) this.handleVictory();
      }, Math.floor(600 / this.speed));
      return;
    }
    if (endState === "defeat") {
      setTimeout(() => {
        if (!this.destroyed) this.handleDefeat();
      }, Math.floor(600 / this.speed));
      return;
    }
    setTimeout(() => {
      if (!this.destroyed && !this.paused) this.nextTurn();
    }, Math.floor(400 / this.speed));
  }
  newRound() {
    if (this.destroyed) return;
    this.combat.round++;
    this.combat.log.push(`--- \uB77C\uC6B4\uB4DC ${this.combat.round} ---`);
    this.combat.turnOrder = generateTurnOrder(this.combat.heroes, this.combat.monsters);
    this.combat.currentTurnIndex = 0;
    this.store.dispatch({ type: "SET_COMBAT", combat: this.combat });
    this.advanceTurn();
  }
  handleVictory() {
    if (this.destroyed) return;
    this.currentPhase = "victory";
    const state = this.store.getState();
    const tower = state.tower;
    const floor = tower ? tower.currentFloor : 1;
    const hasBoss = this.combat.monsters.some((m) => m.isBoss && m.stats.hp <= 0);
    const loot = hasBoss ? generateBossLoot(floor) : generateCombatLoot(floor);
    const monsterCount = this.combat.monsters.length;
    const hasBossMonster = this.combat.monsters.some((m) => m.isBoss);
    const baseExp = floor * 10 + monsterCount * 15;
    const earnedExp = hasBossMonster ? baseExp * 3 : baseExp;
    this.combat.log.push(hasBoss ? "{bold}{green-fg}\uBCF4\uC2A4 \uCC98\uCE58!{/green-fg}{/bold}" : "{green-fg}\uC804\uD22C \uC2B9\uB9AC!{/green-fg}");
    this.combat.log.push(`{bold}{yellow-fg}\uACE8\uB4DC +${loot.gold}{/yellow-fg}{/bold}`);
    this.combat.log.push(`{bold}{cyan-fg}\uACBD\uD5D8\uCE58 +${earnedExp}{/cyan-fg}{/bold}`);
    for (const item of loot.items) {
      this.combat.log.push(`\uD68D\uB4DD: ${item.name}`);
    }
    this.updateDisplay();
    const titleText = hasBoss ? "{bold}{yellow-fg}\uBCF4\uC2A4 \uCC98\uCE58!{/yellow-fg}{/bold}" : "{bold}{green-fg}\uC804\uD22C \uC2B9\uB9AC!{/green-fg}{/bold}";
    const borderColor = hasBoss ? "yellow" : "green";
    const victoryBox = blessed7.box({
      top: "center",
      left: "center",
      width: 44,
      height: 11,
      content: `${titleText}

{bold}{yellow-fg}\uACE8\uB4DC +${loot.gold}{/yellow-fg}{/bold}
{bold}{cyan-fg}\uACBD\uD5D8\uCE58 +${earnedExp}{/cyan-fg}{/bold}
\uC544\uC774\uD15C: ${loot.items.map((i) => i.name).join(", ") || "\uC5C6\uC74C"}

{gray-fg}\uC790\uB3D9 \uACC4\uC18D...{/gray-fg}`,
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: borderColor } },
      align: "center"
    });
    this.addWidget(victoryBox);
    this.screen.render();
    setTimeout(() => {
      if (this.currentPhase === "victory" && !this.destroyed) {
        this.store.dispatch({ type: "END_COMBAT_VICTORY", loot: loot.items, gold: loot.gold });
      }
    }, Math.floor(2500 / this.speed));
  }
  showPotionSelect() {
    const state = this.store.getState();
    const potions = state.inventory.filter((i) => i.consumable === true);
    if (potions.length === 0) {
      const msgBox = blessed7.box({
        top: "center",
        left: "center",
        width: 36,
        height: 5,
        content: "{yellow-fg}\uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uBB3C\uC57D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.{/yellow-fg}\n\n{gray-fg}\uC544\uBB34 \uD0A4\uB098 \uB204\uB974\uC138\uC694{/gray-fg}",
        tags: true,
        border: { type: "line" },
        style: { fg: "white", bg: "black", border: { fg: "yellow" } },
        align: "center"
      });
      this.addWidget(msgBox);
      this.screen.render();
      this.screen.onceKey([], () => {
        msgBox.destroy();
        const idx = this.widgets.indexOf(msgBox);
        if (idx !== -1) this.widgets.splice(idx, 1);
        this.screen.render();
      });
      return;
    }
    const potionLabels = potions.map((p) => {
      const effects = [];
      if (p.healAmount) effects.push(`HP+${p.healAmount}`);
      if (p.buffEffect) effects.push(`${p.buffEffect.stat}+${p.buffEffect.value}`);
      return `${p.name} (${effects.join(" ")})`;
    });
    const potionList = blessed7.list({
      top: "center",
      left: "center",
      width: 44,
      height: Math.min(potions.length + 2, 12),
      label: " \uBB3C\uC57D \uC120\uD0DD ",
      items: potionLabels,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "#ff88ff" },
        selected: { fg: "black", bg: "#ff88ff", bold: true },
        label: { fg: "#ff88ff" }
      }
    });
    this.addWidget(potionList);
    potionList.focus();
    this.screen.render();
    const cleanupPotion = () => {
      potionList.destroy();
      const idx = this.widgets.indexOf(potionList);
      if (idx !== -1) this.widgets.splice(idx, 1);
    };
    potionList.on("select", (_el, idx) => {
      if (idx >= potions.length) return;
      cleanupPotion();
      this.showPotionTargetSelect(potions[idx]);
    });
    potionList.key(["escape"], () => {
      cleanupPotion();
      this.screen.render();
    });
  }
  showPotionTargetSelect(item) {
    const aliveHeroes = this.combat.heroes.filter((h) => h.stats.hp > 0);
    if (aliveHeroes.length === 0) return;
    const heroLabels = aliveHeroes.map(
      (h) => `${h.name} (${getClassName(h.class)}) HP ${h.stats.hp}/${h.stats.maxHp}`
    );
    const heroList = blessed7.list({
      top: "center",
      left: "center",
      width: 50,
      height: Math.min(aliveHeroes.length + 2, 10),
      label: ` ${item.name} \uC0AC\uC6A9 \uB300\uC0C1 `,
      items: heroLabels,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "cyan" },
        selected: { fg: "black", bg: "cyan", bold: true },
        label: { fg: "cyan" }
      }
    });
    this.addWidget(heroList);
    heroList.focus();
    this.screen.render();
    const cleanupHero = () => {
      heroList.destroy();
      const idx = this.widgets.indexOf(heroList);
      if (idx !== -1) this.widgets.splice(idx, 1);
    };
    heroList.on("select", (_el, idx) => {
      if (idx >= aliveHeroes.length) return;
      const hero = aliveHeroes[idx];
      this.store.dispatch({ type: "USE_COMBAT_ITEM", itemId: item.id, heroId: hero.id });
      this.combat = this.store.getState().combat;
      cleanupHero();
      this.updateDisplay();
    });
    heroList.key(["escape"], () => {
      cleanupHero();
      this.showPotionSelect();
    });
  }
  handleDefeat() {
    if (this.destroyed) return;
    this.currentPhase = "defeat";
    this.combat.log.push("{red-fg}\uD30C\uD2F0\uAC00 \uC804\uBA78\uD588\uC2B5\uB2C8\uB2E4!{/red-fg}");
    this.updateDisplay();
    const defeatBox = blessed7.box({
      top: "center",
      left: "center",
      width: 40,
      height: 6,
      content: "{bold}{red-fg}\uC804\uBA78!{/red-fg}{/bold}\n\n\uB2F9\uC2E0\uC758 \uD30C\uD2F0\uB294 \uC5B4\uB460\uC5D0 \uC0BC\uCF1C\uC84C\uC2B5\uB2C8\uB2E4...\n\n{gray-fg}\uC790\uB3D9 \uACC4\uC18D...{/gray-fg}",
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "red" } },
      align: "center"
    });
    this.addWidget(defeatBox);
    this.screen.render();
    setTimeout(() => {
      if (this.currentPhase === "defeat" && !this.destroyed) {
        const state = this.store.getState();
        const allDead = state.roster.every((h) => h.stats.hp <= 0);
        if (allDead) {
          this.store.dispatch({ type: "END_COMBAT_DEFEAT" });
        } else {
          this.store.dispatch({ type: "SET_CONTINUOUS_RUN", enabled: false });
          this.store.dispatch({ type: "END_COMBAT_DEFEAT" });
        }
      }
    }, Math.floor(3e3 / this.speed));
  }
};

// src/screens/InventoryScreen.ts
import blessed8 from "blessed";
var InventoryScreen = class extends BaseScreen {
  itemList;
  detailBox;
  actionBox;
  heroSelectList = null;
  currentItems = [];
  render() {
    const state = this.store.getState();
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      style: { bg: "black" }
    });
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: 3,
      content: `{bold}{yellow-fg} \uC778\uBCA4\uD1A0\uB9AC{/yellow-fg}{/bold}  |  {yellow-fg}\uACE8\uB4DC: ${state.gold}{/yellow-fg}  |  ${state.inventory.length >= 16 ? "{red-fg}" : "{gray-fg}"}\uC544\uC774\uD15C: ${state.inventory.length}/16${state.inventory.length >= 16 ? " [\uAC00\uB4DD!]" : ""}${state.inventory.length >= 16 ? "{/red-fg}" : "{/gray-fg}"}  |  {gray-fg}Esc: \uB3CC\uC544\uAC00\uAE30{/gray-fg}`,
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "gray" } }
    });
    this.currentItems = [...state.inventory];
    const itemLabels = this.getItemLabels();
    this.itemList = blessed8.list({
      top: 3,
      left: 0,
      width: "50%",
      height: "80%",
      label: " \uC544\uC774\uD15C \uBAA9\uB85D ",
      items: itemLabels.length > 0 ? itemLabels : ["{gray-fg}(\uC544\uC774\uD15C \uC5C6\uC74C){/gray-fg}"],
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      scrollable: true,
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "yellow" },
        selected: { fg: "black", bg: "yellow", bold: true },
        label: { fg: "yellow" }
      }
    });
    this.addWidget(this.itemList);
    this.detailBox = this.createBox({
      top: 3,
      left: "50%",
      width: "50%",
      height: "50%",
      label: " \uC544\uC774\uD15C \uC815\uBCF4 ",
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "gray" }, label: { fg: "gray" } },
      content: "{gray-fg}\uC544\uC774\uD15C\uC744 \uC120\uD0DD\uD558\uC138\uC694.{/gray-fg}"
    });
    this.actionBox = this.createBox({
      top: "53%",
      left: "50%",
      width: "50%",
      height: "30%",
      label: " \uD589\uB3D9 ",
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "gray" }, label: { fg: "gray" } },
      content: "{gray-fg}Enter: \uC0AC\uC6A9/\uC7A5\uCC29\nD: \uBC84\uB9AC\uAE30\nS: \uD310\uB9E4\nEsc: \uB3CC\uC544\uAC00\uAE30{/gray-fg}"
    });
    this.createBox({
      bottom: 0,
      left: 0,
      width: "100%",
      height: 3,
      content: "{gray-fg}\u2191\u2193: \uC120\uD0DD  Enter: \uC0AC\uC6A9/\uC7A5\uCC29  D: \uBC84\uB9AC\uAE30  S: \uD310\uB9E4  Esc: \uB3CC\uC544\uAC00\uAE30{/gray-fg}",
      tags: true,
      border: { type: "line" },
      style: { fg: "gray", bg: "black", border: { fg: "gray" } },
      align: "center"
    });
    this.itemList.on("select item", (_el, index) => {
      this.showItemDetail(index);
    });
    this.itemList.on("select", (_item, index) => {
      this.handleItemAction(index);
    });
    this.registerKey(["d"], () => {
      const selected = this.itemList.selected;
      this.discardItem(selected);
    });
    this.registerKey(["s"], () => {
      const selected = this.itemList.selected;
      this.sellItem(selected);
    });
    this.registerKey(["escape"], () => {
      if (this.heroSelectList) {
        this.clearHeroSelect();
        this.itemList.focus();
        this.screen.render();
        return;
      }
      const state2 = this.store.getState();
      if (state2.tower) {
        this.store.dispatch({ type: "NAVIGATE", screen: "dungeon" });
      } else {
        this.store.dispatch({ type: "NAVIGATE", screen: "town" });
      }
    });
    this.itemList.focus();
    this.screen.render();
  }
  getItemLabels() {
    const typeLabels = {
      supply: "{green-fg}[\uBCF4\uAE09]{/green-fg}",
      weapon: "{red-fg}[\uBB34\uAE30]{/red-fg}",
      armor: "{blue-fg}[\uBC29\uC5B4]{/blue-fg}",
      trinket: "{magenta-fg}[\uC7A5\uC2E0]{/magenta-fg}",
      potion: "{#ff88ff-fg}[\uBB3C\uC57D]{/#ff88ff-fg}"
    };
    const rarityColors = {
      common: "white",
      uncommon: "green",
      rare: "blue",
      legendary: "yellow"
    };
    return this.currentItems.map((item) => {
      const type = typeLabels[item.type] || "[???]";
      const rColor = rarityColors[item.rarity] || "white";
      return `${type} {${rColor}-fg}${item.name}{/${rColor}-fg} (${item.value}G)`;
    });
  }
  showItemDetail(index) {
    if (index >= this.currentItems.length) return;
    const item = this.currentItems[index];
    const rarityNames = {
      common: "\uC77C\uBC18",
      uncommon: "\uACE0\uAE09",
      rare: "\uD76C\uADC0",
      legendary: "\uC804\uC124"
    };
    const typeNames = {
      supply: "\uBCF4\uAE09\uD488",
      weapon: "\uBB34\uAE30",
      armor: "\uBC29\uC5B4\uAD6C",
      trinket: "\uC7A5\uC2E0\uAD6C",
      potion: "\uBB3C\uC57D"
    };
    let detail = `{bold}{yellow-fg}${item.name}{/yellow-fg}{/bold}
`;
    detail += `{gray-fg}${typeNames[item.type] || "???"} | ${rarityNames[item.rarity] || "???"}{/gray-fg}

`;
    detail += `${item.description}

`;
    detail += `{yellow-fg}\uAC00\uCE58: ${item.value}G{/yellow-fg}
`;
    if (item.modifiers.length > 0) {
      detail += "\n{cyan-fg}\uD6A8\uACFC:{/cyan-fg}\n";
      for (const mod of item.modifiers) {
        const sign = mod.value > 0 ? "+" : "";
        detail += `  ${mod.stat}: ${sign}${mod.value}
`;
      }
    }
    if (item.healAmount) detail += `
{green-fg}HP \uD68C\uBCF5: ${item.healAmount}{/green-fg}`;
    if (item.buffEffect) detail += `
{yellow-fg}\uBC84\uD504: ${item.buffEffect.stat} +${item.buffEffect.value} (${item.buffEffect.duration}\uD134){/yellow-fg}`;
    let actions = "";
    if (item.consumable) {
      actions = "\n\n{green-fg}Enter: \uC0AC\uC6A9{/green-fg}  {red-fg}D: \uBC84\uB9AC\uAE30{/red-fg}";
    } else {
      actions = "\n\n{cyan-fg}Enter: \uC7A5\uCC29{/cyan-fg}  {yellow-fg}S: \uD310\uB9E4{/yellow-fg}  {red-fg}D: \uBC84\uB9AC\uAE30{/red-fg}";
    }
    this.detailBox.setContent(detail);
    this.actionBox.setContent(actions);
    this.screen.render();
  }
  handleItemAction(index) {
    if (index >= this.currentItems.length) return;
    const item = this.currentItems[index];
    if (item.consumable) {
      this.showHeroSelect(item, "use");
    } else if (item.type === "weapon" || item.type === "armor" || item.type === "trinket") {
      this.showHeroSelect(item, "equip");
    }
  }
  showHeroSelect(item, action) {
    this.clearHeroSelect();
    const state = this.store.getState();
    const heroes = state.roster.filter((h) => h.stats.hp > 0);
    if (heroes.length === 0) {
      this.detailBox.setContent("{red-fg}\uB300\uC0C1 \uC601\uC6C5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.{/red-fg}");
      this.screen.render();
      return;
    }
    const heroLabels = heroes.map((h) => {
      let extra = "";
      if (action === "equip") {
        let equipped;
        if (item.type === "weapon") equipped = h.equipment.weapon;
        else if (item.type === "armor") equipped = h.equipment.armor;
        else if (item.type === "trinket") {
          if (!h.equipment.trinket1) equipped = void 0;
          else if (!h.equipment.trinket2) equipped = void 0;
          else equipped = h.equipment.trinket1;
        }
        const currentStr = equipped ? equipped.name : "\uBE48 \uC2AC\uB86F";
        const comparison = formatEquipComparison(item, equipped);
        const compStr = comparison ? ` ${comparison}` : "";
        extra = ` ${currentStr} \u2192 ${item.name}${compStr}`;
      } else {
        extra = ` HP ${h.stats.hp}/${h.stats.maxHp}`;
      }
      return `${h.name} (${getClassName(h.class)})${extra}`;
    });
    this.heroSelectList = blessed8.list({
      top: "center",
      left: "center",
      width: 64,
      height: Math.min(heroLabels.length + 2, 12),
      label: action === "use" ? " \uB300\uC0C1 \uC120\uD0DD " : " \uC7A5\uCC29 \uB300\uC0C1 \uC120\uD0DD ",
      items: heroLabels,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "cyan" },
        selected: { fg: "black", bg: "cyan", bold: true },
        label: { fg: "cyan" }
      }
    });
    this.addWidget(this.heroSelectList);
    this.heroSelectList.focus();
    this.heroSelectList.on("select", (_el, idx) => {
      if (idx >= heroes.length) return;
      const hero = heroes[idx];
      if (action === "use") {
        this.store.dispatch({ type: "USE_ITEM", itemId: item.id, heroId: hero.id });
        this.detailBox.setContent(`{green-fg}${item.name}\uC744(\uB97C) ${hero.name}\uC5D0\uAC8C \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4!{/green-fg}`);
      } else {
        this.store.dispatch({ type: "EQUIP_ITEM", heroId: hero.id, itemId: item.id });
        this.detailBox.setContent(`{green-fg}${item.name}\uC744(\uB97C) ${hero.name}\uC5D0\uAC8C \uC7A5\uCC29\uD588\uC2B5\uB2C8\uB2E4!{/green-fg}`);
      }
      this.clearHeroSelect();
      this.refreshItems();
      this.itemList.focus();
      this.screen.render();
    });
    this.heroSelectList.key(["escape"], () => {
      this.clearHeroSelect();
      this.itemList.focus();
      this.screen.render();
    });
    this.screen.render();
  }
  clearHeroSelect() {
    if (this.heroSelectList) {
      this.heroSelectList.destroy();
      const idx = this.widgets.indexOf(this.heroSelectList);
      if (idx !== -1) this.widgets.splice(idx, 1);
      this.heroSelectList = null;
    }
  }
  discardItem(index) {
    if (index >= this.currentItems.length) return;
    const item = this.currentItems[index];
    this.store.dispatch({ type: "SELL_ITEM", itemId: item.id });
    this.detailBox.setContent(`{red-fg}${item.name}\uC744(\uB97C) \uBC84\uB838\uC2B5\uB2C8\uB2E4.{/red-fg}
{gray-fg}(${Math.floor(item.value / 2)}G \uD68C\uC218){/gray-fg}`);
    this.refreshItems();
    this.screen.render();
  }
  sellItem(index) {
    if (index >= this.currentItems.length) return;
    const item = this.currentItems[index];
    const sellValue = Math.floor(item.value / 2);
    this.store.dispatch({ type: "SELL_ITEM", itemId: item.id });
    this.detailBox.setContent(`{yellow-fg}${item.name}\uC744(\uB97C) ${sellValue}G\uC5D0 \uD310\uB9E4\uD588\uC2B5\uB2C8\uB2E4!{/yellow-fg}`);
    this.refreshItems();
    this.screen.render();
  }
  refreshItems() {
    const state = this.store.getState();
    this.currentItems = [...state.inventory];
    const labels = this.getItemLabels();
    this.itemList.setItems(labels.length > 0 ? labels : ["{gray-fg}(\uC544\uC774\uD15C \uC5C6\uC74C){/gray-fg}"]);
  }
};

// src/screens/EventScreen.ts
var EventScreen = class extends BaseScreen {
  render() {
    const state = this.store.getState();
    const event = state.currentEvent;
    const speed = state.gameSpeed;
    if (!event) {
      this.store.dispatch({ type: "NAVIGATE", screen: "dungeon" });
      return;
    }
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      style: { bg: "black" }
    });
    const titleColor = event.title.includes("\uBCF4\uBB3C") || event.title.includes("\uD589\uC6B4") ? "yellow" : event.title.includes("\uD568\uC815") || event.title.includes("\uBD88\uC6B4") ? "red" : "magenta";
    this.createBox({
      top: 2,
      left: "center",
      width: 50,
      height: 3,
      content: `{bold}{${titleColor}-fg}${event.title}{/${titleColor}-fg}{/bold}`,
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: titleColor } },
      align: "center"
    });
    let icon = "";
    if (event.title.includes("\uBCF4\uBB3C")) {
      icon = "   ___\n  /   \\\n |  $  |\n |_____|\n  |   |\n  |___|";
    } else if (event.title.includes("\uD568\uC815")) {
      icon = "  /!\\\n / ! \\\n/  !  \\\n------\n  | |\n  |_|";
    } else {
      icon = "   ?\n  / \\\n |   |\n  \\ /\n   ?\n   .";
    }
    this.createBox({
      top: 5,
      left: "center",
      width: 20,
      height: 8,
      content: icon,
      style: { fg: titleColor, bg: "black" },
      align: "center"
    });
    this.createBox({
      top: 13,
      left: "center",
      width: 60,
      height: 6,
      content: event.description,
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "gray" } },
      align: "center"
    });
    this.createBox({
      bottom: 1,
      left: "center",
      width: 40,
      height: 1,
      content: "{gray-fg}\uC790\uB3D9 \uACC4\uC18D...{/gray-fg}",
      tags: true,
      style: { fg: "gray", bg: "black" },
      align: "center"
    });
    this.screen.render();
    setTimeout(() => {
      if (event.choices.length > 0) {
        const safeChoiceIdx = event.choices.findIndex((c) => c.text === "\uC9C0\uB098\uCE58\uAE30");
        if (safeChoiceIdx !== -1) {
          event.choices[safeChoiceIdx].action();
        } else {
          event.choices[0].action();
        }
      }
    }, Math.floor(800 / speed));
  }
};

// src/screens/GameOverScreen.ts
import blessed9 from "blessed";
var GameOverScreen = class extends BaseScreen {
  render() {
    const state = this.store.getState();
    const isVictory = state.gameWon;
    const bossKills = Math.floor(state.maxFloorReached / 10);
    const prestigeGain = calculatePrestigeGain(state.maxFloorReached, bossKills, state.week);
    if (prestigeGain > 0) {
      this.store.dispatch({ type: "EARN_PRESTIGE", amount: prestigeGain });
      savePrestige(this.store.getState().prestige);
    }
    if (!isVictory) {
      this.store.deleteSave();
    }
    const bgColor = "black";
    const fgColor = isVictory ? "yellow" : "red";
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      style: { bg: bgColor }
    });
    const art = isVictory ? VICTORY_ART : SKULL_ART;
    this.createBox({
      top: 1,
      left: "center",
      width: 40,
      height: art.length + 2,
      content: art.join("\n"),
      style: { fg: fgColor, bg: bgColor },
      align: "center"
    });
    const title = isVictory ? "\uC2B9\uB9AC!" : "\uC8FC\uC778\uACF5\uC774 \uC4F0\uB7EC\uC84C\uC2B5\uB2C8\uB2E4";
    const subtitle = isVictory ? "\uC5B4\uB460\uC758 \uD0D1\uC744 \uC815\uBCF5\uD588\uC2B5\uB2C8\uB2E4!" : "\uC5EC\uC815\uC740 \uC5EC\uAE30\uC11C \uB05D\uB0A9\uB2C8\uB2E4... \uC138\uC774\uBE0C\uAC00 \uC0AD\uC81C\uB429\uB2C8\uB2E4.";
    this.createBox({
      top: art.length + 3,
      left: "center",
      width: 50,
      height: 5,
      content: `{bold}{${fgColor}-fg}${title}{/${fgColor}-fg}{/bold}

{gray-fg}${subtitle}{/gray-fg}`,
      tags: true,
      style: { fg: "white", bg: bgColor },
      align: "center"
    });
    const currentPrestige = this.store.getState().prestige;
    const stats = [
      `{cyan-fg}\uC8FC\uCC28:{/cyan-fg} ${state.week}`,
      `{cyan-fg}\uCD5C\uACE0 \uCE35:{/cyan-fg} ${state.maxFloorReached}`,
      `{cyan-fg}\uC5F0\uC18D \uC644\uB8CC:{/cyan-fg} ${state.runsCompleted}\uD68C`,
      `{cyan-fg}\uBCF4\uC720 \uACE8\uB4DC:{/cyan-fg} ${state.gold}`,
      `{yellow-fg}\uD68D\uB4DD \uBA85\uC131:{/yellow-fg} +${prestigeGain}`,
      `{yellow-fg}\uCD1D \uBA85\uC131:{/yellow-fg} ${currentPrestige.points}`
    ];
    this.createBox({
      top: art.length + 8,
      left: "center",
      width: 40,
      height: stats.length + 2,
      label: " \uAE30\uB85D ",
      content: stats.join("\n"),
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: bgColor, border: { fg: "gray" }, label: { fg: "gray" } }
    });
    const menuItems = ["\uC0C8 \uAC8C\uC784", "\uD0C0\uC774\uD2C0\uB85C", "\uB098\uAC00\uAE30"];
    const menu = blessed9.list({
      top: art.length + stats.length + 11,
      left: "center",
      width: 20,
      height: menuItems.length + 2,
      items: menuItems,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        fg: "white",
        bg: bgColor,
        border: { fg: fgColor },
        selected: { fg: "black", bg: fgColor, bold: true }
      }
    });
    this.addWidget(menu);
    menu.on("select", (_item, index) => {
      if (index === 0) {
        this.store.dispatch({ type: "NAVIGATE", screen: "character_select" });
      } else if (index === 1) {
        this.store.dispatch({ type: "NAVIGATE", screen: "title" });
      } else {
        process.exit(0);
      }
    });
    menu.focus();
    this.screen.render();
  }
};

// src/screens/HeroDetailScreen.ts
import blessed10 from "blessed";
var HeroDetailScreen = class extends BaseScreen {
  actionList;
  render() {
    const state = this.store.getState();
    const hero = state.roster.find((h) => h.id === state.selectedHeroId);
    if (!hero) {
      this.store.dispatch({ type: "NAVIGATE", screen: "town" });
      return;
    }
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      style: { bg: "black" }
    });
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: 3,
      content: `{bold}{yellow-fg} \uC601\uC6C5 \uC0C1\uC138{/yellow-fg}{/bold}  |  {yellow-fg}${getStars(hero.rarity)}{/yellow-fg} {cyan-fg}${hero.name}{/cyan-fg} - ${getClassName(hero.class)} Lv.${hero.level}  |  {yellow-fg}\uACE8\uB4DC: ${state.gold}{/yellow-fg}`,
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "gray" } }
    });
    const art = HERO_ART[hero.class];
    const artContent = art.join("\n");
    this.createBox({
      top: 3,
      left: 0,
      width: "35%",
      height: art.length + 4,
      label: ` ${getClassName(hero.class)} `,
      content: `
${artContent}`,
      tags: true,
      border: { type: "line" },
      style: { fg: "yellow", bg: "black", border: { fg: "yellow" }, label: { fg: "yellow" } },
      align: "center"
    });
    const equipContent = this.buildEquipmentContent(hero);
    this.createBox({
      top: art.length + 7,
      left: 0,
      width: "35%",
      height: 10,
      label: " \uC7A5\uBE44 ",
      content: equipContent,
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "gray" }, label: { fg: "gray" } }
    });
    const statsContent = this.buildStatsContent(hero);
    this.createBox({
      top: 3,
      left: "35%",
      width: "35%",
      height: "55%",
      label: " \uB2A5\uB825\uCE58 ",
      content: statsContent,
      tags: true,
      border: { type: "line" },
      scrollable: true,
      style: { fg: "white", bg: "black", border: { fg: "cyan" }, label: { fg: "cyan" } }
    });
    const skillsContent = this.buildSkillsContent(hero);
    this.createBox({
      top: 3,
      left: "70%",
      width: "30%",
      height: "55%",
      label: " \uC2A4\uD0AC ",
      content: skillsContent,
      tags: true,
      border: { type: "line" },
      scrollable: true,
      style: { fg: "white", bg: "black", border: { fg: "magenta" }, label: { fg: "magenta" } }
    });
    const maxLevel = hero.isMainCharacter ? 10 : 5;
    const canLevelUp = hero.level < maxLevel && hero.exp >= hero.expToLevel;
    const levelUpLabel = hero.level >= maxLevel ? "\uB808\uBCA8\uC5C5 (\uCD5C\uB300 \uB808\uBCA8)" : canLevelUp ? "\uB808\uBCA8\uC5C5 (\uACBD\uD5D8\uCE58 \uCDA9\uC871!)" : `\uB808\uBCA8\uC5C5 (EXP ${hero.exp}/${hero.expToLevel})`;
    const actionItems = [
      levelUpLabel,
      "\uC2A4\uD0AC \uD655\uC778"
    ];
    if (hero.isMainCharacter && hero.statPoints > 0) {
      actionItems.push(`\uC2A4\uD0EF \uBC30\uBD84 (${hero.statPoints}\uD3EC\uC778\uD2B8)`);
    }
    actionItems.push("\uB3CC\uC544\uAC00\uAE30");
    this.actionList = blessed10.list({
      bottom: 0,
      left: 0,
      width: "100%",
      height: actionItems.length + 2,
      label: " \uD589\uB3D9 ",
      items: actionItems,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "yellow" },
        selected: { fg: "black", bg: "yellow", bold: true },
        label: { fg: "yellow" }
      }
    });
    this.addWidget(this.actionList);
    this.actionList.on("select", (_item, index) => {
      this.handleAction(index, hero);
    });
    this.registerKey(["escape"], () => {
      this.store.dispatch({ type: "NAVIGATE", screen: "town" });
    });
    this.actionList.focus();
    this.screen.render();
  }
  buildStatsContent(hero) {
    const hpBar = formatBar(hero.stats.hp, hero.stats.maxHp, 14);
    const hpColor = hero.stats.hp / hero.stats.maxHp > 0.5 ? "green" : hero.stats.hp / hero.stats.maxHp > 0.25 ? "yellow" : "red";
    const rec = RECOMMENDED_POSITIONS[hero.class];
    const posWarning = hero.position.col > 0 && !rec.cols.includes(hero.position.col) ? `{yellow-fg}! \uD604\uC7AC \uC5F4(${hero.position.col})\uC774 \uBE44\uCD94\uCC9C{/yellow-fg}` : "";
    let content = "";
    const mcTag = hero.isMainCharacter ? "{bold}{yellow-fg}[\uC8FC\uC778\uACF5]{/yellow-fg}{/bold}\n" : "";
    const maxLevel = hero.isMainCharacter ? 10 : 5;
    content += mcTag;
    content += `{gray-fg}${CLASS_DESCRIPTIONS[hero.class]}{/gray-fg}
`;
    content += `{bold}\uB808\uC5B4\uB3C4:{/bold} {yellow-fg}${getStars(hero.rarity)}{/yellow-fg}
`;
    content += `{bold}\uB808\uBCA8:{/bold} ${hero.level}/${maxLevel}
`;
    if (hero.isMainCharacter && hero.statPoints > 0) {
      content += `{bold}{green-fg}\uBBF8\uBD84\uBC30 \uD3EC\uC778\uD2B8: ${hero.statPoints}{/green-fg}{/bold}
`;
    }
    content += `{cyan-fg}${rec.label}{/cyan-fg}
`;
    if (posWarning) content += `${posWarning}
`;
    content += `
`;
    content += `{bold}HP{/bold}  {${hpColor}-fg}${hpBar}{/${hpColor}-fg}
`;
    content += `     ${hero.stats.hp} / ${hero.stats.maxHp}
`;
    const expBar = formatBar(hero.exp, hero.expToLevel, 14);
    const canLvUp = hero.exp >= hero.expToLevel && hero.level < maxLevel;
    const expLabel = canLvUp ? " {green-fg}[\uB808\uBCA8\uC5C5 \uAC00\uB2A5!]{/green-fg}" : "";
    content += `{bold}EXP{/bold} {cyan-fg}${expBar}{/cyan-fg}
`;
    content += `     ${hero.exp} / ${hero.expToLevel}${expLabel}

`;
    content += `{white-fg}\uACF5\uACA9\uB825:{/white-fg}  ${hero.stats.attack}
`;
    content += `{white-fg}\uBC29\uC5B4\uB825:{/white-fg}  ${hero.stats.defense}
`;
    content += `{white-fg}\uC18D  \uB3C4:{/white-fg}  ${hero.stats.speed}
`;
    content += `{white-fg}\uBA85  \uC911:{/white-fg}  ${hero.stats.accuracy}
`;
    content += `{white-fg}\uD68C  \uD53C:{/white-fg}  ${hero.stats.dodge}
`;
    content += `{white-fg}\uCE58\uBA85\uD0C0:{/white-fg}  ${hero.stats.crit}%
`;
    if (hero.traits && hero.traits.length > 0) {
      content += `
{bold}\uD2B9\uC131:{/bold}
`;
      for (const trait of hero.traits) {
        const color = getTraitCategoryColor(trait.category);
        content += `  {${color}-fg}${trait.name}{/${color}-fg} {gray-fg}${trait.description}{/gray-fg}
`;
      }
    }
    return content;
  }
  buildEquipmentContent(hero) {
    let content = "";
    content += `{white-fg}\uBB34\uAE30:{/white-fg} ${hero.equipment.weapon ? `{yellow-fg}${hero.equipment.weapon.name}{/yellow-fg}` : "{gray-fg}\uC5C6\uC74C{/gray-fg}"}
`;
    content += `{white-fg}\uBC29\uC5B4:{/white-fg} ${hero.equipment.armor ? `{cyan-fg}${hero.equipment.armor.name}{/cyan-fg}` : "{gray-fg}\uC5C6\uC74C{/gray-fg}"}
`;
    content += `{white-fg}\uC7A5\uC2E01:{/white-fg} ${hero.equipment.trinket1 ? `{magenta-fg}${hero.equipment.trinket1.name}{/magenta-fg}` : "{gray-fg}\uC5C6\uC74C{/gray-fg}"}
`;
    content += `{white-fg}\uC7A5\uC2E02:{/white-fg} ${hero.equipment.trinket2 ? `{magenta-fg}${hero.equipment.trinket2.name}{/magenta-fg}` : "{gray-fg}\uC5C6\uC74C{/gray-fg}"}
`;
    return content;
  }
  buildSkillsContent(hero) {
    let content = "";
    for (const skill of hero.skills) {
      const canUseFromPos = hero.position.col > 0 ? skill.useCols.includes(hero.position.col) : true;
      const posColor = canUseFromPos ? "green" : "red";
      content += `{bold}{yellow-fg}${skill.name}{/yellow-fg}{/bold}
`;
      content += `{gray-fg}${skill.description}{/gray-fg}
`;
      content += `{${posColor}-fg}\uC0AC\uC6A9: [${skill.useCols.join(",")}]{/${posColor}-fg}`;
      if (skill.targetAlly) {
        content += ` \uB300\uC0C1: \uC544\uAD70
`;
      } else {
        content += ` \uB300\uC0C1: [${skill.targetCols.join(",")}]
`;
      }
      if (skill.damage.max > 0) {
        content += `DMG: ${skill.damage.min}-${skill.damage.max}x `;
      }
      if (skill.heal) {
        content += `\uD790: ${skill.heal.min}-${skill.heal.max} `;
      }
      content += `

`;
    }
    return content;
  }
  handleAction(index, hero) {
    const state = this.store.getState();
    switch (index) {
      case 0: {
        const maxLevel = hero.isMainCharacter ? 10 : 5;
        if (hero.level >= maxLevel) return;
        if (hero.exp < hero.expToLevel) return;
        this.store.dispatch({ type: "LEVEL_UP_HERO", heroId: hero.id });
        this.destroy();
        this.render();
        break;
      }
      case 1: {
        this.screen.render();
        break;
      }
      default: {
        if (hero.isMainCharacter && hero.statPoints > 0 && index === 2) {
          this.store.dispatch({ type: "SET_SELECTED_HERO", heroId: hero.id });
          this.store.dispatch({ type: "NAVIGATE", screen: "stat_allocation" });
        } else {
          this.store.dispatch({ type: "NAVIGATE", screen: "town" });
        }
        break;
      }
    }
  }
};

// src/screens/CharacterSelectScreen.ts
import blessed11 from "blessed";
var CharacterSelectScreen = class extends BaseScreen {
  render() {
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      style: { bg: "black" }
    });
    this.createBox({
      top: 0,
      left: "center",
      width: 40,
      height: 3,
      content: "{center}{bold}\uD074\uB798\uC2A4 \uC120\uD0DD{/bold}{/center}",
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "red" } }
    });
    const classList = blessed11.list({
      top: 4,
      left: 2,
      width: 24,
      height: MAIN_CHAR_CLASSES.length + 2,
      label: " \uD074\uB798\uC2A4 ",
      border: { type: "line" },
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      items: MAIN_CHAR_CLASSES.map((cls) => ` ${getClassName(cls)}`),
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "red" },
        selected: { fg: "black", bg: "yellow", bold: true },
        item: { fg: "white" }
      }
    });
    this.addWidget(classList);
    const previewBox = this.createBox({
      top: 4,
      left: 28,
      width: 50,
      height: 20,
      label: " \uC0C1\uC138 \uC815\uBCF4 ",
      border: { type: "line" },
      tags: true,
      scrollable: true,
      style: { fg: "white", bg: "black", border: { fg: "red" } }
    });
    this.createBox({
      bottom: 0,
      left: "center",
      width: 50,
      height: 3,
      content: "{center}Enter: \uC120\uD0DD | Esc: \uB4A4\uB85C{/center}",
      tags: true,
      border: { type: "line" },
      style: { fg: "gray", bg: "black", border: { fg: "red" } }
    });
    const updatePreview = (index) => {
      const cls = MAIN_CHAR_CLASSES[index];
      const stats = BASE_STATS[cls];
      const pos = RECOMMENDED_POSITIONS[cls];
      const skills = HERO_SKILLS[cls];
      let content = `{bold}{yellow-fg}${getClassName(cls)}{/yellow-fg}{/bold}

`;
      content += `{bold}\u2500\u2500 \uAE30\uBCF8 \uC2A4\uD0EF \u2500\u2500{/bold}
`;
      content += `  HP:   ${stats.maxHp}
`;
      content += `  \uACF5\uACA9: ${stats.attack}
`;
      content += `  \uBC29\uC5B4: ${stats.defense}
`;
      content += `  \uC18D\uB3C4: ${stats.speed}
`;
      content += `  \uBA85\uC911: ${stats.accuracy}
`;
      content += `  \uD68C\uD53C: ${stats.dodge}
`;
      content += `  \uCE58\uBA85\uD0C0: ${stats.crit}

`;
      content += `{bold}\u2500\u2500 \uC704\uCE58 \u2500\u2500{/bold}
`;
      content += `  ${pos.label}

`;
      content += `{bold}\u2500\u2500 \uC2A4\uD0AC \u2500\u2500{/bold}
`;
      for (const skill of skills) {
        content += `  {yellow-fg}${skill.name}{/yellow-fg} - ${skill.description}
`;
      }
      previewBox.setContent(content);
      this.screen.render();
    };
    classList.select(0);
    updatePreview(0);
    classList.on("select item", (_item, index) => {
      updatePreview(index);
    });
    classList.on("select", (_item, index) => {
      const selectedClass = MAIN_CHAR_CLASSES[index];
      this.store.dispatch({ type: "NEW_GAME", mainCharClass: selectedClass });
    });
    classList.key(["escape"], () => {
      this.store.dispatch({ type: "NAVIGATE", screen: "title" });
    });
    classList.focus();
    this.screen.render();
  }
};

// src/screens/StatAllocationScreen.ts
import blessed12 from "blessed";
var STAT_DEFS = [
  { key: "hp", label: "HP", perPoint: 3, unit: "maxHp" },
  { key: "attack", label: "ATK", perPoint: 1, unit: "\uACF5\uACA9\uB825" },
  { key: "defense", label: "DEF", perPoint: 1, unit: "\uBC29\uC5B4\uB825" },
  { key: "speed", label: "SPD", perPoint: 1, unit: "\uC18D\uB3C4" },
  { key: "accuracy", label: "ACC", perPoint: 2, unit: "\uBA85\uC911" },
  { key: "dodge", label: "DODGE", perPoint: 2, unit: "\uD68C\uD53C" },
  { key: "crit", label: "CRIT", perPoint: 1, unit: "\uCE58\uBA85\uD0C0" }
];
var StatAllocationScreen = class extends BaseScreen {
  statList;
  allocation = {};
  totalPoints = 0;
  render() {
    const state = this.store.getState();
    const hero = state.roster.find((h) => h.id === state.selectedHeroId);
    if (!hero || hero.statPoints <= 0) {
      this.store.dispatch({ type: "NAVIGATE", screen: "town" });
      return;
    }
    this.totalPoints = hero.statPoints;
    this.allocation = {
      hp: 0,
      attack: 0,
      defense: 0,
      speed: 0,
      accuracy: 0,
      dodge: 0,
      crit: 0
    };
    this.buildUI(hero);
  }
  buildUI(hero) {
    this.destroy();
    const remaining = this.getRemainingPoints();
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      style: { bg: "black" }
    });
    this.createBox({
      top: 0,
      left: 0,
      width: "100%",
      height: 3,
      content: `{bold}{yellow-fg} \uC2A4\uD0EF \uBC30\uBD84{/yellow-fg}{/bold}  |  {yellow-fg}${getStars(hero.rarity)}{/yellow-fg} {cyan-fg}${hero.name}{/cyan-fg} - ${getClassName(hero.class)} Lv.${hero.level}  |  \uB0A8\uC740 \uD3EC\uC778\uD2B8: {bold}{${remaining > 0 ? "yellow" : "green"}-fg}${remaining}{/${remaining > 0 ? "yellow" : "green"}-fg}{/bold}/${this.totalPoints}`,
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "gray" } }
    });
    const statsContent = this.buildCurrentStatsContent(hero);
    this.createBox({
      top: 3,
      left: 0,
      width: "40%",
      height: "70%",
      label: " \uD604\uC7AC \uB2A5\uB825\uCE58 ",
      content: statsContent,
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "cyan" }, label: { fg: "cyan" } }
    });
    const statItems = STAT_DEFS.map((sd) => {
      const allocated = this.allocation[sd.key];
      const bonus = allocated * sd.perPoint;
      const bar = allocated > 0 ? `{green-fg}+${bonus}{/green-fg} (${"\u25A0".repeat(allocated)}${"\xB7".repeat(this.totalPoints - allocated)})` : `{gray-fg}+0{/gray-fg} (${"\xB7".repeat(this.totalPoints)})`;
      return `  ${sd.label.padEnd(6)} [${String(allocated).padStart(2)}] ${bar}  {gray-fg}(+${sd.perPoint}/pt){/gray-fg}`;
    });
    this.statList = blessed12.list({
      top: 3,
      left: "40%",
      width: "60%",
      height: "70%",
      label: " \uC2A4\uD0EF \uBC30\uBD84 ",
      items: statItems,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        fg: "white",
        bg: "black",
        border: { fg: "yellow" },
        selected: { fg: "black", bg: "yellow", bold: true },
        label: { fg: "yellow" }
      }
    });
    this.addWidget(this.statList);
    const confirmColor = remaining === 0 ? "green" : "gray";
    this.createBox({
      bottom: 0,
      left: 0,
      width: "100%",
      height: 3,
      content: `  {gray-fg}\u2191\u2193{/gray-fg} \uC774\uB3D9  |  {gray-fg}Enter/\u2192{/gray-fg} \uD3EC\uC778\uD2B8 \uCD94\uAC00  |  {gray-fg}\u2190/Backspace{/gray-fg} \uD3EC\uC778\uD2B8 \uC81C\uAC70  |  {${confirmColor}-fg}[C] \uD655\uC815{/${confirmColor}-fg}  |  {gray-fg}[ESC] \uCDE8\uC18C{/gray-fg}`,
      tags: true,
      border: { type: "line" },
      style: { fg: "white", bg: "black", border: { fg: "gray" } }
    });
    this.statList.key(["right", "enter"], () => {
      this.addPoint(hero);
    });
    this.statList.key(["left", "backspace"], () => {
      this.removePoint(hero);
    });
    this.registerKey(["c", "C"], () => {
      this.confirmAllocation(hero);
    });
    this.registerKey(["escape"], () => {
      this.store.dispatch({ type: "NAVIGATE", screen: "hero_detail" });
    });
    this.statList.focus();
    this.screen.render();
  }
  buildCurrentStatsContent(hero) {
    let content = "";
    content += `
`;
    content += `  {bold}HP:{/bold}     ${hero.stats.hp} / ${hero.stats.maxHp}`;
    if (this.allocation.hp > 0) content += `  {green-fg}(+${this.allocation.hp * 3}){/green-fg}`;
    content += `
`;
    content += `  {bold}\uACF5\uACA9\uB825:{/bold} ${hero.stats.attack}`;
    if (this.allocation.attack > 0) content += `  {green-fg}(+${this.allocation.attack}){/green-fg}`;
    content += `
`;
    content += `  {bold}\uBC29\uC5B4\uB825:{/bold} ${hero.stats.defense}`;
    if (this.allocation.defense > 0) content += `  {green-fg}(+${this.allocation.defense}){/green-fg}`;
    content += `
`;
    content += `  {bold}\uC18D  \uB3C4:{/bold} ${hero.stats.speed}`;
    if (this.allocation.speed > 0) content += `  {green-fg}(+${this.allocation.speed}){/green-fg}`;
    content += `
`;
    content += `  {bold}\uBA85  \uC911:{/bold} ${hero.stats.accuracy}`;
    if (this.allocation.accuracy > 0) content += `  {green-fg}(+${this.allocation.accuracy * 2}){/green-fg}`;
    content += `
`;
    content += `  {bold}\uD68C  \uD53C:{/bold} ${hero.stats.dodge}`;
    if (this.allocation.dodge > 0) content += `  {green-fg}(+${this.allocation.dodge * 2}){/green-fg}`;
    content += `
`;
    content += `  {bold}\uCE58\uBA85\uD0C0:{/bold} ${hero.stats.crit}%`;
    if (this.allocation.crit > 0) content += `  {green-fg}(+${this.allocation.crit}){/green-fg}`;
    content += `
`;
    content += `
`;
    content += `  {yellow-fg}\uC2A4\uD0EF \uD3EC\uC778\uD2B8: ${hero.statPoints}{/yellow-fg}
`;
    content += `  {gray-fg}\uB808\uBCA8\uC5C5 \uC2DC 5 \uD3EC\uC778\uD2B8 \uD68D\uB4DD{/gray-fg}
`;
    content += `
`;
    content += `  {gray-fg}\u2500\u2500 \uD3EC\uC778\uD2B8 \uB2F9 \uD6A8\uACFC \u2500\u2500{/gray-fg}
`;
    content += `  {gray-fg}HP:    +3 maxHp{/gray-fg}
`;
    content += `  {gray-fg}ATK:   +1 \uACF5\uACA9\uB825{/gray-fg}
`;
    content += `  {gray-fg}DEF:   +1 \uBC29\uC5B4\uB825{/gray-fg}
`;
    content += `  {gray-fg}SPD:   +1 \uC18D\uB3C4{/gray-fg}
`;
    content += `  {gray-fg}ACC:   +2 \uBA85\uC911{/gray-fg}
`;
    content += `  {gray-fg}DODGE: +2 \uD68C\uD53C{/gray-fg}
`;
    content += `  {gray-fg}CRIT:  +1 \uCE58\uBA85\uD0C0{/gray-fg}
`;
    return content;
  }
  getRemainingPoints() {
    const used = Object.values(this.allocation).reduce((sum, v) => sum + v, 0);
    return this.totalPoints - used;
  }
  addPoint(hero) {
    if (this.getRemainingPoints() <= 0) return;
    const index = this.statList.selected ?? 0;
    const statKey = STAT_DEFS[index].key;
    this.allocation[statKey]++;
    this.buildUI(hero);
    this.statList.select(index);
    this.screen.render();
  }
  removePoint(hero) {
    const index = this.statList.selected ?? 0;
    const statKey = STAT_DEFS[index].key;
    if (this.allocation[statKey] <= 0) return;
    this.allocation[statKey]--;
    this.buildUI(hero);
    this.statList.select(index);
    this.screen.render();
  }
  confirmAllocation(hero) {
    if (this.getRemainingPoints() !== 0) return;
    this.store.dispatch({
      type: "ALLOCATE_STATS",
      heroId: hero.id,
      allocation: { ...this.allocation }
    });
    this.store.dispatch({ type: "NAVIGATE", screen: "town" });
  }
};

// src/App.ts
var App = class {
  screen;
  store;
  currentScreen = null;
  previousScreen = null;
  constructor() {
    this.screen = blessed13.screen({
      smartCSR: true,
      title: "tui-game",
      fullUnicode: true
    });
    this.store = new GameStore();
    this.screen.key(["C-c"], () => process.exit(0));
    this.store.on("change", (state) => {
      if (state.screen !== this.previousScreen) {
        this.previousScreen = state.screen;
        this.switchScreen(state.screen);
      }
    });
  }
  switchScreen(screenName) {
    if (this.currentScreen) {
      this.currentScreen.destroy();
    }
    switch (screenName) {
      case "title":
        this.currentScreen = new TitleScreen(this.screen, this.store);
        break;
      case "town":
        this.currentScreen = new TownScreen(this.screen, this.store);
        break;
      case "party_select":
        this.currentScreen = new PartySelectScreen(this.screen, this.store);
        break;
      case "dungeon":
        this.currentScreen = new DungeonScreen(this.screen, this.store);
        break;
      case "combat":
        this.currentScreen = new CombatScreen(this.screen, this.store);
        break;
      case "inventory":
        this.currentScreen = new InventoryScreen(this.screen, this.store);
        break;
      case "event":
        this.currentScreen = new EventScreen(this.screen, this.store);
        break;
      case "game_over":
        this.currentScreen = new GameOverScreen(this.screen, this.store);
        break;
      case "hero_detail":
        this.currentScreen = new HeroDetailScreen(this.screen, this.store);
        break;
      case "character_select":
        this.currentScreen = new CharacterSelectScreen(this.screen, this.store);
        break;
      case "stat_allocation":
        this.currentScreen = new StatAllocationScreen(this.screen, this.store);
        break;
    }
    this.currentScreen.render();
    this.screen.render();
  }
  start() {
    this.switchScreen("title");
  }
};

// src/index.ts
import { RNG as RNG2 } from "rot-js";
RNG2.setSeed(Date.now());
var app = new App();
app.start();
