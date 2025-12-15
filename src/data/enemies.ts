// 敵データ
// 概念・哲学・抽象的存在をテーマにした敵

import { Enemy, EnemyTemplate, EnemyMove, Intent } from '../types/game';

// 敵テンプレート定義
export const enemyTemplates: EnemyTemplate[] = [
  // === 通常敵 (1-4階) === ダメージ2倍、HP1.5倍に調整
  {
    id: 1,
    name: '疑念の影',
    maxHp: [45, 63],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'doubt_attack', name: '疑いの一撃', intent: { type: 'attack', value: 12 }, weight: 60 },  // 2x
      { id: 'doubt_defend', name: '防御姿勢', intent: { type: 'defend', value: 8 }, weight: 40 },
    ],
  },
  {
    id: 2,
    name: '迷妄',
    maxHp: [40, 54],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'confusion_attack', name: '混乱の波', intent: { type: 'attack', value: 10 }, weight: 50 },  // 2x
      { id: 'confusion_debuff', name: '惑わせる', intent: { type: 'debuff' }, weight: 30 },
      { id: 'confusion_defend', name: '揺らぎ', intent: { type: 'defend', value: 6 }, weight: 20 },
    ],
  },
  {
    id: 3,
    name: '怠惰の具現',
    maxHp: [57, 72],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'sloth_heavy', name: '重い一撃', intent: { type: 'attack', value: 20 }, weight: 30 },  // 2x
      { id: 'sloth_rest', name: '休息', intent: { type: 'buff' }, weight: 40 },
      { id: 'sloth_guard', name: '鈍重な守り', intent: { type: 'defend', value: 12 }, weight: 30 },
    ],
  },
  {
    id: 4,
    name: '小さな恐怖',
    maxHp: [34, 45],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'fear_scratch', name: '引っ掻き', intent: { type: 'attack', value: 8 }, weight: 70 },  // 2x
      { id: 'fear_tremble', name: '震えさせる', intent: { type: 'debuff' }, weight: 30 },
    ],
  },
  {
    id: 5,
    name: '偏見の塊',
    maxHp: [49, 63],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'bias_strike', name: '偏った攻撃', intent: { type: 'attack', value: 14 }, weight: 55 },  // 2x
      { id: 'bias_shield', name: '頑なな壁', intent: { type: 'defend', value: 9 }, weight: 45 },
    ],
  },

  // === 通常敵 (5-9階) === ダメージ2倍、HP1.5倍に調整
  {
    id: 6,
    name: '虚栄の鏡',
    maxHp: [67, 85],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'vanity_reflect', name: '映し返し', intent: { type: 'attack', value: 16 }, weight: 40 },  // 2x
      { id: 'vanity_buff', name: '自己陶酔', intent: { type: 'buff' }, weight: 35 },
      { id: 'vanity_guard', name: '虚飾の盾', intent: { type: 'defend', value: 11 }, weight: 25 },
    ],
  },
  {
    id: 7,
    name: '矛盾の怪物',
    maxHp: [79, 94],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'paradox_strike', name: '矛盾する一撃', intent: { type: 'attack', value: 18 }, weight: 45 },  // 2x
      { id: 'paradox_chaos', name: '混沌を呼ぶ', intent: { type: 'debuff' }, weight: 30 },
      { id: 'paradox_defend', name: '矛盾の防壁', intent: { type: 'defend', value: 12 }, weight: 25 },
    ],
  },
  {
    id: 8,
    name: '後悔の亡霊',
    maxHp: [63, 79],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'regret_haunt', name: '過去の重荷', intent: { type: 'attack', value: 14 }, weight: 50 },  // 2x
      { id: 'regret_curse', name: '呪い', intent: { type: 'debuff' }, weight: 35 },
      { id: 'regret_fade', name: '薄れゆく', intent: { type: 'defend', value: 8 }, weight: 15 },
    ],
  },
  {
    id: 9,
    name: '傲慢の化身',
    maxHp: [72, 90],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'pride_smash', name: '高慢な一撃', intent: { type: 'attack', value: 22 }, weight: 50 },  // 2x
      { id: 'pride_stance', name: '威圧', intent: { type: 'buff' }, weight: 30 },
      { id: 'pride_block', name: '見下す', intent: { type: 'defend', value: 9 }, weight: 20 },
    ],
  },
  {
    id: 10,
    name: 'ニヒリズムの使徒',
    maxHp: [58, 75],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'nihil_void', name: '無の一撃', intent: { type: 'attack', value: 16 }, weight: 45 },  // 2x
      { id: 'nihil_negate', name: '否定', intent: { type: 'debuff' }, weight: 40 },
      { id: 'nihil_empty', name: '空虚', intent: { type: 'defend', value: 6 }, weight: 15 },
    ],
  },

  // === 通常敵 (10-14階) === ダメージ2倍、HP1.5倍に調整
  {
    id: 11,
    name: '絶望の深淵',
    maxHp: [90, 112],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'despair_crush', name: '絶望の重圧', intent: { type: 'attack', value: 24 }, weight: 40 },  // 2x
      { id: 'despair_drain', name: '希望を吸う', intent: { type: 'debuff' }, weight: 35 },
      { id: 'despair_wall', name: '暗黒の壁', intent: { type: 'defend', value: 15 }, weight: 25 },
    ],
  },
  {
    id: 12,
    name: 'カオスの精霊',
    maxHp: [85, 103],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'chaos_random', name: '混沌の嵐', intent: { type: 'attack', value: 20 }, weight: 35 },  // 2x
      { id: 'chaos_buff', name: '混沌強化', intent: { type: 'buff' }, weight: 30 },
      { id: 'chaos_debuff', name: '混乱付与', intent: { type: 'debuff' }, weight: 20 },
      { id: 'chaos_defend', name: '無秩序な防御', intent: { type: 'defend', value: 12 }, weight: 15 },
    ],
  },
  {
    id: 13,
    name: '時間の狂気',
    maxHp: [94, 117],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'time_strike', name: '時の一撃', intent: { type: 'attack', value: 22 }, weight: 45 },  // 2x
      { id: 'time_slow', name: '時間減速', intent: { type: 'debuff' }, weight: 35 },
      { id: 'time_rewind', name: '巻き戻し', intent: { type: 'buff' }, weight: 20 },
    ],
  },
  {
    id: 14,
    name: '実存の危機',
    maxHp: [102, 124],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'exist_question', name: '存在への問い', intent: { type: 'attack', value: 26 }, weight: 40 },  // 2x
      { id: 'exist_doubt', name: '自己懐疑', intent: { type: 'debuff' }, weight: 35 },
      { id: 'exist_affirm', name: '存在肯定', intent: { type: 'defend', value: 14 }, weight: 25 },
    ],
  },
  {
    id: 15,
    name: '無意識の怪物',
    maxHp: [108, 130],  // 1.5x (再)
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'uncon_surge', name: '衝動の奔流', intent: { type: 'attack', value: 28 }, weight: 50 },  // 2x
      { id: 'uncon_suppress', name: '抑圧', intent: { type: 'debuff' }, weight: 30 },
      { id: 'uncon_hide', name: '深層へ', intent: { type: 'defend', value: 17 }, weight: 20 },
    ],
  },

  // === 通常敵 (15-19階) ===
  {
    id: 16,
    name: '形而上の亡霊',
    maxHp: [120, 142],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'meta_strike', name: '超越の一撃', intent: { type: 'attack', value: 30 }, weight: 45 },
      { id: 'meta_void', name: '存在の消去', intent: { type: 'debuff' }, weight: 30 },
      { id: 'meta_shield', name: '概念の盾', intent: { type: 'defend', value: 18 }, weight: 25 },
    ],
  },
  {
    id: 17,
    name: '認識論の悪魔',
    maxHp: [112, 135],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'epis_doubt', name: '懐疑の刃', intent: { type: 'attack', value: 26 }, weight: 40 },
      { id: 'epis_confuse', name: '認識の混乱', intent: { type: 'debuff' }, weight: 35 },
      { id: 'epis_know', name: '知の防壁', intent: { type: 'defend', value: 15 }, weight: 25 },
    ],
  },
  {
    id: 18,
    name: '決定論の鎖',
    maxHp: [127, 150],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'deter_bind', name: '運命の束縛', intent: { type: 'attack', value: 32 }, weight: 50 },
      { id: 'deter_fate', name: '不可避の運命', intent: { type: 'buff' }, weight: 30 },
      { id: 'deter_guard', name: '因果の壁', intent: { type: 'defend', value: 20 }, weight: 20 },
    ],
  },

  // === 通常敵 (20-29階) ===
  {
    id: 19,
    name: '自由意志の幻影',
    maxHp: [135, 165],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'free_chaos', name: '選択の嵐', intent: { type: 'attack', value: 34 }, weight: 45 },
      { id: 'free_bind', name: '意志の拘束', intent: { type: 'debuff' }, weight: 30 },
      { id: 'free_wall', name: '自由の防壁', intent: { type: 'defend', value: 22 }, weight: 25 },
    ],
  },
  {
    id: 20,
    name: '弁証法の螺旋',
    maxHp: [142, 172],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'dial_thesis', name: '正の一撃', intent: { type: 'attack', value: 28 }, weight: 35 },
      { id: 'dial_anti', name: '反の呪い', intent: { type: 'debuff' }, weight: 30 },
      { id: 'dial_syn', name: '合の強化', intent: { type: 'buff' }, weight: 20 },
      { id: 'dial_guard', name: '螺旋の守り', intent: { type: 'defend', value: 18 }, weight: 15 },
    ],
  },
  {
    id: 21,
    name: '真理の番人',
    maxHp: [150, 180],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'truth_judge', name: '真理の裁き', intent: { type: 'attack', value: 38 }, weight: 45 },
      { id: 'truth_reveal', name: '虚偽の暴露', intent: { type: 'debuff' }, weight: 30 },
      { id: 'truth_wall', name: '真実の壁', intent: { type: 'defend', value: 25 }, weight: 25 },
    ],
  },

  // === 通常敵 (30-39階) ===
  {
    id: 22,
    name: '無限の深淵',
    maxHp: [165, 195],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'infinity_void', name: '無限の穴', intent: { type: 'attack', value: 40 }, weight: 45 },
      { id: 'infinity_drain', name: '無限の吸収', intent: { type: 'debuff' }, weight: 30 },
      { id: 'infinity_wall', name: '果てしなき壁', intent: { type: 'defend', value: 28 }, weight: 25 },
    ],
  },
  {
    id: 23,
    name: '相対主義の霧',
    maxHp: [157, 187],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'relative_strike', name: '相対の一撃', intent: { type: 'attack', value: 36 }, weight: 40 },
      { id: 'relative_confuse', name: '相対化', intent: { type: 'debuff' }, weight: 35 },
      { id: 'relative_shield', name: '曖昧な盾', intent: { type: 'defend', value: 24 }, weight: 25 },
    ],
  },
  {
    id: 24,
    name: '本質の守護者',
    maxHp: [172, 202],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'essence_strike', name: '本質の一撃', intent: { type: 'attack', value: 42 }, weight: 45 },
      { id: 'essence_reveal', name: '本質の顕現', intent: { type: 'buff' }, weight: 30 },
      { id: 'essence_guard', name: '本質の守り', intent: { type: 'defend', value: 30 }, weight: 25 },
    ],
  },
  {
    id: 25,
    name: '存在論の亡霊',
    maxHp: [180, 210],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'onto_question', name: '存在の問い', intent: { type: 'attack', value: 44 }, weight: 40 },
      { id: 'onto_negate', name: '存在の否定', intent: { type: 'debuff' }, weight: 35 },
      { id: 'onto_shield', name: '存在の壁', intent: { type: 'defend', value: 26 }, weight: 25 },
    ],
  },
  {
    id: 26,
    name: '因果律の鎖',
    maxHp: [187, 217],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'causal_bind', name: '因果の束縛', intent: { type: 'attack', value: 38 }, weight: 35 },
      { id: 'causal_chain', name: '連鎖反応', intent: { type: 'attack', value: 20 }, weight: 30, condition: 'multi_hit_2' },
      { id: 'causal_block', name: '因果の断絶', intent: { type: 'defend', value: 32 }, weight: 35 },
    ],
  },

  // === 通常敵 (40-50階) ===
  {
    id: 27,
    name: '絶対知の化身',
    maxHp: [202, 232],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'absknow_strike', name: '絶対知の一撃', intent: { type: 'attack', value: 48 }, weight: 45 },
      { id: 'absknow_insight', name: '洞察', intent: { type: 'buff' }, weight: 30 },
      { id: 'absknow_wall', name: '知の城壁', intent: { type: 'defend', value: 35 }, weight: 25 },
    ],
  },
  {
    id: 28,
    name: '超越論的主観',
    maxHp: [210, 240],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'trans_judge', name: '超越的判断', intent: { type: 'attack', value: 50 }, weight: 40 },
      { id: 'trans_category', name: 'カテゴリー適用', intent: { type: 'debuff' }, weight: 35 },
      { id: 'trans_synth', name: '統覚の統合', intent: { type: 'defend', value: 38 }, weight: 25 },
    ],
  },
  {
    id: 29,
    name: '究極の懐疑',
    maxHp: [217, 247],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'doubt_ultimate', name: '究極の疑い', intent: { type: 'attack', value: 52 }, weight: 45 },
      { id: 'doubt_strip', name: '確信の剥奪', intent: { type: 'debuff' }, weight: 30 },
      { id: 'doubt_guard', name: '懐疑の盾', intent: { type: 'defend', value: 36 }, weight: 25 },
    ],
  },
  {
    id: 30,
    name: '根源的存在',
    maxHp: [225, 255],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'root_strike', name: '根源の一撃', intent: { type: 'attack', value: 54 }, weight: 40 },
      { id: 'root_emerge', name: '湧出', intent: { type: 'buff' }, weight: 25 },
      { id: 'root_absorb', name: '吸収', intent: { type: 'debuff' }, weight: 20 },
      { id: 'root_wall', name: '根源の壁', intent: { type: 'defend', value: 40 }, weight: 15 },
    ],
  },
  {
    id: 31,
    name: '意味の崩壊',
    maxHp: [232, 262],  // 1.5x
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'mean_crush', name: '意味の崩壊', intent: { type: 'attack', value: 56 }, weight: 45 },
      { id: 'mean_void', name: '無意味化', intent: { type: 'debuff' }, weight: 35 },
      { id: 'mean_shield', name: '意味の残滓', intent: { type: 'defend', value: 42 }, weight: 20 },
    ],
  },

  // === エリート敵 === ダメージ2倍、HP1.5倍に調整
  {
    id: 101,
    name: 'デカルトの悪霊',
    maxHp: [112, 135],  // 1.5x (再)
    isBoss: false,
    isElite: true,
    moves: [
      { id: 'demon_deceive', name: '欺瞞', intent: { type: 'attack', value: 24 }, weight: 40 },  // 2x
      { id: 'demon_doubt', name: '方法的懐疑', intent: { type: 'debuff' }, weight: 35 },
      { id: 'demon_illusion', name: '幻惑', intent: { type: 'buff' }, weight: 25 },
    ],
  },
  {
    id: 102,
    name: 'プラトンの影',
    maxHp: [124, 147],  // 1.5x (再)
    isBoss: false,
    isElite: true,
    moves: [
      { id: 'shadow_strike', name: '影の一撃', intent: { type: 'attack', value: 28 }, weight: 45 },  // 2x
      { id: 'shadow_bind', name: '洞窟の鎖', intent: { type: 'debuff' }, weight: 30 },
      { id: 'shadow_mimic', name: '模倣', intent: { type: 'buff' }, weight: 25 },
    ],
  },
  {
    id: 103,
    name: 'ニーチェの超人',
    maxHp: [135, 162],  // 1.5x (再)
    isBoss: false,
    isElite: true,
    moves: [
      { id: 'uber_smash', name: '力への意志', intent: { type: 'attack', value: 32 }, weight: 50 },  // 2x
      { id: 'uber_overcome', name: '克服', intent: { type: 'buff' }, weight: 35 },
      { id: 'uber_eternal', name: '永劫の構え', intent: { type: 'defend', value: 18 }, weight: 15 },
    ],
  },
  {
    id: 104,
    name: 'カントの純粋理性',
    maxHp: [150, 180],  // 1.5x
    isBoss: false,
    isElite: true,
    moves: [
      { id: 'kant_critique', name: '批判の刃', intent: { type: 'attack', value: 38 }, weight: 45 },
      { id: 'kant_category', name: 'カテゴリーの束縛', intent: { type: 'debuff' }, weight: 30 },
      { id: 'kant_apriori', name: 'アプリオリな防御', intent: { type: 'defend', value: 25 }, weight: 25 },
    ],
  },
  {
    id: 105,
    name: 'ショーペンハウアーの意志',
    maxHp: [165, 195],  // 1.5x
    isBoss: false,
    isElite: true,
    moves: [
      { id: 'will_strike', name: '盲目的意志', intent: { type: 'attack', value: 44 }, weight: 50 },
      { id: 'will_suffer', name: '苦悩の連鎖', intent: { type: 'debuff' }, weight: 30 },
      { id: 'will_deny', name: '意志の否定', intent: { type: 'defend', value: 30 }, weight: 20 },
    ],
  },
  {
    id: 106,
    name: 'スピノザの神',
    maxHp: [180, 210],  // 1.5x
    isBoss: false,
    isElite: true,
    moves: [
      { id: 'spinoza_nature', name: '自然即神', intent: { type: 'attack', value: 50 }, weight: 40 },
      { id: 'spinoza_affect', name: '情動の支配', intent: { type: 'debuff' }, weight: 30 },
      { id: 'spinoza_eternal', name: '永遠の相', intent: { type: 'buff' }, weight: 15 },
      { id: 'spinoza_substance', name: '実体の壁', intent: { type: 'defend', value: 35 }, weight: 15 },
    ],
  },

  // === ボス === ダメージ2倍、HP1.5倍に調整
  {
    id: 201,
    name: '虚無',
    maxHp: 225,  // 1.5x (再)
    isBoss: true,
    isElite: false,
    moves: [
      { id: 'void_consume', name: '虚無に飲む', intent: { type: 'attack', value: 36 }, weight: 35 },  // 2x
      { id: 'void_erase', name: '消滅', intent: { type: 'debuff' }, weight: 25 },
      { id: 'void_expand', name: '虚無の拡大', intent: { type: 'buff' }, weight: 20 },
      { id: 'void_shield', name: '無の壁', intent: { type: 'defend', value: 23 }, weight: 20 },
    ],
  },
  {
    id: 202,
    name: '永劫回帰',
    maxHp: 270,  // 1.5x (再)
    isBoss: true,
    isElite: false,
    moves: [
      { id: 'eternal_cycle', name: '輪廻の一撃', intent: { type: 'attack', value: 30 }, weight: 30 },  // 2x
      { id: 'eternal_repeat', name: '繰り返し', intent: { type: 'attack', value: 16 }, weight: 25, condition: 'multi_hit_2' },  // 2x
      { id: 'eternal_burden', name: '永遠の重荷', intent: { type: 'debuff' }, weight: 25 },
      { id: 'eternal_restore', name: '回帰', intent: { type: 'buff' }, weight: 20 },
    ],
  },
  {
    id: 203,
    name: '絶対精神',
    maxHp: 337,  // 1.5x (再)
    isBoss: true,
    isElite: false,
    moves: [
      { id: 'spirit_thesis', name: '正', intent: { type: 'attack', value: 24 }, weight: 25 },  // 2x
      { id: 'spirit_antithesis', name: '反', intent: { type: 'debuff' }, weight: 25 },
      { id: 'spirit_synthesis', name: '合', intent: { type: 'buff' }, weight: 20 },
      { id: 'spirit_absolute', name: '絶対の一撃', intent: { type: 'attack', value: 50 }, weight: 15, condition: 'after_3_turns' },  // 2x
      { id: 'spirit_transcend', name: '超越', intent: { type: 'defend', value: 30 }, weight: 15 },
    ],
  },
  {
    id: 204,
    name: '存在と時間',
    maxHp: 420,  // 1.5x
    isBoss: true,
    isElite: false,
    moves: [
      { id: 'sein_presence', name: '現存在の重圧', intent: { type: 'attack', value: 40 }, weight: 30 },
      { id: 'sein_anxiety', name: '根源的不安', intent: { type: 'debuff' }, weight: 25 },
      { id: 'sein_death', name: '死への先駆', intent: { type: 'attack', value: 55 }, weight: 20 },
      { id: 'sein_time', name: '時間性の展開', intent: { type: 'buff' }, weight: 15 },
      { id: 'sein_care', name: '気遣いの構造', intent: { type: 'defend', value: 35 }, weight: 10 },
    ],
  },
  {
    id: 205,
    name: '世界精神',
    maxHp: 525,  // 1.5x
    isBoss: true,
    isElite: false,
    moves: [
      { id: 'world_history', name: '歴史の審判', intent: { type: 'attack', value: 45 }, weight: 25 },
      { id: 'world_reason', name: '理性の狡知', intent: { type: 'debuff' }, weight: 20 },
      { id: 'world_freedom', name: '自由の実現', intent: { type: 'buff' }, weight: 20 },
      { id: 'world_final', name: '歴史の終焉', intent: { type: 'attack', value: 70 }, weight: 15 },
      { id: 'world_state', name: '国家の防壁', intent: { type: 'defend', value: 40 }, weight: 20 },
    ],
  },

  // === 追加ボス（5階ごとに10体体制） ===
  {
    id: 206,
    name: '懐疑の淵',
    maxHp: 180,  // 1.5x
    isBoss: true,
    isElite: false,
    moves: [
      { id: 'doubt_abyss', name: '疑念の渦', intent: { type: 'attack', value: 20 }, weight: 40 },
      { id: 'doubt_question', name: '根本的問い', intent: { type: 'debuff' }, weight: 30 },
      { id: 'doubt_wall', name: '懐疑の壁', intent: { type: 'defend', value: 15 }, weight: 30 },
    ],
  },
  {
    id: 207,
    name: '二元論の裂け目',
    maxHp: 247,  // 1.5x
    isBoss: true,
    isElite: false,
    moves: [
      { id: 'dual_mind', name: '精神の刃', intent: { type: 'attack', value: 28 }, weight: 35 },
      { id: 'dual_body', name: '物質の重圧', intent: { type: 'attack', value: 22 }, weight: 30 },
      { id: 'dual_split', name: '分裂', intent: { type: 'debuff' }, weight: 20 },
      { id: 'dual_unite', name: '統合の試み', intent: { type: 'buff' }, weight: 15 },
    ],
  },
  {
    id: 208,
    name: '功利の天秤',
    maxHp: 300,  // 1.5x
    isBoss: true,
    isElite: false,
    moves: [
      { id: 'util_calc', name: '幸福計算', intent: { type: 'attack', value: 35 }, weight: 35 },
      { id: 'util_sacrifice', name: '少数の犠牲', intent: { type: 'attack', value: 45 }, weight: 20 },
      { id: 'util_maximize', name: '最大化', intent: { type: 'buff' }, weight: 25 },
      { id: 'util_balance', name: '均衡', intent: { type: 'defend', value: 25 }, weight: 20 },
    ],
  },
  {
    id: 209,
    name: '意志の深淵',
    maxHp: 382,  // 1.5x
    isBoss: true,
    isElite: false,
    moves: [
      { id: 'will_blind', name: '盲目の衝動', intent: { type: 'attack', value: 42 }, weight: 35 },
      { id: 'will_desire', name: '欲望の連鎖', intent: { type: 'debuff' }, weight: 25 },
      { id: 'will_deny_self', name: '意志の否定', intent: { type: 'attack', value: 55 }, weight: 20 },
      { id: 'will_art', name: '芸術的昇華', intent: { type: 'defend', value: 32 }, weight: 20 },
    ],
  },
  {
    id: 210,
    name: '言語の牢獄',
    maxHp: 472,  // 1.5x
    isBoss: true,
    isElite: false,
    moves: [
      { id: 'lang_trap', name: '言語の罠', intent: { type: 'attack', value: 48 }, weight: 30 },
      { id: 'lang_confuse', name: '意味の混乱', intent: { type: 'debuff' }, weight: 25 },
      { id: 'lang_silence', name: '沈黙', intent: { type: 'attack', value: 60 }, weight: 20 },
      { id: 'lang_game', name: '言語ゲーム', intent: { type: 'buff' }, weight: 15 },
      { id: 'lang_wall', name: '言葉の壁', intent: { type: 'defend', value: 38 }, weight: 10 },
    ],
  },
];

