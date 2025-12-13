// 敵データ
// 概念・哲学・抽象的存在をテーマにした敵

import { Enemy, EnemyTemplate, EnemyMove, Intent } from '../types/game';

// 敵テンプレート定義
export const enemyTemplates: EnemyTemplate[] = [
  // === 通常敵 (1-4階) === ダメージ2倍、HP1.5倍に調整
  {
    id: 1,
    name: '疑念の影',
    maxHp: [30, 42],  // 1.5x
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
    maxHp: [27, 36],  // 1.5x
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
    maxHp: [38, 48],  // 1.5x
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
    maxHp: [23, 30],  // 1.5x
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
    maxHp: [33, 42],  // 1.5x
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
    maxHp: [45, 57],  // 1.5x
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
    maxHp: [53, 63],  // 1.5x
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
    maxHp: [42, 53],  // 1.5x
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
    maxHp: [48, 60],  // 1.5x
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
    maxHp: [39, 50],  // 1.5x
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
    maxHp: [60, 75],  // 1.5x
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
    maxHp: [57, 69],  // 1.5x
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
    maxHp: [63, 78],  // 1.5x
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
    maxHp: [68, 83],  // 1.5x
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
    maxHp: [72, 87],  // 1.5x
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
    maxHp: [80, 95],
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
    maxHp: [75, 90],
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
    maxHp: [85, 100],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'deter_bind', name: '運命の束縛', intent: { type: 'attack', value: 32 }, weight: 50 },
      { id: 'deter_fate', name: '不可避の運命', intent: { type: 'buff' }, weight: 30 },
      { id: 'deter_guard', name: '因果の壁', intent: { type: 'defend', value: 20 }, weight: 20 },
    ],
  },

  // === 通常敵 (20-24階) ===
  {
    id: 19,
    name: '自由意志の幻影',
    maxHp: [90, 110],
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
    maxHp: [95, 115],
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
    maxHp: [100, 120],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'truth_judge', name: '真理の裁き', intent: { type: 'attack', value: 38 }, weight: 45 },
      { id: 'truth_reveal', name: '虚偽の暴露', intent: { type: 'debuff' }, weight: 30 },
      { id: 'truth_wall', name: '真実の壁', intent: { type: 'defend', value: 25 }, weight: 25 },
    ],
  },

  // === エリート敵 === ダメージ2倍、HP1.5倍に調整
  {
    id: 101,
    name: 'デカルトの悪霊',
    maxHp: [75, 90],  // 1.5x
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
    maxHp: [83, 98],  // 1.5x
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
    maxHp: [90, 108],  // 1.5x
    isBoss: false,
    isElite: true,
    moves: [
      { id: 'uber_smash', name: '力への意志', intent: { type: 'attack', value: 32 }, weight: 50 },  // 2x
      { id: 'uber_overcome', name: '克服', intent: { type: 'buff' }, weight: 35 },
      { id: 'uber_eternal', name: '永劫の構え', intent: { type: 'defend', value: 18 }, weight: 15 },
    ],
  },

  // === ボス === ダメージ2倍、HP1.5倍に調整
  {
    id: 201,
    name: '虚無',
    maxHp: 150,  // 1.5x
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
    maxHp: 180,  // 1.5x
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
    maxHp: 225,  // 1.5x
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
    maxHp: 280,
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
    maxHp: 350,
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
  if (floor <= 4) {
    return enemyTemplates.filter(t => t.id >= 1 && t.id <= 5);
  } else if (floor <= 9) {
    return enemyTemplates.filter(t => t.id >= 1 && t.id <= 10);
  } else if (floor <= 14) {
    return enemyTemplates.filter(t => t.id >= 6 && t.id <= 15);
  } else if (floor <= 19) {
    return enemyTemplates.filter(t => t.id >= 11 && t.id <= 18);
  } else {
    return enemyTemplates.filter(t => t.id >= 16 && t.id <= 21);
  }
};

// エリート敵を取得
export const getEliteEnemies = (): EnemyTemplate[] => {
  return enemyTemplates.filter(t => t.isElite);
};

// ボスを取得（階層別）
export const getBossForFloor = (floor: number): EnemyTemplate | undefined => {
  if (floor === 5) {
    return enemyTemplates.find(t => t.id === 201); // 虚無
  } else if (floor === 10) {
    return enemyTemplates.find(t => t.id === 202); // 永劫回帰
  } else if (floor === 15) {
    return enemyTemplates.find(t => t.id === 203); // 絶対精神
  } else if (floor === 20) {
    return enemyTemplates.find(t => t.id === 204); // 存在と時間
  } else if (floor === 25) {
    return enemyTemplates.find(t => t.id === 205); // 世界精神
  }
  return undefined;
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
export const generateEnemyGroup = (floor: number, nodeType: 'battle' | 'elite' | 'boss'): Enemy[] => {
  if (nodeType === 'boss') {
    const boss = generateBoss(floor);
    return boss ? [boss] : [];
  }

  if (nodeType === 'elite') {
    // エリート戦：1-2体
    const eliteCount = Math.random() < 0.3 ? 2 : 1;
    const elites: Enemy[] = [];
    for (let i = 0; i < eliteCount; i++) {
      elites.push(generateEliteEnemy());
    }
    return elites;
  }

  // 通常戦闘：階層に応じて1-3体
  // 序盤: 1-2体、中盤以降: 2-3体
  let enemyCount: number;
  if (floor <= 9) {
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
