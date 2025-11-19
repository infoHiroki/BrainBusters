import { Concept } from '../data/concepts';

export interface BattleResult {
  playerConcept: Concept;
  enemyConcept: Concept;
  playerPower: number;
  enemyPower: number;
  winner: 'player' | 'enemy' | 'draw';
  powerDifference: number;
}

// ランダム要素を加えた最終パワーを計算
// 基本パワー + ランダム補正 (-20 ~ +20)
export const calculatePower = (concept: Concept): number => {
  const randomBonus = Math.floor(Math.random() * 41) - 20; // -20 to +20
  const finalPower = Math.max(1, Math.min(100, concept.basePower + randomBonus));
  return finalPower;
};

// バトル結果を計算
export const battle = (playerConcept: Concept, enemyConcept: Concept): BattleResult => {
  const playerPower = calculatePower(playerConcept);
  const enemyPower = calculatePower(enemyConcept);

  let winner: 'player' | 'enemy' | 'draw';
  if (playerPower > enemyPower) {
    winner = 'player';
  } else if (enemyPower > playerPower) {
    winner = 'enemy';
  } else {
    winner = 'draw';
  }

  return {
    playerConcept,
    enemyConcept,
    playerPower,
    enemyPower,
    winner,
    powerDifference: Math.abs(playerPower - enemyPower),
  };
};

// カテゴリに応じた色を返す
export const getCategoryColor = (category: Concept['category']): string => {
  switch (category) {
    case 'abstract':
      return '#9B59B6'; // 紫
    case 'emotion':
      return '#E74C3C'; // 赤
    case 'action':
      return '#F39C12'; // オレンジ
    case 'philosophy':
      return '#3498DB'; // 青
    case 'quote':
      return '#1ABC9C'; // ティール
    case 'science':
      return '#00D4FF'; // シアン
    case 'culture':
      return '#FF69B4'; // ピンク
    case 'modern':
      return '#8B5CF6'; // バイオレット
    case 'person':
      return '#FFB347'; // ライトオレンジ
    case 'mythology':
      return '#9370DB'; // ミディアムパープル
    case 'psychology':
      return '#20B2AA'; // ライトシーグリーン
    case 'society':
      return '#CD853F'; // ペルー
    case 'literature':
      return '#DA70D6'; // オーキッド
    default:
      return '#95A5A6'; // グレー
  }
};

// カテゴリのグラデーション色を返す
export const getCategoryGradient = (category: Concept['category']): [string, string] => {
  switch (category) {
    case 'abstract':
      return ['#9B59B6', '#8E44AD'];
    case 'emotion':
      return ['#E74C3C', '#C0392B'];
    case 'action':
      return ['#F39C12', '#E67E22'];
    case 'philosophy':
      return ['#3498DB', '#2980B9'];
    case 'quote':
      return ['#1ABC9C', '#16A085'];
    case 'science':
      return ['#00D4FF', '#0099CC'];
    case 'culture':
      return ['#FF69B4', '#FF1493'];
    case 'modern':
      return ['#8B5CF6', '#7C3AED'];
    case 'person':
      return ['#FFB347', '#FF8C00'];
    case 'mythology':
      return ['#9370DB', '#7B68EE'];
    case 'psychology':
      return ['#20B2AA', '#008B8B'];
    case 'society':
      return ['#CD853F', '#A0522D'];
    case 'literature':
      return ['#DA70D6', '#BA55D3'];
    default:
      return ['#95A5A6', '#7F8C8D'];
  }
};

// カテゴリ名を日本語で返す
export const getCategoryName = (category: Concept['category']): string => {
  switch (category) {
    case 'abstract':
      return '抽象';
    case 'emotion':
      return '感情';
    case 'action':
      return '行動';
    case 'philosophy':
      return '哲学';
    case 'quote':
      return '発言';
    case 'science':
      return '科学';
    case 'culture':
      return '文化';
    case 'modern':
      return '現代';
    case 'person':
      return '人物';
    case 'mythology':
      return '神話';
    case 'psychology':
      return '心理';
    case 'society':
      return '社会';
    case 'literature':
      return '文学';
    default:
      return '不明';
  }
};
