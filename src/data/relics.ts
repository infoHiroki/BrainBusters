// レリックデータ
// 哲学・概念をテーマにしたパッシブ強化アイテム

import { Relic, RelicEffect } from '../types/game';

export const relics: Relic[] = [
  // === COMMON (コモン) - 基本的な効果 ===
  {
    id: 1,
    name: 'デカルトの眼鏡',
    description: '戦闘開始時、1枚ドロー',
    rarity: 'common',
    effects: [{
      trigger: 'battle_start',
      effectType: 'draw',
      value: 1,
    }],
  },
  {
    id: 2,
    name: 'ソクラテスの杯',
    description: '戦闘開始時、3ブロック獲得',
    rarity: 'common',
    effects: [{
      trigger: 'battle_start',
      effectType: 'block',
      value: 3,
    }],
  },
  {
    id: 3,
    name: '論理の結晶',
    description: 'ターン開始時、1ブロック獲得',
    rarity: 'common',
    effects: [{
      trigger: 'turn_start',
      effectType: 'block',
      value: 1,
    }],
  },
  {
    id: 4,
    name: '知恵の書',
    description: '最大HP+5',
    rarity: 'common',
    effects: [{
      trigger: 'passive',
      effectType: 'heal',
      value: 5,
      condition: 'max_hp_increase',
    }],
  },
  {
    id: 5,
    name: 'アリストテレスの羽ペン',
    description: '敵を倒すと2ゴールド獲得',
    rarity: 'common',
    effects: [{
      trigger: 'on_kill',
      effectType: 'energy', // ゴールド用に流用
      value: 2,
      condition: 'gold',
    }],
  },
  {
    id: 6,
    name: '弁証法の輪',
    description: '戦闘終了時、1HP回復',
    rarity: 'common',
    effects: [{
      trigger: 'turn_end',
      effectType: 'heal',
      value: 1,
      condition: 'battle_end',
    }],
  },
  {
    id: 7,
    name: '存在の証',
    description: 'コスト0のカードを使用時、1ダメージ追加',
    rarity: 'common',
    effects: [{
      trigger: 'on_card_play',
      effectType: 'damage',
      value: 1,
      condition: 'cost_0',
    }],
  },
  {
    id: 8,
    name: '懐疑の灯',
    description: '戦闘開始時、敵1体に脆弱1付与',
    rarity: 'common',
    effects: [{
      trigger: 'battle_start',
      effectType: 'debuff',
      value: 1,
      condition: 'vulnerable',
    }],
  },

  // === UNCOMMON (アンコモン) - より強力な効果 ===
  {
    id: 9,
    name: 'カントの時計',
    description: '毎ターン開始時、1エネルギー追加（最初のターンのみ）',
    rarity: 'uncommon',
    effects: [{
      trigger: 'turn_start',
      effectType: 'energy',
      value: 1,
      condition: 'first_turn',
    }],
  },
  {
    id: 10,
    name: 'ニーチェの槌',
    description: '攻撃カード使用時、追加で2ダメージ',
    rarity: 'uncommon',
    effects: [{
      trigger: 'on_card_play',
      effectType: 'damage',
      value: 2,
      condition: 'attack_card',
    }],
  },
  {
    id: 11,
    name: 'プラトンの洞窟',
    description: '防御カード使用時、追加で2ブロック',
    rarity: 'uncommon',
    effects: [{
      trigger: 'on_card_play',
      effectType: 'block',
      value: 2,
      condition: 'defense_card',
    }],
  },
  {
    id: 12,
    name: 'ヘーゲルの鏡',
    description: 'スキルカード使用時、1枚ドロー',
    rarity: 'uncommon',
    effects: [{
      trigger: 'on_card_play',
      effectType: 'draw',
      value: 1,
      condition: 'skill_card',
    }],
  },
  {
    id: 13,
    name: 'フッサールのレンズ',
    description: '戦闘開始時、2枚ドロー',
    rarity: 'uncommon',
    effects: [{
      trigger: 'battle_start',
      effectType: 'draw',
      value: 2,
    }],
  },
  {
    id: 14,
    name: '実存の仮面',
    description: 'ダメージを受けるたび、次のターン1ブロック獲得',
    rarity: 'uncommon',
    effects: [{
      trigger: 'on_damage',
      effectType: 'block',
      value: 1,
      condition: 'next_turn',
    }],
  },
  {
    id: 15,
    name: '形而上の鍵',
    description: '最大エネルギー+1',
    rarity: 'uncommon',
    effects: [{
      trigger: 'passive',
      effectType: 'energy',
      value: 1,
      condition: 'max_energy_increase',
    }],
  },
  {
    id: 16,
    name: 'パスカルの賭け',
    description: '戦闘開始時、50%で5ダメージ or 5ブロック',
    rarity: 'uncommon',
    effects: [{
      trigger: 'battle_start',
      effectType: 'damage',
      value: 5,
      condition: 'random_50',
    }],
  },
  {
    id: 17,
    name: '永遠回帰の環',
    description: '捨て札が山札に戻るとき、1枚多くドロー',
    rarity: 'uncommon',
    effects: [{
      trigger: 'passive',
      effectType: 'draw',
      value: 1,
      condition: 'shuffle',
    }],
  },
  {
    id: 18,
    name: '意志の結晶',
    description: '敵を倒すと、3HP回復',
    rarity: 'uncommon',
    effects: [{
      trigger: 'on_kill',
      effectType: 'heal',
      value: 3,
    }],
  },

  // === RARE (レア) - 強力な効果 ===
  {
    id: 19,
    name: '絶対精神の器',
    description: '戦闘開始時、筋力+1',
    rarity: 'rare',
    effects: [{
      trigger: 'battle_start',
      effectType: 'buff',
      value: 1,
      condition: 'strength',
    }],
  },
  {
    id: 20,
    name: 'ツァラトゥストラの杖',
    description: '攻撃でトドメを刺すと、1エネルギー獲得',
    rarity: 'rare',
    effects: [{
      trigger: 'on_kill',
      effectType: 'energy',
      value: 1,
    }],
  },
  {
    id: 21,
    name: '物自体の欠片',
    description: 'ターン終了時、ブロックが0でなければ3ダメージを全体に',
    rarity: 'rare',
    effects: [{
      trigger: 'turn_end',
      effectType: 'damage',
      value: 3,
      condition: 'has_block',
    }],
  },
  {
    id: 22,
    name: '現象学の眼',
    description: '敵の行動が「攻撃」の時、追加で3ブロック獲得',
    rarity: 'rare',
    effects: [{
      trigger: 'turn_start',
      effectType: 'block',
      value: 3,
      condition: 'enemy_intent_attack',
    }],
  },
  {
    id: 23,
    name: 'ライプニッツの計算機',
    description: 'コスト3以上のカード使用時、1エネルギー還元',
    rarity: 'rare',
    effects: [{
      trigger: 'on_card_play',
      effectType: 'energy',
      value: 1,
      condition: 'cost_3_plus',
    }],
  },
  {
    id: 24,
    name: '超越者の翼',
    description: '最大HP+10、戦闘開始時に5ダメージを受ける',
    rarity: 'rare',
    effects: [
      {
        trigger: 'passive',
        effectType: 'heal',
        value: 10,
        condition: 'max_hp_increase',
      },
      {
        trigger: 'battle_start',
        effectType: 'damage',
        value: -5, // 自傷ダメージ
        condition: 'self_damage',
      },
    ],
  },

  // === BOSS (ボスレリック) - 最も強力 ===
  {
    id: 25,
    name: '虚無の心臓',
    description: '最大エネルギー+1、ショップでカード削除不可',
    rarity: 'boss',
    effects: [{
      trigger: 'passive',
      effectType: 'energy',
      value: 1,
      condition: 'max_energy_increase',
    }],
  },
  {
    id: 26,
    name: '絶対知の書',
    description: '戦闘開始時、3枚ドロー、手札上限-1',
    rarity: 'boss',
    effects: [{
      trigger: 'battle_start',
      effectType: 'draw',
      value: 3,
    }],
  },
  {
    id: 27,
    name: '混沌の王冠',
    description: '毎ターン、ランダムなカード1枚のコストが0になる',
    rarity: 'boss',
    effects: [{
      trigger: 'turn_start',
      effectType: 'energy',
      value: 0,
      condition: 'random_cost_zero',
    }],
  },
  {
    id: 28,
    name: '永劫回帰の環',
    description: 'HPが0になった時、1度だけHP1で復活',
    rarity: 'boss',
    effects: [{
      trigger: 'on_damage',
      effectType: 'heal',
      value: 1,
      condition: 'on_death_once',
    }],
  },
  {
    id: 29,
    name: '世界精神の核',
    description: '全てのカードのダメージ/ブロック+2',
    rarity: 'boss',
    effects: [{
      trigger: 'passive',
      effectType: 'buff',
      value: 2,
      condition: 'all_cards_boost',
    }],
  },
  {
    id: 30,
    name: '存在と時間の砂時計',
    description: '戦闘中、ターン数が偶数の時エネルギー+1',
    rarity: 'boss',
    effects: [{
      trigger: 'turn_start',
      effectType: 'energy',
      value: 1,
      condition: 'even_turn',
    }],
  },
];

