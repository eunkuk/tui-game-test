import { EventEmitter } from 'events';
import type { GameState, Hero, Item, Screen, StatusEffect } from '../models/types.ts';
import type { GameAction } from './actions.ts';
import { createHero, createMainCharacter, resetHeroNames, COMPANION_CLASSES, levelUpHero, applyStatPoints, getStars } from '../data/heroes.ts';
import { SUPPLY_ITEMS, createItemCopy } from '../data/items.ts';
import { clamp, randomInt } from '../utils/helpers.ts';
import { saveGame, loadGame, hasSaveFile, deleteSave, loadPrestige, savePrestige } from '../engine/save-load.ts';
import { generateFloor } from '../data/dungeons.ts';
import { generateFloorMap } from '../engine/map-generator.ts';
import { getThemeForFloor } from '../data/themes.ts';
import { hasPrestigeUpgrade, getStartGold, getRecruitCost, getMaxRoster, PRESTIGE_UPGRADES, calculatePrestigeGain } from '../data/prestige.ts';
import { resetBossPatterns } from '../engine/boss-patterns.ts';

function initialState(): GameState {
  return {
    screen: 'title',
    roster: [],
    party: [null, null, null, null, null, null],
    inventory: [],
    gold: 500,
    tower: null,
    combat: null,
    week: 1,
    maxFloorReached: 0,
    gameLog: ['새로운 모험이 시작됩니다...'],
    currentEvent: null,
    gameWon: false,
    selectedHeroId: null,
    gameSpeed: 1,
    continuousRun: false,
    runsCompleted: 0,
    paused: false,
    mainCharacterId: null,
    pendingLoot: null,
    prestige: { points: 0, totalEarned: 0, purchased: [] },
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME': {
      resetHeroNames();
      const prestige = state.prestige;
      const mainChar = { ...createMainCharacter(action.mainCharClass), position: { row: 2, col: 1 } };
      const food = [createItemCopy(SUPPLY_ITEMS[1]!), createItemCopy(SUPPLY_ITEMS[1]!)];
      const startInventory = [...food];

      // Apply prestige: start potions
      if (hasPrestigeUpgrade(prestige, 'start_potions')) {
        // Find healing potion in items
        const healPotion = SUPPLY_ITEMS.find(i => i.healAmount);
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
        screen: 'town',
        prestige, // preserve prestige across games
        gameLog: ['새로운 모험이 시작됩니다...', `${mainChar.name}이(가) 여정을 시작합니다.`],
      };
    }

    case 'NAVIGATE':
      return { ...state, screen: action.screen };

    case 'RECRUIT_HERO': {
      const recruitCost = getRecruitCost(state.prestige);
      const maxRoster = getMaxRoster(state.prestige);
      if (state.gold < recruitCost) return state;
      if (state.roster.length >= maxRoster) return state;
      const newHero = createHero(action.heroClass);
      return {
        ...state,
        roster: [...state.roster, newHero],
        gold: state.gold - recruitCost,
        gameLog: [...state.gameLog, `${newHero.name}이(가) 영입되었습니다. (${getStars(newHero.rarity)})`],
      };
    }

    case 'DISMISS_HERO': {
      // Cannot dismiss main character
      if (action.heroId === state.mainCharacterId) return state;
      const inParty = state.party.some(h => h?.id === action.heroId);
      if (inParty) return state;
      return {
        ...state,
        roster: state.roster.filter(h => h.id !== action.heroId),
        gameLog: [...state.gameLog, '영웅이 해고되었습니다.'],
      };
    }

    case 'ADD_TO_PARTY': {
      const hero = state.roster.find(h => h.id === action.heroId);
      if (!hero) return state;
      if (action.slotIndex < 0 || action.slotIndex > 5) return state;
      if (state.party[action.slotIndex] !== null) return state;
      if (state.party.some(h => h?.id === action.heroId)) return state;

      // Map slot index to grid position: slots 0-2 = col 1 (rows 1-3), slots 3-5 = col 2-3
      const slotToGridPos = (slot: number): { row: number; col: number } => {
        const col = Math.floor(slot / 3) + 1;
        const row = (slot % 3) + 1;
        return { row, col };
      };
      const gridPos = slotToGridPos(action.slotIndex);
      const updatedHero: Hero = { ...hero, position: gridPos };
      const newParty = [...state.party];
      newParty[action.slotIndex] = updatedHero;
      return {
        ...state,
        party: newParty,
        gameLog: [...state.gameLog, `${hero.name}이(가) 파티에 배치되었습니다.`],
      };
    }

    case 'REMOVE_FROM_PARTY': {
      if (action.slotIndex < 0 || action.slotIndex > 5) return state;
      const removed = state.party[action.slotIndex];
      if (!removed) return state;
      if (removed.id === state.mainCharacterId) return state;
      const newParty = [...state.party];
      newParty[action.slotIndex] = null;
      return {
        ...state,
        party: newParty,
        gameLog: [...state.gameLog, `${removed.name}이(가) 파티에서 제거되었습니다.`],
      };
    }

    case 'SWAP_PARTY_POSITION': {
      const { pos1, pos2 } = action;
      if (pos1 < 0 || pos1 > 5 || pos2 < 0 || pos2 > 5) return state;
      const newParty = [...state.party];
      const h1 = newParty[pos1];
      const h2 = newParty[pos2];
      // Swap their positions
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

    case 'BUY_ITEM': {
      if (state.gold < action.item.value) return state;
      if (state.inventory.length >= 16) return state;
      const boughtItem = createItemCopy(action.item);
      return {
        ...state,
        gold: state.gold - action.item.value,
        inventory: [...state.inventory, boughtItem],
        gameLog: [...state.gameLog, `${action.item.name}을(를) 구매했습니다.`],
      };
    }

    case 'SELL_ITEM': {
      const item = state.inventory.find(i => i.id === action.itemId);
      if (!item) return state;
      const sellValue = Math.floor(item.value / 2);
      return {
        ...state,
        gold: state.gold + sellValue,
        inventory: state.inventory.filter(i => i.id !== action.itemId),
        gameLog: [...state.gameLog, `${item.name}을(를) ${sellValue}골드에 팔았습니다.`],
      };
    }

    case 'EQUIP_ITEM': {
      const item = state.inventory.find(i => i.id === action.itemId);
      if (!item) return state;
      if (item.type === 'supply' || item.type === 'potion') return state;

      const updateHeroEquip = (hero: Hero): Hero => {
        const newEquip = { ...hero.equipment };
        let unequipped: Item | undefined;

        if (item.type === 'weapon') {
          unequipped = newEquip.weapon;
          newEquip.weapon = item;
        } else if (item.type === 'armor') {
          unequipped = newEquip.armor;
          newEquip.armor = item;
        } else if (item.type === 'trinket') {
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

      let newInventory = state.inventory.filter(i => i.id !== action.itemId);
      let newRoster = [...state.roster];
      let newParty = [...state.party];
      let found = false;

      const rosterIdx = newRoster.findIndex(h => h.id === action.heroId);
      if (rosterIdx !== -1) {
        const oldHero = newRoster[rosterIdx]!;
        const updatedHero = updateHeroEquip(oldHero);
        const oldSlotItem = item.type === 'weapon' ? oldHero.equipment.weapon
          : item.type === 'armor' ? oldHero.equipment.armor
          : undefined;
        if (oldSlotItem) newInventory.push(oldSlotItem);
        newRoster[rosterIdx] = updatedHero;
        found = true;
      }

      if (!found) {
        for (let i = 0; i < newParty.length; i++) {
          if (newParty[i]?.id === action.heroId) {
            const oldHero = newParty[i]!;
            const updatedHero = updateHeroEquip(oldHero);
            const oldSlotItem = item.type === 'weapon' ? oldHero.equipment.weapon
              : item.type === 'armor' ? oldHero.equipment.armor
              : undefined;
            if (oldSlotItem) newInventory.push(oldSlotItem);
            newParty[i] = updatedHero;
            const ri = newRoster.findIndex(h => h.id === action.heroId);
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
        gameLog: [...state.gameLog, `${item.name}을(를) 장착했습니다.`],
      };
    }

    case 'UNEQUIP_ITEM': {
      const findAndUnequip = (hero: Hero): { hero: Hero; item: Item | undefined } => {
        const newEquip = { ...hero.equipment };
        let removed: Item | undefined;
        if (action.slot === 'weapon') { removed = newEquip.weapon; newEquip.weapon = undefined; }
        else if (action.slot === 'armor') { removed = newEquip.armor; newEquip.armor = undefined; }
        else if (action.slot === 'trinket1') { removed = newEquip.trinket1; newEquip.trinket1 = undefined; }
        else if (action.slot === 'trinket2') { removed = newEquip.trinket2; newEquip.trinket2 = undefined; }
        return { hero: { ...hero, equipment: newEquip }, item: removed };
      };

      let newRoster = [...state.roster];
      let newParty = [...state.party];
      let removedItem: Item | undefined;

      const rosterIdx = newRoster.findIndex(h => h.id === action.heroId);
      if (rosterIdx !== -1) {
        const result = findAndUnequip(newRoster[rosterIdx]!);
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
            const result = findAndUnequip(newParty[i]!);
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
        gameLog: [...state.gameLog, `${removedItem.name}을(를) 해제했습니다.`],
      };
    }

    case 'USE_ITEM': {
      const item = state.inventory.find(i => i.id === action.itemId);
      if (!item || !item.consumable) return state;

      let newParty = [...state.party];
      const logs: string[] = [];

      if (action.heroId && (item.healAmount || item.buffEffect)) {
        for (let i = 0; i < newParty.length; i++) {
          if (newParty[i]?.id === action.heroId) {
            let hero = { ...newParty[i]!, stats: { ...newParty[i]!.stats }, statusEffects: [...newParty[i]!.statusEffects] };
            if (item.healAmount) {
              const actualHeal = Math.min(item.healAmount, hero.stats.maxHp - hero.stats.hp);
              hero.stats.hp = clamp(hero.stats.hp + item.healAmount, 0, hero.stats.maxHp);
              if (hero.isDeathsDoor && hero.stats.hp > 0) {
                hero = { ...hero, isDeathsDoor: false };
              }
              logs.push(`${hero.name}이(가) HP ${actualHeal} 회복!`);
            }
            if (item.buffEffect) {
              const buffStatMap: Record<string, string> = {
                attack: 'buff_attack',
                defense: 'buff_defense',
                speed: 'buff_speed',
              };
              const effectType = buffStatMap[item.buffEffect.stat] || `buff_${item.buffEffect.stat}`;
              const newEffect: StatusEffect = {
                type: effectType as StatusEffect['type'],
                duration: item.buffEffect.duration,
                value: item.buffEffect.value,
                source: item.name,
              };
              hero.statusEffects.push(newEffect);
              logs.push(`${hero.name}에게 ${item.name} 효과 적용! (${item.buffEffect.stat} +${item.buffEffect.value}, ${item.buffEffect.duration}턴)`);
            }
            newParty[i] = hero;
            break;
          }
        }
      }

      return {
        ...state,
        party: newParty,
        inventory: state.inventory.filter(i => i.id !== action.itemId),
        gameLog: [...state.gameLog, ...logs],
      };
    }

    case 'ENTER_TOWER': {
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
          theme: getThemeForFloor(1),
        },
        paused: false,
        screen: 'dungeon',
        gameLog: [...state.gameLog, '어둠의 탑에 진입했습니다. 1층...'],
      };
    }

    case 'ADVANCE_FLOOR': {
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
          theme: getThemeForFloor(nextFloor),
        },
        maxFloorReached: newMaxFloor,
        gameLog: [...state.gameLog, `${nextFloor}층으로 이동합니다.`],
      };
    }

    case 'EXIT_TOWER': {
      return {
        ...state,
        tower: null,
        screen: 'town',
        gameLog: [...state.gameLog, '어둠의 탑에서 귀환했습니다.'],
      };
    }

    case 'START_COMBAT': {
      const heroes = state.party.filter((h): h is Hero => h !== null);
      const surprised = action.isSurprised || false;
      const enemySurprised = action.enemySurprised || false;
      const combatLog = ['전투 시작!'];
      if (surprised) combatLog.push('{red-fg}기습당했다! 적이 먼저 행동합니다!{/red-fg}');
      if (enemySurprised) combatLog.push('{green-fg}적을 기습했다! 아군이 먼저 행동합니다!{/green-fg}');
      return {
        ...state,
        combat: {
          phase: 'animating',
          heroes: heroes.map(h => ({ ...h, stats: { ...h.stats } })),
          monsters: action.monsters,
          turnOrder: [],
          currentTurnIndex: 0,
          round: 1,
          log: combatLog,
          selectedSkillIndex: 0,
          isSurprised: surprised,
          enemySurprised: enemySurprised,
        },
        screen: 'combat',
      };
    }

    case 'SET_COMBAT':
      return { ...state, combat: action.combat };

    case 'END_COMBAT_VICTORY': {
      if (!state.tower || !state.combat) return state;
      const updatedParty: (Hero | null)[] = [...state.party];
      for (const combatHero of state.combat.heroes) {
        for (let i = 0; i < updatedParty.length; i++) {
          if (updatedParty[i]?.id === combatHero.id) {
            updatedParty[i] = { ...combatHero };
            break;
          }
        }
      }
      // Grant EXP to surviving heroes and auto level-up
      const monsterCount = state.combat.monsters.length;
      const hasBossMonster = state.combat.monsters.some(m => m.isBoss);
      const floor = state.tower.currentFloor;
      const baseExp = floor * 10 + monsterCount * 15;
      let totalExp = hasBossMonster ? baseExp * 3 : baseExp;
      // Apply prestige exp bonus
      if (hasPrestigeUpgrade(state.prestige, 'exp_bonus_20')) {
        totalExp = Math.round(totalExp * 1.2);
      } else if (hasPrestigeUpgrade(state.prestige, 'exp_bonus_10')) {
        totalExp = Math.round(totalExp * 1.1);
      }
      const levelUpLogs: string[] = [];

      for (let i = 0; i < updatedParty.length; i++) {
        let h = updatedParty[i];
        if (!h || h.stats.hp <= 0) continue;
        h = { ...h, exp: h.exp + totalExp };
        // 자동 레벨업 (연속 레벨업 가능)
        const maxLevel = h.isMainCharacter ? 10 : 5;
        while (h.exp >= h.expToLevel && h.level < maxLevel) {
          h = levelUpHero(h);
          levelUpLogs.push(`${h.name}이(가) 레벨 ${h.level}로 성장!`);
        }
        updatedParty[i] = h;
      }

      // Remove dead non-main heroes from party and roster
      let newRoster = [...state.roster];
      for (let i = 0; i < updatedParty.length; i++) {
        const h = updatedParty[i];
        if (h && h.stats.hp <= 0 && h.isDeathsDoor) {
          if (h.id !== state.mainCharacterId) {
            updatedParty[i] = null;
            // Remove dead companion from roster permanently
            newRoster = newRoster.filter(rh => rh.id !== h.id);
          }
        }
      }
      // Mark current tile cleared on the floor map
      const combatFloorMap = { ...state.tower.floorMap };
      const combatTiles = combatFloorMap.tiles.map(row => row.map(t => ({ ...t })));
      const px = combatFloorMap.playerX;
      const py = combatFloorMap.playerY;
      if (py >= 0 && py < combatFloorMap.height && px >= 0 && px < combatFloorMap.width) {
        combatTiles[py]![px]!.cleared = true;
      }
      combatFloorMap.tiles = combatTiles;

      // Update roster with party versions (includes EXP/level-up), fallback to combat versions
      newRoster = newRoster.map(rh => {
        const partyVersion = updatedParty.find(ph => ph?.id === rh.id);
        if (partyVersion) return { ...partyVersion };
        const combatVersion = state.combat!.heroes.find(ch => ch.id === rh.id);
        return combatVersion ? { ...combatVersion } : rh;
      });

      const currentTile = combatTiles[py]?.[px];
      const isBossRoom = currentTile?.type === 'boss';
      const currentFloor = state.tower.currentFloor;

      // Floor bonus gold
      const floorGold = action.gold + currentFloor * 5;
      const newMaxFloor = Math.max(state.maxFloorReached, currentFloor);

      // Set pending loot instead of directly adding items
      const pendingLoot = action.loot.length > 0 ? {
        items: action.loot,
        currentIndex: 0,
        gold: 0, // gold added separately
        source: 'combat' as const,
      } : null;

      if (isBossRoom) {
        const bossBonus = currentFloor * 20;
        const totalGold = floorGold + bossBonus;

        // Floor 100 boss = game won
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
          screen: 'dungeon',
          gameLog: [...state.gameLog, `보스 처치! ${totalGold}골드 획득! (보스 보너스 ${bossBonus}G)`, `경험치 +${totalExp}`, ...levelUpLogs],
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
        screen: 'dungeon',
        gameLog: [...state.gameLog, `전투 승리! ${floorGold}골드 획득.`, `경험치 +${totalExp}`, ...levelUpLogs],
      };
    }

    case 'END_COMBAT_DEFEAT':
      return {
        ...state,
        combat: null,
        screen: 'game_over',
        gameLog: [...state.gameLog, '주인공이 쓰러졌습니다...'],
      };

    case 'FLEE_COMBAT': {
      if (!state.tower || !state.combat) return state;
      const updatedParty2: (Hero | null)[] = [...state.party];
      for (const combatHero of state.combat.heroes) {
        for (let i = 0; i < updatedParty2.length; i++) {
          if (updatedParty2[i]?.id === combatHero.id) {
            updatedParty2[i] = { ...combatHero, stats: { ...combatHero.stats } };
            break;
          }
        }
      }
      // Flee from tower = exit tower
      return {
        ...state,
        party: updatedParty2,
        combat: null,
        tower: null,
        screen: 'town',
        gameLog: [...state.gameLog, '전투에서 도주했습니다! 탑에서 귀환합니다.'],
      };
    }

    case 'MAIN_CHAR_FLEE': {
      if (!state.tower || !state.combat) return state;
      const updatedParty3: (Hero | null)[] = [...state.party];
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
        screen: 'town',
        gameLog: [...state.gameLog, '{red-fg}주인공의 HP가 위험합니다! 긴급 도주!{/red-fg}'],
      };
    }

    case 'UPDATE_PARTY_HERO': {
      const newParty = [...state.party];
      for (let i = 0; i < newParty.length; i++) {
        if (newParty[i]?.id === action.hero.id) {
          newParty[i] = action.hero;
          break;
        }
      }
      const newRoster = state.roster.map(h => h.id === action.hero.id ? action.hero : h);
      return { ...state, party: newParty, roster: newRoster };
    }

    case 'SET_EVENT':
      return {
        ...state,
        currentEvent: action.event,
        screen: action.event ? 'event' : state.screen,
      };

    case 'CLEAR_ROOM': {
      // Legacy action - no-op with tile map system
      return state;
    }

    case 'CLEAR_TILE': {
      if (!state.tower) return state;
      const fm = state.tower.floorMap;
      const newTiles = fm.tiles.map(row => row.map(t => ({ ...t })));
      if (action.y >= 0 && action.y < fm.height && action.x >= 0 && action.x < fm.width) {
        newTiles[action.y]![action.x]!.cleared = true;
      }
      return {
        ...state,
        tower: {
          ...state.tower,
          floorMap: { ...fm, tiles: newTiles },
        },
      };
    }

    case 'UPDATE_FLOOR_MAP': {
      if (!state.tower) return state;
      return {
        ...state,
        tower: { ...state.tower, floorMap: action.floorMap },
      };
    }

    case 'TOGGLE_PAUSE': {
      return { ...state, paused: !state.paused };
    }

    case 'ADD_GOLD':
      return { ...state, gold: state.gold + action.amount };

    case 'ADD_LOG':
      return { ...state, gameLog: [...state.gameLog, action.message] };

    case 'SET_GAME_WON':
      return { ...state, gameWon: action.won };

    case 'LOAD_STATE':
      return { ...action.state };

    case 'LEVEL_UP_HERO': {
      const hero = state.roster.find(h => h.id === action.heroId);
      if (!hero) return state;
      const maxLevel = hero.isMainCharacter ? 10 : 5;
      if (hero.level >= maxLevel) return state;
      if (hero.exp < hero.expToLevel) return state;
      const upgraded = levelUpHero(hero);
      const newRoster = state.roster.map(h => h.id === action.heroId ? upgraded : h);
      const newParty = state.party.map(h => h?.id === action.heroId ? upgraded : h);
      return {
        ...state,
        roster: newRoster,
        party: newParty,
        gameLog: [...state.gameLog, `${upgraded.name}이(가) 레벨 ${upgraded.level}로 성장했습니다!`],
      };
    }

    case 'ALLOCATE_STATS': {
      const hero = state.roster.find(h => h.id === action.heroId);
      if (!hero || !hero.isMainCharacter) return state;
      const updated = applyStatPoints(hero, action.allocation);
      const newRoster = state.roster.map(h => h.id === action.heroId ? updated : h);
      const newParty = state.party.map(h => h?.id === action.heroId ? updated : h);
      return {
        ...state,
        roster: newRoster,
        party: newParty,
        gameLog: [...state.gameLog, `${updated.name}의 능력치가 강화되었습니다!`],
      };
    }

    case 'SET_SELECTED_HERO':
      return { ...state, selectedHeroId: action.heroId };

    case 'ADVANCE_WEEK':
      return { ...state, week: state.week + 1, gameLog: [...state.gameLog, `${state.week + 1}주차가 시작됩니다.`] };

    case 'SET_GAME_SPEED':
      return { ...state, gameSpeed: action.speed };

    case 'TOGGLE_CONTINUOUS_RUN':
      return { ...state, continuousRun: !state.continuousRun };

    case 'SET_CONTINUOUS_RUN':
      return { ...state, continuousRun: action.enabled };

    case 'INCREMENT_RUNS':
      return { ...state, runsCompleted: state.runsCompleted + 1 };

    case 'SET_PENDING_LOOT':
      return {
        ...state,
        pendingLoot: action.loot,
        gold: state.gold + action.loot.gold,
      };

    case 'RESOLVE_LOOT_ITEM': {
      if (!state.pendingLoot) return state;
      const pl = state.pendingLoot;
      const currentItem = pl.items[pl.currentIndex];
      if (!currentItem) return { ...state, pendingLoot: null };

      let newState = { ...state };

      if (action.decision === 'equip' && action.heroId) {
        // Reuse EQUIP_ITEM logic inline
        const equipResult = gameReducer(newState, { type: 'EQUIP_ITEM', heroId: action.heroId, itemId: '__pending__' });
        // Since the item is not in inventory, handle manually
        const targetHero = newState.roster.find(h => h.id === action.heroId) ||
          newState.party.find(h => h?.id === action.heroId);
        if (targetHero && (currentItem.type === 'weapon' || currentItem.type === 'armor' || currentItem.type === 'trinket')) {
          const newEquip = { ...targetHero.equipment };
          let unequipped: Item | undefined;
          if (currentItem.type === 'weapon') {
            unequipped = newEquip.weapon;
            newEquip.weapon = currentItem;
          } else if (currentItem.type === 'armor') {
            unequipped = newEquip.armor;
            newEquip.armor = currentItem;
          } else if (currentItem.type === 'trinket') {
            if (!newEquip.trinket1) newEquip.trinket1 = currentItem;
            else if (!newEquip.trinket2) newEquip.trinket2 = currentItem;
            else { unequipped = newEquip.trinket1; newEquip.trinket1 = currentItem; }
          }
          const updatedHero = { ...targetHero, equipment: newEquip };
          newState = {
            ...newState,
            roster: newState.roster.map(h => h.id === action.heroId ? updatedHero : h),
            party: newState.party.map(h => h?.id === action.heroId ? updatedHero : h),
            inventory: unequipped ? [...newState.inventory, unequipped] : newState.inventory,
            gameLog: [...newState.gameLog, `${currentItem.name}을(를) ${targetHero.name}에게 장착!`],
          };
        }
      } else if (action.decision === 'store') {
        if (newState.inventory.length < 16) {
          newState = {
            ...newState,
            inventory: [...newState.inventory, currentItem],
            gameLog: [...newState.gameLog, `${currentItem.name}을(를) 보관했습니다.`],
          };
        }
      } else if (action.decision === 'use' && action.heroId) {
        // Apply consumable effect directly
        const useResult = gameReducer(newState, { type: 'USE_ITEM', itemId: '__pending__', heroId: action.heroId });
        // Since the item is not in inventory, handle manually
        let newParty = [...newState.party];
        const logs: string[] = [];
        for (let i = 0; i < newParty.length; i++) {
          if (newParty[i]?.id === action.heroId) {
            let hero = { ...newParty[i]!, stats: { ...newParty[i]!.stats }, statusEffects: [...newParty[i]!.statusEffects] };
            if (currentItem.healAmount) {
              const actualHeal = Math.min(currentItem.healAmount, hero.stats.maxHp - hero.stats.hp);
              hero.stats.hp = clamp(hero.stats.hp + currentItem.healAmount, 0, hero.stats.maxHp);
              if (hero.isDeathsDoor && hero.stats.hp > 0) hero = { ...hero, isDeathsDoor: false };
              logs.push(`${hero.name}이(가) HP ${actualHeal} 회복!`);
            }
            if (currentItem.buffEffect) {
              const buffStatMap: Record<string, string> = { attack: 'buff_attack', defense: 'buff_defense', speed: 'buff_speed' };
              const effectType = buffStatMap[currentItem.buffEffect.stat] || `buff_${currentItem.buffEffect.stat}`;
              hero.statusEffects.push({
                type: effectType as any,
                duration: currentItem.buffEffect.duration,
                value: currentItem.buffEffect.value,
                source: currentItem.name,
              });
              logs.push(`${hero.name}에게 ${currentItem.name} 효과 적용!`);
            }
            newParty[i] = hero;
            break;
          }
        }
        const newRoster2 = newState.roster.map(rh => {
          const partyVer = newParty.find(ph => ph?.id === rh.id);
          return partyVer || rh;
        });
        newState = { ...newState, party: newParty, roster: newRoster2, gameLog: [...newState.gameLog, ...logs] };
      }
      // else discard: do nothing

      // Advance to next item or clear
      const nextIndex = pl.currentIndex + 1;
      if (nextIndex >= pl.items.length) {
        newState = { ...newState, pendingLoot: null };
      } else {
        newState = { ...newState, pendingLoot: { ...pl, currentIndex: nextIndex } };
      }

      return newState;
    }

    case 'CLEAR_PENDING_LOOT':
      return { ...state, pendingLoot: null };

    case 'EARN_PRESTIGE': {
      const newPrestige = {
        ...state.prestige,
        points: state.prestige.points + action.amount,
        totalEarned: state.prestige.totalEarned + action.amount,
      };
      return { ...state, prestige: newPrestige };
    }

    case 'BUY_PRESTIGE_UPGRADE': {
      const upgrade = PRESTIGE_UPGRADES.find(u => u.id === action.upgradeId);
      if (!upgrade) return state;
      if (state.prestige.purchased.includes(action.upgradeId)) return state;
      if (state.prestige.points < upgrade.cost) return state;
      if (upgrade.requires && !state.prestige.purchased.includes(upgrade.requires)) return state;
      const newPrestige = {
        ...state.prestige,
        points: state.prestige.points - upgrade.cost,
        purchased: [...state.prestige.purchased, action.upgradeId],
      };
      return {
        ...state,
        prestige: newPrestige,
        gameLog: [...state.gameLog, `명성 업그레이드: ${upgrade.name} 구매!`],
      };
    }

    case 'USE_COMBAT_ITEM': {
      if (!state.combat) return state;
      const item = state.inventory.find(i => i.id === action.itemId);
      if (!item || !item.consumable) return state;

      const heroIdx = state.combat.heroes.findIndex(h => h.id === action.heroId);
      if (heroIdx === -1) return state;

      const newHeroes = [...state.combat.heroes];
      let hero = { ...newHeroes[heroIdx]!, stats: { ...newHeroes[heroIdx]!.stats }, statusEffects: [...newHeroes[heroIdx]!.statusEffects] };
      const logs: string[] = [];

      if (item.healAmount) {
        const actualHeal = Math.min(item.healAmount, hero.stats.maxHp - hero.stats.hp);
        hero.stats.hp = clamp(hero.stats.hp + item.healAmount, 0, hero.stats.maxHp);
        if (hero.isDeathsDoor && hero.stats.hp > 0) hero = { ...hero, isDeathsDoor: false };
        logs.push(`${hero.name}이(가) ${item.name}으로 HP ${actualHeal} 회복!`);
      }
      if (item.buffEffect) {
        const buffStatMap: Record<string, string> = { attack: 'buff_attack', defense: 'buff_defense', speed: 'buff_speed' };
        const effectType = buffStatMap[item.buffEffect.stat] || `buff_${item.buffEffect.stat}`;
        hero.statusEffects.push({
          type: effectType as any,
          duration: item.buffEffect.duration,
          value: item.buffEffect.value,
          source: item.name,
        });
        logs.push(`${hero.name}에게 ${item.name} 효과 적용! (${item.buffEffect.stat} +${item.buffEffect.value}, ${item.buffEffect.duration}턴)`);
      }

      newHeroes[heroIdx] = hero;
      return {
        ...state,
        combat: { ...state.combat, heroes: newHeroes, log: [...state.combat.log, ...logs] },
        inventory: state.inventory.filter(i => i.id !== action.itemId),
      };
    }

    default:
      return state;
  }
}

export class GameStore extends EventEmitter {
  private state: GameState;

  constructor() {
    super();
    this.state = initialState();
    // Load persistent prestige
    this.state.prestige = loadPrestige();
  }

  getState(): GameState {
    return this.state;
  }

  dispatch(action: GameAction): void {
    this.state = gameReducer(this.state, action);
    this.emit('change', this.state);
  }

  reset(): void {
    this.state = initialState();
    this.emit('change', this.state);
  }

  saveGame(): boolean {
    savePrestige(this.state.prestige);
    return saveGame(this.state);
  }

  loadGame(): boolean {
    const loaded = loadGame();
    if (loaded) {
      this.dispatch({ type: 'LOAD_STATE', state: loaded });
      return true;
    }
    return false;
  }

  hasSaveFile(): boolean {
    return hasSaveFile();
  }

  deleteSave(): void {
    deleteSave();
  }
}
