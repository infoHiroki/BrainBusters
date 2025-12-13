// カードデータ変換
// 既存の500枚の概念カードをバトル用カードに変換

import { Card, CardType, CardEffect } from '../types/game';
import conceptsData from './concepts.json';

// 既存の概念型
interface Concept {
  id: number;
  name: string;
  description: string;
  basePower: number;
  category: string;
  rarity: 1 | 2 | 3 | 4 | 5;
  author?: string;
}

const concepts: Concept[] = conceptsData as Concept[];

// 回復系カードかどうかを判定
const isHealingCard = (name: string, category: string): boolean => {
  const healKeywords = [
    '治', '癒', '回復', '生命', '愛', '希望', '光', '救', '再生', '復活', '蘇', '健康', '活力',
    '安心', '幸福', '慈悲', '平穏', '安らぎ', '休息', '祈り', '恵み', '感謝', '満足', '喜び'
  ];
  return healKeywords.some(kw => name.includes(kw));
};

// カテゴリからカードタイプを決定
const getCategoryType = (category: string, name: string): CardType => {
  // 回復系は先にチェック（スキルとして扱う）
  if (isHealingCard(name, category)) {
    return 'skill';
  }

  // 攻撃系カテゴリ
  const attackCategories = ['action', 'emotion'];
  const attackKeywords = ['怒り', '破壊', '攻撃', '力', '戦', '殺', '死', '滅'];

  // 防御系カテゴリ
  const defenseCategories = ['philosophy', 'abstract'];
  const defenseKeywords = ['守', '防', '耐', '壁', '盾', '安', '静', '平和'];

  // スキル系カテゴリ
  const skillCategories = ['science', 'culture', 'modern', 'mythology', 'psychology', 'society', 'literature', 'person'];

  // 名前でキーワードチェック
  if (attackKeywords.some(kw => name.includes(kw))) {
    return 'attack';
  }
  if (defenseKeywords.some(kw => name.includes(kw))) {
    return 'defense';
  }

  // カテゴリで判定
  if (attackCategories.includes(category)) {
    return 'attack';
  }
  if (defenseCategories.includes(category)) {
    return 'defense';
  }
  if (skillCategories.includes(category)) {
    return 'skill';
  }

  // quote（発言）は内容に応じて分散
  if (category === 'quote') {
    // ランダムに近い分散だが、一貫性を保つためIDで決定
    const mod = concepts.findIndex(c => c.name === name) % 3;
    return mod === 0 ? 'attack' : mod === 1 ? 'defense' : 'skill';
  }

  return 'skill';
};

// カードの「個性」を決定するためのハッシュ関数
const getCardVariant = (id: number): number => {
  // IDを使って一貫したバリアント（0-9）を生成
  return id % 10;
};

// basePowerからコストを計算（バリアントで変化）
const calculateCost = (basePower: number, type: CardType, name: string = '', category: string = '', id: number = 0): number => {
  const variant = getCardVariant(id);

  // 回復カードは強力なのでコスト高め、ただしバリアントで変化
  if (isHealingCard(name, category)) {
    if (variant < 3) return 1; // 30%: 低コスト・低効果
    if (variant < 7) return 2; // 40%: 中コスト
    return 3; // 30%: 高コスト・高効果
  }

  // スキルカード
  if (type === 'skill') {
    if (variant < 4) return 0; // 40%: 無料
    if (variant < 8) return 1; // 40%: 低コスト
    return 2; // 20%: 高コスト・高効果
  }

  // 攻撃・防御カード - basePowerとバリアントの組み合わせ
  if (variant < 2) return 0; // 20%: 無料（弱い）
  if (variant < 5) return 1; // 30%: 低コスト
  if (variant < 8) return 2; // 30%: 中コスト
  return 3; // 20%: 高コスト・強力
};

