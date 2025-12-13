// カードデータ変換
// 既存の500枚の概念カードをバトル用カードに変換

import { Card, CardType, CardEffect, StatusType } from '../types/game';
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

// basePowerからコストを計算（コスト0を減らし、1-2をメインに）
const calculateCost = (basePower: number, type: CardType, name: string = '', category: string = '', id: number = 0): number => {
  const variant = getCardVariant(id);

  // 回復カードは強力なのでコスト高め
  if (isHealingCard(name, category)) {
    if (variant < 2) return 1; // 20%: 低コスト・低効果
    if (variant < 6) return 2; // 40%: 中コスト
    return 3; // 40%: 高コスト・高効果
  }

  // スキルカード（コスト0を減らす）
  if (type === 'skill') {
    if (variant < 2) return 0; // 20%: 無料
    if (variant < 6) return 1; // 40%: 低コスト
    return 2; // 40%: 高コスト・高効果
  }

  // 攻撃・防御カード（コスト0を大幅に減らす）
  if (variant < 1) return 0; // 10%: 無料（弱い）
  if (variant < 4) return 1; // 30%: 低コスト
  if (variant < 7) return 2; // 30%: 中コスト
  return 3; // 30%: 高コスト・強力
};

// コストに応じた効果値を計算（数値を全体的に上げる）
const calculateEffectValue = (basePower: number, type: CardType, cost: number, id: number = 0): number => {
  const variant = getCardVariant(id);

  // コストに応じた基本値（より高い数値）
  const baseByCost: Record<number, [number, number]> = {
    0: [6, 10],    // コスト0: 6-10
    1: [12, 18],   // コスト1: 12-18
    2: [20, 28],   // コスト2: 20-28
    3: [30, 45],   // コスト3: 30-45
  };

  const [min, max] = baseByCost[cost] || [12, 18];

  // バリアントで範囲内の値を決定
  const range = max - min;
  const value = min + Math.floor((variant / 10) * range);

  return value;
};

// カテゴリ別効果テンプレート定義
// 各カテゴリに特色ある効果パターンを持たせる
interface EffectTemplate {
  type: CardEffect['type'];
  valueMultiplier: number; // 基本値に対する乗数
  target: CardEffect['target'];
  statusType?: StatusType;
  statusDuration?: number;
  extraValue?: number; // 固定値追加
}

interface CategoryTemplate {
  attackPatterns: EffectTemplate[][];
  defensePatterns: EffectTemplate[][];
  skillPatterns: EffectTemplate[][];
}

