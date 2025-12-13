// ゲーム全体の型定義

// カードタイプ
export type CardType = 'attack' | 'defense' | 'skill';

// カード効果のタイプ
export type EffectType =
  | 'damage'      // ダメージを与える
  | 'block'       // ブロックを得る
  | 'draw'        // カードを引く
  | 'energy'      // エネルギーを得る
  | 'heal'        // HPを回復
  | 'buff'        // バフを付与
  | 'debuff';     // デバフを付与

// バフ/デバフの種類
export type StatusType =
  | 'strength'    // 攻撃力上昇
  | 'dexterity'   // ブロック上昇
  | 'vulnerable'  // 被ダメージ50%増加
  | 'weak'        // 与ダメージ25%減少
  | 'frail'       // ブロック25%減少
  | 'poison'      // ターン終了時ダメージ
  | 'regeneration'; // ターン開始時回復

// カード効果
export interface CardEffect {
  type: EffectType;
  value: number;
  target?: 'self' | 'enemy' | 'all_enemies';
  statusType?: StatusType;  // buff/debuff時に使用
  statusDuration?: number;  // ステータス効果の持続ターン
}

// カード（ゲーム中で使用）
export interface Card {
  id: number;
  name: string;
  description: string;
  type: CardType;
  cost: number;             // エネルギーコスト (0-3)
  effects: CardEffect[];    // 効果リスト
  category: string;         // 既存カテゴリ
  rarity: 1 | 2 | 3 | 4 | 5;
  flavorText?: string;      // フレーバーテキスト
}

// カードインスタンス（デッキ内の個別カード）
export interface CardInstance {
  instanceId: string;       // ユニークID（同じカードを複数持てるため）
  card: Card;
}

// 敵の行動予告
export type IntentType = 'attack' | 'defend' | 'buff' | 'debuff' | 'unknown';

export interface Intent {
  type: IntentType;
  value?: number;           // 攻撃なら予告ダメージ
}

// ステータス効果（バフ/デバフ）
export interface StatusEffect {
  type: StatusType;
  stacks: number;           // スタック数
  duration?: number;        // 残りターン（undefinedなら永続）
}

// 敵
export interface Enemy {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  intent: Intent;
  block: number;
  statuses: StatusEffect[];
  isBoss: boolean;
  isElite: boolean;
}

// 敵テンプレート（データ定義用）
export interface EnemyTemplate {
  id: number;
  name: string;
  maxHp: number | [number, number];  // 固定値 or [min, max]
  isBoss: boolean;
  isElite: boolean;
  moves: EnemyMove[];       // 行動パターン
}

// 敵の行動
export interface EnemyMove {
  id: string;
  name: string;
  intent: Intent;
  weight?: number;          // 選択確率の重み
  condition?: string;       // 条件（"first_turn", "hp_below_50" など）
}

// レリック効果のトリガー
export type RelicTrigger =
  | 'battle_start'          // 戦闘開始時
  | 'turn_start'            // ターン開始時
  | 'turn_end'              // ターン終了時
  | 'on_attack'             // 攻撃時
  | 'on_damage'             // ダメージを受けた時
  | 'on_kill'               // 敵を倒した時
  | 'on_card_play'          // カード使用時
  | 'passive';              // 常時発動

// レリック効果
export interface RelicEffect {
  trigger: RelicTrigger;
  effectType: EffectType;
  value: number;
  condition?: string;
}

// レリック
export interface Relic {
  id: number;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'boss';
  effects: RelicEffect[];
}

// マップノードタイプ
export type NodeType = 'battle' | 'elite' | 'boss' | 'shop' | 'rest' | 'event';

// マップノード
export interface MapNode {
  id: string;
  floor: number;
  type: NodeType;
  x: number;                // 横位置（表示用）
  connections: string[];    // 接続先ノードID
  completed: boolean;
}

// バトル状態
export interface BattleState {
  enemies: Enemy[];
  turn: number;
  playerBlock: number;
  playerStatuses: StatusEffect[];
  isPlayerTurn: boolean;
}

// ラン状態
export interface RunState {
  id: string;               // ランID
  floor: number;            // 現在階 (1-15)
  hp: number;
  maxHp: number;
  deck: CardInstance[];     // 全デッキ
  energy: number;
  maxEnergy: number;
  relics: Relic[];
  gold: number;
  map: MapNode[];
  currentNodeId: string | null;
  seed: number;             // ランダムシード
  startedAt: number;        // 開始時刻
}

// ショップアイテム
export interface ShopItem {
  type: 'card' | 'relic' | 'card_removal';
  item?: Card | Relic;
  price: number;
  sold: boolean;
}

// 実績
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: number;      // アンロック時刻
}

// 永続データ（メタ進行）
export interface MetaData {
  totalRuns: number;
  bestFloor: number;
  victories: number;
  totalEnemiesKilled: number;
  discoveredCards: number[];
  discoveredEnemies: number[];
  discoveredRelics: number[];
  achievements: Achievement[];
  createdAt: number;
  lastPlayedAt: number;
}

// ゲーム設定
export const GAME_CONFIG = {
  MAX_FLOOR: 15,
  BOSS_FLOORS: [5, 10, 15],
  STARTING_HP: 50,
  STARTING_ENERGY: 3,
  STARTING_HAND_SIZE: 5,
  STARTING_DECK_SIZE: 10,
  STARTING_GOLD: 50,
} as const;