// コストに応じた効果値を計算（大きな差を持たせる）
const calculateEffectValue = (basePower: number, type: CardType, cost: number, id: number = 0): number => {
  const variant = getCardVariant(id);

  // コストに応じた基本値（大きな差）
  const baseByCost: Record<number, [number, number]> = {
    0: [4, 8],    // コスト0: 4-8
    1: [8, 14],   // コスト1: 8-14
    2: [14, 22],  // コスト2: 14-22
    3: [22, 35],  // コスト3: 22-35
  };

  const [min, max] = baseByCost[cost] || [8, 14];

  // バリアントで範囲内の値を決定
  const range = max - min;
  const value = min + Math.floor((variant / 10) * range);

  return value;
};

// カードタイプに応じた効果を生成（カードIDで特殊効果を決定）
const generateEffects = (basePower: number, type: CardType, rarity: number, name: string = '', category: string = '', id: number = 0): CardEffect[] => {
  const cost = calculateCost(basePower, type, name, category, id);
  const value = calculateEffectValue(basePower, type, cost, id);
  const variant = getCardVariant(id);
  const effects: CardEffect[] = [];

  // 回復系カードの場合
  if (isHealingCard(name, category)) {
    // 回復量はコストに比例（大きな差）
    const healByCost: Record<number, number> = { 1: 8, 2: 18, 3: 30 };
    const healValue = healByCost[cost] || 12;

    effects.push({
      type: 'heal',
      value: healValue,
      target: 'self',
    });

    // バリアントで追加効果
    if (variant >= 7) {
      // 30%: 再生バフも付与
      effects.push({
        type: 'buff',
        value: 2,
        target: 'self',
        statusType: 'regeneration',
        statusDuration: 3,
      });
    } else if (variant >= 4) {
      // 30%: ブロックも付与
      effects.push({
        type: 'block',
        value: Math.floor(healValue / 2),
        target: 'self',
      });
    }
    return effects;
  }

  switch (type) {
    case 'attack':
      // 攻撃カードのバリエーション
      if (variant < 2) {
        // 20%: 全体攻撃（威力は低め）
        effects.push({
          type: 'damage',
          value: Math.floor(value * 0.6),
          target: 'all_enemies',
        });
      } else if (variant < 4) {
        // 20%: デバフ付き攻撃
        effects.push({
          type: 'damage',
          value: Math.floor(value * 0.8),
          target: 'enemy',
        });
        effects.push({
          type: 'debuff',
          value: 2,
          target: 'enemy',
          statusType: 'vulnerable',
          statusDuration: 2,
        });
      } else if (variant < 6) {
        // 20%: 高威力（シンプル）
        effects.push({
          type: 'damage',
          value: value,
          target: 'enemy',
        });
      } else if (variant < 8) {
        // 20%: 弱体化付き
        effects.push({
          type: 'damage',
          value: Math.floor(value * 0.85),
          target: 'enemy',
        });
        effects.push({
          type: 'debuff',
          value: 1,
          target: 'enemy',
          statusType: 'weak',
          statusDuration: 2,
        });
      } else {
        // 20%: 筋力バフ付き
        effects.push({
          type: 'damage',
          value: Math.floor(value * 0.7),
          target: 'enemy',
        });
        effects.push({
          type: 'buff',
          value: 2,
          target: 'self',
          statusType: 'strength',
        });
      }
      break;

    case 'defense':
      // 防御カードのバリエーション
      if (variant < 3) {
        // 30%: 高ブロック
        effects.push({
          type: 'block',
          value: value,
          target: 'self',
        });
      } else if (variant < 5) {
        // 20%: 中ブロック + 敏捷
        effects.push({
          type: 'block',
          value: Math.floor(value * 0.7),
          target: 'self',
        });
        effects.push({
          type: 'buff',
          value: 2,
          target: 'self',
          statusType: 'dexterity',
          statusDuration: 2,
        });
      } else if (variant < 7) {
        // 20%: ブロック + ドロー
        effects.push({
          type: 'block',
          value: Math.floor(value * 0.6),
          target: 'self',
        });
        effects.push({
          type: 'draw',
          value: 1,
          target: 'self',
        });
      } else if (variant < 9) {
        // 20%: ブロック + 反撃ダメージ
        effects.push({
          type: 'block',
          value: Math.floor(value * 0.7),
          target: 'self',
        });
        effects.push({
          type: 'damage',
          value: Math.floor(value * 0.3),
          target: 'enemy',
        });
      } else {
        // 10%: 敵を弱体化
        effects.push({
          type: 'block',
          value: Math.floor(value * 0.5),
          target: 'self',
        });
        effects.push({
          type: 'debuff',
          value: 2,
          target: 'enemy',
          statusType: 'weak',
          statusDuration: 2,
        });
      }
      break;

    case 'skill':
      // スキルカードはさらに多様
      if (variant < 2) {
        // 20%: 大量ドロー
        effects.push({
          type: 'draw',
          value: cost + 2,
          target: 'self',
        });
      } else if (variant < 4) {
        // 20%: エネルギー獲得 + ドロー
        effects.push({
          type: 'energy',
          value: 2,
          target: 'self',
        });
        effects.push({
          type: 'draw',
          value: 1,
          target: 'self',
        });
      } else if (variant < 6) {
        // 20%: 大筋力バフ
        effects.push({
          type: 'buff',
          value: cost + 2,
          target: 'self',
          statusType: 'strength',
        });
      } else if (variant < 8) {
        // 20%: 敵全体にデバフ
        effects.push({
          type: 'debuff',
          value: 2,
          target: 'all_enemies',
          statusType: 'vulnerable',
          statusDuration: 2,
        });
        effects.push({
          type: 'debuff',
          value: 2,
          target: 'all_enemies',
          statusType: 'weak',
          statusDuration: 2,
        });
      } else {
        // 20%: 複合効果（小ダメージ + 小ブロック + ドロー）
        effects.push({
          type: 'damage',
          value: 5 + cost * 3,
          target: 'all_enemies',
        });
        effects.push({
          type: 'block',
          value: 5 + cost * 3,
          target: 'self',
        });
        effects.push({
          type: 'draw',
          value: 1,
          target: 'self',
        });
      }
      break;
  }

  return effects;
};

