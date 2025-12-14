// 著者マスター
// 哲学者・思想家のデータベース

import { Author } from '../types/tags';

export const authors: Author[] = [
  // ========================================
  // 古代ギリシャ三賢人
  // ========================================
  {
    id: 'socrates',
    name: 'ソクラテス',
    era: 'ancient',
    category: '思想・哲学（古代）',
    schools: ['ソクラテス学派'],
    description: '無知の知を説き、対話による真理探求を実践した古代ギリシャの哲学者',
  },
  {
    id: 'plato',
    name: 'プラトン',
    era: 'ancient',
    category: '思想・哲学（古代）',
    schools: ['アカデメイア', 'イデア論'],
    description: 'イデア論を提唱し、西洋哲学の基礎を築いたソクラテスの弟子',
  },
  {
    id: 'aristotle',
    name: 'アリストテレス',
    era: 'ancient',
    category: '思想・哲学（古代）',
    schools: ['リュケイオン', '形而上学'],
    description: '万学の祖と呼ばれ、論理学から自然学まで体系化したプラトンの弟子',
  },

  // ========================================
  // 合理主義（近世）
  // ========================================
  {
    id: 'descartes',
    name: 'デカルト',
    era: '1500s-1700s',
    category: '思想・哲学（近現代）',
    schools: ['合理主義', '二元論'],
    description: '「我思う、ゆえに我あり」で知られる近代哲学の父',
  },
  {
    id: 'spinoza',
    name: 'スピノザ',
    era: '1500s-1700s',
    category: '思想・哲学（近現代）',
    schools: ['合理主義', '汎神論'],
    description: '神即自然を説き、幾何学的方法で倫理学を構築した哲学者',
  },
  {
    id: 'leibniz',
    name: 'ライプニッツ',
    era: '1500s-1700s',
    category: '思想・哲学（近現代）',
    schools: ['合理主義', 'モナド論'],
    description: '予定調和とモナド論を提唱した万能の天才',
  },

  // ========================================
  // ドイツ観念論
  // ========================================
  {
    id: 'kant',
    name: 'カント',
    era: '1800s',
    category: '思想・哲学（近現代）',
    schools: ['ドイツ観念論', '批判哲学'],
    description: '純粋理性批判で認識論に革命をもたらした近代哲学の巨人',
  },
  {
    id: 'hegel',
    name: 'ヘーゲル',
    era: '1800s',
    category: '思想・哲学（近現代）',
    schools: ['ドイツ観念論', '弁証法'],
    description: '弁証法と絶対精神を説き、歴史哲学を確立した観念論の完成者',
  },
  {
    id: 'fichte',
    name: 'フィヒテ',
    era: '1800s',
    category: '思想・哲学（近現代）',
    schools: ['ドイツ観念論'],
    description: '自我の哲学を展開し、カントとヘーゲルを繋いだ観念論者',
  },

  // ========================================
  // 実存主義の先駆者
  // ========================================
  {
    id: 'kierkegaard',
    name: 'キルケゴール',
    era: '1800s',
    category: '思想・哲学（近現代）',
    schools: ['実存主義'],
    description: '実存主義の父と呼ばれ、主体的真理を追求したデンマークの哲学者',
  },
  {
    id: 'schopenhauer',
    name: 'ショーペンハウアー',
    era: '1800s',
    category: '思想・哲学（近現代）',
    schools: ['ペシミズム', '意志の哲学'],
    description: '世界は盲目的意志であると説き、ニーチェに影響を与えた厭世哲学者',
  },

  // ========================================
  // 実存主義
  // ========================================
  {
    id: 'nietzsche',
    name: 'ニーチェ',
    era: '1800s',
    category: '思想・哲学（近現代）',
    schools: ['実存主義', '虚無主義', '超人思想'],
    description: '神の死を宣言し、超人と永劫回帰を説いた破壊と創造の哲学者',
  },
  {
    id: 'heidegger',
    name: 'ハイデガー',
    era: '1900-1950',
    category: '思想・哲学（近現代）',
    schools: ['実存主義', '現象学', '存在論'],
    description: '存在と時間で現存在の分析を行い、存在の意味を問うた哲学者',
  },
  {
    id: 'sartre',
    name: 'サルトル',
    era: '1900-1950',
    category: '思想・哲学（近現代）',
    schools: ['実存主義', '現象学'],
    description: '実存は本質に先立つと説き、自由と責任を追求したフランスの知識人',
  },
  {
    id: 'camus',
    name: 'カミュ',
    era: '1900-1950',
    category: '思想・哲学（近現代）',
    schools: ['実存主義', '不条理の哲学'],
    description: '不条理を直視しながらも反抗を説いたノーベル文学賞作家',
  },

  // ========================================
  // 現象学
  // ========================================
  {
    id: 'husserl',
    name: 'フッサール',
    era: '1900-1950',
    category: '思想・哲学（近現代）',
    schools: ['現象学'],
    description: '現象学を創始し、意識の本質を厳密に分析した哲学者',
  },

  // ========================================
  // 心理学
  // ========================================
  {
    id: 'freud',
    name: 'フロイト',
    era: '1900-1950',
    category: '心理学',
    schools: ['精神分析'],
    description: '無意識を発見し、精神分析を創始した心理学の革命者',
  },
  {
    id: 'jung',
    name: 'ユング',
    era: '1900-1950',
    category: '心理学',
    schools: ['分析心理学', '集合的無意識'],
    description: '集合的無意識と元型理論を提唱したフロイトの弟子',
  },

  // ========================================
  // 東洋思想
  // ========================================
  {
    id: 'suzuki_daisetz',
    name: '鈴木大拙',
    era: '1900-1950',
    category: '仏教・禅',
    schools: ['禅仏教'],
    description: '禅を西洋に紹介し、東西思想の架け橋となった仏教学者',
  },

  // ========================================
  // その他の重要哲学者
  // ========================================
  {
    id: 'pascal',
    name: 'パスカル',
    era: '1500s-1700s',
    category: '思想・哲学（近現代）',
    schools: ['宗教哲学', '数学'],
    description: '「人間は考える葦である」で知られる数学者・宗教哲学者',
  },
];

