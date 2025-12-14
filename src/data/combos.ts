// コンボ定義
// 哲学者・思想家のカード組み合わせで発動するコンボ効果

import { ComboDefinition, ComboType } from '../types/tags';

export const combos: ComboDefinition[] = [
  // ========================================
  // 著者コンボ（同一著者2枚）
  // ========================================
  {
    id: 'nietzsche_power',
    name: '力への意志',
    type: 'author',
    condition: {
      authorId: 'nietzsche',
      minCards: 2,
    },
    effects: [
      { type: 'damage', value: 15, target: 'single' },
      { type: 'buff', value: 2, buffType: 'strength', duration: 2 },
    ],
    icon: '🔥',
    screenEffect: 'shake',
    quote: '「神は死んだ。我々が殺したのだ」',
    description: '価値の転換を通じて超人へ至る。ニーチェの思想が共鳴し、破壊的な力を解放する。',
  },
  {
    id: 'plato_idealism',
    name: 'イデア界への上昇',
    type: 'author',
    condition: {
      authorId: 'plato',
      minCards: 2,
    },
    effects: [
      { type: 'block', value: 12, target: 'self' },
      { type: 'draw', value: 1 },
    ],
    icon: '🌟',
    screenEffect: 'glow',
    quote: '「洞窟を出よ、真実の光を見よ」',
    description: '影の世界から真実のイデアへ。プラトンの哲学が防御と洞察をもたらす。',
  },
  {
    id: 'heidegger_being',
    name: '存在への問い',
    type: 'author',
    condition: {
      authorId: 'heidegger',
      minCards: 2,
    },
    effects: [
      { type: 'damage', value: 10, target: 'single' },
      { type: 'block', value: 8, target: 'self' },
    ],
    icon: '⏳',
    screenEffect: 'glow',
    quote: '「存在とは何か」',
    description: '現存在が存在を問う。ハイデガーの思索が攻守のバランスをもたらす。',
  },
  {
    id: 'sartre_freedom',
    name: '自由の呪い',
    type: 'author',
    condition: {
      authorId: 'sartre',
      minCards: 2,
    },
    effects: [
      { type: 'energy', value: 1 },
      { type: 'damage', value: 8, target: 'single' },
    ],
    icon: '🗝️',
    screenEffect: 'sparkle',
    quote: '「人間は自由の刑に処せられている」',
    description: '絶対的自由がエネルギーを解放する。サルトルの実存主義が行動力を高める。',
  },
  {
    id: 'kant_critique',
    name: '純粋理性批判',
    type: 'author',
    condition: {
      authorId: 'kant',
      minCards: 2,
    },
    effects: [
      { type: 'block', value: 15, target: 'self' },
      { type: 'debuff', value: 1, target: 'single', buffType: 'weak', duration: 2 },
    ],
    icon: '📖',
    screenEffect: 'glow',
    quote: '「汝の行為の格率が普遍的法則となることを欲せよ」',
    description: 'カントの批判精神が敵の攻撃を無力化し、堅固な防御をもたらす。',
  },

  // ========================================
  // 師弟コンボ
  // ========================================
  {
    id: 'athens_lineage',
    name: 'アテネの系譜',
    type: 'master_student',
    condition: {
      authorIds: ['socrates', 'plato', 'aristotle'],
      relationType: 'master_student',
      minCards: 2,
    },
    effects: [
      { type: 'draw', value: 3 },
      { type: 'buff', value: 1, buffType: 'dexterity', duration: 3 },
      { type: 'heal', value: 5 },
    ],
    icon: '📜',
    screenEffect: 'glow',
    quote: '「私が知っているのは、自分が何も知らないということだ」',
    description: '西洋哲学の源流、知の伝承。師から弟子へ、知恵が継承される。',
  },
  {
    id: 'phenomenology_heritage',
    name: '現象学の継承',
    type: 'master_student',
    condition: {
      authorIds: ['husserl', 'heidegger'],
      relationType: 'master_student',
      minCards: 2,
    },
    effects: [
      { type: 'draw', value: 2 },
      { type: 'block', value: 10, target: 'self' },
    ],
    icon: '👁️',
    screenEffect: 'glow',
    quote: '「事象そのものへ」',
    description: '現象学から存在論へ。フッサールからハイデガーへの知の継承。',
  },
  {
    id: 'unconscious_quest',
    name: '無意識の探求',
    type: 'master_student',
    condition: {
      authorIds: ['freud', 'jung'],
      relationType: 'master_student',
      minCards: 2,
    },
    effects: [
      { type: 'debuff', value: 2, target: 'all', buffType: 'vulnerable', duration: 2 },
      { type: 'heal', value: 8 },
    ],
    icon: '🌙',
    screenEffect: 'sparkle',
    quote: '「無意識は意識の海である」',
    description: '精神分析から分析心理学へ。無意識の探求が敵の弱点を暴く。',
  },

  // ========================================
  // 対立コンボ
  // ========================================
  {
    id: 'dialectical_clash',
    name: '弁証法的衝突',
    type: 'opposition',
    condition: {
      relationType: 'opposition',
      minCards: 2,
    },
    effects: [
      { type: 'damage', value: 25, target: 'all' },
    ],
    icon: '⚡',
    screenEffect: 'lightning',
    quote: '「テーゼ、アンチテーゼ、ジンテーゼ」',
    description: '対立が統合を生み出す。思想の衝突が爆発的な力を放つ。',
  },
  {
    id: 'value_overthrow',
    name: '価値の転覆',
    type: 'opposition',
    condition: {
      authorIds: ['nietzsche', 'plato'],
      relationType: 'opposition',
      minCards: 2,
    },
    effects: [
      { type: 'damage', value: 20, target: 'single' },
      { type: 'buff', value: 3, buffType: 'strength', duration: 1 },
    ],
    icon: '🔨',
    screenEffect: 'shake',
    quote: '「イデアは虚構だ」',
    description: 'ニーチェによるプラトニズム批判。価値の転換が世界を揺るがす。',
  },

  // ========================================
  // 同流派コンボ
  // ========================================
  {
    id: 'rationalism_light',
    name: '理性の光',
    type: 'school',
    condition: {
      authorIds: ['descartes', 'spinoza', 'leibniz'],
      school: '合理主義',
      minCards: 2,
    },
    effects: [
      { type: 'draw', value: 2 },
      { type: 'energy', value: 1 },
    ],
    icon: '💡',
    screenEffect: 'glow',
    quote: '「明晰判明な観念」',
    description: '合理主義者たちの探求。理性の光が真理を照らし、行動力を高める。',
  },
  {
    id: 'german_idealism',
    name: 'ドイツ精神',
    type: 'school',
    condition: {
      authorIds: ['kant', 'fichte', 'hegel'],
      school: 'ドイツ観念論',
      minCards: 2,
    },
    effects: [
      { type: 'block', value: 12, target: 'self' },
      { type: 'buff', value: 1, buffType: 'dexterity', duration: 3 },
    ],
    icon: '🦅',
    screenEffect: 'glow',
    quote: '「絶対精神の自己展開」',
    description: 'ドイツ観念論の系譜。批判哲学から弁証法へ、精神の発展。',
  },
  {
    id: 'existentialism_fire',
    name: '実存の炎',
    type: 'school',
    condition: {
      authorIds: ['kierkegaard', 'nietzsche', 'heidegger', 'sartre', 'camus'],
      school: '実存主義',
      minCards: 2,
    },
    effects: [
      { type: 'damage', value: 12, target: 'single' },
      { type: 'energy', value: 1 },
    ],
    icon: '🔥',
    screenEffect: 'shake',
    quote: '「実存は本質に先立つ」',
    description: '実存主義の思想家たち。主体的に生きる炎が敵を焼き尽くす。',
  },

  // ========================================
  // テーマコンボ（特別な組み合わせ）
  // ========================================
  {
    id: 'absurd_rebellion',
    name: '不条理への反抗',
    type: 'theme',
    condition: {
      authorIds: ['camus'],
      minCards: 2,
    },
    effects: [
      { type: 'damage', value: 18, target: 'single' },
      { type: 'heal', value: 5 },
    ],
    icon: '🪨',
    screenEffect: 'shake',
    quote: '「シシュポスは幸福だと想像しなければならない」',
    description: '不条理に直面しながらも反抗し続ける。カミュの精神が生命力をもたらす。',
  },
];

// ========================================
// ヘルパー関数
// ========================================

// IDでコンボを取得
export const getComboById = (id: string): ComboDefinition | undefined => {
  return combos.find(c => c.id === id);
};

// タイプでコンボをフィルタ
export const getCombosByType = (type: ComboType): ComboDefinition[] => {
  return combos.filter(c => c.type === type);
};

// 著者IDが含まれるコンボを取得
export const getCombosForAuthor = (authorId: string): ComboDefinition[] => {
  return combos.filter(c =>
    c.condition.authorId === authorId ||
    c.condition.authorIds?.includes(authorId)
  );
};

// 統計情報
export const comboStats = {
  total: combos.length,
  byType: {
    author: getCombosByType('author').length,
    master_student: getCombosByType('master_student').length,
    opposition: getCombosByType('opposition').length,
    school: getCombosByType('school').length,
    theme: getCombosByType('theme').length,
  },
};
