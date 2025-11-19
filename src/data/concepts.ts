// 概念データ - 各概念は抽象度に応じた基本パワーを持つ
import conceptsData from './concepts.json';

export interface Concept {
  id: number;
  name: string;
  description: string;
  basePower: number; // 基本パワー (1-100)
  category: 'abstract' | 'emotion' | 'action' | 'philosophy' | 'quote' | 'science' | 'culture' | 'modern' | 'person' | 'mythology' | 'psychology' | 'society' | 'literature';
  rarity: 1 | 2 | 3 | 4 | 5; // レア度
  author?: string; // 発言者（quote用）
}

export const concepts: Concept[] = conceptsData as Concept[];

export const getRandomConcept = (): Concept => {
  return concepts[Math.floor(Math.random() * concepts.length)];
};

// レア度に応じた色を返す
export const getRarityColor = (rarity: number): string => {
  switch (rarity) {
    case 5: return '#FFD700'; // 金
    case 4: return '#A855F7'; // 紫
    case 3: return '#3B82F6'; // 青
    case 2: return '#22C55E'; // 緑
    default: return '#9CA3AF'; // グレー
  }
};

// レア度の星表示
export const getRarityStars = (rarity: number): string => {
  return '★'.repeat(rarity) + '☆'.repeat(5 - rarity);
};
