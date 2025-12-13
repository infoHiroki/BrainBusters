// ゲーム状態の整合性テスト

import { GAME_CONFIG, RunState, Card } from '../types/game';

describe('ゲーム設定の整合性', () => {
  it('ボス階層が正しく設定されている', () => {
    const { BOSS_FLOORS, MAX_FLOOR } = GAME_CONFIG;

    // ボス階層は最大階層以下
    BOSS_FLOORS.forEach(floor => {
      expect(floor).toBeLessThanOrEqual(MAX_FLOOR);
    });

    // 最終階層がボス階層に含まれている
    expect(BOSS_FLOORS).toContain(MAX_FLOOR);
  });

  it('初期ステータスが適切に設定されている', () => {
    expect(GAME_CONFIG.STARTING_HP).toBeGreaterThan(0);
    expect(GAME_CONFIG.STARTING_ENERGY).toBeGreaterThan(0);
    expect(GAME_CONFIG.STARTING_HAND_SIZE).toBeGreaterThan(0);
    expect(GAME_CONFIG.STARTING_DECK_SIZE).toBeGreaterThan(0);
    expect(GAME_CONFIG.STARTING_GOLD).toBeGreaterThanOrEqual(0);
  });

  it('エネルギーと手札のバランスが適切', () => {
    // エネルギーは手札枚数に対して少なすぎない
    expect(GAME_CONFIG.STARTING_ENERGY).toBeGreaterThanOrEqual(GAME_CONFIG.STARTING_HAND_SIZE / 2);
  });
});

describe('RunState型の整合性', () => {
  const createMockRunState = (): RunState => ({
    id: 'test-run',
    floor: 1,
    hp: GAME_CONFIG.STARTING_HP,
    maxHp: GAME_CONFIG.STARTING_HP,
    deck: [],
    energy: GAME_CONFIG.STARTING_ENERGY,
    maxEnergy: GAME_CONFIG.STARTING_ENERGY,
    relics: [],
    gold: GAME_CONFIG.STARTING_GOLD,
    map: [],
    currentNodeId: null,
    seed: 12345,
    startedAt: Date.now(),
    stockCards: [],
  });

  it('stockCardsは配列でカードを複数枚保持できる', () => {
    const state = createMockRunState();
    expect(state.stockCards).toEqual([]);

    const mockCard: Card = {
      id: 1,
      name: 'テストカード',
      description: 'テスト用',
      type: 'attack',
      cost: 1,
      effects: [{ type: 'damage', value: 10 }],
      category: 'test',
      rarity: 1,
    };

    state.stockCards.push(mockCard);
    expect(state.stockCards.length).toBe(1);
    expect(state.stockCards[0]).toBe(mockCard);

    // 最大5枚まで追加可能
    for (let i = 0; i < 4; i++) {
      state.stockCards.push({ ...mockCard, id: i + 2 });
    }
    expect(state.stockCards.length).toBe(5);
  });
});
