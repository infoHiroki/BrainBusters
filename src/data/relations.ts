// 関係性マスター
// 哲学者間の師弟関係、影響、対立などを定義

import { Relation, RelationType } from '../types/tags';

export const relations: Relation[] = [
  // ========================================
  // 師弟関係（master_student）
  // ========================================
  {
    type: 'master_student',
    from: 'socrates',
    to: 'plato',
    description: '対話を通じた真理探求の継承',
    comboName: 'アテネの系譜',
  },
  {
    type: 'master_student',
    from: 'plato',
    to: 'aristotle',
    description: 'イデアから形相質料論へ',
    comboName: 'アカデメイアの継承',
  },
  {
    type: 'master_student',
    from: 'husserl',
    to: 'heidegger',
    description: '現象学から存在論への発展',
    comboName: '現象学の継承',
  },
  {
    type: 'master_student',
    from: 'freud',
    to: 'jung',
    description: '精神分析から分析心理学へ',
    comboName: '無意識の探求',
  },
  {
    type: 'master_student',
    from: 'schopenhauer',
    to: 'nietzsche',
    description: '意志の哲学の継承と転換',
    comboName: '意志の系譜',
  },

  // ========================================
  // 影響関係（influence）
  // ========================================
  {
    type: 'influence',
    from: 'nietzsche',
    to: 'sartre',
    description: 'ニヒリズムから実存主義へ',
    comboName: '実存への道',
  },
  {
    type: 'influence',
    from: 'nietzsche',
    to: 'heidegger',
    description: '神の死から存在忘却へ',
    comboName: '存在への問い',
  },
  {
    type: 'influence',
    from: 'nietzsche',
    to: 'camus',
    description: 'ニヒリズムから不条理の哲学へ',
    comboName: '反抗の精神',
  },
  {
    type: 'influence',
    from: 'kierkegaard',
    to: 'sartre',
    description: '主体的真理から実存主義へ',
    comboName: '実存の覚醒',
  },
  {
    type: 'influence',
    from: 'kant',
    to: 'hegel',
    description: '批判哲学から弁証法へ',
    comboName: 'ドイツ精神',
  },

  // ========================================
  // 対立関係（opposition）
  // ========================================
  {
    type: 'opposition',
    from: 'nietzsche',
    to: 'plato',
    description: 'イデア界批判、価値の転換',
    comboName: '価値の転覆',
  },
  {
    type: 'opposition',
    from: 'freud',
    to: 'jung',
    description: '無意識の解釈をめぐる対立',
    comboName: '精神の分裂',
  },
  {
    type: 'opposition',
    from: 'sartre',
    to: 'camus',
    description: '革命と反抗をめぐる論争',
    comboName: '実存の衝突',
  },

  // ========================================
  // 同流派（same_school）
  // ========================================
  {
    type: 'same_school',
    from: 'descartes',
    to: 'spinoza',
    description: '合理主義の探求者たち',
    comboName: '理性の光',
  },
  {
    type: 'same_school',
    from: 'descartes',
    to: 'leibniz',
    description: '合理主義と数学的思考',
    comboName: '明晰判明',
  },
  {
    type: 'same_school',
    from: 'spinoza',
    to: 'leibniz',
    description: '汎神論とモナド論',
    comboName: '予定調和',
  },
  {
    type: 'same_school',
    from: 'kant',
    to: 'fichte',
    description: 'ドイツ観念論の発展',
    comboName: '自我の哲学',
  },
  {
    type: 'same_school',
    from: 'fichte',
    to: 'hegel',
    description: '観念論の完成へ',
    comboName: '絶対精神',
  },
  {
    type: 'same_school',
    from: 'sartre',
    to: 'camus',
    description: '実存主義の二つの顔',
    comboName: '自由と反抗',
  },
  {
    type: 'same_school',
    from: 'heidegger',
    to: 'sartre',
    description: '現象学的実存主義',
    comboName: '実存の現象',
  },

  // ========================================
  // 同時代（contemporary）
  // ========================================
  {
    type: 'contemporary',
    from: 'descartes',
    to: 'pascal',
    description: '理性と信仰の17世紀',
    comboName: '考える葦と我思う',
  },
];

// ========================================
// ヘルパー関数
// ========================================

// 著者間の関係を取得（双方向）
export const getRelationBetween = (authorId1: string, authorId2: string): Relation | undefined => {
  return relations.find(
    r => (r.from === authorId1 && r.to === authorId2) ||
         (r.from === authorId2 && r.to === authorId1)
  );
};

// 特定の著者が関わる全ての関係を取得
export const getRelationsForAuthor = (authorId: string): Relation[] => {
  return relations.filter(r => r.from === authorId || r.to === authorId);
};

// 関係タイプでフィルタ
export const getRelationsByType = (type: RelationType): Relation[] => {
  return relations.filter(r => r.type === type);
};

// 2人の著者が何らかの関係を持つかチェック
export const hasRelation = (authorId1: string, authorId2: string): boolean => {
  return getRelationBetween(authorId1, authorId2) !== undefined;
};

// 関係性の説明を取得
export const getRelationDescription = (authorId1: string, authorId2: string): string | undefined => {
  const relation = getRelationBetween(authorId1, authorId2);
  return relation?.description;
};

// コンボ名を取得
export const getComboName = (authorId1: string, authorId2: string): string | undefined => {
  const relation = getRelationBetween(authorId1, authorId2);
  return relation?.comboName;
};

// 関係タイプの日本語名
export const getRelationTypeName = (type: RelationType): string => {
  const names: Record<RelationType, string> = {
    master_student: '師弟',
    influence: '影響',
    opposition: '対立',
    same_school: '同流派',
    contemporary: '同時代',
  };
  return names[type];
};

// 統計情報
export const relationStats = {
  total: relations.length,
  byType: {
    master_student: getRelationsByType('master_student').length,
    influence: getRelationsByType('influence').length,
    opposition: getRelationsByType('opposition').length,
    same_school: getRelationsByType('same_school').length,
    contemporary: getRelationsByType('contemporary').length,
  },
};
