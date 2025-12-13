// 敵生成システムのテスト

import { generateEnemyGroup, getBossForFloor } from '../data/enemies';
import { GAME_CONFIG, Enemy } from '../types/game';

describe('敵生成システム', () => {
  describe('generateEnemyGroup', () => {
    it('通常階層で敵が生成される', () => {
      const enemies = generateEnemyGroup(1, 'battle');
      expect(enemies.length).toBeGreaterThan(0);
    });

    it('ボス階層で1体のボスが生成される', () => {
      GAME_CONFIG.BOSS_FLOORS.forEach(floor => {
        const enemies = generateEnemyGroup(floor, 'boss');
        expect(enemies.length).toBe(1);
        expect(enemies[0].isBoss).toBe(true);
      });
    });

    it('エリート戦で強敵が生成される', () => {
      const enemies = generateEnemyGroup(2, 'elite');
      expect(enemies.some((e: Enemy) => e.isElite)).toBe(true);
    });

    it('後半階層では敵の数が増える', () => {
      const earlyFloorCounts: number[] = [];
      const lateFloorCounts: number[] = [];

      for (let i = 0; i < 20; i++) {
        earlyFloorCounts.push(generateEnemyGroup(3, 'battle').length);
        lateFloorCounts.push(generateEnemyGroup(18, 'battle').length);
      }

      const earlyAvg = earlyFloorCounts.reduce((a, b) => a + b, 0) / earlyFloorCounts.length;
      const lateAvg = lateFloorCounts.reduce((a, b) => a + b, 0) / lateFloorCounts.length;

      expect(lateAvg).toBeGreaterThanOrEqual(earlyAvg);
    });
  });

  describe('ボス整合性', () => {
    it('すべてのボス階層に対応するボスが存在する', () => {
      GAME_CONFIG.BOSS_FLOORS.forEach(floor => {
        const boss = getBossForFloor(floor);
        expect(boss).toBeDefined();
        expect(boss?.isBoss).toBe(true);
      });
    });

    it('ボスは通常敵より強い', () => {
      const normalEnemy = generateEnemyGroup(1, 'battle')[0];
      const boss = getBossForFloor(5);

      expect(boss!.maxHp).toBeGreaterThan(normalEnemy.maxHp);
    });
  });

  describe('敵の行動パターン', () => {
    it('生成された敵にはintentが設定されている', () => {
      const enemies = generateEnemyGroup(1, 'battle');
      enemies.forEach((enemy: Enemy) => {
        expect(enemy.intent).toBeDefined();
        expect(['attack', 'defend', 'buff', 'debuff', 'unknown']).toContain(enemy.intent.type);
      });
    });
  });
});
