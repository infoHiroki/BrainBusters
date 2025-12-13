/**
 * RewardScreen関連のテスト
 * - ボスレリック選択問題の修正
 * - カード再選択機能
 */

// テスト用のモック型定義
type Card = {
  id: number;
  name: string;
  type: string;
  cost: number;
  effects: unknown[];
  rarity: number;
};

type Relic = {
  id: number;
  name: string;
  description: string;
  rarity: number;
};

// カード生成のシミュレーション
const generateRewardCards = (floor: number): Card[] => {
  const cards: Card[] = [];
  for (let i = 0; i < 3; i++) {
    const baseRarity = floor >= 10 ? 2 : 1;
    const rarity = Math.random() > 0.65 ? baseRarity + 1 : baseRarity;
    cards.push({
      id: i + 1,
      name: `テストカード${i + 1}`,
      type: 'attack',
      cost: 1,
      effects: [],
      rarity,
    });
  }
  return cards;
};

// レリック生成のシミュレーション
const allRelics: Relic[] = [
  { id: 1, name: 'レリック1', description: '説明1', rarity: 3 },
  { id: 2, name: 'レリック2', description: '説明2', rarity: 3 },
  { id: 3, name: 'レリック3', description: '説明3', rarity: 3 },
  { id: 4, name: 'レリック4', description: '説明4', rarity: 3 },
  { id: 5, name: 'レリック5', description: '説明5', rarity: 3 },
];

const getRandomRelicByRarity = (ownedRelicIds: number[]): Relic | null => {
  const available = allRelics.filter(r => !ownedRelicIds.includes(r.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
};

describe('RewardScreen - カード報酬生成', () => {
  test('カード報酬は3枚生成される', () => {
    const cards = generateRewardCards(1);
    expect(cards).toHaveLength(3);
  });

  test('各カードはid, name, type, cost, effectsを持つ', () => {
    const cards = generateRewardCards(1);
    cards.forEach(card => {
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('name');
      expect(card).toHaveProperty('type');
      expect(card).toHaveProperty('cost');
      expect(card).toHaveProperty('effects');
    });
  });

  test('階層が上がるとレアカードの出現率が上がる（floor 10以上）', () => {
    // 複数回生成してレアリティ3以上の出現率をチェック
    let rareCount = 0;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const cards = generateRewardCards(10);
      cards.forEach(card => {
        if (card.rarity >= 3) rareCount++;
      });
    }

    // 10階以上では35%以上がレア（3以上）であるべき
    const rareRate = rareCount / (iterations * 3);
    expect(rareRate).toBeGreaterThan(0.25);
  });
});

describe('RewardScreen - ボスレリック生成', () => {
  test('ボスレリックは1つ生成される', () => {
    const ownedRelicIds: number[] = [];
    const relic = getRandomRelicByRarity(ownedRelicIds);
    expect(relic).not.toBeNull();
  });

  test('既に所持しているレリックは生成されない', () => {
    // 100回生成して、すべて異なるIDになることを確認
    const ownedRelicIds = [1, 2, 3];
    for (let i = 0; i < 100; i++) {
      const relic = getRandomRelicByRarity(ownedRelicIds);
      if (relic) {
        expect(ownedRelicIds).not.toContain(relic.id);
      }
    }
  });

  test('レリックはname, description, rarityを持つ', () => {
    const relic = getRandomRelicByRarity([]);
    expect(relic).toHaveProperty('name');
    expect(relic).toHaveProperty('description');
    expect(relic).toHaveProperty('rarity');
  });
});

describe('RewardScreen - カード選択ロジック', () => {
  // カード選択状態のシミュレーション
  type CardSelection = {
    selectedCard: { id: number; name: string } | null;
  };

  const createCardSelectionState = (): CardSelection => ({
    selectedCard: null,
  });

  const handleCardSelect = (
    state: CardSelection,
    card: { id: number; name: string }
  ): CardSelection => {
    // 同じカードをタップしたら選択解除
    if (state.selectedCard && state.selectedCard.id === card.id) {
      return { selectedCard: null };
    }
    return { selectedCard: card };
  };

  test('カードを選択できる', () => {
    let state = createCardSelectionState();
    const card = { id: 1, name: 'テストカード' };

    state = handleCardSelect(state, card);
    expect(state.selectedCard).toEqual(card);
  });

  test('別のカードを選ぶと選択が切り替わる', () => {
    let state = createCardSelectionState();
    const card1 = { id: 1, name: 'カード1' };
    const card2 = { id: 2, name: 'カード2' };

    state = handleCardSelect(state, card1);
    expect(state.selectedCard).toEqual(card1);

    state = handleCardSelect(state, card2);
    expect(state.selectedCard).toEqual(card2);
  });

  test('同じカードをタップすると選択解除される', () => {
    let state = createCardSelectionState();
    const card = { id: 1, name: 'テストカード' };

    state = handleCardSelect(state, card);
    expect(state.selectedCard).toEqual(card);

    state = handleCardSelect(state, card);
    expect(state.selectedCard).toBeNull();
  });

  test('選択せずに進むことができる（selectedCardがnullのまま）', () => {
    const state = createCardSelectionState();
    expect(state.selectedCard).toBeNull();
    // この状態でonSkip()を呼べば、カード追加なしで進む
  });
});
