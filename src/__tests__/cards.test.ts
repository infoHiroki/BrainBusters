// カードシステムのテスト

import { generateRewardCards, generateStarterDeck } from '../data/cards';
import { Card, CardType, CardInstance, GAME_CONFIG } from '../types/game';

describe('カード生成システム', () => {
  describe('generateStarterDeck', () => {
    it('初期デッキが正しい枚数で生成される', () => {
      const deck = generateStarterDeck();
      expect(deck.length).toBe(GAME_CONFIG.STARTING_DECK_SIZE);
    });

    it('デッキにはattack, defenseが含まれる', () => {
      const deck = generateStarterDeck();
      const types = deck.map((c: Card) => c.type);

      expect(types.filter((t: string) => t === 'attack').length).toBeGreaterThan(0);
      expect(types.filter((t: string) => t === 'defense').length).toBeGreaterThan(0);
    });
  });

  describe('generateRewardCards', () => {
    it('報酬カードが3枚生成される', () => {
      const rewards = generateRewardCards(1);
      expect(rewards.length).toBe(3);
    });

    it('階層が上がるとレアリティの高いカードが出やすくなる', () => {
      // 複数回生成してレアリティをチェック
      const earlyFloorRarities: number[] = [];
      const lateFloorRarities: number[] = [];

      for (let i = 0; i < 20; i++) {
        const early = generateRewardCards(1);
        const late = generateRewardCards(20);

        early.forEach(c => earlyFloorRarities.push(c.rarity));
        late.forEach(c => lateFloorRarities.push(c.rarity));
      }

      const earlyAvg = earlyFloorRarities.reduce((a, b) => a + b, 0) / earlyFloorRarities.length;
      const lateAvg = lateFloorRarities.reduce((a, b) => a + b, 0) / lateFloorRarities.length;

      expect(lateAvg).toBeGreaterThanOrEqual(earlyAvg);
    });
  });

  describe('カードの整合性', () => {
    it('すべてのカードにはコストが0-6の範囲内である', () => {
      const deck = generateStarterDeck();
      deck.forEach((card: Card) => {
        expect(card.cost).toBeGreaterThanOrEqual(0);
        expect(card.cost).toBeLessThanOrEqual(6);
      });
    });

    it('すべてのカードに効果が設定されている', () => {
      const deck = generateStarterDeck();
      deck.forEach((card: Card) => {
        expect(card.effects).toBeDefined();
        expect(card.effects.length).toBeGreaterThan(0);
      });
    });

    it('コストに応じた適切な効果値が設定されている', () => {
      // コスト別の期待範囲（高コストカード追加）
      const expectedRanges: Record<number, [number, number]> = {
        0: [4, 8],
        1: [8, 14],
        2: [14, 22],
        3: [22, 35],
        4: [35, 55],
        5: [50, 80],
        6: [70, 120],
      };

      const rewards = generateRewardCards(10);
      rewards.forEach((card: Card) => {
        const [min, max] = expectedRanges[card.cost] || [0, 100];
        const mainEffect = card.effects[0];

        if (mainEffect.type === 'damage' || mainEffect.type === 'block') {
          // 多少の誤差は許容（追加効果付きカードは値が下がることがある）
          expect(mainEffect.value).toBeGreaterThanOrEqual(min - 4);
          expect(mainEffect.value).toBeLessThanOrEqual(max + 15);
        }
      });
    });
  });
});
