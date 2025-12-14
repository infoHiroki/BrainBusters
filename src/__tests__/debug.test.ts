// デバッグモードのテスト

import { initBattleState } from '../store/runStore';
import { RunState, GAME_CONFIG } from '../types/game';

// テスト用のモックRunState
const createMockRunState = (floor: number = 1): RunState => ({
  id: 'test-run',
  floor,
  hp: GAME_CONFIG.STARTING_HP,
  maxHp: GAME_CONFIG.STARTING_HP,
  deck: [],
  energy: GAME_CONFIG.STARTING_ENERGY,
  maxEnergy: GAME_CONFIG.STARTING_ENERGY,
  relics: [],
  gold: GAME_CONFIG.STARTING_GOLD,
  map: [
    { id: 'battle-1', floor: 1, type: 'battle', x: 0, connections: [], completed: false },
    { id: 'elite-1', floor: 2, type: 'elite', x: 0, connections: [], completed: false },
    { id: 'boss-5', floor: 5, type: 'boss', x: 0, connections: [], completed: false },
  ],
  currentNodeId: 'battle-1',
  seed: 12345,
  startedAt: Date.now(),
  stockCards: [],
});

describe('initBattleState', () => {
  it('デフォルトでcurrentNodeIdからノードタイプを取得する', () => {
    const runState = createMockRunState(1);
    runState.currentNodeId = 'battle-1';

    const battleState = initBattleState(runState);

    expect(battleState).toBeDefined();
    expect(battleState.enemies.length).toBeGreaterThan(0);
    expect(battleState.turn).toBe(1);
    expect(battleState.playerBlock).toBe(0);
  });

  it('overrideNodeTypeでノードタイプを強制できる', () => {
    const runState = createMockRunState(5);
    runState.currentNodeId = 'battle-1'; // 通常バトルノードだが...

    // ボスタイプを強制
    const battleState = initBattleState(runState, 'boss');

    expect(battleState).toBeDefined();
    expect(battleState.enemies.length).toBe(1); // ボスは1体
    expect(battleState.enemies[0].isBoss).toBe(true);
  });

  it('エリートタイプを指定すると1-2体のエリート敵が生成される', () => {
    const runState = createMockRunState(10);

    const battleState = initBattleState(runState, 'elite');

    expect(battleState).toBeDefined();
    expect(battleState.enemies.length).toBeGreaterThanOrEqual(1);
    expect(battleState.enemies.length).toBeLessThanOrEqual(2);
    expect(battleState.enemies[0].isElite).toBe(true);
  });

  it('通常バトルでは階層に応じた敵が生成される', () => {
    const runState = createMockRunState(20);

    const battleState = initBattleState(runState, 'battle');

    expect(battleState).toBeDefined();
    expect(battleState.enemies.length).toBeGreaterThanOrEqual(1);
    expect(battleState.enemies.length).toBeLessThanOrEqual(3);
  });
});

describe('デバッグ設定の検証', () => {
  it('GAME_CONFIGの値が正しい', () => {
    expect(GAME_CONFIG.MAX_FLOOR).toBe(50);
    expect(GAME_CONFIG.BOSS_FLOORS).toEqual([5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);
    expect(GAME_CONFIG.STARTING_HP).toBe(70);
    expect(GAME_CONFIG.STARTING_ENERGY).toBe(7);
    expect(GAME_CONFIG.STARTING_HAND_SIZE).toBe(6);
    expect(GAME_CONFIG.MAX_STOCK_CARDS).toBe(5);
  });

  it('ボス階層が正しく5階ごとに設定されている', () => {
    const bossFloors = GAME_CONFIG.BOSS_FLOORS;

    expect(bossFloors.length).toBe(10);
    bossFloors.forEach((floor, index) => {
      expect(floor).toBe((index + 1) * 5);
    });
  });
});