// 敵テンプレートからインスタンスを生成
export const createEnemy = (template: EnemyTemplate): Enemy => {
  // HP計算
  let hp: number;
  if (Array.isArray(template.maxHp)) {
    const [min, max] = template.maxHp;
    hp = Math.floor(Math.random() * (max - min + 1)) + min;
  } else {
    hp = template.maxHp;
  }

  // 初期行動を決定
  const intent = selectIntent(template.moves);

  return {
    id: template.id,
    name: template.name,
    hp: hp,
    maxHp: hp,
    intent: intent,
    block: 0,
    statuses: [],
    isBoss: template.isBoss,
    isElite: template.isElite,
  };
};

// 行動を選択（重みに基づく）
const selectIntent = (moves: EnemyMove[]): Intent => {
  const totalWeight = moves.reduce((sum, move) => sum + (move.weight || 1), 0);
  let random = Math.random() * totalWeight;

  for (const move of moves) {
    random -= (move.weight || 1);
    if (random <= 0) {
      return { ...move.intent };
    }
  }

  return moves[0].intent;
};

// 次の行動を決定
export const selectNextIntent = (enemy: Enemy): Intent => {
  const template = enemyTemplates.find(t => t.id === enemy.id);
  if (!template) {
    return { type: 'attack', value: 5 };
  }
  return selectIntent(template.moves);
};