// カテゴリ別テンプレート定義
const categoryTemplates: Record<string, CategoryTemplate> = {
  // 感情: ネガティブ→高火力攻撃/デバフ、ポジティブ→回復/バフ
  emotion: {
    attackPatterns: [
      // 怒り・破壊系: 高火力単体
      [{ type: 'damage', valueMultiplier: 1.3, target: 'enemy' }],
      // 恐怖系: ダメージ + 弱体化
      [
        { type: 'damage', valueMultiplier: 0.9, target: 'enemy' },
        { type: 'debuff', valueMultiplier: 0, target: 'enemy', statusType: 'weak', statusDuration: 2, extraValue: 2 },
      ],
      // 悲しみ系: 全体攻撃
      [{ type: 'damage', valueMultiplier: 0.95, target: 'all_enemies' }],
      // 絶望系: 大ダメージ + 自傷（脆弱）
      [
        { type: 'damage', valueMultiplier: 1.5, target: 'enemy' },
        { type: 'debuff', valueMultiplier: 0, target: 'self', statusType: 'vulnerable', statusDuration: 1, extraValue: 1 },
      ],
    ],
    defensePatterns: [
      // 希望系: ブロック + 再生
      [
        { type: 'block', valueMultiplier: 0.7, target: 'self' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'regeneration', statusDuration: 2, extraValue: 2 },
      ],
      // 愛系: ブロック + 回復
      [
        { type: 'block', valueMultiplier: 0.6, target: 'self' },
        { type: 'heal', valueMultiplier: 0.3, target: 'self' },
      ],
      // 安心系: 高ブロック
      [{ type: 'block', valueMultiplier: 1.1, target: 'self' }],
    ],
    skillPatterns: [
      // 喜び系: ドロー + エネルギー
      [
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 2 },
        { type: 'energy', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
      // 平穏系: 回復
      [{ type: 'heal', valueMultiplier: 1.2, target: 'self' }],
    ],
  },

  // 行動: 連撃、追加効果、機動力
  action: {
    attackPatterns: [
      // 連撃系: 2回攻撃
      [
        { type: 'damage', valueMultiplier: 0.5, target: 'enemy' },
        { type: 'damage', valueMultiplier: 0.5, target: 'enemy' },
      ],
      // 突進系: ダメージ + 敵弱体
      [
        { type: 'damage', valueMultiplier: 0.9, target: 'enemy' },
        { type: 'debuff', valueMultiplier: 0, target: 'enemy', statusType: 'vulnerable', statusDuration: 1, extraValue: 1 },
      ],
      // 全力攻撃: 高ダメージ
      [{ type: 'damage', valueMultiplier: 1.2, target: 'enemy' }],
      // 乱撃: 全体攻撃
      [{ type: 'damage', valueMultiplier: 0.9, target: 'all_enemies' }],
    ],
    defensePatterns: [
      // 回避系: ブロック + ドロー
      [
        { type: 'block', valueMultiplier: 0.6, target: 'self' },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
      // カウンター: ブロック + 反撃
      [
        { type: 'block', valueMultiplier: 0.5, target: 'self' },
        { type: 'damage', valueMultiplier: 0.4, target: 'enemy' },
      ],
      // 構え: ブロック + 筋力
      [
        { type: 'block', valueMultiplier: 0.6, target: 'self' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 1 },
      ],
    ],
    skillPatterns: [
      // 準備: 筋力バフ
      [{ type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 3 }],
      // 加速: エネルギー + ドロー
      [
        { type: 'energy', valueMultiplier: 0, target: 'self', extraValue: 2 },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
    ],
  },

  // 哲学: 知的、複合効果、ドロー系
  philosophy: {
    attackPatterns: [
      // 論理的攻撃: ダメージ + ドロー
      [
        { type: 'damage', valueMultiplier: 0.8, target: 'enemy' },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
      // 真理: 高威力
      [{ type: 'damage', valueMultiplier: 1.1, target: 'enemy' }],
      // 啓蒙: ダメージ + 敵脆弱
      [
        { type: 'damage', valueMultiplier: 0.85, target: 'enemy' },
        { type: 'debuff', valueMultiplier: 0, target: 'enemy', statusType: 'vulnerable', statusDuration: 2, extraValue: 1 },
      ],
    ],
    defensePatterns: [
      // 思索: ブロック + ドロー
      [
        { type: 'block', valueMultiplier: 0.5, target: 'self' },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 2 },
      ],
      // 冷静: 高ブロック
      [{ type: 'block', valueMultiplier: 1.0, target: 'self' }],
      // 洞察: ブロック + 敏捷
      [
        { type: 'block', valueMultiplier: 0.6, target: 'self' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'dexterity', statusDuration: 2, extraValue: 2 },
      ],
    ],
    skillPatterns: [
      // 熟考: 大量ドロー
      [{ type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 3 }],
      // 悟り: 筋力 + 敏捷
      [
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 2 },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'dexterity', statusDuration: 3, extraValue: 2 },
      ],
    ],
  },

  // 抽象概念: 特殊効果、エネルギー操作
  abstract: {
    attackPatterns: [
      // 無: 全体攻撃
      [{ type: 'damage', valueMultiplier: 0.85, target: 'all_enemies' }],
      // 因果: ダメージ + デバフ
      [
        { type: 'damage', valueMultiplier: 0.7, target: 'enemy' },
        { type: 'debuff', valueMultiplier: 0, target: 'enemy', statusType: 'weak', statusDuration: 2, extraValue: 2 },
        { type: 'debuff', valueMultiplier: 0, target: 'enemy', statusType: 'vulnerable', statusDuration: 2, extraValue: 1 },
      ],
      // 存在: 高威力単体
      [{ type: 'damage', valueMultiplier: 1.15, target: 'enemy' }],
    ],
    defensePatterns: [
      // 静寂: 高ブロック + ドロー
      [
        { type: 'block', valueMultiplier: 0.7, target: 'self' },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
      // 永遠: ブロック + 再生
      [
        { type: 'block', valueMultiplier: 0.5, target: 'self' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'regeneration', statusDuration: 3, extraValue: 3 },
      ],
    ],
    skillPatterns: [
      // 時間: エネルギー大獲得
      [{ type: 'energy', valueMultiplier: 0, target: 'self', extraValue: 3 }],
      // 空間: ドロー + ブロック
      [
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 2 },
        { type: 'block', valueMultiplier: 0.4, target: 'self' },
      ],
      // 無限: バフ全部
      [
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 1 },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'dexterity', statusDuration: 3, extraValue: 1 },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
    ],
  },

  // 神話: 強力だがリスクあり、ハイリターン
  mythology: {
    attackPatterns: [
      // 神の一撃: 超高威力
      [{ type: 'damage', valueMultiplier: 1.6, target: 'enemy' }],
      // 天罰: 全体大ダメージ
      [{ type: 'damage', valueMultiplier: 0.9, target: 'all_enemies' }],
      // 神話の力: ダメージ + 筋力
      [
        { type: 'damage', valueMultiplier: 0.8, target: 'enemy' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 3 },
      ],
    ],
    defensePatterns: [
      // 神盾: 超高ブロック
      [{ type: 'block', valueMultiplier: 1.4, target: 'self' }],
      // 加護: ブロック + 再生
      [
        { type: 'block', valueMultiplier: 0.6, target: 'self' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'regeneration', statusDuration: 3, extraValue: 4 },
      ],
    ],
    skillPatterns: [
      // 啓示: 大量ドロー + エネルギー
      [
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 3 },
        { type: 'energy', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
      // 神威: 全バフ
      [
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 2 },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'dexterity', statusDuration: 3, extraValue: 2 },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'regeneration', statusDuration: 2, extraValue: 2 },
      ],
    ],
  },

  // 心理学: デバフ特化、精神操作
  psychology: {
    attackPatterns: [
      // 心理攻撃: ダメージ + 弱体
      [
        { type: 'damage', valueMultiplier: 0.7, target: 'enemy' },
        { type: 'debuff', valueMultiplier: 0, target: 'enemy', statusType: 'weak', statusDuration: 2, extraValue: 2 },
      ],
      // 恐怖誘発: ダメージ + 脆弱
      [
        { type: 'damage', valueMultiplier: 0.8, target: 'enemy' },
        { type: 'debuff', valueMultiplier: 0, target: 'enemy', statusType: 'vulnerable', statusDuration: 2, extraValue: 2 },
      ],
      // 混乱: 全体攻撃 + デバフ
      [
        { type: 'damage', valueMultiplier: 0.8, target: 'all_enemies' },
        { type: 'debuff', valueMultiplier: 0, target: 'all_enemies', statusType: 'weak', statusDuration: 2, extraValue: 1 },
      ],
    ],
    defensePatterns: [
      // 冷静さ: ブロック + ドロー
      [
        { type: 'block', valueMultiplier: 0.7, target: 'self' },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
      // 精神集中: ブロック + 敏捷
      [
        { type: 'block', valueMultiplier: 0.6, target: 'self' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'dexterity', statusDuration: 2, extraValue: 2 },
      ],
    ],
    skillPatterns: [
      // 分析: ドロー
      [{ type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 3 }],
      // 催眠: 全体デバフ
      [
        { type: 'debuff', valueMultiplier: 0, target: 'all_enemies', statusType: 'weak', statusDuration: 2, extraValue: 2 },
        { type: 'debuff', valueMultiplier: 0, target: 'all_enemies', statusType: 'vulnerable', statusDuration: 2, extraValue: 2 },
      ],
    ],
  },

  // 科学: 精密、計算、バフ系
  science: {
    attackPatterns: [
      // 精密打撃: 高威力
      [{ type: 'damage', valueMultiplier: 1.15, target: 'enemy' }],
      // 化学反応: ダメージ + 毒
      [
        { type: 'damage', valueMultiplier: 0.7, target: 'enemy' },
        { type: 'debuff', valueMultiplier: 0, target: 'enemy', statusType: 'poison', extraValue: 4 },
      ],
      // 連鎖反応: 全体攻撃
      [{ type: 'damage', valueMultiplier: 0.85, target: 'all_enemies' }],
    ],
    defensePatterns: [
      // 計算: ブロック + ドロー
      [
        { type: 'block', valueMultiplier: 0.6, target: 'self' },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
      // 強化材: 高ブロック
      [{ type: 'block', valueMultiplier: 1.1, target: 'self' }],
      // 研究: ブロック + 筋力
      [
        { type: 'block', valueMultiplier: 0.5, target: 'self' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 2 },
      ],
    ],
    skillPatterns: [
      // 実験: エネルギー + ドロー
      [
        { type: 'energy', valueMultiplier: 0, target: 'self', extraValue: 2 },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
      // 発見: 大ドロー
      [{ type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 4 }],
    ],
  },

  // 人物: コンボ起点、バフ付与、育成型
  person: {
    attackPatterns: [
      // 師の教え: ダメージ + 筋力
      [
        { type: 'damage', valueMultiplier: 0.7, target: 'enemy' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 2 },
      ],
      // 英雄の一撃: 高威力
      [{ type: 'damage', valueMultiplier: 1.1, target: 'enemy' }],
      // 先人の知恵: ダメージ + ドロー
      [
        { type: 'damage', valueMultiplier: 0.8, target: 'enemy' },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
    ],
    defensePatterns: [
      // 守護者: 高ブロック
      [{ type: 'block', valueMultiplier: 1.0, target: 'self' }],
      // 賢者の盾: ブロック + ドロー
      [
        { type: 'block', valueMultiplier: 0.6, target: 'self' },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
      // 導師: ブロック + バフ
      [
        { type: 'block', valueMultiplier: 0.5, target: 'self' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'dexterity', statusDuration: 2, extraValue: 2 },
      ],
    ],
    skillPatterns: [
      // 指導: 筋力バフ
      [{ type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 3 }],
      // 啓発: ドロー + 敏捷
      [
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 2 },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'dexterity', statusDuration: 2, extraValue: 1 },
      ],
    ],
  },

  // 名言: 多様な効果（ランダム性高め）
  quote: {
    attackPatterns: [
      // 言葉の力: 高威力
      [{ type: 'damage', valueMultiplier: 1.1, target: 'enemy' }],
      // 痛烈な一言: ダメージ + デバフ
      [
        { type: 'damage', valueMultiplier: 0.8, target: 'enemy' },
        { type: 'debuff', valueMultiplier: 0, target: 'enemy', statusType: 'vulnerable', statusDuration: 2, extraValue: 2 },
      ],
      // 演説: 全体攻撃
      [{ type: 'damage', valueMultiplier: 0.9, target: 'all_enemies' }],
      // 鼓舞: ダメージ + 筋力
      [
        { type: 'damage', valueMultiplier: 0.7, target: 'enemy' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 2 },
      ],
    ],
    defensePatterns: [
      // 名言の守り: 高ブロック
      [{ type: 'block', valueMultiplier: 1.0, target: 'self' }],
      // 格言: ブロック + ドロー
      [
        { type: 'block', valueMultiplier: 0.6, target: 'self' },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
      // 教訓: ブロック + 敏捷
      [
        { type: 'block', valueMultiplier: 0.6, target: 'self' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'dexterity', statusDuration: 2, extraValue: 2 },
      ],
    ],
    skillPatterns: [
      // 金言: バフ全部
      [
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 2 },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'dexterity', statusDuration: 2, extraValue: 1 },
      ],
      // 知恵: ドロー
      [{ type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 3 }],
    ],
  },

  // 文化: バランス型、多様な効果
  culture: {
    attackPatterns: [
      // 文化の衝撃: ダメージ + デバフ
      [
        { type: 'damage', valueMultiplier: 0.85, target: 'enemy' },
        { type: 'debuff', valueMultiplier: 0, target: 'enemy', statusType: 'weak', statusDuration: 2, extraValue: 1 },
      ],
      // 伝統の力: 高威力
      [{ type: 'damage', valueMultiplier: 1.05, target: 'enemy' }],
      // 祭り: 全体攻撃
      [{ type: 'damage', valueMultiplier: 0.85, target: 'all_enemies' }],
    ],
    defensePatterns: [
      // 習慣: ブロック
      [{ type: 'block', valueMultiplier: 1.0, target: 'self' }],
      // 儀式: ブロック + 再生
      [
        { type: 'block', valueMultiplier: 0.5, target: 'self' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'regeneration', statusDuration: 2, extraValue: 2 },
      ],
    ],
    skillPatterns: [
      // 継承: バフ
      [{ type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 2 }],
      // 交流: ドロー + エネルギー
      [
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 2 },
        { type: 'energy', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
    ],
  },

  // 現代: 効率重視、エネルギー系
  modern: {
    attackPatterns: [
      // 効率的攻撃: ダメージ + ドロー
      [
        { type: 'damage', valueMultiplier: 0.85, target: 'enemy' },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
      // 技術の力: 高威力
      [{ type: 'damage', valueMultiplier: 1.1, target: 'enemy' }],
      // 革新: 全体攻撃
      [{ type: 'damage', valueMultiplier: 0.85, target: 'all_enemies' }],
    ],
    defensePatterns: [
      // 防護: ブロック
      [{ type: 'block', valueMultiplier: 1.0, target: 'self' }],
      // システム: ブロック + ドロー
      [
        { type: 'block', valueMultiplier: 0.6, target: 'self' },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
    ],
    skillPatterns: [
      // 最適化: エネルギー
      [{ type: 'energy', valueMultiplier: 0, target: 'self', extraValue: 3 }],
      // 更新: ドロー
      [{ type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 3 }],
    ],
  },

  // 社会: デバフ、集団効果
  society: {
    attackPatterns: [
      // 社会的圧力: ダメージ + デバフ
      [
        { type: 'damage', valueMultiplier: 0.75, target: 'enemy' },
        { type: 'debuff', valueMultiplier: 0, target: 'enemy', statusType: 'vulnerable', statusDuration: 2, extraValue: 2 },
      ],
      // 革命: 全体攻撃
      [{ type: 'damage', valueMultiplier: 0.95, target: 'all_enemies' }],
      // 団結: ダメージ + 筋力
      [
        { type: 'damage', valueMultiplier: 0.8, target: 'enemy' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 1 },
      ],
    ],
    defensePatterns: [
      // 連帯: ブロック + 敏捷
      [
        { type: 'block', valueMultiplier: 0.7, target: 'self' },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'dexterity', statusDuration: 2, extraValue: 1 },
      ],
      // 秩序: 高ブロック
      [{ type: 'block', valueMultiplier: 1.05, target: 'self' }],
    ],
    skillPatterns: [
      // 協力: バフ
      [
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 2 },
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'dexterity', statusDuration: 3, extraValue: 1 },
      ],
      // 改革: 全体デバフ
      [
        { type: 'debuff', valueMultiplier: 0, target: 'all_enemies', statusType: 'weak', statusDuration: 2, extraValue: 1 },
        { type: 'debuff', valueMultiplier: 0, target: 'all_enemies', statusType: 'vulnerable', statusDuration: 2, extraValue: 1 },
      ],
    ],
  },

  // 文学: ドロー、バフ、物語的効果
  literature: {
    attackPatterns: [
      // 物語の力: ダメージ + ドロー
      [
        { type: 'damage', valueMultiplier: 0.8, target: 'enemy' },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 1 },
      ],
      // 詩の一撃: 高威力
      [{ type: 'damage', valueMultiplier: 1.05, target: 'enemy' }],
      // 叙事詩: 全体攻撃
      [{ type: 'damage', valueMultiplier: 0.8, target: 'all_enemies' }],
    ],
    defensePatterns: [
      // 韻律: ブロック + ドロー
      [
        { type: 'block', valueMultiplier: 0.5, target: 'self' },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 2 },
      ],
      // 散文: ブロック
      [{ type: 'block', valueMultiplier: 1.0, target: 'self' }],
    ],
    skillPatterns: [
      // 朗読: 大量ドロー
      [{ type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 4 }],
      // インスピレーション: バフ + ドロー
      [
        { type: 'buff', valueMultiplier: 0, target: 'self', statusType: 'strength', extraValue: 1 },
        { type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 2 },
      ],
    ],
  },
};