// ヘルパー関数

// IDでレリックを取得
export const getRelicById = (id: number): Relic | undefined => {
  return relics.find(r => r.id === id);
};

// レアリティでフィルタ
export const getRelicsByRarity = (rarity: Relic['rarity']): Relic[] => {
  return relics.filter(r => r.rarity === rarity);
};

// ランダムなレリックを取得
export const getRandomRelic = (excludeIds: number[] = []): Relic | undefined => {
  const available = relics.filter(r => !excludeIds.includes(r.id) && r.rarity !== 'boss');
  if (available.length === 0) return undefined;
  return available[Math.floor(Math.random() * available.length)];
};

// レアリティに基づいてランダムなレリックを取得
export const getRandomRelicByRarity = (excludeIds: number[] = []): Relic | undefined => {
  const weights = { common: 55, uncommon: 35, rare: 10 };
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  let random = Math.random() * totalWeight;
  let selectedRarity: 'common' | 'uncommon' | 'rare' = 'common';

  for (const [rarity, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      selectedRarity = rarity as 'common' | 'uncommon' | 'rare';
      break;
    }
  }

  const available = getRelicsByRarity(selectedRarity).filter(r => !excludeIds.includes(r.id));
  if (available.length === 0) {
    // フォールバック：他のレアリティから選ぶ
    const fallback = relics.filter(r => !excludeIds.includes(r.id) && r.rarity !== 'boss');
    if (fallback.length === 0) return undefined;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
};

// ボスレリックをランダムに取得
export const getRandomBossRelic = (excludeIds: number[] = []): Relic | undefined => {
  const bossRelics = getRelicsByRarity('boss').filter(r => !excludeIds.includes(r.id));
  if (bossRelics.length === 0) return undefined;
  return bossRelics[Math.floor(Math.random() * bossRelics.length)];
};

// ショップ用レリックを生成（3つ）
export const generateShopRelics = (excludeIds: number[] = []): Relic[] => {
  const shopRelics: Relic[] = [];
  const usedIds = new Set(excludeIds);

  // コモン1つ、アンコモン1つ、レア1つ
  const rarities: Array<'common' | 'uncommon' | 'rare'> = ['common', 'uncommon', 'rare'];

  for (const rarity of rarities) {
    const available = getRelicsByRarity(rarity).filter(r => !usedIds.has(r.id));
    if (available.length > 0) {
      const relic = available[Math.floor(Math.random() * available.length)];
      shopRelics.push(relic);
      usedIds.add(relic.id);
    }
  }

  return shopRelics;
};

// レリックの価格を計算
export const getRelicPrice = (relic: Relic): number => {
  switch (relic.rarity) {
    case 'common': return 150;
    case 'uncommon': return 250;
    case 'rare': return 350;
    case 'boss': return 999; // 通常は購入不可
  }
};

// レリック統計
export const relicStats = {
  total: relics.length,
  byRarity: {
    common: getRelicsByRarity('common').length,
    uncommon: getRelicsByRarity('uncommon').length,
    rare: getRelicsByRarity('rare').length,
    boss: getRelicsByRarity('boss').length,
  },
};