// ヘルパー関数

// IDでテンプレートを取得
export const getEnemyTemplateById = (id: number): EnemyTemplate | undefined => {
  return enemyTemplates.find(t => t.id === id);
};

// 通常敵を取得（階層別）
export const getNormalEnemies = (floor: number): EnemyTemplate[] => {
  if (floor <= 9) {
    // 1-9階: 序盤の敵
    return enemyTemplates.filter(t => t.id >= 1 && t.id <= 10);
  } else if (floor <= 19) {
    // 10-19階: 中盤の敵
    return enemyTemplates.filter(t => t.id >= 6 && t.id <= 15);
  } else if (floor <= 29) {
    // 20-29階: 後半の敵
    return enemyTemplates.filter(t => t.id >= 11 && t.id <= 21);
  } else if (floor <= 39) {
    // 30-39階: 深層の敵
    return enemyTemplates.filter(t => t.id >= 16 && t.id <= 26);
  } else {
    // 40-50階: 最深層の敵
    return enemyTemplates.filter(t => t.id >= 22 && t.id <= 31);
  }
};

// エリート敵を取得
export const getEliteEnemies = (): EnemyTemplate[] => {
  return enemyTemplates.filter(t => t.isElite);
};

// ボスを取得（階層別）- 5階ごとにボス10体
export const getBossForFloor = (floor: number): EnemyTemplate | undefined => {
  const bossMap: Record<number, number> = {
    5: 206,   // 懐疑の淵
    10: 201,  // 虚無
    15: 207,  // 二元論の裂け目
    20: 202,  // 永劫回帰
    25: 208,  // 功利の天秤
    30: 203,  // 絶対精神
    35: 209,  // 意志の深淵
    40: 204,  // 存在と時間
    45: 210,  // 言語の牢獄
    50: 205,  // 世界精神
  };
  const bossId = bossMap[floor];
  return bossId ? enemyTemplates.find(t => t.id === bossId) : undefined;
};