// ========================================
// ヘルパー関数
// ========================================

// IDで著者を取得
export const getAuthorById = (id: string): Author | undefined => {
  return authors.find(a => a.id === id);
};

// 時代で著者をフィルタ
export const getAuthorsByEra = (era: Author['era']): Author[] => {
  return authors.filter(a => a.era === era);
};

// カテゴリで著者をフィルタ
export const getAuthorsByCategory = (category: Author['category']): Author[] => {
  return authors.filter(a => a.category === category);
};

// 流派で著者をフィルタ
export const getAuthorsBySchool = (school: string): Author[] => {
  return authors.filter(a => a.schools?.includes(school));
};

// 著者名から著者を検索
export const getAuthorByName = (name: string): Author | undefined => {
  return authors.find(a => a.name === name);
};

// 著者の流派を取得
export const getAuthorSchools = (authorId: string): string[] => {
  const author = getAuthorById(authorId);
  return author?.schools || [];
};

// 統計情報
export const authorStats = {
  total: authors.length,
  byEra: {
    ancient: getAuthorsByEra('ancient').length,
    medieval: getAuthorsByEra('medieval').length,
    '1500s-1700s': getAuthorsByEra('1500s-1700s').length,
    '1800s': getAuthorsByEra('1800s').length,
    '1900-1950': getAuthorsByEra('1900-1950').length,
  },
  byCategory: {
    '思想・哲学（古代）': getAuthorsByCategory('思想・哲学（古代）').length,
    '思想・哲学（近現代）': getAuthorsByCategory('思想・哲学（近現代）').length,
    '心理学': getAuthorsByCategory('心理学').length,
    '仏教・禅': getAuthorsByCategory('仏教・禅').length,
  },
};