// カードの説明文を生成
const generateCardDescription = (effects: CardEffect[], type: CardType): string => {
  const descriptions: string[] = [];

  for (const effect of effects) {
    switch (effect.type) {
      case 'damage':
        if (effect.target === 'all_enemies') {
          descriptions.push(`全ての敵に${effect.value}ダメージ`);
        } else {
          descriptions.push(`${effect.value}ダメージ`);
        }
        break;
      case 'block':
        descriptions.push(`${effect.value}ブロック`);
        break;
      case 'draw':
        descriptions.push(`即座に${effect.value}枚ドロー`);
        break;
      case 'energy':
        descriptions.push(`${effect.value}エネルギー獲得`);
        break;
      case 'heal':
        descriptions.push(`${effect.value}回復`);
        break;
      case 'buff':
        const buffName = getStatusName(effect.statusType!);
        if (effect.statusDuration) {
          descriptions.push(`${buffName}を${effect.value}付与(${effect.statusDuration}ターン)`);
        } else {
          descriptions.push(`${buffName}を${effect.value}付与`);
        }
        break;
      case 'debuff':
        const debuffName = getStatusName(effect.statusType!);
        if (effect.statusDuration) {
          descriptions.push(`${debuffName}を${effect.value}付与(${effect.statusDuration}ターン)`);
        } else {
          descriptions.push(`${debuffName}を${effect.value}付与`);
        }
        break;
    }
  }

  return descriptions.join('。');
};

