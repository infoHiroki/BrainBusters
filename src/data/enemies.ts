// 敵データ
// 概念・哲学・抽象的存在をテーマにした敵

import { Enemy, EnemyTemplate, EnemyMove, Intent } from '../types/game';

// 敵テンプレート定義
export const enemyTemplates: EnemyTemplate[] = [
  // === 通常敵 (1-4階) ===
  {
    id: 1,
    name: '疑念の影',
    maxHp: [20, 28],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'doubt_attack', name: '疑いの一撃', intent: { type: 'attack', value: 6 }, weight: 60 },
      { id: 'doubt_defend', name: '防御姿勢', intent: { type: 'defend', value: 5 }, weight: 40 },
    ],
  },
  {
    id: 2,
    name: '迷妄',
    maxHp: [18, 24],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'confusion_attack', name: '混乱の波', intent: { type: 'attack', value: 5 }, weight: 50 },
      { id: 'confusion_debuff', name: '惑わせる', intent: { type: 'debuff' }, weight: 30 },
      { id: 'confusion_defend', name: '揺らぎ', intent: { type: 'defend', value: 4 }, weight: 20 },
    ],
  },
  {
    id: 3,
    name: '怠惰の具現',
    maxHp: [25, 32],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'sloth_heavy', name: '重い一撃', intent: { type: 'attack', value: 10 }, weight: 30 },
      { id: 'sloth_rest', name: '休息', intent: { type: 'buff' }, weight: 40 },
      { id: 'sloth_guard', name: '鈍重な守り', intent: { type: 'defend', value: 8 }, weight: 30 },
    ],
  },
  {
    id: 4,
    name: '小さな恐怖',
    maxHp: [15, 20],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'fear_scratch', name: '引っ掻き', intent: { type: 'attack', value: 4 }, weight: 70 },
      { id: 'fear_tremble', name: '震えさせる', intent: { type: 'debuff' }, weight: 30 },
    ],
  },
  {
    id: 5,
    name: '偏見の塊',
    maxHp: [22, 28],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'bias_strike', name: '偏った攻撃', intent: { type: 'attack', value: 7 }, weight: 55 },
      { id: 'bias_shield', name: '頑なな壁', intent: { type: 'defend', value: 6 }, weight: 45 },
    ],
  },

  // === 通常敵 (5-9階) ===
  {
    id: 6,
    name: '虚栄の鏡',
    maxHp: [30, 38],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'vanity_reflect', name: '映し返し', intent: { type: 'attack', value: 8 }, weight: 40 },
      { id: 'vanity_buff', name: '自己陶酔', intent: { type: 'buff' }, weight: 35 },
      { id: 'vanity_guard', name: '虚飾の盾', intent: { type: 'defend', value: 7 }, weight: 25 },
    ],
  },
  {
    id: 7,
    name: '矛盾の怪物',
    maxHp: [35, 42],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'paradox_strike', name: '矛盾する一撃', intent: { type: 'attack', value: 9 }, weight: 45 },
      { id: 'paradox_chaos', name: '混沌を呼ぶ', intent: { type: 'debuff' }, weight: 30 },
      { id: 'paradox_defend', name: '矛盾の防壁', intent: { type: 'defend', value: 8 }, weight: 25 },
    ],
  },
  {
    id: 8,
    name: '後悔の亡霊',
    maxHp: [28, 35],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'regret_haunt', name: '過去の重荷', intent: { type: 'attack', value: 7 }, weight: 50 },
      { id: 'regret_curse', name: '呪い', intent: { type: 'debuff' }, weight: 35 },
      { id: 'regret_fade', name: '薄れゆく', intent: { type: 'defend', value: 5 }, weight: 15 },
    ],
  },
  {
    id: 9,
    name: '傲慢の化身',
    maxHp: [32, 40],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'pride_smash', name: '高慢な一撃', intent: { type: 'attack', value: 11 }, weight: 50 },
      { id: 'pride_stance', name: '威圧', intent: { type: 'buff' }, weight: 30 },
      { id: 'pride_block', name: '見下す', intent: { type: 'defend', value: 6 }, weight: 20 },
    ],
  },
  {
    id: 10,
    name: 'ニヒリズムの使徒',
    maxHp: [26, 33],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'nihil_void', name: '無の一撃', intent: { type: 'attack', value: 8 }, weight: 45 },
      { id: 'nihil_negate', name: '否定', intent: { type: 'debuff' }, weight: 40 },
      { id: 'nihil_empty', name: '空虚', intent: { type: 'defend', value: 4 }, weight: 15 },
    ],
  },

  // === 通常敵 (10-14階) ===
  {
    id: 11,
    name: '絶望の深淵',
    maxHp: [40, 50],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'despair_crush', name: '絶望の重圧', intent: { type: 'attack', value: 12 }, weight: 40 },
      { id: 'despair_drain', name: '希望を吸う', intent: { type: 'debuff' }, weight: 35 },
      { id: 'despair_wall', name: '暗黒の壁', intent: { type: 'defend', value: 10 }, weight: 25 },
    ],
  },
  {
    id: 12,
    name: 'カオスの精霊',
    maxHp: [38, 46],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'chaos_random', name: '混沌の嵐', intent: { type: 'attack', value: 10 }, weight: 35 },
      { id: 'chaos_buff', name: '混沌強化', intent: { type: 'buff' }, weight: 30 },
      { id: 'chaos_debuff', name: '混乱付与', intent: { type: 'debuff' }, weight: 20 },
      { id: 'chaos_defend', name: '無秩序な防御', intent: { type: 'defend', value: 8 }, weight: 15 },
    ],
  },
  {
    id: 13,
    name: '時間の狂気',
    maxHp: [42, 52],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'time_strike', name: '時の一撃', intent: { type: 'attack', value: 11 }, weight: 45 },
      { id: 'time_slow', name: '時間減速', intent: { type: 'debuff' }, weight: 35 },
      { id: 'time_rewind', name: '巻き戻し', intent: { type: 'buff' }, weight: 20 },
    ],
  },
  {
    id: 14,
    name: '実存の危機',
    maxHp: [45, 55],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'exist_question', name: '存在への問い', intent: { type: 'attack', value: 13 }, weight: 40 },
      { id: 'exist_doubt', name: '自己懐疑', intent: { type: 'debuff' }, weight: 35 },
      { id: 'exist_affirm', name: '存在肯定', intent: { type: 'defend', value: 9 }, weight: 25 },
    ],
  },
  {
    id: 15,
    name: '無意識の怪物',
    maxHp: [48, 58],
    isBoss: false,
    isElite: false,
    moves: [
      { id: 'uncon_surge', name: '衝動の奔流', intent: { type: 'attack', value: 14 }, weight: 50 },
      { id: 'uncon_suppress', name: '抑圧', intent: { type: 'debuff' }, weight: 30 },
      { id: 'uncon_hide', name: '深層へ', intent: { type: 'defend', value: 11 }, weight: 20 },
    ],
  },

  // === エリート敵 ===
  {
    id: 101,
    name: 'デカルトの悪霊',
    maxHp: [50, 60],
    isBoss: false,
    isElite: true,
    moves: [
      { id: 'demon_deceive', name: '欺瞞', intent: { type: 'attack', value: 12 }, weight: 40 },
      { id: 'demon_doubt', name: '方法的懐疑', intent: { type: 'debuff' }, weight: 35 },
      { id: 'demon_illusion', name: '幻惑', intent: { type: 'buff' }, weight: 25 },
    ],
  },
  {
    id: 102,
    name: 'プラトンの影',
    maxHp: [55, 65],
    isBoss: false,
    isElite: true,
    moves: [
      { id: 'shadow_strike', name: '影の一撃', intent: { type: 'attack', value: 14 }, weight: 45 },
      { id: 'shadow_bind', name: '洞窟の鎖', intent: { type: 'debuff' }, weight: 30 },
      { id: 'shadow_mimic', name: '模倣', intent: { type: 'buff' }, weight: 25 },
    ],
  },
  {
    id: 103,
    name: 'ニーチェの超人',
    maxHp: [60, 72],
    isBoss: false,
    isElite: true,
    moves: [
      { id: 'uber_smash', name: '力への意志', intent: { type: 'attack', value: 16 }, weight: 50 },
      { id: 'uber_overcome', name: '克服', intent: { type: 'buff' }, weight: 35 },
      { id: 'uber_eternal', name: '永劫の構え', intent: { type: 'defend', value: 12 }, weight: 15 },
    ],
  },

  // === ボス ===
  {
    id: 201,
    name: '虚無',
    maxHp: 100,
    isBoss: true,
    isElite: false,
    moves: [
      { id: 'void_consume', name: '虚無に飲む', intent: { type: 'attack', value: 18 }, weight: 35 },
      { id: 'void_erase', name: '消滅', intent: { type: 'debuff' }, weight: 25 },
      { id: 'void_expand', name: '虚無の拡大', intent: { type: 'buff' }, weight: 20 },
      { id: 'void_shield', name: '無の壁', intent: { type: 'defend', value: 15 }, weight: 20 },
    ],
  },
  {
    id: 202,
    name: '永劫回帰',
    maxHp: 120,
    isBoss: true,
    isElite: false,
    moves: [
      { id: 'eternal_cycle', name: '輪廻の一撃', intent: { type: 'attack', value: 15 }, weight: 30 },
      { id: 'eternal_repeat', name: '繰り返し', intent: { type: 'attack', value: 8 }, weight: 25, condition: 'multi_hit_2' },
      { id: 'eternal_burden', name: '永遠の重荷', intent: { type: 'debuff' }, weight: 25 },
      { id: 'eternal_restore', name: '回帰', intent: { type: 'buff' }, weight: 20 },
    ],
  },
  {
    id: 203,
    name: '絶対精神',
    maxHp: 150,
    isBoss: true,
    isElite: false,
    moves: [
      { id: 'spirit_thesis', name: '正', intent: { type: 'attack', value: 12 }, weight: 25 },
      { id: 'spirit_antithesis', name: '反', intent: { type: 'debuff' }, weight: 25 },
      { id: 'spirit_synthesis', name: '合', intent: { type: 'buff' }, weight: 20 },
      { id: 'spirit_absolute', name: '絶対の一撃', intent: { type: 'attack', value: 25 }, weight: 15, condition: 'after_3_turns' },
      { id: 'spirit_transcend', name: '超越', intent: { type: 'defend', value: 20 }, weight: 15 },
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
  } else {
    return enemyTemplates.filter(t => t.id >= 6 && t.id <= 15);
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
    return [generateEliteEnemy()];
  }

  // 通常戦闘：1-2体
  const enemyCount = Math.random() < 0.3 ? 2 : 1;
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