// ランダムな敵を生成（階層に応じて）
export const generateRandomEnemy = (floor: number): Enemy => {
  const candidates = getNormalEnemies(floor);
  const template = candidates[Math.floor(Math.random() * candidates.length)];
  return createEnemy(template);
};

// ランダムなエリート敵を生成
export const generateEliteEnemy = (): Enemy => {
  const elites = getEliteEnemies();
  const template = elites[Math.floor(Math.random() * elites.length)];
  return createEnemy(template);
};

// ボスを生成
export const generateBoss = (floor: number): Enemy | undefined => {
  const template = getBossForFloor(floor);
  if (!template) return undefined;
  return createEnemy(template);
};

// 戦闘用の敵グループを生成
// overrideCount: デバッグ用に敵数を強制指定（通常・エリートのみ有効）
export const generateEnemyGroup = (
  floor: number,
  nodeType: 'battle' | 'elite' | 'boss',
  overrideCount?: number
): Enemy[] => {
  if (nodeType === 'boss') {
    const boss = generateBoss(floor);
    return boss ? [boss] : [];
  }

  if (nodeType === 'elite') {
    // エリート戦：overrideCountがあればその数、なければ1-2体
    const eliteCount = overrideCount ?? (Math.random() < 0.3 ? 2 : 1);
    const elites: Enemy[] = [];
    for (let i = 0; i < eliteCount; i++) {
      elites.push(generateEliteEnemy());
    }
    return elites;
  }

  // 通常戦闘：overrideCountがあればその数、なければ階層に応じて1-3体
  let enemyCount: number;
  if (overrideCount !== undefined) {
    enemyCount = overrideCount;
  } else if (floor <= 9) {
    enemyCount = Math.random() < 0.4 ? 2 : 1;
  } else if (floor <= 14) {
    enemyCount = Math.random() < 0.5 ? 2 : Math.random() < 0.5 ? 3 : 1;
  } else {
    // 後半は2-3体が多い
    const rand = Math.random();
    if (rand < 0.3) enemyCount = 1;
    else if (rand < 0.7) enemyCount = 2;
    else enemyCount = 3;
  }

  const enemies: Enemy[] = [];
  for (let i = 0; i < enemyCount; i++) {
    enemies.push(generateRandomEnemy(floor));
  }
  return enemies;
};

// 敵統計
export const enemyStats = {
  total: enemyTemplates.length,
  normal: enemyTemplates.filter(t => !t.isBoss && !t.isElite).length,
  elite: enemyTemplates.filter(t => t.isElite).length,
  boss: enemyTemplates.filter(t => t.isBoss).length,
};