// ステータス名を取得
const getStatusName = (statusType: string): string => {
  switch (statusType) {
    case 'strength': return '筋力';
    case 'dexterity': return '敏捷';
    case 'vulnerable': return '脆弱';
    case 'weak': return '弱体';
    case 'frail': return '衰弱';
    case 'poison': return '毒';
    case 'regeneration': return '再生';
    default: return statusType;
  }
};

// 概念をカードに変換
const convertConceptToCard = (concept: Concept): Card => {
  const type = getCategoryType(concept.category, concept.name);
  const cost = calculateCost(concept.basePower, type, concept.name, concept.category, concept.id);
  const effects = generateEffects(concept.basePower, type, concept.rarity, concept.name, concept.category, concept.id);
  const description = generateCardDescription(effects, type);

  return {
    id: concept.id,
    name: concept.name,
    description: description,
    type: type,
    cost: cost,
    effects: effects,
    category: concept.category,
    rarity: concept.rarity,
    flavorText: concept.description, // 元の説明をフレーバーテキストに
  };
};

// 全カードを変換
export const cards: Card[] = concepts.map(convertConceptToCard);

// ヘルパー関数

// IDでカードを取得
export const getCardById = (id: number): Card | undefined => {
  return cards.find(c => c.id === id);
};

// タイプでフィルタ
export const getCardsByType = (type: CardType): Card[] => {
  return cards.filter(c => c.type === type);
};

// レアリティでフィルタ
export const getCardsByRarity = (rarity: 1 | 2 | 3 | 4 | 5): Card[] => {
  return cards.filter(c => c.rarity === rarity);
};

// カテゴリでフィルタ
export const getCardsByCategory = (category: string): Card[] => {
  return cards.filter(c => c.category === category);
};

// コストでフィルタ
export const getCardsByCost = (cost: number): Card[] => {
  return cards.filter(c => c.cost === cost);
};

// 回復カードを取得
export const getHealingCards = (): Card[] => {
  return cards.filter(c => c.effects.some(e => e.type === 'heal'));
};

// ランダムなカードを取得
export const getRandomCard = (): Card => {
  return cards[Math.floor(Math.random() * cards.length)];
};

// レアリティに基づいてランダムなカードを取得
export const getRandomCardByRarity = (): Card => {
  // レアリティの重み
  const weights = { 1: 40, 2: 30, 3: 20, 4: 8, 5: 2 };
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  let random = Math.random() * totalWeight;
  let selectedRarity: 1 | 2 | 3 | 4 | 5 = 1;

  for (const [rarity, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      selectedRarity = parseInt(rarity) as 1 | 2 | 3 | 4 | 5;
      break;
    }
  }

  const cardsOfRarity = getCardsByRarity(selectedRarity);
  return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
};

// 初期デッキを生成（10枚）
// 500種類の概念から幅広く選択
export const generateStarterDeck = (): Card[] => {
  const starterDeck: Card[] = [];
  const usedIds = new Set<number>();

  // コスト2以下、レアリティ4以下のカードから選択（より広いプール）
  const validCards = cards.filter(c => c.cost <= 2 && c.rarity <= 4);

  // ユニークなカードを選択するヘルパー
  const pickUnique = (pool: Card[]): Card => {
    const available = pool.filter(c => !usedIds.has(c.id));
    if (available.length === 0) {
      // フォールバック: 重複許可
      return pool[Math.floor(Math.random() * pool.length)];
    }
    const card = available[Math.floor(Math.random() * available.length)];
    usedIds.add(card.id);
    return card;
  };

  // 攻撃カード5枚
  const attackCards = validCards.filter(c => c.type === 'attack');
  for (let i = 0; i < 5; i++) {
    const card = pickUnique(attackCards);
    starterDeck.push(card);
  }

  // 防御カード4枚
  const defenseCards = validCards.filter(c => c.type === 'defense');
  for (let i = 0; i < 4; i++) {
    const card = pickUnique(defenseCards);
    starterDeck.push(card);
  }

  // スキルカード1枚
  const skillCards = validCards.filter(c => c.type === 'skill');
  starterDeck.push(pickUnique(skillCards));

  return starterDeck;
};

