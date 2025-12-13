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
  const healKeywords = ['治', '癒', '回復', '生命', '命', '愛', '希望', '光', '救', '再生', '復活', '蘇', '健康', '活力'];
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

// basePowerからコストを計算
const calculateCost = (basePower: number, type: CardType): number => {
  // 基本コスト計算
  if (basePower >= 85) return 3;
  if (basePower >= 70) return 2;
  if (basePower >= 50) return 1;
  return 0;

  // スキルカードは若干コストを下げる
  // if (type === 'skill' && cost > 0) {
  //   return cost - 1;
  // }
};

// basePowerから効果値を計算
const calculateEffectValue = (basePower: number, type: CardType): number => {
  // ダメージ/ブロック値の計算
  // basePower 1-100 → 効果値 3-20
  const base = Math.floor(basePower / 5) + 2;
  return Math.max(3, Math.min(20, base));
};

// カードタイプに応じた効果を生成
const generateEffects = (basePower: number, type: CardType, rarity: number, name: string = '', category: string = ''): CardEffect[] => {
  const value = calculateEffectValue(basePower, type);
  const effects: CardEffect[] = [];

  // 回復系カードの場合は回復効果を生成
  if (isHealingCard(name, category)) {
    const healValue = Math.floor(value * 0.8); // 回復量はダメージより若干低め
    effects.push({
      type: 'heal',
      value: Math.max(3, healValue),
      target: 'self',
    });
    // 高レアは追加で再生バフ
    if (rarity >= 4) {
      effects.push({
        type: 'buff',
        value: 2,
        target: 'self',
        statusType: 'regeneration',
        statusDuration: 2,
      });
    }
    return effects;
  }

  switch (type) {
    case 'attack':
      // 攻撃カード：ダメージを与える
      effects.push({
        type: 'damage',
        value: value,
        target: 'enemy',
      });
      // 高レア攻撃はデバフも付与
      if (rarity >= 4 && basePower >= 80) {
        effects.push({
          type: 'debuff',
          value: 1,
          target: 'enemy',
          statusType: 'vulnerable',
          statusDuration: 2,
        });
      }
      break;

    case 'defense':
      // 防御カード：ブロックを得る
      effects.push({
        type: 'block',
        value: value,
        target: 'self',
      });
      // 高レア防御は追加効果
      if (rarity >= 4 && basePower >= 80) {
        effects.push({
          type: 'buff',
          value: 1,
          target: 'self',
          statusType: 'dexterity',
          statusDuration: 1,
        });
      }
      break;

    case 'skill':
      // スキルカード：多様な効果
      if (basePower >= 75) {
        // 高パワースキル：ドロー + 小ダメージ
        effects.push({
          type: 'draw',
          value: Math.min(3, Math.floor(basePower / 30)),
          target: 'self',
        });
        if (rarity >= 3) {
          effects.push({
            type: 'damage',
            value: Math.floor(value / 2),
            target: 'all_enemies',
          });
        }
      } else if (basePower >= 50) {
        // 中パワースキル：バフ
        effects.push({
          type: 'buff',
          value: Math.floor(basePower / 25),
          target: 'self',
          statusType: 'strength',
        });
      } else {
        // 低パワースキル：ドロー + エネルギー
        effects.push({
          type: 'draw',
          value: 1,
          target: 'self',
        });
        if (rarity >= 2) {
          effects.push({
            type: 'energy',
            value: 1,
            target: 'self',
          });
        }
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
        descriptions.push(`${effect.value}枚ドロー`);
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
  const cost = calculateCost(concept.basePower, type);
  const effects = generateEffects(concept.basePower, type, concept.rarity, concept.name, concept.category);
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
export const generateStarterDeck = (): Card[] => {
  const starterDeck: Card[] = [];

  // 攻撃カード5枚（低〜中コスト）
  const attackCards = getCardsByType('attack').filter(c => c.cost <= 1 && c.rarity <= 2);
  for (let i = 0; i < 5; i++) {
    starterDeck.push(attackCards[Math.floor(Math.random() * attackCards.length)]);
  }

  // 防御カード4枚（低〜中コスト）
  const defenseCards = getCardsByType('defense').filter(c => c.cost <= 1 && c.rarity <= 2);
  for (let i = 0; i < 4; i++) {
    starterDeck.push(defenseCards[Math.floor(Math.random() * defenseCards.length)]);
  }

  // スキルカード1枚（低コスト）
  const skillCards = getCardsByType('skill').filter(c => c.cost <= 1 && c.rarity <= 2);
  starterDeck.push(skillCards[Math.floor(Math.random() * skillCards.length)]);

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

  // 30%の確率で回復カードを1枚含める
  const includeHealCard = Math.random() < 0.3;
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