// デフォルトテンプレート（カテゴリが見つからない場合）
const defaultTemplate: CategoryTemplate = {
  attackPatterns: [
    [{ type: 'damage', valueMultiplier: 1.0, target: 'enemy' }],
    [{ type: 'damage', valueMultiplier: 0.85, target: 'all_enemies' }],
  ],
  defensePatterns: [
    [{ type: 'block', valueMultiplier: 1.0, target: 'self' }],
  ],
  skillPatterns: [
    [{ type: 'draw', valueMultiplier: 0, target: 'self', extraValue: 2 }],
  ],
};

// カードタイプに応じた効果を生成（カテゴリベース）
const generateEffects = (basePower: number, type: CardType, rarity: number, name: string = '', category: string = '', id: number = 0): CardEffect[] => {
  const cost = calculateCost(basePower, type, name, category, id);
  const value = calculateEffectValue(basePower, type, cost, id);
  const variant = getCardVariant(id);
  const effects: CardEffect[] = [];

  // 回復系カードの場合（カテゴリに関わらず回復効果を持つ）
  if (isHealingCard(name, category)) {
    const healByCost: Record<number, number> = { 1: 8, 2: 18, 3: 30 };
    const healValue = healByCost[cost] || 12;

    effects.push({
      type: 'heal',
      value: healValue,
      target: 'self',
    });

    // カテゴリに応じた追加効果
    if (category === 'emotion' || category === 'mythology') {
      // 感情・神話系は再生バフも
      if (variant >= 5) {
        effects.push({
          type: 'buff',
          value: 2,
          target: 'self',
          statusType: 'regeneration',
          statusDuration: 3,
        });
      }
    } else if (category === 'science' || category === 'philosophy') {
      // 科学・哲学系はドローも
      if (variant >= 5) {
        effects.push({
          type: 'draw',
          value: 1,
          target: 'self',
        });
      }
    } else {
      // その他はブロックも
      if (variant >= 5) {
        effects.push({
          type: 'block',
          value: Math.floor(healValue / 2),
          target: 'self',
        });
      }
    }
    return effects;
  }

  // カテゴリテンプレートを取得
  const template = categoryTemplates[category] || defaultTemplate;

  // タイプに応じたパターンリストを取得
  let patterns: EffectTemplate[][];
  switch (type) {
    case 'attack':
      patterns = template.attackPatterns;
      break;
    case 'defense':
      patterns = template.defensePatterns;
      break;
    case 'skill':
      patterns = template.skillPatterns;
      break;
    default:
      patterns = template.skillPatterns;
  }

  // IDとレアリティを組み合わせてパターンを選択（より多様性を出す）
  const patternIndex = (id + rarity) % patterns.length;
  const selectedPattern = patterns[patternIndex];

  // パターンから効果を生成
  for (const template of selectedPattern) {
    const effect: CardEffect = {
      type: template.type,
      value: Math.floor(value * template.valueMultiplier) + (template.extraValue || 0),
      target: template.target,
    };

    if (template.statusType) {
      effect.statusType = template.statusType;
    }
    if (template.statusDuration) {
      effect.statusDuration = template.statusDuration;
    }

    // 値が0以下の効果は除外（バフ/デバフは値0でもOK）
    if (effect.value > 0 || template.statusType) {
      effects.push(effect);
    }
  }

  // レアリティボーナス: 高レアリティは追加効果
  if (rarity >= 4 && variant >= 7) {
    // レア4以上で30%の確率で追加効果
    if (type === 'attack') {
      effects.push({
        type: 'buff',
        value: 1,
        target: 'self',
        statusType: 'strength',
      });
    } else if (type === 'defense') {
      effects.push({
        type: 'draw',
        value: 1,
        target: 'self',
      });
    } else {
      effects.push({
        type: 'energy',
        value: 1,
        target: 'self',
      });
    }
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