// 報酬カード候補を生成（3枚）
export const generateRewardCards = (floor: number): Card[] => {
  const rewards: Card[] = [];
  const usedIds = new Set<number>();

  // 階層に応じてレアリティの出現率を上げる
  const getFloorRarity = (): 1 | 2 | 3 | 4 | 5 => {
    const rand = Math.random() * 100;
    if (floor >= 10) {
      if (rand < 5) return 5;
      if (rand < 20) return 4;
      if (rand < 50) return 3;
      if (rand < 80) return 2;
      return 1;
    } else if (floor >= 5) {
      if (rand < 2) return 5;
      if (rand < 10) return 4;
      if (rand < 35) return 3;
      if (rand < 70) return 2;
      return 1;
    } else {
      if (rand < 1) return 5;
      if (rand < 5) return 4;
      if (rand < 25) return 3;
      if (rand < 60) return 2;
      return 1;
    }
  };

  // 50%の確率で回復カードを1枚含める
  const includeHealCard = Math.random() < 0.5;
  if (includeHealCard) {
    const healingCards = getHealingCards().filter(c => !usedIds.has(c.id));
    if (healingCards.length > 0) {
      const healCard = healingCards[Math.floor(Math.random() * healingCards.length)];
      rewards.push(healCard);
      usedIds.add(healCard.id);
    }
  }

  while (rewards.length < 3) {
    const rarity = getFloorRarity();
    const candidates = getCardsByRarity(rarity).filter(c => !usedIds.has(c.id));
    if (candidates.length > 0) {
      const card = candidates[Math.floor(Math.random() * candidates.length)];
      rewards.push(card);
      usedIds.add(card.id);
    }
  }

  return rewards;
};

// カードの統計情報
export const cardStats = {
  total: cards.length,
  byType: {
    attack: getCardsByType('attack').length,
    defense: getCardsByType('defense').length,
    skill: getCardsByType('skill').length,
  },
  byRarity: {
    1: getCardsByRarity(1).length,
    2: getCardsByRarity(2).length,
    3: getCardsByRarity(3).length,
    4: getCardsByRarity(4).length,
    5: getCardsByRarity(5).length,
  },
};

// カードを強化する
// 効果値+25%、コスト0のカードはそのまま、コスト1以上は稀にコスト-1
export const upgradeCard = (card: Card): Card => {
  if (card.upgraded) {
    return card; // 既に強化済み
  }

  // 効果を強化（ダメージ/ブロック/回復を+25%、ドローは+1）
  const upgradedEffects: CardEffect[] = card.effects.map(effect => {
    const newEffect = { ...effect };

    switch (effect.type) {
      case 'damage':
      case 'block':
      case 'heal':
        // +25%（最低+2）
        newEffect.value = effect.value + Math.max(2, Math.floor(effect.value * 0.25));
        break;
      case 'draw':
        // ドローは+1
        newEffect.value = effect.value + 1;
        break;
      case 'buff':
      case 'debuff':
        // バフ/デバフは+1スタック
        newEffect.value = effect.value + 1;
        break;
      case 'energy':
        // エネルギーは+1
        newEffect.value = effect.value + 1;
        break;
    }

    return newEffect;
  });

  // コスト軽減（コスト2以上で30%の確率、コスト3以上で50%の確率）
  let newCost = card.cost;
  if (card.cost >= 3) {
    newCost = card.cost - 1;
  } else if (card.cost === 2 && Math.random() < 0.3) {
    newCost = 1;
  }

  // 説明文を再生成
  const newDescription = generateCardDescription(upgradedEffects, card.type);

  return {
    ...card,
    name: card.name + '+',
    cost: newCost,
    effects: upgradedEffects,
    description: newDescription,
    upgraded: true,
  };
};
