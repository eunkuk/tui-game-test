import { percentChance, randomInt } from '../utils/helpers.ts';

export interface CurioOutcome {
  description: string;
  hpChange?: number;
  stressChange?: number;
  goldChange?: number;
  weight: number; // higher = more likely
}

export interface CurioChoice {
  text: string;
  outcomes: CurioOutcome[];
}

export interface CurioEvent {
  id: string;
  title: string;
  description: string;
  choices: CurioChoice[];
}

export const CURIO_EVENTS: CurioEvent[] = [
  {
    id: 'altar',
    title: '수상한 제단',
    description: '어둠 속에서 희미하게 빛나는 제단이 있다.',
    choices: [
      {
        text: '기도하기',
        outcomes: [
          { description: '평온함이 밀려온다.', stressChange: -10, weight: 60 },
          { description: '저주가 되돌아왔다!', stressChange: 15, weight: 40 },
        ],
      },
      {
        text: '부수기',
        outcomes: [
          { description: '보석이 쏟아진다!', goldChange: 50, weight: 50 },
          { description: '함정이 발동했다!', hpChange: -8, weight: 50 },
        ],
      },
      {
        text: '무시하기',
        outcomes: [
          { description: '조심스럽게 지나쳤다.', weight: 100 },
        ],
      },
    ],
  },
  {
    id: 'bookshelf',
    title: '먼지 쌓인 책장',
    description: '오래된 책들이 가득한 책장이 있다.',
    choices: [
      {
        text: '읽기',
        outcomes: [
          { description: '지혜를 얻었다. 마음이 편안해진다.', stressChange: -5, weight: 55 },
          { description: '금서였다! 정신이 혼란해진다.', stressChange: 10, weight: 45 },
        ],
      },
      {
        text: '뒤지기',
        outcomes: [
          { description: '책 사이에 금화가 있었다!', goldChange: 30, weight: 55 },
          { description: '독침 함정이 발동!', hpChange: -6, weight: 45 },
        ],
      },
      {
        text: '무시하기',
        outcomes: [
          { description: '지나쳤다.', weight: 100 },
        ],
      },
    ],
  },
  {
    id: 'fountain',
    title: '신비로운 분수대',
    description: '맑은 물이 솟아오르는 분수대다.',
    choices: [
      {
        text: '마시기',
        outcomes: [
          { description: '상처가 치유된다!', hpChange: 8, stressChange: -5, weight: 60 },
          { description: '독이 섞여 있었다!', hpChange: -5, stressChange: 5, weight: 40 },
        ],
      },
      {
        text: '동전 던지기',
        outcomes: [
          { description: '행운의 빛이 감돈다.', goldChange: 40, stressChange: -3, weight: 50 },
          { description: '아무 일도 일어나지 않았다.', goldChange: -10, weight: 50 },
        ],
      },
      {
        text: '무시하기',
        outcomes: [
          { description: '조심스럽게 지나쳤다.', weight: 100 },
        ],
      },
    ],
  },
  {
    id: 'corpse',
    title: '탐험가의 시체',
    description: '이전 탐험가의 시체가 있다. 소지품이 보인다.',
    choices: [
      {
        text: '뒤지기',
        outcomes: [
          { description: '금화를 발견했다!', goldChange: 35, weight: 65 },
          { description: '함정이 발동! 독가스!', hpChange: -4, stressChange: 8, weight: 35 },
        ],
      },
      {
        text: '묵념하기',
        outcomes: [
          { description: '마음이 안정된다.', stressChange: -8, weight: 100 },
        ],
      },
      {
        text: '무시하기',
        outcomes: [
          { description: '지나쳤다.', weight: 100 },
        ],
      },
    ],
  },
  {
    id: 'chest',
    title: '잠긴 상자',
    description: '자물쇠가 걸린 낡은 상자가 있다.',
    choices: [
      {
        text: '부수기',
        outcomes: [
          { description: '보물이 가득했다!', goldChange: 60, weight: 50 },
          { description: '함정이 발동!', hpChange: -6, stressChange: 5, weight: 50 },
        ],
      },
      {
        text: '조심스럽게 열기',
        outcomes: [
          { description: '금화가 약간 있었다.', goldChange: 25, weight: 70 },
          { description: '비어있었다.', stressChange: 3, weight: 30 },
        ],
      },
      {
        text: '무시하기',
        outcomes: [
          { description: '지나쳤다.', weight: 100 },
        ],
      },
    ],
  },
  {
    id: 'statue',
    title: '벽의 기묘한 부조',
    description: '벽에 새겨진 고대 부조가 빛나고 있다.',
    choices: [
      {
        text: '만지기',
        outcomes: [
          { description: '힘이 흘러들어온다!', hpChange: 5, stressChange: -5, weight: 50 },
          { description: '저주가 덮쳤다!', stressChange: 12, weight: 50 },
        ],
      },
      {
        text: '무시하기',
        outcomes: [
          { description: '지나쳤다.', weight: 100 },
        ],
      },
    ],
  },
];

export function resolveOutcome(outcomes: CurioOutcome[]): CurioOutcome {
  const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const outcome of outcomes) {
    roll -= outcome.weight;
    if (roll <= 0) return outcome;
  }
  return outcomes[outcomes.length - 1]!;
}
