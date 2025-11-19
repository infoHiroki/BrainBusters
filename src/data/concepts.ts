// 概念データ - 各概念は抽象度に応じた基本パワーを持つ
export interface Concept {
  id: number;
  name: string;
  description: string;
  basePower: number; // 基本パワー (1-100)
  category: 'abstract' | 'emotion' | 'action' | 'philosophy' | 'quote' | 'science' | 'culture' | 'modern';
  rarity: 1 | 2 | 3 | 4 | 5; // レア度
  author?: string; // 発言者（quote用）
}

export const concepts: Concept[] = [
  // ========== 哲学的発言 (quote) ==========
  { id: 1, name: '我思う、故に我あり', description: '存在の根本的証明', basePower: 92, category: 'quote', rarity: 5, author: 'デカルト' },
  { id: 2, name: '神は死んだ', description: '価値の根源の喪失', basePower: 95, category: 'quote', rarity: 5, author: 'ニーチェ' },
  { id: 3, name: '万物は流転する', description: '永遠の変化の真理', basePower: 88, category: 'quote', rarity: 4, author: 'ヘラクレイトス' },
  { id: 4, name: '知は力なり', description: '知識こそが力の源泉', basePower: 85, category: 'quote', rarity: 4, author: 'ベーコン' },
  { id: 5, name: '無知の知', description: '知らないことを知る', basePower: 90, category: 'quote', rarity: 5, author: 'ソクラテス' },
  { id: 6, name: '人間は考える葦である', description: '脆さと偉大さの共存', basePower: 86, category: 'quote', rarity: 4, author: 'パスカル' },
  { id: 7, name: '存在は本質に先立つ', description: '実存主義の核心', basePower: 89, category: 'quote', rarity: 5, author: 'サルトル' },
  { id: 8, name: '他者は地獄だ', description: '視線による拘束', basePower: 84, category: 'quote', rarity: 4, author: 'サルトル' },
  { id: 9, name: '言語の限界は世界の限界', description: '思考と言葉の境界', basePower: 91, category: 'quote', rarity: 5, author: 'ウィトゲンシュタイン' },
  { id: 10, name: '永劫回帰', description: '同一の人生を無限に繰り返す', basePower: 93, category: 'quote', rarity: 5, author: 'ニーチェ' },
  { id: 11, name: '大いなる正午', description: '超人への変容の瞬間', basePower: 87, category: 'quote', rarity: 4, author: 'ニーチェ' },
  { id: 12, name: '絶対精神', description: '精神の自己実現の到達点', basePower: 94, category: 'quote', rarity: 5, author: 'ヘーゲル' },
  { id: 13, name: '弁証法', description: '対立と統合による発展', basePower: 82, category: 'quote', rarity: 4, author: 'ヘーゲル' },
  { id: 14, name: 'イデア', description: '真の実在としての理念', basePower: 88, category: 'quote', rarity: 4, author: 'プラトン' },
  { id: 15, name: '洞窟の比喩', description: '影しか見えない囚人たち', basePower: 83, category: 'quote', rarity: 4, author: 'プラトン' },
  { id: 16, name: '形相と質料', description: '事物の二つの原理', basePower: 79, category: 'quote', rarity: 3, author: 'アリストテレス' },
  { id: 17, name: '中庸', description: '両極端の間の徳', basePower: 75, category: 'quote', rarity: 3, author: 'アリストテレス' },
  { id: 18, name: '予定調和', description: 'モナド間の調和', basePower: 81, category: 'quote', rarity: 4, author: 'ライプニッツ' },
  { id: 19, name: '物自体', description: '認識不可能な真の実在', basePower: 90, category: 'quote', rarity: 5, author: 'カント' },
  { id: 20, name: '定言命法', description: '無条件の道徳法則', basePower: 84, category: 'quote', rarity: 4, author: 'カント' },

  // ========== 抽象概念 (abstract) ==========
  { id: 21, name: '無', description: '存在しないという存在', basePower: 96, category: 'abstract', rarity: 5 },
  { id: 22, name: 'クオリア', description: '主観的な意識体験', basePower: 91, category: 'abstract', rarity: 5 },
  { id: 23, name: '永遠', description: '時間を超越した概念', basePower: 89, category: 'abstract', rarity: 5 },
  { id: 24, name: '矛盾', description: '対立する二つが共存する状態', basePower: 85, category: 'abstract', rarity: 4 },
  { id: 25, name: '抽象', description: '具体を離れた純粋な形', basePower: 82, category: 'abstract', rarity: 4 },
  { id: 26, name: '時間', description: '過去から未来への流れ', basePower: 80, category: 'abstract', rarity: 4 },
  { id: 27, name: '空間', description: '存在が広がる場', basePower: 79, category: 'abstract', rarity: 4 },
  { id: 28, name: '因果', description: '原因と結果の連鎖', basePower: 77, category: 'abstract', rarity: 3 },
  { id: 29, name: '運命', description: '定められた道筋', basePower: 84, category: 'abstract', rarity: 4 },
  { id: 30, name: '混沌', description: '秩序なき状態', basePower: 86, category: 'abstract', rarity: 4 },
  { id: 31, name: '秩序', description: '整然とした配列', basePower: 74, category: 'abstract', rarity: 3 },
  { id: 32, name: '偶然', description: '必然でない出来事', basePower: 72, category: 'abstract', rarity: 3 },
  { id: 33, name: '必然', description: '避けられない帰結', basePower: 78, category: 'abstract', rarity: 3 },
  { id: 34, name: '存在', description: 'あるということ', basePower: 88, category: 'abstract', rarity: 5 },
  { id: 35, name: '虚無', description: '何もないこと', basePower: 90, category: 'abstract', rarity: 5 },

  // ========== 感情 (emotion) ==========
  { id: 36, name: '幸福', description: '満たされた心の状態', basePower: 72, category: 'emotion', rarity: 3 },
  { id: 37, name: '愛', description: '深い慈しみの心', basePower: 75, category: 'emotion', rarity: 3 },
  { id: 38, name: '希望', description: '未来への期待', basePower: 68, category: 'emotion', rarity: 3 },
  { id: 39, name: '絶望', description: '希望を失った状態', basePower: 76, category: 'emotion', rarity: 3 },
  { id: 40, name: '恐怖', description: '危険への本能的反応', basePower: 70, category: 'emotion', rarity: 3 },
  { id: 41, name: '怒り', description: '激しい感情の爆発', basePower: 73, category: 'emotion', rarity: 3 },
  { id: 42, name: '悲しみ', description: '失うことへの痛み', basePower: 67, category: 'emotion', rarity: 2 },
  { id: 43, name: '喜び', description: '満ち足りた感情', basePower: 65, category: 'emotion', rarity: 2 },
  { id: 44, name: '忍耐', description: '耐え抜く精神力', basePower: 64, category: 'emotion', rarity: 2 },
  { id: 45, name: '勇気', description: '恐れに立ち向かう心', basePower: 69, category: 'emotion', rarity: 3 },
  { id: 46, name: '孤独', description: '一人であること', basePower: 71, category: 'emotion', rarity: 3 },
  { id: 47, name: '郷愁', description: '過去への憧れ', basePower: 63, category: 'emotion', rarity: 2 },
  { id: 48, name: '嫉妬', description: '他者への羨望', basePower: 66, category: 'emotion', rarity: 2 },
  { id: 49, name: '狂気', description: '理性を超えた状態', basePower: 80, category: 'emotion', rarity: 4 },
  { id: 50, name: '恍惚', description: '我を忘れた歓喜', basePower: 74, category: 'emotion', rarity: 3 },

  // ========== アクション (action) ==========
  { id: 51, name: '戦争', description: '大規模な武力衝突', basePower: 82, category: 'action', rarity: 4 },
  { id: 52, name: '闘争', description: '勝利を求める争い', basePower: 77, category: 'action', rarity: 3 },
  { id: 53, name: '革命', description: '既存秩序の転覆', basePower: 81, category: 'action', rarity: 4 },
  { id: 54, name: '創造', description: '新しいものを生み出す力', basePower: 79, category: 'action', rarity: 4 },
  { id: 55, name: '破壊', description: '既存のものを壊す力', basePower: 78, category: 'action', rarity: 3 },
  { id: 56, name: '支配', description: '他者を従わせる力', basePower: 76, category: 'action', rarity: 3 },
  { id: 57, name: '解放', description: '束縛からの脱却', basePower: 75, category: 'action', rarity: 3 },
  { id: 58, name: '征服', description: '力による制圧', basePower: 80, category: 'action', rarity: 4 },
  { id: 59, name: '超越', description: '限界を超えること', basePower: 85, category: 'action', rarity: 4 },
  { id: 60, name: '覚醒', description: '眠りからの目覚め', basePower: 83, category: 'action', rarity: 4 },

  // ========== 哲学概念 (philosophy) ==========
  { id: 61, name: '自由', description: '束縛からの解放', basePower: 78, category: 'philosophy', rarity: 4 },
  { id: 62, name: '正義', description: '正しさの追求', basePower: 76, category: 'philosophy', rarity: 3 },
  { id: 63, name: '真理', description: '揺るぎない事実', basePower: 84, category: 'philosophy', rarity: 4 },
  { id: 64, name: '知恵', description: '深い理解と判断力', basePower: 77, category: 'philosophy', rarity: 3 },
  { id: 65, name: '美', description: '心を動かす調和', basePower: 70, category: 'philosophy', rarity: 3 },
  { id: 66, name: '善', description: '道徳的な正しさ', basePower: 73, category: 'philosophy', rarity: 3 },
  { id: 67, name: '悪', description: '道徳に反するもの', basePower: 75, category: 'philosophy', rarity: 3 },
  { id: 68, name: '意志', description: '行動を決定する力', basePower: 74, category: 'philosophy', rarity: 3 },
  { id: 69, name: '理性', description: '論理的思考の能力', basePower: 72, category: 'philosophy', rarity: 3 },
  { id: 70, name: '信仰', description: '見えないものへの信頼', basePower: 79, category: 'philosophy', rarity: 4 },

  // ========== 科学・数学 (science) ==========
  { id: 71, name: '相対性', description: '観測者による変化', basePower: 88, category: 'science', rarity: 5 },
  { id: 72, name: 'エントロピー', description: '無秩序への不可逆的増大', basePower: 86, category: 'science', rarity: 4 },
  { id: 73, name: '無限', description: '果てしなく続くこと', basePower: 92, category: 'science', rarity: 5 },
  { id: 74, name: '確率', description: '起こりやすさの度合い', basePower: 71, category: 'science', rarity: 3 },
  { id: 75, name: 'カオス', description: '初期条件への敏感性', basePower: 84, category: 'science', rarity: 4 },
  { id: 76, name: '量子', description: '離散的なエネルギー単位', basePower: 85, category: 'science', rarity: 4 },
  { id: 77, name: '重力', description: '質量による引力', basePower: 80, category: 'science', rarity: 4 },
  { id: 78, name: 'ブラックホール', description: '光も逃げられない天体', basePower: 90, category: 'science', rarity: 5 },
  { id: 79, name: 'シンギュラリティ', description: '技術的特異点', basePower: 89, category: 'science', rarity: 5 },
  { id: 80, name: 'フラクタル', description: '自己相似の無限構造', basePower: 78, category: 'science', rarity: 3 },
  { id: 81, name: 'パラドックス', description: '論理的矛盾', basePower: 83, category: 'science', rarity: 4 },
  { id: 82, name: '次元', description: '空間の自由度', basePower: 81, category: 'science', rarity: 4 },
  { id: 83, name: '対称性', description: '変換に対する不変性', basePower: 76, category: 'science', rarity: 3 },
  { id: 84, name: '波動', description: '振動の伝播', basePower: 73, category: 'science', rarity: 3 },
  { id: 85, name: '観測問題', description: '観測による状態の確定', basePower: 87, category: 'science', rarity: 5 },

  // ========== 文化・芸術 (culture) ==========
  { id: 86, name: 'わびさび', description: '不完全さの美', basePower: 82, category: 'culture', rarity: 4 },
  { id: 87, name: '粋', description: '洗練された美意識', basePower: 78, category: 'culture', rarity: 3 },
  { id: 88, name: '崇高', description: '圧倒的な偉大さ', basePower: 85, category: 'culture', rarity: 4 },
  { id: 89, name: 'カタルシス', description: '感情の浄化', basePower: 79, category: 'culture', rarity: 4 },
  { id: 90, name: '無常', description: '移ろいゆくもの', basePower: 81, category: 'culture', rarity: 4 },
  { id: 91, name: '幽玄', description: '奥深い神秘', basePower: 83, category: 'culture', rarity: 4 },
  { id: 92, name: 'もののあはれ', description: 'しみじみとした情趣', basePower: 80, category: 'culture', rarity: 4 },
  { id: 93, name: '風流', description: '風雅な趣', basePower: 74, category: 'culture', rarity: 3 },
  { id: 94, name: 'アウラ', description: '一回性の雰囲気', basePower: 77, category: 'culture', rarity: 3 },
  { id: 95, name: 'キッチュ', description: '俗悪な趣味', basePower: 68, category: 'culture', rarity: 2 },
  { id: 96, name: 'パトス', description: '情念と感動', basePower: 75, category: 'culture', rarity: 3 },
  { id: 97, name: 'エトス', description: '性格と信頼', basePower: 72, category: 'culture', rarity: 3 },
  { id: 98, name: 'ロゴス', description: '論理と言葉', basePower: 76, category: 'culture', rarity: 3 },
  { id: 99, name: 'ミメーシス', description: '模倣と再現', basePower: 71, category: 'culture', rarity: 3 },
  { id: 100, name: 'アイロニー', description: '反語的表現', basePower: 73, category: 'culture', rarity: 3 },

  // ========== 現代概念 (modern) ==========
  { id: 101, name: 'AI', description: '人工的な知能', basePower: 84, category: 'modern', rarity: 4 },
  { id: 102, name: 'メタバース', description: '仮想現実の世界', basePower: 79, category: 'modern', rarity: 4 },
  { id: 103, name: 'サステナビリティ', description: '持続可能性', basePower: 75, category: 'modern', rarity: 3 },
  { id: 104, name: 'ディストピア', description: '暗黒郷', basePower: 80, category: 'modern', rarity: 4 },
  { id: 105, name: 'ユートピア', description: '理想郷', basePower: 78, category: 'modern', rarity: 3 },
  { id: 106, name: 'グローバリズム', description: '世界規模の統合', basePower: 74, category: 'modern', rarity: 3 },
  { id: 107, name: 'ポストモダン', description: '近代の超克', basePower: 81, category: 'modern', rarity: 4 },
  { id: 108, name: 'サイバーパンク', description: '高度技術と社会崩壊', basePower: 77, category: 'modern', rarity: 3 },
  { id: 109, name: 'トランスヒューマン', description: '人間の技術的拡張', basePower: 83, category: 'modern', rarity: 4 },
  { id: 110, name: 'デジタルネイティブ', description: 'デジタル環境での成長', basePower: 70, category: 'modern', rarity: 2 },
];

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
